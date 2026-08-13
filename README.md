# Blade OS 帮助文档

公开的 Blade OS 产品与开发文档，使用 [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/) + MDX 构建。

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
