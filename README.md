# Blade Agent 公共文档

公开的 Blade Agent 使用、开发、接入与版本文档，使用 [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/) + MDX 构建。

## 本地开发

```bash
pnpm install
pnpm dev
```

默认访问 `http://localhost:4321/public-docs/`。

## 构建与预览

```bash
pnpm build
pnpm preview
```

## 目录

- `src/content/docs/`：MDX 文档
- `public/images/`：文档图片与演示视频
- `public/downloads/`：示例工程下载
- `astro.config.mjs`：站点、导航与侧边栏配置

本仓库只保留公开使用文档，不包含可安装的 Skill 包或 Skill 实现代码。


## 内容发布规则

- 使用文档回答怎么部署、使用、接入和排障。
- 更新日志只记录已发布版本；每个版本必须写前置条件、升级、回滚和已知限制。
- Blog 写产品与工程判断，必须署名并给出代码、日志、配置、数据或可核对的时间线。
- `pnpm build` 会执行内容校验、类型检查、双向链接校验和中文搜索索引校验。

详细审计与治理依据见 [`docs/content-audit-2026-08-13.md`](docs/content-audit-2026-08-13.md)。
