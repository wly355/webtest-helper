# WebTest Helper — 浏览器测试辅助插件

自己写的 Chrome 扩展（Manifest V3），解决三个测试日常里最烦的小事：

1. **点一下元素，直接给出 XPath 和 CSS 定位** —— 写自动化脚本和提缺陷时不用再手抠 DOM
2. **一键把页面上的表单字段导成 Markdown 表格** —— 快速生成用例草稿（字段 / 类型 / 必填 / 定位）
3. **自动记录当前页面的接口请求**（状态码 / 方法 / URL）—— 提缺陷单直接贴，不用再翻 DevTools 网络面板

## 安装（30 秒）

1. 打开 Chrome，地址栏输入 `chrome://extensions/`
2. 右上角打开「开发者模式」
3. 点「加载已解压的扩展程序」，选择本文件夹
4. 工具栏出现插件图标，点开即可用

## 使用

| 按钮 | 作用 |
| --- | --- |
| ① 点选元素取定位 | 开启拾取模式，在页面上点任意元素，弹出 CSS / XPath 定位结果 |
| ② 导出页面字段 | 把当前页所有输入框导成 Markdown 表格，可直接贴进用例文档 |
| ③ 刷新接口记录 | 列出当前页最近 50 条接口请求，可一键复制 |

## 技术实现

| 文件 | 作用 |
| --- | --- |
| `manifest.json` | MV3 配置：权限、后台 Service Worker、内容脚本 |
| `content.js` | 元素拾取、CSS Selector 与 XPath 生成、表单字段采集 |
| `background.js` | 监听 `webRequest.onCompleted`，把接口记录存进 `chrome.storage` |
| `popup.html / popup.js / popup.css` | 弹窗界面与交互逻辑 |

没有用任何框架和第三方库，全部原生 JavaScript，代码量约 350 行。

## 面试可以讲的技术点

- **XPath 生成**：用 `previousElementSibling` 统计同名兄弟节点序号，逐层向上拼 `/tag[2]/div[1]`，保证唯一性
- **CSS 生成**：优先用 `id`，没有 id 就取前两个 class 名并按 `nth-of-type` 去重
- **事件捕获**：用 `addEventListener(..., true)` 在捕获阶段拦截点击，避免被页面自身的跳转吃掉
- **MV3 限制**：Service Worker 不能常驻，所以数据落 `chrome.storage.local` 而不是内存变量
