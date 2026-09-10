import json
from pathlib import Path
from typing import Any, Literal

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("business-data")
APP_URI = "ui://business-data/app.html"
CONFIG_PATH = Path.home() / ".plugin" / "business-data" / "config.json"
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


def read_config() -> dict[str, Any]:
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise ValueError("请打开业务数据插件配置，填写演示令牌并保存") from None
    if not isinstance(config, dict) or config.get("token") != "demo-token":
        raise ValueError("演示令牌应填写 demo-token，请勿使用真实凭据")
    dataset = config.get("default_dataset")
    if not isinstance(dataset, str) or dataset not in DATASETS:
        raise ValueError("请在插件配置中选择销售或库存作为默认数据集")
    return config


def dataset_result(dataset: str | None = None) -> dict[str, Any]:
    config = read_config()
    selected = dataset or config["default_dataset"]
    rows = DATASETS[selected]
    return {
        "datasets": list(DATASETS),
        "dataset": selected,
        "rows": rows,
        "row_count": len(rows),
        "demo": True,
    }


@mcp.tool()
def query_dataset(
    dataset: Literal["sales", "inventory"] | None = None,
) -> dict[str, Any]:
    """查询演示销售金额或库存数量；不传数据集时使用用户配置的默认值。"""
    return dataset_result(dataset)


@mcp.tool(meta={"ui": {"resourceUri": APP_URI, "visibility": ["model", "app"]}})
def open_data_browser() -> dict[str, Any]:
    """打开业务数据选择卡片，预览默认数据集，让用户选择数据后提交分析请求。"""
    return dataset_result()


@mcp.tool(meta={"ui": {"visibility": ["app"]}})
def inspect_dataset(dataset: Literal["sales", "inventory"]) -> dict[str, Any]:
    """查询卡片选择的演示数据集。"""
    return dataset_result(dataset)


@mcp.resource(
    APP_URI,
    mime_type="text/html;profile=mcp-app",
    meta={"ui": {"csp": {"connectDomains": [], "resourceDomains": []}, "permissions": {}}},
)
def app_html() -> str:
    return Path(__file__).with_name("app.html").read_text(encoding="utf-8")


if __name__ == "__main__":
    mcp.run(transport="stdio")
