---
title: "接入 MCP 工具"
description: 设计插件工具，通过 stdio 或 Streamable HTTP 提供 MCP 服务，并处理运行依赖与调用失败。
---

## 设计工具的输入与输出

按业务动作命名工具，例如 `query_dataset`、`get_order`，让参数表示业务概念；不要把任意 shell 或 SQL 执行作为普通查询插件的默认入口。

快速开始使用 `Literal["sales", "inventory"]` 限定数据集，返回 `dataset`、`rows` 和 `row_count`。对真实业务系统还应明确单位、时间范围、分页和权限边界，使智能体能区分“没有记录”“只返回第一页”和“查询失败”。

工具描述告诉智能体工具能做什么；返回结果只包含完成任务需要的信息，不返回密码、访问令牌或完整认证响应。

## 运行包内 stdio 服务

在包根目录的 `mcp.json` 中声明服务：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "data": {
      "type": "stdio",
      "command": "python3",
      "args": ["${PLUGIN_ROOT}/server.py"],
      "cwd": "${PLUGIN_ROOT}"
    }
  }
}
```

`command` 是单个可执行文件名，或 `./` 开头的包内入口；参数写在 `args`，不能把 `python3 server.py` 整句放进 `command`。默认工作目录是插件根目录，可指定包内子目录或 `${PLUGIN_DATA}` 下已存在的目录。

运行时提供 `PLUGIN_ROOT` 和 `PLUGIN_DATA`，不要在 `env` 中覆盖它们。其他 `env` 值是随包配置，不适合保存用户秘密；用户凭据应走[配置文件](../configuration/)。

工具在沙盒内执行，沙盒需要预先具备 Python、MCP SDK 和插件依赖；上传包不会触发 `pip install`。stdio 的标准输出用于协议通信，调试信息应写到标准错误。进程内变量也不能作为可靠的持久会话状态，应把需要保留的数据写到合适的数据目录。

## 连接 Streamable HTTP 服务

已有 MCP 服务可以直接声明地址：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "data": {
      "type": "streamable-http",
      "url": "https://data.example.com/mcp"
    }
  }
}
```

将示例地址换成真实服务。地址必须能从沙盒访问，除 loopback 地址外必须使用 HTTPS；`localhost` 指沙盒自身，不是开发电脑或 BA 宿主机。当前不支持 SSE，也不把 SSE 自动转换为 Streamable HTTP。

若部署环境已经管理了服务凭据，可在 `cn.com.bladeai.agent/mcp-auth.json` 引用沙盒环境变量名称：

```json
{
  "mcpServers": {
    "data": {
      "bearer_token_env_var": "BUSINESS_DATA_SERVICE_TOKEN"
    }
  }
}
```

这项扩展只适用于 HTTP 服务，也支持 `env_http_headers` 将 HTTP header 名映射到环境变量名；不要与静态 `headers` 重复定义同一个 header。它不会把用户配置表单自动转换成环境变量，更不会执行 OAuth 登录。

需要每个用户分别填写凭据时，优先使用读取用户配置的包内 stdio 连接器，再由连接器请求业务服务；远程 MCP 服务不能直接读取沙盒的用户 Home。该扩展目录的 Hub 分发限制见[发布前检查](../publish/#发布前检查)。

## 工具如何被发现与调用

BA 在用户激活插件后准备包；声明了用户配置时，先检查配置，再连接 MCP 服务获取工具清单。智能体看到的是当前已激活插件的工具索引，并通过平台生成的沙盒入口查询参数和调用原始工具名。

一个插件可以声明多个 MCP 服务，当前上限为 6 个。服务按条目分别准备，一个服务失败不等于其他服务和独立 Skill 都失效；检查时要看具体服务的状态，不能只看插件是否已勾选。

不要把发现时生成的命令路径固化到 Skill。带 MCP Apps 的调用需要完整输出供 BA 识别来源，不能给平台生成的调用命令追加 `head`、管道或重定向。

## 处理执行失败与副作用

失败信息应告诉用户下一步能做什么，例如“访问令牌已失效，请重新填写插件配置”，并避免包含响应 header、令牌或堆栈中的秘密。查询结果为空应返回正常的空列表，不能伪装成服务错误。

真实 HTTP 请求应设置超时并检查响应状态，重试范围由业务语义决定：只读请求可以在明确条件下重试，创建订单等写操作应携带业务幂等键并由服务端去重。工具标注和 Skill 指引都不能代替后端授权或幂等逻辑。

BA 对 MCP 工具返回内容有 4 MiB 上限。大数据查询应分页、汇总或返回后续可访问的业务对象标识，避免把整张数据库表塞进一次响应。
