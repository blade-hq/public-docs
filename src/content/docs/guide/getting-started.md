---
title: "快速开始"
description: 从已部署的 Blade Agent 服务完成登录、版本检查和第一次可验证的对话。
appliesTo: ">=2608.0.0"
---

这一页假设 Blade Agent 已按[Docker 部署](../../ops/docker/)启动。你需要一台能访问部署地址的电脑，以及 Blade OAuth 中的用户账号。

## 前置检查

先确认 Blade Agent 服务和版本接口可用：

```bash
curl -f http://<host>:8020/api/health
curl -f http://<host>:8020/api/version
```

预期分别返回 `{"status":"ok"...}` 和包含 `version`、`min_sdk` 的 JSON。接口失败时先看[Docker 部署的自检步骤](../../ops/docker/#部署自检)，不要继续排查前端。

## 获取账号

私有化环境的管理员账号由 Blade OAuth 的部署和组织配置决定。`v2610.0.0-beta.1` 起，首个登录用户不会自动成为管理员；请在 Blade OAuth 管理端（`http://<host>:19000/admin`）确认管理员身份，再创建团队账号。

如果你使用的是公司提供的演示环境，向环境管理员索取地址和账号。本文档不提供公共匿名实例。

## 登录平台

打开浏览器，访问 `http://<host>`（Blade OS 桌面，端口 80），使用账号密码登录。

## 进入桌面

登录成功后，自动进入 Blade OS 浏览器桌面。桌面是你使用所有功能的起点。

<img src="../../images/blade-os-desktop.png" alt="Blade OS 桌面">

## 发起第一次对话

1. 在桌面上打开「智能助手」应用，也可以直接访问 `http://<host>:8020`。
2. 上传一个不含敏感信息的文本或表格文件。
3. 输入一个带验证条件的任务，例如：`读取 sample.csv，按 status 分组统计行数，把结果写入 summary.md，并在回复中列出各组数量。`
4. 发送消息，观察文件读取、命令执行和产物生成。

<video src="../../images/first-chat-demo.mp4" controls autoplay loop muted playsinline style="width:100%;border-radius:8px;margin-top:16px"></video>

## 验证结果

任务结束后确认三件事：回复中的统计总数等于原文件行数；会话产物中出现 `summary.md`；打开文件后，分组名称与数量和回复一致。只看到“任务完成”不算验证。

## 常见失败

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `:80` 能打开，SDK 或 API 请求失败 | `:80` 是 Blade OS，不是 Blade Agent API | API 和 SDK 使用 `http://<host>:8020` |
| 登录后没有管理员入口 | 当前账号没有 Blade OAuth 管理员声明 | 由现有管理员在 Blade OAuth 中分配权限 |
| 对话只给建议、不执行工具 | 当前角色处于规划模式或没有所需 Skill | 切换到执行模式，并检查角色和 Skill |
| 文件已上传但智能体找不到 | 消息中没写清文件名，或上传仍未完成 | 等上传完成后在任务里引用准确文件名 |
