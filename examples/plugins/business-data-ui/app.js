import { App } from '@modelcontextprotocol/ext-apps';

const app = new App({ name: 'Business Data', version: '1.0.0' });
const select = document.querySelector('#dataset');
const output = document.querySelector('#result');
const status = document.querySelector('#status');
const load = document.querySelector('#load');
const send = document.querySelector('#send');
let selected = null;
let busy = false;

function render(result) {
  selected = null;
  output.textContent = '';
  send.disabled = true;
  if (result.isError) throw new Error('查询失败，请检查插件配置后重试');
  const data = result.structuredContent;
  if (!data || !Array.isArray(data.datasets)) throw new Error('服务返回的数据格式无效');
  const labels = { sales: '销售', inventory: '库存' };
  select.replaceChildren(...data.datasets.map((id) => new Option(labels[id] || id, id)));
  selected = data.dataset ? data : null;
  if (selected) select.value = selected.dataset;
  output.textContent = selected ? JSON.stringify(selected.rows, null, 2) : '';
  send.disabled = !selected || busy;
}

app.ontoolresult = (result) => {
  try {
    render(result);
    status.textContent = '';
  } catch (error) {
    status.textContent = error.message;
  }
};

async function run(action) {
  if (busy) return;
  busy = true;
  load.disabled = send.disabled = select.disabled = true;
  status.textContent = '';
  try {
    await action();
  } catch (error) {
    status.textContent = error.message || '操作失败，请重试';
  } finally {
    busy = false;
    load.disabled = select.disabled = false;
    send.disabled = !selected;
  }
}

select.onchange = () => {
  selected = null;
  output.textContent = '';
  send.disabled = true;
};

load.onclick = () => run(async () => {
  selected = null;
  output.textContent = '';
  const result = await app.callServerTool({
    name: 'inspect_dataset',
    arguments: { dataset: select.value },
  });
  render(result);
  await app.updateModelContext({
    content: [{ type: 'text', text: `用户已预览演示数据集 ${selected.dataset}` }],
    structuredContent: selected,
  });
});

send.onclick = () => run(async () => {
  if (!selected) return;
  await app.sendMessage({
    role: 'user',
    content: [{ type: 'text', text: `请分析以下演示数据：${JSON.stringify(selected)}` }],
  });
  status.textContent = '已加入待发送区';
});

app.connect().then(() => {
  load.disabled = select.disabled = false;
}).catch(() => {
  status.textContent = '无法连接会话，请在 BA 对话卡片中打开';
});
