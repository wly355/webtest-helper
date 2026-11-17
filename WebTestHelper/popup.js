const $ = (id) => document.getElementById(id);
const out = $("out");

function setOut(text) {
  out.value = text;
  out.focus();
  out.select();
}

function tip(msg) {
  $("tip").textContent = msg;
  setTimeout(() => { $("tip").textContent = ""; }, 1500);
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function send(cmd) {
  const tab = await activeTab();
  if (!tab || !tab.id) throw new Error("没有可用的标签页");
  return chrome.tabs.sendMessage(tab.id, { cmd });
}

$("btnPick").addEventListener("click", async () => {
  try {
    await send("startPick");
    setOut("");
    tip("已在页面上开启拾取，点一下目标元素");
  } catch (e) {
    setOut("无法在当前页面拾取（浏览器内置页、设置页不支持）。换一个普通网页再试。");
  }
});

$("btnStop").addEventListener("click", async () => {
  try { await send("stopPick"); tip("已停止拾取"); } catch (e) { /* ignore */ }
});

$("btnFields").addEventListener("click", async () => {
  try {
    const res = await send("exportFields");
    const rows = (res.fields || []).map((f, i) =>
      `| ${i + 1} | ${f.label || "-"} | ${f.type} | ${f.required ? "是" : "否"} | \`${f.css}\` |`);
    setOut([`# 页面字段清单：${res.title || ""}`, "",
      "| # | 字段 | 类型 | 必填 | 定位 |", "| --- | --- | --- | --- | --- |", ...rows].join("\n"));
    tip("已导出 " + rows.length + " 个字段");
  } catch (e) {
    setOut("当前页面不支持导出，换一个普通网页再试。");
  }
});

function renderRequests(list) {
  const ul = $("reqList");
  ul.innerHTML = "";
  (list || []).slice(0, 20).forEach((r) => {
    const li = document.createElement("li");
    const ok = r.status >= 200 && r.status < 400;
    const short = r.url.length > 62 ? r.url.slice(0, 62) + "..." : r.url;
    li.innerHTML = `<span class="st ${ok ? "ok" : "bad"}">${r.status}</span> ${r.method} ${short}`;
    ul.appendChild(li);
  });
  if (!ul.children.length) {
    ul.innerHTML = "<li>还没有记录到接口请求，刷新一下目标页面再看。</li>";
  }
  return list || [];
}

$("btnRequests").addEventListener("click", async () => {
  const list = await new Promise((resolve) =>
    chrome.storage.local.get({ requests: [] }, (r) => resolve(r.requests)));
  renderRequests(list);
  const md = list.slice(0, 20).map((r) =>
    `| ${r.status} | ${r.method} | \`${r.url}\` |`).join("\n");
  setOut(["# 当前页接口请求记录", "", "| 状态码 | 方法 | URL |", "| --- | --- | --- |", md].join("\n"));
  tip("共 " + list.length + " 条");
});

$("btnCopy").addEventListener("click", async () => {
  if (!out.value) { tip("没有内容可复制"); return; }
  await navigator.clipboard.writeText(out.value);
  tip("已复制到剪贴板");
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.picked && changes.picked.newValue) {
    const p = changes.picked.newValue;
    setOut([
      "元素定位结果",
      "──────────────",
      "标签：" + p.tag + (p.text ? "（" + p.text + "）" : ""),
      "CSS ：" + p.css,
      "XPath：" + p.xpath,
      "",
      "// 用于自动化脚本",
      'by_css = "' + p.css + '"',
      'by_xpath = "' + p.xpath + '"'
    ].join("\n"));
    tip("已生成定位");
  }
});

chrome.storage.local.get({ requests: [] }, (r) => renderRequests(r.requests));
