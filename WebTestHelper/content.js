// 页面内：元素拾取 + 生成定位 + 表单字段导出
(function () {
  if (window.__wthInjected) return;
  window.__wthInjected = true;

  const style = document.createElement("style");
  style.textContent = `
    .wth-hover { outline: 2px solid #2A6F97 !important; background: rgba(42,111,151,.10) !important; cursor: crosshair !important; }
    .wth-picked { outline: 2px solid #E4572E !important; }
  `;
  document.documentElement.appendChild(style);

  let picking = false;
  let lastEl = null;

  function cssPath(el) {
    if (!(el instanceof Element)) return "";
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      if (node.id) {
        parts.unshift(node.tagName.toLowerCase() + "#" + node.id);
        break;
      }
      let part = node.tagName.toLowerCase();
      const cls = typeof node.className === "string" ? node.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
      if (cls.length) part += "." + cls.join(".");
      const parent = node.parentNode;
      if (parent) {
        const same = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (same.length > 1) part += ":nth-of-type(" + (same.indexOf(node) + 1) + ")";
      }
      parts.unshift(part);
      node = node.parentNode;
    }
    return parts.join(" > ");
  }

  function xpathOf(el) {
    if (!(el instanceof Element)) return "";
    if (el.id) return '//*[@id="' + el.id + '"]';
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      let idx = 1;
      let sib = node.previousElementSibling;
      while (sib) {
        if (sib.tagName === node.tagName) idx++;
        sib = sib.previousElementSibling;
      }
      parts.unshift(node.tagName.toLowerCase() + "[" + idx + "]");
      node = node.parentElement;
    }
    return "/" + parts.join("/");
  }

  function labelOf(el) {
    if (el.id) {
      const l = document.querySelector('label[for="' + el.id + '"]');
      if (l) return l.innerText.trim();
    }
    const p = el.closest("label");
    if (p) return p.innerText.trim();
    return el.getAttribute("placeholder") || el.getAttribute("name") || el.getAttribute("id") || "";
  }

  function describe(el) {
    return {
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.value || "").trim().slice(0, 60),
      css: cssPath(el),
      xpath: xpathOf(el),
      label: labelOf(el),
      type: el.getAttribute("type") || "",
      name: el.getAttribute("name") || "",
      id: el.getAttribute("id") || ""
    };
  }

  function onOver(e) {
    if (!picking) return;
    if (lastEl) lastEl.classList.remove("wth-hover");
    lastEl = e.target;
    lastEl.classList.add("wth-hover");
  }

  function onClick(e) {
    if (!picking) return;
    e.preventDefault();
    e.stopPropagation();
    const info = describe(e.target);
    if (lastEl) lastEl.classList.remove("wth-hover");
    e.target.classList.add("wth-picked");
    chrome.storage.local.set({ picked: info });
    picking = false;
    document.removeEventListener("mouseover", onOver, true);
    document.removeEventListener("click", onClick, true);
    try {
      chrome.runtime.sendMessage({ cmd: "picked" });
    } catch (err) {
      /* 弹窗已关闭，忽略 */
    }
  }

  function exportFields() {
    const els = Array.from(document.querySelectorAll("input, select, textarea"))
      .filter((el) => !["hidden", "submit", "button"].includes((el.getAttribute("type") || "").toLowerCase()));
    return els.map((el) => ({
      label: labelOf(el),
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute("type") || (el.tagName === "SELECT" ? "select" : "text"),
      required: el.hasAttribute("required"),
      css: cssPath(el)
    }));
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.cmd === "startPick") {
      picking = true;
      document.addEventListener("mouseover", onOver, true);
      document.addEventListener("click", onClick, true);
      sendResponse({ ok: true });
      return true;
    }
    if (msg.cmd === "stopPick") {
      picking = false;
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("click", onClick, true);
      sendResponse({ ok: true });
      return true;
    }
    if (msg.cmd === "exportFields") {
      sendResponse({ ok: true, fields: exportFields(), title: document.title });
      return true;
    }
    return false;
  });
})();
