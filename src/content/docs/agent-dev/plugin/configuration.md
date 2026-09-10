---
title: "用户配置与账号认证"
description: 用 JSON Schema 声明插件配置，读取用户凭据，并由插件处理认证、缓存和配置变化。
---

:::note[分发前提]
BA 已支持本页配置契约，但本指南核对的 Hub 上传白名单尚不接受 `cn.com.bladeai.agent/` 目录。自定义插件需要部署方先提供兼容的包分发支持；可在 BA 内置的“示例登录”插件中体验表单、凭据保存和缓存行为。不要把 schema 移到其他目录来绕过限制，BA 不会在那里发现它。
:::

## 声明配置表单

在 `cn.com.bladeai.agent/config.schema.json` 中声明 JSON Schema Draft 2020-12，BA 据此生成表单并校验保存内容。本例为业务数据插件增加令牌和默认数据集：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "业务数据账号",
  "type": "object",
  "required": ["token", "default_dataset"],
  "additionalProperties": false,
  "properties": {
    "token": {
      "type": "string",
      "title": "访问令牌",
      "minLength": 1,
      "writeOnly": true
    },
    "default_dataset": {
      "type": "string",
      "title": "默认数据集",
      "enum": ["sales", "inventory"],
      "default": "sales"
    },
    "remember": {
      "type": "boolean",
      "title": "保存登录缓存",
      "default": true
    }
  }
}
```

表单也可以使用嵌套对象、数组和 `oneOf` 等条件结构，例如在密码和令牌两种方式之间选择；每个分支应明确必填字段。`default` 用于表单初始值，不能代替用户保存有效配置。

`$ref` 只允许解析包内 schema，不能依赖联网下载外部定义；其他 JSON Schema draft 不会静默降级。没有 schema 文件的插件不会出现配置入口。

## 处理密码和令牌

对秘密字段标注 `writeOnly: true`。BA 读取配置供界面展示时会移除秘密值，保存时未修改的秘密可以保留；需要清除时使用表单的删除操作，不要把掩码当成真实密码提交。

这保证的是配置接口不回显秘密，磁盘上的 `config.json` 仍保存插件运行需要的真实值，不是加密保险箱，也不是不同插件之间的秘密隔离边界。只安装可信插件，工具返回值、日志和模型上下文都不得携带令牌。

## 读取用户配置

在插件根目录增加 `auth.py`：

```python
import json
from pathlib import Path

CONFIG_PATH = Path.home() / ".plugin" / "business-data" / "config.json"


def read_config() -> dict:
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ValueError("请在业务数据插件配置中填写并保存访问令牌") from exc
    if not isinstance(config, dict) or not isinstance(config.get("token"), str):
        raise ValueError("插件配置无效，请重新保存")
    if not config["token"].strip():
        raise ValueError("访问令牌为空，请重新填写插件配置")
    return config
```

标准沙盒中的路径是 `/root/.plugin/business-data/config.json`。配置按用户和插件共享，不按会话复制，删除会话不会删除它；本地开发可在独立开发账号的 Home 中放置模拟配置，但不要把它打进 ZIP。

声明了 schema 但配置未就绪时，用户的勾选会保留，BA 暂不准备该插件的 MCP，也不向智能体呈现其可用技能。保存符合 schema 的配置不代表业务登录一定成功，真正的凭据有效性由插件验证。

## 实现登录与缓存

把读取配置放在工具调用过程中，用实际业务服务的客户端完成认证。例如服务支持 Bearer Token 时，在 `requirements.txt` 中增加 `httpx==0.28.1` 并在开发环境和沙盒准备该依赖，然后在 `auth.py` 增加下面的函数，由查询工具调用它；这是请求接入示例，需替换域名与真实响应格式：

```python
import httpx


def query_service(dataset: str) -> dict:
    if dataset not in {"sales", "inventory"}:
        raise ValueError("不支持的数据集")
    config = read_config()
    token = config["token"]
    if any(ord(char) < 32 or ord(char) == 127 for char in token):
        raise ValueError("访问令牌格式无效，请重新填写")
    try:
        with httpx.Client(timeout=20, follow_redirects=False) as client:
            response = client.get(
                f"https://data.example.com/api/datasets/{dataset}",
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.HTTPError:
        raise ValueError("业务服务不可达，请稍后重试") from None
    if response.status_code in {401, 403}:
        raise ValueError("认证失败或无访问权限，请检查插件配置")
    if not response.is_success:
        raise ValueError("业务服务查询失败，请稍后重试")
    try:
        data = response.json()
    except ValueError:
        raise ValueError("业务服务不可达或响应无效，请稍后重试") from None
    if not isinstance(data, dict):
        raise ValueError("业务服务响应格式无效")
    return data
```

如果服务要求先登录换取会话令牌，插件应实现该服务的登录接口，并记录过期时间；这里只读演示插件不虚构某种通用登录协议。可把可重建缓存放在 `PLUGIN_DATA`，若需要跨会话缓存则放到自行管理的用户数据目录，同时处理并发写入、文件权限和退出清理。

## 响应配置修改与凭据失效

平台只校验和保存配置，不负责登录、刷新令牌、清除插件缓存或重启 MCP 服务。上面的工具每次调用都重新读取文件，因此用户修改令牌后下一次调用会使用新值。

需要缓存登录状态时，将配置指纹与缓存一同保存；指纹变化或令牌过期就重新认证，关闭缓存选项时停止复用旧状态。刷新失败应让用户更新配置，不要在聊天中索要密码，也不要无限重试登录。

验证时依次保存有效配置、修改令牌、触发认证失败，再开启另一个会话检查配置复用；在每一步确认工具输出和日志没有暴露秘密。
