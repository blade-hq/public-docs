---
title: "使用 MCP Apps 提供交互界面"
description: 为业务数据插件增加选择与预览卡片，通过 MCP Apps 调用工具并向智能体传递用户选择。
---

:::note[分发前提]
本页使用 BA 已实现的 MCP Apps 能力。当前核对的 Hub 会拒绝 `.html` 文件，自定义插件需要兼容的分发版本才能完成上传和 BA 内验证；不要将 HTML 改后缀来规避准入。可先使用 BA 内置“演示数据中心”插件体验交互卡片。
:::

## 哪些任务适合交互界面

当用户要在多个数据集中选择、预览记录后再提问时，交互卡片比反复输入名称更方便。MCP Apps 让插件在对话里提供这类界面，界面经宿主调用 MCP 工具，凭据和业务逻辑仍留在服务端。

本例沿用快速开始的两组演示数据，为用户提供数据集选择、结果预览和“加入待发送区”操作。无须给简单查询强制配界面，普通 MCP 工具仍可直接返回文本和结构化结果。

## 关联工具与界面资源

在插件目录中新建 `app-server.py`，保留快速开始的 `server.py` 作为演示数据来源：

```python
from pathlib import Path
from typing import Any, Literal

from mcp.server.fastmcp import FastMCP

from server import DATASETS

mcp = FastMCP("business-data-app")
APP_URI = "ui://business-data/app.html"


@mcp.tool(meta={"ui": {"resourceUri": APP_URI, "visibility": ["model", "app"]}})
def open_data_browser() -> dict[str, Any]:
    """打开业务数据选择卡片，让用户选择销售或库存并预览数据。"""
    return {"datasets": list(DATASETS)}


@mcp.tool(meta={"ui": {"visibility": ["app"]}})
def inspect_dataset(dataset: Literal["sales", "inventory"]) -> dict[str, Any]:
    """查询卡片中所选数据集。"""
    rows = DATASETS[dataset]
    return {
        "datasets": list(DATASETS),
        "dataset": dataset,
        "rows": rows,
        "row_count": len(rows),
    }


@mcp.resource(
    APP_URI,
    mime_type="text/html;profile=mcp-app",
    meta={"ui": {"csp": {"connectDomains": [], "resourceDomains": []}, "permissions": {}}},
)
def app_html() -> str:
    return Path(__file__).with_name("app.html").read_text(encoding="utf-8")


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

把 `mcp.json` 的 `args` 改成 `["${PLUGIN_ROOT}/app-server.py"]`。这一版通过 `open_data_browser` 打开卡片，`inspect_dataset` 只对卡片可见；模型不应直接调用仅含 `app` 可见性的工具。

`resourceUri` 必须与服务提供的资源 URI 一致。BA 读取并归档 HTML 后在隔离 iframe 中展示，不会把 ZIP 中任意 HTML 自动当成应用。示例不需要外部网络或资源，因此 CSP 的域名列表为空；真实应用应只声明实际需要的域名。

## 从界面调用工具

在插件目录旁创建 `business-data-ui` 构建目录，开发依赖不放入插件 ZIP：

```bash
mkdir business-data-ui
cd business-data-ui
npm init -y
npm install --save-exact @modelcontextprotocol/ext-apps@2.0.0
npm install --save-dev --save-exact esbuild@0.25.0
```

创建 `app.js`，使用 [MCP Apps SDK](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html) 与宿主连接：

```javascript
import { App } from "@modelcontextprotocol/ext-apps";

const app = new App({ name: "Business Data", version: "0.1.0" });
const select = document.querySelector("#dataset");
const output = document.querySelector("#result");
const status = document.querySelector("#status");
const load = document.querySelector("#load");
const send = document.querySelector("#send");
let selected = null;
let busy = false;

function render(result) {
  if (result.isError) throw new Error("查询失败，请检查插件配置后重试");
  const data = result.structuredContent;
  if (!data || !Array.isArray(data.datasets)) throw new Error("服务返回的数据格式无效");
  select.replaceChildren(...data.datasets.map((id) => new Option(id, id)));
  selected = data.dataset ? data : null;
  if (selected) select.value = selected.dataset;
  output.textContent = selected ? JSON.stringify(selected.rows, null, 2) : "";
  send.disabled = !selected || busy;
}

app.ontoolresult = (result) => {
  try {
    render(result);
    status.textContent = "";
  } catch (error) {
    status.textContent = error.message;
  }
};

async function run(action) {
  if (busy) return;
  busy = true;
  load.disabled = send.disabled = select.disabled = true;
  status.textContent = "";
  try {
    await action();
  } catch (error) {
    status.textContent = error.message || "操作失败，请重试";
  } finally {
    busy = false;
    load.disabled = select.disabled = false;
    send.disabled = !selected;
  }
}

select.onchange = () => {
  selected = null;
  output.textContent = "";
  send.disabled = true;
};

load.onclick = () => run(async () => {
  selected = null;
  output.textContent = "";
  const result = await app.callServerTool({
    name: "inspect_dataset",
    arguments: { dataset: select.value },
  });
  render(result);
  await app.updateModelContext({
    content: [{ type: "text", text: `用户已预览演示数据集 ${selected.dataset}` }],
    structuredContent: selected,
  });
});

send.onclick = () => run(async () => {
  if (!selected) return;
  await app.sendMessage({
    role: "user",
    content: [{
      type: "text",
      text: `请分析以下演示数据：${JSON.stringify(selected)}`,
    }],
  });
  status.textContent = "已加入待发送区";
});

app.connect().then(() => {
  load.disabled = false;
  select.disabled = false;
}).catch(() => {
  status.textContent = "无法连接会话，请在 BA 对话卡片中打开";
});
```

再创建 `build.mjs`，把依赖打包进单个 HTML，运行时不依赖 CDN：

```javascript
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";

const result = await build({
  entryPoints: ["app.js"],
  bundle: true,
  format: "iife",
  platform: "browser",
  write: false,
});
const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>业务数据</title>
<style>
body { margin: 16px; font: 14px system-ui; color: #222; background: #fff; }
label, select, button { font: inherit; }
select, button { margin: 4px; padding: 6px; max-width: 100%; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
#status { color: #9b2525; }
</style>
<h1 style="font-size:18px">业务数据</h1>
<label for="dataset">数据集</label><select id="dataset" disabled></select>
<button id="load" type="button" disabled>查询</button>
<pre id="result"></pre>
<button id="send" type="button" disabled>加入待发送区</button>
<p id="status" role="status"></p>
<script>${script}</script>
</html>`;
await writeFile("../business-data/app.html", html, "utf8");
```

执行 `node build.mjs`，将生成的 `app.html` 与 `app-server.py`、`server.py` 和清单一起交付。直接在浏览器打开 HTML 只能看到页面，完整交互必须在 BA 的 MCP App 卡片里运行；重新发布后使用新会话验证，避免读取旧包或历史卡片归档。

卡片发起工具调用时，BA 依据归档来源限制目标服务和可调用工具；业务服务仍须校验数据权限。不要在浏览器脚本里存放令牌，也不要让客户端参数决定任意服务地址。

## 把用户选择交给智能体

本例在查询完成后调用 `updateModelContext`，记录用户已预览的数据；它不会发送聊天消息或自动触发智能体运行，后续新一轮对话才读取保存的上下文。用户点击“加入待发送区”时，`sendMessage` 把文本交给 BA 的待发送区域，仍由用户决定何时发送。

两项操作要按业务含义选择：临时切换下拉选项不一定代表确认，本例只有查询成功才更新上下文。只传必要的选择和摘要，当前 BA 上下文支持文本及结构化内容，消息入口仅支持文本，均有 64 KiB 级别的大小限制。

验证时打开卡片、查询销售、切换库存，再提交分析请求；刷新页面后检查卡片恢复的结果，确认没有重复执行写操作。若同时安装了上一章的 Skill，也要把其操作指引更新为“打开数据选择卡片”，不要继续引用此版本已不提供的 `query_dataset`。
