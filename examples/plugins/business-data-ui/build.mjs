import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../business-data');
const manifest = JSON.parse(await readFile(join(source, 'plugin.json'), 'utf8'));
const output = resolve(here, '../../../public/downloads', `${manifest.name}-${manifest.version}.zip`);
const result = await build({
  entryPoints: [join(here, 'app.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  minify: true,
  absWorkingDir: here,
  metafile: true,
  write: false,
});
const packages = new Set(Object.keys(result.metafile.inputs)
  .filter((path) => path.startsWith('node_modules/'))
  .map((path) => {
    const parts = path.slice('node_modules/'.length).split('/');
    return parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  }));
const notices = [];
for (const name of [...packages].sort()) {
  const directory = join(here, 'node_modules', name);
  for (const file of (await readdir(directory)).filter((file) => /^(LICENSE|NOTICE)(\.|$)/i.test(file))) {
    notices.push(`${name} / ${file}\n\n${await readFile(join(directory, file), 'utf8')}`);
  }
}
const script = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>业务数据</title>
<style>
body{margin:16px;font:14px system-ui;color:#222;background:#fff}
label,select,button{font:inherit}
select,button{margin:4px;padding:6px;max-width:100%}
pre{white-space:pre-wrap;overflow-wrap:anywhere}
#status{color:#9b2525}
</style>
<h1 style="font-size:18px">业务数据</h1>
<label for="dataset">数据集</label><select id="dataset" disabled></select>
<button id="load" type="button" disabled>查询</button>
<pre id="result"></pre>
<button id="send" type="button" disabled>加入待发送区</button>
<p id="status" role="status"></p>
<script>${script}</script>
</html>`;
const files = [
  'plugin.json', 'mcp.json', 'server.py', 'requirements.txt', 'README.md',
  'cn.com.bladeai.agent/config.schema.json', 'skills/query/SKILL.md',
  'docs/config.example.json',
];
const stage = await mkdtemp(join(tmpdir(), 'business-data-package-'));
try {
  for (const file of files) {
    await mkdir(dirname(join(stage, file)), { recursive: true });
    await cp(join(source, file), join(stage, file));
  }
  await writeFile(join(stage, 'app.html'), html, 'utf8');
  await writeFile(join(stage, 'docs/THIRD_PARTY_NOTICES.txt'), notices.join('\n\n'), 'utf8');
  await mkdir(dirname(output), { recursive: true });
  const archive = join(stage, 'package.zip');
  execFileSync('zip', ['-q', '-X', archive, ...files, 'app.html', 'docs/THIRD_PARTY_NOTICES.txt'], { cwd: stage });
  await cp(archive, output);
  console.log(output);
} finally {
  await rm(stage, { recursive: true, force: true });
}
