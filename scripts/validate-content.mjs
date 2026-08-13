import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const contentDir = join(root, 'src/content/docs');
const errors = [];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  }).filter((path) => /\.mdx?$/.test(path));
}

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] || '';
}

for (const path of files(contentDir)) {
  const source = readFileSync(path, 'utf8');
  const fm = frontmatter(source);
  const name = relative(root, path);
  if (!/^description:\s*.+/m.test(fm)) errors.push(`${name}: 缺少 description`);
  if (/https:\/\/github\.com\/blade-hq\/blade-agent/.test(source)) errors.push(`${name}: 链接指向私有 blade-agent 仓库`);
  if (/blade agent run/.test(source)) errors.push(`${name}: 使用不存在的命令 blade agent run`);
  if (/1\.0\.10|0\.5\.11/.test(source)) errors.push(`${name}: 使用过期版本示例`);

  if (/contentType:\s*changelog-release/.test(fm)) {
    const version = fm.match(/^version:\s*["']?([^"'\n]+)/m)?.[1];
    const commits = Number(fm.match(/^commits:\s*(\d+)/m)?.[1] || 0);
    const refsBlock = fm.match(/^refs:\s*\[([^\]]*)\]/m)?.[1] || '';
    const refs = refsBlock.match(/#\d+/g) || [];
    if (!version || !/^\d{4}\.\d+\.\d+(?:-beta\.\d+)?$/.test(version)) errors.push(`${name}: version 格式错误`);
    if (!commits) errors.push(`${name}: 缺少 commits`);
    if (refs.length !== commits && version !== '2608.0.0') errors.push(`${name}: commits=${commits}，refs=${refs.length}`);
    const imagePaths = [...source.matchAll(/images\/releases\/([^/]+)\//g)].map((m) => m[1]);
    for (const imageVersion of imagePaths) if (`v${version}` !== imageVersion) errors.push(`${name}: 引用了其他版本图片 ${imageVersion}`);
    for (const heading of ['## 前置条件', '## 升级步骤', '## 回滚方式', '## 已知限制']) {
      if (!source.includes(heading)) errors.push(`${name}: 缺少固定小节 ${heading}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('内容校验通过');
