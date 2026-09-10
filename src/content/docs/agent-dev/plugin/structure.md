---
title: "插件目录与清单"
description: 插件的目录布局、plugin.json 字段、展示信息、运行路径和 ZIP 打包要求。
---

## 完整目录示例

```text
business-data/
├── plugin.json                         # 必需：插件身份
├── mcp.json                            # 可选：MCP 服务声明
├── server.py                           # 示例的工具实现
├── requirements.txt                    # 依赖说明，不会自动执行安装
├── icon.png                            # 可选：包内图标
├── app.html                            # 可选：MCP App 构建产物
├── skills/
│   └── query/
│       ├── SKILL.md                     # 可选：业务指引
│       └── references/
│           └── metrics.md              # 技能所需的参考资料
└── cn.com.bladeai.agent/
    ├── config.schema.json              # 可选：用户配置表单
    └── mcp-auth.json                   # 可选：HTTP MCP 认证引用
```

这是 BA 的包布局；通过 Hub 分发时还需满足其文件白名单，当前版本的差异见[发布前检查](../publish/#发布前检查)。MCP Apps 的 `ui://` 地址由 MCP 服务映射到界面内容，并不要求使用固定的 HTML 文件名。

BA 从 `skills/` 下的直接子目录查找 `SKILL.md`。不要把技能再套进 `skills/team/query/SKILL.md`，也不要把其他客户端的 `commands/`、`agents/` 当成 BA 会自动识别的入口。

## 编写 `plugin.json`

| 字段 | 要求 | 用途 |
| --- | --- | --- |
| `$schema` | 必需，值为 `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` | 指定清单版本 |
| `name` | 必需，与 Hub 资源名一致 | 插件身份、配置路径及能力归属 |
| `version` | 可选，建议发布时填写 | 标识交付版本，建议采用 `0.1.0` 形式 |
| `description` | 可选，建议填写 | 用一句话说明插件提供的业务能力 |
| `author` | 可选对象 | 可包含 `name`、`email`、`url` |
| `homepage`、`repository`、`license` | 可选字符串 | 项目地址和许可证信息 |
| `keywords` | 可选字符串数组 | 检索标签 |
| `extensions` | 可选对象 | 按反向域名组织客户端扩展 |

规范允许的名称与 Hub 名称规则并不完全一致。为兼容两端，建议使用不超过 64 个字符的小写字母、数字及单个连字符，首尾为字母或数字，例如 `business-data`；不要用下划线、点、连续连字符，也不要使用 Hub 保留的 `upload`、`create`、`installed`、`new`。

技术名称发布后应保持稳定：改名会产生新的身份和用户配置路径。版本号是元数据，不能据此推断已有会话会自动更新。

## 配置显示名称与图标

将以下字段加入清单的 `extensions`：

```json
{
  "extensions": {
    "cn.com.bladeai.agent": {
      "display_name": "业务数据",
      "icon": "icon.png"
    }
  }
}
```

显示名最多 64 个字符；图标必须是包内相对路径，支持 PNG、JPEG、WebP，最大 256 KiB。当前 BA 不支持把 SVG 或远程图片 URL 用作插件图标。

这些字段只影响 BA 展示，不改变 `name`。缺失或无效时，BA 使用技术名称和默认图标；当前 Hub 列表可能仍显示技术名称，不应为此新增非标准的清单顶层字段。

## 路径、数据与打包规则

| 位置 | 生命周期 | 使用方式 |
| --- | --- | --- |
| `PLUGIN_ROOT` | 当前会话准备的插件包 | 读取代码及随包资源；不要硬编码平台绝对路径 |
| `PLUGIN_DATA` | 当前会话中该插件的运行数据目录 | 保存可重建缓存等运行数据，不等同于跨会话配置 |
| `~/.plugin/business-data/config.json` | 同一用户的持久配置 | 由 BA 写入，插件读取，多个会话共享 |
| `~/.plugin/business-data/data/` | 插件自行管理的用户数据 | 如需跨会话保存状态，可自行使用并处理并发与清理 |

stdio 服务会获得 `PLUGIN_ROOT` 和 `PLUGIN_DATA` 环境变量；`mcp.json` 的参数、环境值及工作目录支持对应占位符。普通 Skill 脚本不能假定也获得了这两个变量，宜从脚本自身路径定位随包资料。

打包时让 `plugin.json` 直接位于 ZIP 根目录，排除 `.venv`、`node_modules`、账号配置、运行缓存和开发密钥。不能包含符号链接、绝对路径或越界路径；BA 包上限为压缩后 50 MiB、解压后 200 MiB、500 个文件，Hub 还限制单文件不超过 3 MiB。

优先用 `python3 server.py` 这样的解释器入口。Hub 重新打包时不要假定能保留脚本执行权限；需要额外依赖时应在交付环境中提前准备，而不是把整套开发环境塞进插件 ZIP。
