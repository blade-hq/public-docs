---
title: "开发第一个插件"
description: 用一个可运行的 Python MCP 服务制作业务数据查询插件，完成打包、安装和首次调用。
---

## 准备环境与示例目标

本例提供两组固定的演示数据，用户说“用业务数据插件查询销售数据”时，智能体应调用 `query_dataset` 并返回两条记录。示例不连接真实业务系统，也不需要账号配置。

需要已启用插件功能的 BA、与 BA 连接的 Hub，以及可用的沙盒会话；登录模式下使用同一账号访问两项服务。Python 服务运行在会话沙盒内，因此只在开发电脑安装依赖不够。

开发电脑使用 Python 3.10 或更新版本，创建独立环境：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install 'mcp==1.27.1'
```

沙盒中的 `python3` 也需要能执行 `from mcp.server.fastmcp import FastMCP`，并具有兼容的 MCP 1.x 版本；依赖准备参见[沙箱镜像定制](../../../ops/sandbox/)。平台不会因为包中出现 `requirements.txt` 就自动安装依赖。

## 创建最小插件包

建立以下目录，`.venv` 放在插件目录外：

```text
business-data/
├── plugin.json
├── mcp.json
├── requirements.txt
└── server.py
```

`plugin.json`：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "business-data",
  "version": "0.1.0",
  "description": "查询演示业务数据，支持销售与库存数据集",
  "extensions": {
    "cn.com.bladeai.agent": {
      "display_name": "业务数据"
    }
  }
}
```

`mcp.json`：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "data": {
      "type": "stdio",
      "command": "python3",
      "args": ["${PLUGIN_ROOT}/server.py"]
    }
  }
}
```

`requirements.txt`：

```text
mcp==1.27.1
```

`server.py`：

```python
from typing import Any, Literal

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("business-data")

DATASETS = {
    "sales": [
        {"product": "A", "amount": 1200},
        {"product": "B", "amount": 800},
    ],
    "inventory": [
        {"product": "A", "quantity": 18},
        {"product": "B", "quantity": 7},
    ],
}


@mcp.tool()
def query_dataset(
    dataset: Literal["sales", "inventory"],
) -> dict[str, Any]:
    """查询演示数据：sales 是销售金额，inventory 是库存数量。"""
    rows = DATASETS[dataset]
    return {"dataset": dataset, "rows": rows, "row_count": len(rows)}


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

这段代码使用 [MCP Python SDK 的 FastMCP](https://github.com/modelcontextprotocol/python-sdk/tree/v1.27.1)；参数类型生成工具的输入约束，字典结果同时供智能体和后续界面使用。无需编写 `tools.py` 或额外注册 BA 工具。

## 安装并在会话中激活

在 `business-data` 目录内打包文件，确保 ZIP 根目录直接包含清单：

```bash
cd business-data
zip ../business-data-0.1.0.zip plugin.json mcp.json requirements.txt server.py
```

在 Hub 的插件页面选择“上传”，资源名填写 `business-data`，上传 ZIP 后点击该插件的“安装”。随后进入 BA 沙盒会话，打开插件列表，勾选“业务数据”；尚未读取展示信息时也可能先显示技术名称 `business-data`。

上传成功与安装是两步操作。插件没有出现在 BA 列表时，先确认 Hub 中已安装、两个服务使用同一账号，且 BA 已连接到该 Hub；完整接口见[发布到 Hub](../publish/#发布到-hub)。

## 完成第一次调用

在会话中输入：

> 用业务数据插件查询销售数据，列出产品及金额，并计算合计。

预期工具调用为 `query_dataset`，参数是 `{"dataset":"sales"}`，结果含两行数据，金额分别为 1200 和 800，合计 2000。再查询库存，应得到数量 18 和 7。

验证时看实际工具记录，不只看最终回答。若插件已勾选但工具未就绪，检查沙盒中的 Python 依赖与服务启动错误；stdio 服务不能往标准输出打印调试日志。

下一步可[添加 Skill](../skills/)，让智能体遵循业务口径；需要账号的服务继续读[用户配置与账号认证](../configuration/)。
