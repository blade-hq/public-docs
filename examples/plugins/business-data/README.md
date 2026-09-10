# 业务数据插件 1.0.0

这是插件开发指南的完整演示包，已包含 Skill、用户配置声明、MCP 工具和构建好的交互界面；无需自己构建前端。所有数据都来自包内固定样例，不访问真实业务系统。

## 安装与使用

1. 确认 BA 支持插件配置与 MCP Apps，并使用沙盒会话；沙盒的 `python3` 需安装 `requirements.txt` 中的依赖。
2. 通过兼容的 Hub 上传此 ZIP，资源名填写 `business-data`，点击安装，然后在新建的 BA 会话中激活插件。
3. 打开插件配置，演示令牌填写 `demo-token`，默认数据集选择 `sales` 或 `inventory`，保存。
4. 输入“用业务数据插件汇总销售金额”，结果应为 2000；库存数量合计应为 25。
5. 输入“打开业务数据选择卡片”，选择数据集、查询并预览，再点“加入待发送区”，由用户发送分析请求。

配置里的演示令牌只是为了演示表单与读取逻辑，不提供真实身份认证，也不需要真实凭据。修改默认数据集后，下一次打开卡片或不指定数据集查询时会读取新值。

## 分发限制

本指南核对的 Hub `5c8da9d0` 不允许上传 `cn.com.bladeai.agent/` 和 `.html` 文件，因此该版本会拒绝本完整包。需要部署方先提供兼容的分发支持；下载文件本身不会绕过此限制，也不会自动安装 Python 依赖。

同名旧插件已经在会话中准备过时，请新建会话验证本包；重复勾选不会强制升级已有会话。已有用户配置若使用其他演示值，请重新保存本包要求的配置。

## 包内文件

- `plugin.json`、`mcp.json`：插件身份和工具服务入口。
- `server.py`、`requirements.txt`：Python 实现及依赖。
- `cn.com.bladeai.agent/config.schema.json`：用户配置表单。
- `skills/query/SKILL.md`：工具选择与结果解读指引。
- `app.html`：已构建的单文件界面，SDK 已内嵌，不依赖 CDN。
- `docs/config.example.json`：演示配置格式，仅供参考；不会自动写入用户 Home。
- `docs/THIRD_PARTY_NOTICES.txt`：界面内嵌依赖的许可证与声明。

用户真实配置由 BA 保存到 `~/.plugin/business-data/config.json`。本包不包含用户配置、令牌缓存或开发环境目录；工具读取配置但不在结果中返回演示令牌。

## 源码与重建

源代码位于文档仓库的 `examples/plugins/business-data/`，界面与打包脚本位于相邻的 `business-data-ui/`。在 `business-data-ui` 执行 `npm ci`、`npm run build`，即可生成带预构建界面的完整 ZIP。

该包没有接入配置章节中的示例远程域名，也没有模拟真实登录或刷新令牌；接入企业业务系统时，应替换数据查询实现并由业务服务执行实际认证和权限检查。
