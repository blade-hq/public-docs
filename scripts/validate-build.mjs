import { readFileSync } from 'node:fs';

const index = readFileSync('dist/index.html', 'utf8');
const pagefind = JSON.parse(readFileSync('dist/pagefind/pagefind-entry.json', 'utf8'));
const errors = [];
if (!/<html[^>]+lang="zh-CN"/.test(index)) errors.push('dist/index.html 的 lang 不是 zh-CN');
if (!Object.keys(pagefind.languages || {}).some((lang) => lang.startsWith('zh'))) errors.push('Pagefind 没有生成中文索引');
if (!readFileSync('dist/blog/rss.xml', 'utf8').includes('<rss')) errors.push('Blog RSS 未生成');
if (!readFileSync('dist/changelog/rss.xml', 'utf8').includes('<rss')) errors.push('Changelog RSS 未生成');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('构建产物校验通过');
