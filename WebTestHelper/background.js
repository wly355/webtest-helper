// 记录最近 50 条接口请求，供弹窗里一键复制成 Markdown（写缺陷单时贴进去）
const MAX_LOG = 50;

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!details.url || !/^https?:/i.test(details.url)) return;
    const item = {
      url: details.url,
      method: details.method,
      status: details.statusCode,
      type: details.type,
      time: Date.now()
    };
    chrome.storage.local.get({ requests: [] }, (res) => {
      const list = res.requests.slice(0, MAX_LOG - 1);
      list.unshift(item);
      chrome.storage.local.set({ requests: list });
    });
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ requests: [], picked: null });
});
