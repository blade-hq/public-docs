import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import rewritePublicAssets from './src/plugins/rewrite-public-assets.mjs';

const site = process.env.SITE_URL || 'https://blade-hq.github.io';
const base = process.env.BASE_PATH || '/public-docs';

export default defineConfig({
  site,
  base,
  markdown: {
    rehypePlugins: [[rewritePublicAssets, { base }]],
  },
  integrations: [
    starlight({
      title: 'Blade Agent',
      description: 'Blade Agent 使用文档、更新日志与产品 Blog',
      customCss: ['./src/styles/custom.css'],
      components: {
        Header: './src/components/Header.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/blade-hq/public-docs' },
      ],
      lastUpdated: true,
      pagination: true,
      plugins: [
        starlightLinksValidator({
          errorOnRelativeLinks: false,
          exclude: ['/public-docs/downloads/**'],
        }),
      ],
      sidebar: [
        {
          label: '使用指南',
          items: [
            { label: '快速开始', slug: 'guide/getting-started' },
            { label: 'Blade OS 桌面', slug: 'guide/blade-os' },
            { label: '解决方案与角色', slug: 'guide/solutions-and-roles' },
            { label: '云电脑', slug: 'guide/cloud-computer' },
            { label: '软件工厂', slug: 'guide/factory' },
            { label: '技能编辑', slug: 'guide/skill-editor' },
            {
              label: '智能助手',
              collapsed: false,
              items: [
                { label: '对话与交互', slug: 'guide/chat' },
                { label: '会话管理', slug: 'guide/sessions' },
                { label: '记忆功能', slug: 'guide/memory' },
                { label: '定时任务', slug: 'guide/scheduled-tasks' },
                { label: '浏览器插件', slug: 'guide/browser-extension' },
              ],
            },
          ],
        },
        {
          label: '智能体开发',
          items: [
            { label: '核心概念', slug: 'agent-dev/concepts' },
            {
              label: '解决方案开发',
              items: [
                { label: '目录结构与 manifest', slug: 'agent-dev/solution/structure' },
                { label: '业务角色配置', slug: 'agent-dev/solution/bizrole' },
                { label: '解决方案应用', slug: 'agent-dev/solution/app' },
                { label: '校验工具', slug: 'agent-dev/solution/validation' },
              ],
            },
            {
              label: '技能开发',
              items: [
                { label: 'SKILL.md 编写规范', slug: 'agent-dev/skill/skill-md' },
                { label: '技能注册中心', slug: 'agent-dev/skill/registry' },
                { label: '发布与版本管理', slug: 'agent-dev/skill/publish' },
                { label: '内置系统工具', slug: 'agent-dev/skill/tools' },
              ],
            },
            { label: '调试与排查', slug: 'agent-dev/debugging' },
          ],
        },
        {
          label: '应用接入',
          items: [
            { label: '核心概念', slug: 'integration/concepts' },
            {
              label: '前端 SDK',
              items: [
                { label: 'React', slug: 'integration/frontend/react' },
                { label: 'Vue', slug: 'integration/frontend/vue' },
                { label: '聊天 UI 与自渲染', slug: 'integration/frontend/chat-ui' },
                { label: '宿主页面联动', slug: 'integration/frontend/host-integration' },
              ],
            },
            {
              label: '后端接入',
              items: [
                { label: 'Node.js', slug: 'integration/backend/nodejs' },
                { label: 'Python', slug: 'integration/backend/python' },
                { label: '鉴权与 Token', slug: 'integration/backend/auth' },
                { label: '文件上传', slug: 'integration/backend/file-upload' },
              ],
            },
            {
              label: '智能体能力',
              items: [
                { label: '工作模式', slug: 'integration/capabilities/work-modes' },
                { label: '指定解决方案与角色', slug: 'integration/capabilities/solution-role' },
                { label: '会话技能上传', slug: 'integration/capabilities/session-skill' },
                { label: '外部服务接入', slug: 'integration/capabilities/external-services' },
              ],
            },
            { label: '调试与排查', slug: 'integration/debugging' },
          ],
        },
        {
          label: 'API 参考',
          items: [
            { label: '概览', slug: 'api/overview' },
            { label: 'REST 接口', slug: 'api/rest' },
            { label: 'WebSocket 接口', slug: 'api/websocket' },
            { label: '核心类型', slug: 'api/types' },
            { label: '会话生命周期', slug: 'api/session-lifecycle' },
            { label: 'Chat 流程', slug: 'api/chat-flow' },
          ],
        },
        {
          label: '部署与运维',
          items: [
            { label: 'Docker 部署', slug: 'ops/docker' },
            { label: 'Blade OAuth', slug: 'ops/oauth' },
            { label: 'LLM Gateway 配置', slug: 'ops/llm-gateway' },
            { label: '使用盒子内的大模型', slug: 'ops/use-llm' },
            { label: '沙箱镜像定制', slug: 'ops/sandbox' },
            { label: '环境变量参考', slug: 'ops/env' },
            { label: '监控与观测', slug: 'ops/monitoring' },
            { label: '安全与加密', slug: 'ops/security' },
          ],
        },
      ],
    }),
  ],
  vite: {
    server: { strictPort: true },
  },
});
