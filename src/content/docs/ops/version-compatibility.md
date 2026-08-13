---
title: 版本与兼容性
description: Blade Agent、JavaScript SDK、Python SDK、Blade Hub、Blade OAuth 和沙箱镜像的版本匹配规则。
appliesTo: ">=2608.0.0"
---

Blade Agent 的镜像与 SDK 使用同一 CalVer 版本号。Blade Hub、Blade OAuth 和沙箱镜像有独立发布节奏；只在更新日志明确要求时同步升级。

## 基本规则

| 组件 | 匹配规则 |
| --- | --- |
| Blade Agent 镜像 | 以更新日志中的完整 tag 为准，包括 `v` 前缀 |
| JavaScript SDK | 安装与 `GET /api/version` 返回的 `version` 相同的精确版本 |
| Python SDK | 使用同一发布清单中的精确版本；包名以对应版本更新日志为准 |
| Blade Hub | 更新日志出现「需同步 Blade Hub」时，必须按前置条件成对部署 |
| Blade OAuth | 身份或默认令牌接口变更时，先验证要求的接口与声明 |
| 沙箱镜像 | 只有更新日志明确写出新镜像时才更新，不要自行猜测 tag |

## 获取服务端版本

```bash
curl http://<host>:8020/api/version
```

```json
{
  "version": "2608.0.4",
  "min_sdk": "1.1.1"
}
```

`version` 用来选择 SDK；`min_sdk` 是协议最低断点，不表示旧 SDK 拥有新版本的全部功能。

## 已知版本要求

| Blade Agent | 类型 | 配套要求 |
| --- | --- | --- |
| `2608.0.0` | 正式版 | SDK 改用 `2608.0.0`；沙箱继续 `sandbox-v0.0.29` |
| `2608.0.2` | 正式版 | Blade OAuth 必须提供 `GET /api/v1/pat/v3/default`；沙箱继续 `sandbox-v0.0.30` |
| `2608.0.3` | 正式版 | SDK 使用 `2608.0.3`；联网检索改在界面配置；沙箱不变 |
| `2608.0.4` | 正式版 | 镜像和 SDK 同步到 `2608.0.4` |
| `2610.0.0-beta.1` | 预发布 | Blade Hub 必须含模板用户空间改动；BA 与 BH 必须成对回滚 |

## 升级前检查

1. 阅读目标版本的「前置条件」「升级步骤」「回滚方式」「已知限制」。
2. 请求当前环境的 `/api/version`，记录镜像和 SDK 基线。
3. 检查更新日志是否要求 Blade Hub、Blade OAuth 或沙箱镜像同步。
4. 在测试环境验证登录、会话、文件、浏览器和关键 Skill。
5. 准备成对回滚的镜像与配置，不只保存 Blade Agent tag。
