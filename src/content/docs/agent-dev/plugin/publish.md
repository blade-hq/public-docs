---
title: "发布、安装与版本更新"
description: 按当前 Hub 与 BA 的实际行为发布插件，验证账号安装及会话激活，并管理版本和交付限制。
---

## 发布前检查

发布前先确认 ZIP 根目录有 `plugin.json`、资源名与清单名称一致、沙盒已安装依赖，并移除凭据、缓存、`.venv` 和 `node_modules`。用独立测试会话验证业务调用，不要把上传成功当成运行验收。

本指南核对的 BA 与 Hub 存在分发能力差异：

| 项目 | BA 支持情况 | Hub `5c8da9d0` 上传限制 |
| --- | --- | --- |
| 基础 Skill 与 Python MCP | 支持 | 可上传；子目录仅允许 `skills/`、`assets/`、`docs/` |
| 配置及 MCP 认证扩展 | 支持 `cn.com.bladeai.agent/` | 当前不接受该顶层目录 |
| MCP Apps HTML | 支持 MCP 提供 HTML 资源 | 文件后缀白名单不包含 `.html`、`.js`、`.css` |
| 图标 | PNG、JPEG、WebP | 可上传这些图片，但 BA 不把 SVG 当作插件图标 |
| 名称 | Agent Plugins 名称规则 | 与 BA 有差异，推荐使用小写字母、数字及单个连字符 |

这意味着[快速开始](../quickstart/)的包可以走下述上传流程，但完整的配置与 Apps 包需要部署方先提供兼容的分发支持。不要改目录或改后缀来规避校验，也不要把“最新版 BA 支持”理解为“当前 Hub 能发布所有组件”。

上传限制为 ZIP 50 MiB、解压总量 200 MiB、500 个文件、单文件 3 MiB。当前 Hub 的常用允许后缀包括 `.md`、`.json`、`.py`、`.sh`、`.txt`、`.yaml`、`.yml`、`.toml`、`.csv` 和图片后缀；目录层级最多 8 段，路径段以字母或数字开头。

## 发布到 Hub

登录 Hub，进入“插件”，点击“上传”，填写 `business-data` 并选择基础示例 ZIP。新上传的插件出现在“我的”列表中，再点击“安装”加入当前账号的安装列表。

当前用户上传的插件是私有资源，其他账号不能直接搜索或安装它。给其他用户交付时，可以提供不含秘密的 ZIP，由对方自行上传和安装；平台内置分发属于部署流程，本指南不假定存在跨用户公开发布入口。

自动化上传可使用以下 Bash 命令。把地址换成实际 Hub 地址，输入的是该 Hub 接受的登录访问令牌，不是插件业务账号的令牌：

```bash
hub_url='https://hub.example.com'
read -r -s -p 'Hub access token: ' hub_token

curl --fail-with-body \
  -H "Authorization: Bearer ${hub_token}" \
  -F 'file=@business-data-0.1.0.zip' \
  "${hub_url}/api/plugins/upload?name=business-data"

curl --fail-with-body -X POST \
  -H "Authorization: Bearer ${hub_token}" \
  "${hub_url}/api/plugins/business-data/install"

unset hub_token
```

上传以 multipart 的 `file` 字段提交；首次上传不带覆盖参数，遇到同名资源返回冲突，不会默默替换。安装成功返回 HTTP 204。未启用认证的本地模式可省略认证 header，但不能把本地模式的行为套用于登录部署。

| 操作 | Hub 接口 |
| --- | --- |
| 列出当前用户可见插件 | `GET /api/plugins` |
| 查看插件元数据与 digest | `GET /api/plugins/{name}` |
| 上传 ZIP | `POST /api/plugins/upload?name={name}` |
| 安装 / 卸载 | `POST` / `DELETE /api/plugins/{name}/install` |
| 下载当前包 | `GET /api/plugins/{name}/download` |
| 查看账号已安装资源 | `GET /api/registry/installed` |

这些是 Hub 接口；BA 会话里的插件选择是另一项操作，不要把 Hub 的 `/install` 当成会话激活。

## 验证用户安装体验

用接收方账号上传并安装交付包，然后新建 BA 沙盒会话，从用户视角完成以下检查：

1. 插件在列表中可见，勾选后能完成准备；需要配置的兼容包可打开并保存表单。
2. 基础示例查询 `sales` 返回两条记录、金额合计 2000，查询 `inventory` 返回数量 18 和 7。
3. 再启用另一个插件，原插件仍然可用，两个插件的业务指引没有相互覆盖。
4. 对含配置或界面的插件，继续验证凭据更新、错误提示、卡片操作及另一会话中的配置复用。

同一会话当前最多准备 12 个插件；取消勾选不会清除已准备包，也不释放这类准备记录，需要更多插件时新建会话。准备失败会保留选择，用户可以修正依赖或配置后重试。

## 发布新版本

修改代码后更新 `plugin.json` 的 `version`，生成新的 ZIP；保留旧 ZIP 和源代码版本，便于回退。当前 Hub 使用同名覆盖发布，不提供技能旧版接口那样的 `/versions` 或 `/release` 流程。

通过界面的覆盖选项，或上传接口的 `overwrite=true` 替换自己的包：

```text
POST /api/plugins/upload?name=business-data&overwrite=true
```

Hub 根据文件内容计算 digest，内容改变才更新对应摘要；只填写更大的版本号不会让已有 BA 会话自动换包。BA 会话已经准备的插件会继续使用原包，取消勾选再勾选也不是强制升级操作。

验证更新时，新建会话并激活插件以获取当前 Hub 包；原会话用于比较旧行为。若首次准备曾失败，重试还可能继续使用当时固定的包，因此新会话也是验证新版本最清晰的方式。

配置按用户共享，新旧会话可能同时读取同一个 `config.json`，新增字段应尽量向后兼容；确需改写数据结构时，由插件实现明确的迁移和失败处理。回退时重新上传保存的旧包并覆盖，在新会话中验证，已有会话和历史界面卡片不会因此全部切换到旧版。
