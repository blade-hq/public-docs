---
title: 端到端接入示例
description: 用 JavaScript SDK 完成版本检查、创建会话、上传文件、发送任务、接收流式事件和下载产物。
appliesTo: ">=2608.0.0"
---

这条路径覆盖一个真实接入最容易漏掉的环节：版本匹配、文件路径、Socket.IO 结束条件和产物校验。示例接口以 `@blade-hq/agent-kit/client` 为准。

## 前置条件

- Blade Agent 已运行在 `http://<host>:8020`
- 当前用户已创建 API Key
- 已准备 `report.csv`
- Node.js 项目使用 ESM，`package.json` 包含 `"type": "module"`

先检查后端版本：

```bash
curl http://<host>:8020/api/version
```

假设返回 `2608.0.4`：

```bash
pnpm add @blade-hq/agent-kit@2608.0.4
```

## 创建会话并上传文件

```ts
import { readFile } from "node:fs/promises"
import { BladeClient } from "@blade-hq/agent-kit/client"

const client = new BladeClient({
  baseUrl: "http://<host>:8020",
  token: process.env.BLADE_API_KEY,
})

const { session_id } = await client.sessions.createSession("分析状态报表")
const buffer = await readFile("report.csv")

await client.sessions.uploadFiles(session_id, ".", [
  {
    file: new File([buffer], "report.csv", { type: "text/csv" }),
    name: "report.csv",
  },
])
```

文件上传到会话工作区后，消息中引用准确文件名，不要只说“刚才的文件”。

## 发送任务并等待结束

```ts
const socket = client.socket()

await new Promise((resolve, reject) => {
  socket.on("connect_error", reject)
  socket.on("system:error", reject)
  socket.on("turn:patch", (event) => {
    process.stdout.write(event.data?.turn?.text_delta ?? "")
  })
  socket.on("chat:end", resolve)

  socket.emit("chat:send", {
    session_id,
    mode: "executing",
    message: [
      "读取工作区里的 report.csv。",
      "按 status 分组统计行数。",
      "把结果写入 summary.md。",
      "回复时列出每组数量，并确认总数等于原文件数据行数。",
    ].join("\n"),
  })
})
```

不要只监听 `turn:end`。一次任务可能有多个 turn，最终结束信号是 `chat:end`；错误路径还要处理 `system:error` 和 `connect_error`。

## 验证并取回产物

先列出工作区，确认 `summary.md` 存在，再下载文件：

```ts
const files = await client.sessions.listDir(session_id, ".")
const output = files.find((item) => item.name === "summary.md")
if (!output) throw new Error("任务结束，但 summary.md 不存在")

const response = await fetch(
  `http://<host>:8020/api/sessions/${session_id}/files/summary.md`,
  { headers: { Authorization: `Bearer ${process.env.BLADE_API_KEY}` } },
)
if (!response.ok) throw new Error(`下载失败: ${response.status}`)
console.log(await response.text())
```

Node.js 环境不能调用只为浏览器下载设计的 `downloadFile()`，所以示例直接请求 REST 文件接口。更多方法见[文件上传](./backend/file-upload/)和[REST 接口](../api/rest/#工作空间文件)。验证原则不变：收到 `chat:end` 之后，仍要检查产物是否存在、内容是否满足任务条件。

## 失败处理

| 现象 | 检查 |
| --- | --- |
| 401 | API Key 是否吊销，REST 与 Socket.IO 是否使用同一 Token |
| 能看历史但消息无响应 | 当前 session 是否激活，Socket.IO 是否订阅该会话 |
| 智能体不执行工具 | `mode` 是否为 `executing`，角色是否强制规划模式 |
| 找不到文件 | 上传目录和消息里的文件名是否一致 |
| 有 `chat:end` 但没产物 | 任务是否明确要求写文件；检查 `system:error` 和工具返回 |
