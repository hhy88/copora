# Copora — 技术架构文档

## 1. 技术选型总览

### 1.1 核心技术栈

| 层级 | 技术方案 | 选型理由 |
|------|----------|----------|
| 桌面框架 | Electron 33+ | 跨平台原生窗口、文件系统访问、系统菜单/托盘、进程管理 |
| 前端框架 | React 18 + TypeScript | 组件化架构、强类型保障、生态成熟 |
| 编辑器内核 | ProseMirror | 最成熟的 WYSIWYG 编辑框架，支持自定义 Schema、双向 Markdown 映射 |
| 源码编辑器 | CodeMirror 6 | 高性能源码模式，语法高亮、虚拟滚动 |
| Markdown 解析 | markdown-it | CommonMark 严格合规 + GFM 插件扩展 |
| 数学公式 | KaTeX + MathJax 4 双引擎 | KaTeX 高性能实时预览 + MathJax 4 完整 AMS 宏包兼容 |
| 图表渲染 | Mermaid 11.x | 流程图/时序图/甘特图等全类型支持，本地离线渲染 |
| 代码高亮 | Shiki | VS Code 同源高亮引擎，100+ 语言支持，主题兼容 |
| 状态管理 | Zustand | 轻量、TypeScript 友好、无 boilerplate |
| 样式方案 | CSS Modules + CSS Variables | 主题系统零依赖切换、组件样式隔离 |
| 构建工具 | Vite + electron-builder | 极速 HMR、生产级 Electron 打包 |
| PDF 导出 | Puppeteer (headless Chrome) | 矢量公式/图表无损嵌入、精确分页控制 |
| 拼写检查 | nspell + hunspell 词典 | 本地离线、多语言支持 |

### 1.2 架构分层

```
┌─────────────────────────────────────────────────────┐
│                   Electron Main Process              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ 窗口管理  │ │ 文件系统  │ │  系统菜单/托盘/快捷键 │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ 自动更新  │ │ IPC 通信  │ │  导出引擎(Puppeteer) │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │ IPC Bridge
┌───────────────────────┴─────────────────────────────┐
│                  Renderer Process (React)             │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Application Shell                    │ │
│  │  ┌──────┐ ┌──────────┐ ┌──────────────────────┐ │ │
│  │  │菜单栏 │ │  工具栏   │ │   偏好设置面板       │ │ │
│  │  └──────┘ └──────────┘ └──────────────────────┘ │ │
│  │  ┌──────────┐ ┌──────────────────────────────┐  │ │
│  │  │ 侧边面板  │ │      核心编辑画布             │  │ │
│  │  │ 文件树    │ │  ┌─────────┐ ┌───────────┐  │  │ │
│  │  │ 大纲导航  │ │  │ProseMirror│ │CodeMirror │  │  │ │
│  │  └──────────┘ │  │ (WYSIWYG)│ │(源码模式) │  │  │ │
│  │               │  └─────────┘ └───────────┘  │  │ │
│  │               └──────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────┐   │ │
│  │  │         状态栏 / 字数统计                   │   │ │
│  │  └──────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Core Engine Layer                    │ │
│  │  ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ │ │
│  │  │Markdown  │ │Math    │ │Mermaid│ │Spell     │ │ │
│  │  │Parser    │ │Engine  │ │Engine │ │Checker   │ │ │
│  │  └──────────┘ └────────┘ └──────┘ └──────────┘ │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 2. 项目目录结构

```
copora/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 主进程入口
│   ├── preload.ts               # 预加载脚本
│   ├── ipc/                     # IPC 通信处理
│   │   ├── file-handlers.ts     # 文件操作 IPC
│   │   ├── window-handlers.ts   # 窗口管理 IPC
│   │   ├── export-handlers.ts   # 导出功能 IPC
│   │   └── menu-handlers.ts     # 系统菜单 IPC
│   ├── services/                # 主进程服务
│   │   ├── file-watcher.ts      # 文件监听服务
│   │   ├── auto-save.ts         # 自动保存服务
│   │   ├── backup.ts            # 备份恢复服务
│   │   └── updater.ts           # 自动更新服务
│   └── menu/                    # 原生菜单定义
│       ├── app-menu.ts          # 应用菜单
│       └── context-menu.ts      # 右键菜单
├── src/                         # 渲染进程（React）
│   ├── main.tsx                 # React 入口
│   ├── App.tsx                  # 根组件
│   ├── components/              # UI 组件
│   │   ├── layout/              # 布局组件
│   │   │   ├── AppShell.tsx     # 应用外壳
│   │   │   ├── TitleBar.tsx     # 标题栏
│   │   │   ├── MenuBar.tsx      # 菜单栏
│   │   │   ├── SidePanel.tsx    # 侧边面板容器
│   │   │   ├── EditorCanvas.tsx # 编辑画布容器
│   │   │   └── StatusBar.tsx    # 状态栏
│   │   ├── editor/              # 编辑器组件
│   │   │   ├── WysiwygEditor.tsx    # 所见即所得编辑器
│   │   │   ├── SourceEditor.tsx     # 源码编辑器
│   │   │   ├── FloatingToolbar.tsx  # 悬浮工具栏
│   │   │   └── EditorSwitcher.tsx   # 模式切换器
│   │   ├── sidebar/             # 侧边栏组件
│   │   │   ├── FileTree.tsx     # 文件树
│   │   │   ├── Outline.tsx      # 大纲导航
│   │   │   └── SearchPanel.tsx  # 搜索面板
│   │   ├── tabs/                # 标签页组件
│   │   │   ├── TabBar.tsx       # 标签栏
│   │   │   └── TabItem.tsx      # 单个标签
│   │   ├── modals/              # 弹窗组件
│   │   │   ├── ExportModal.tsx  # 导出弹窗
│   │   │   ├── SettingsModal.tsx# 偏好设置弹窗
│   │   │   ├── ImageModal.tsx   # 图片预览弹窗
│   │   │   ├── AboutModal.tsx   # 关于弹窗
│   │   │   └── ConfirmModal.tsx # 确认弹窗
│   │   └── common/              # 通用组件
│   │       ├── ContextMenu.tsx  # 右键菜单
│   │       ├── Tooltip.tsx      # 提示
│   │       └── Dropdown.tsx     # 下拉菜单
│   ├── engine/                  # 核心引擎
│   │   ├── markdown/            # Markdown 引擎
│   │   │   ├── parser.ts        # markdown-it 解析器
│   │   │   ├── serializer.ts    # ProseMirror → Markdown 序列化
│   │   │   ├── schema.ts        # ProseMirror Schema 定义
│   │   │   └── plugins/         # ProseMirror 插件
│   │   │       ├── heading.ts   # 标题插件
│   │   │       ├── table.ts     # 表格插件
│   │   │       ├── codeblock.ts # 代码块插件
│   │   │       ├── math.ts      # 公式插件
│   │   │       ├── mermaid.ts   # 图表插件
│   │   │       ├── image.ts     # 图片插件
│   │   │       ├── list.ts      # 列表插件
│   │   │       └── footnote.ts  # 脚注插件
│   │   ├── math/                # 数学公式引擎
│   │   │   ├── katex-renderer.ts
│   │   │   └── mathjax-renderer.ts
│   │   ├── diagram/             # 图表引擎
│   │   │   └── mermaid-renderer.ts
│   │   ├── highlight/           # 代码高亮引擎
│   │   │   └── shiki-loader.ts
│   │   └── spell/               # 拼写检查引擎
│   │       ├── spell-checker.ts
│   │       └── dictionaries/
│   ├── stores/                  # 状态管理
│   │   ├── app-store.ts         # 全局应用状态
│   │   ├── editor-store.ts      # 编辑器状态
│   │   ├── file-store.ts        # 文件管理状态
│   │   ├── settings-store.ts    # 设置状态
│   │   └── theme-store.ts       # 主题状态
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useEditor.ts         # 编辑器 Hook
│   │   ├── useFileSystem.ts     # 文件系统 Hook
│   │   ├── useShortcuts.ts      # 快捷键 Hook
│   │   └── useAutoSave.ts       # 自动保存 Hook
│   ├── services/                # 前端服务
│   │   ├── file-service.ts      # 文件操作服务
│   │   ├── export-service.ts    # 导出服务
│   │   ├── image-service.ts     # 图片管理服务
│   │   ├── search-service.ts    # 搜索服务
│   │   └── session-service.ts   # 会话管理服务
│   ├── themes/                  # 主题系统
│   │   ├── base.css             # 基础变量
│   │   ├── github-light.css     # 默认浅色
│   │   ├── github-dark.css      # 默认深色
│   │   ├── newsprint.css        # 石墨灰
│   │   ├── night.css            # 护眼柔和
│   │   └── pixyll.css           # 极简纯白
│   ├── styles/                  # 全局样式
│   │   ├── global.css           # 全局基础
│   │   ├── variables.css        # CSS 变量定义
│   │   ├── animations.css       # 动画定义
│   │   └── typography.css       # 排版定义
│   └── utils/                   # 工具函数
│       ├── markdown-utils.ts    # Markdown 工具
│       ├── string-utils.ts      # 字符串工具
│       └── platform-utils.ts    # 平台检测工具
├── resources/                   # 静态资源
│   ├── icons/                   # 图标
│   └── dictionaries/            # 拼写检查词典
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.yml
└── README.md
```

---

## 3. 核心引擎架构

### 3.1 编辑器双引擎架构

Copora 采用 ProseMirror（WYSIWYG）+ CodeMirror 6（源码模式）双引擎架构：

```
┌──────────────────────────────────────────┐
│            EditorSwitcher                │
│  ┌─────────────┐    ┌────────────────┐  │
│  │ ProseMirror  │◄──►│  CodeMirror 6  │  │
│  │  (WYSIWYG)   │    │  (源码模式)     │  │
│  └──────┬───────┘    └───────┬────────┘  │
│         │                    │            │
│         ▼                    ▼            │
│  ┌─────────────────────────────────────┐ │
│  │        Markdown Document Model       │ │
│  │   (统一文档模型，双引擎共享)          │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**WYSIWYG 模式（ProseMirror）：**
- 自定义 Schema 覆盖完整 Markdown 语法节点
- 输入规则（InputRules）实时捕获 Markdown 语法并转换为富文本节点
- 装饰器（Decorations）实现光标位置显示原始语法、非聚焦时渲染成品样式
- 插件系统实现表格编辑、数学公式预览、Mermaid 图表渲染

**源码模式（CodeMirror 6）：**
- Markdown 语法高亮
- 虚拟滚动保障千行代码流畅
- 与 ProseMirror 共享文档模型，切换时无缝同步

### 3.2 Markdown 解析管线

```
原始 Markdown 文本
       │
       ▼
  markdown-it 解析
       │
       ▼
  markdown-it AST
       │
       ▼
  AST → ProseMirror Node 转换
       │
       ▼
  ProseMirror Document
       │
       ▼
  ProseMirror View 渲染
       │
       ▼
  DOM 输出（WYSIWYG 画布）
```

**反向序列化：**
```
ProseMirror Document
       │
       ▼
  ProseMirror → Markdown 序列化器
       │
       ▼
  原始 Markdown 文本
```

### 3.3 ProseMirror Schema 设计

```typescript
const coporaSchema = new Schema({
  nodes: {
    doc,
    paragraph,
    heading (attrs: { level: 1-6 }),
    blockquote,
    ordered_list (attrs: { start, tight }),
    bullet_list (attrs: { tight }),
    list_item,
    task_list_item (attrs: { checked }),
    code_block (attrs: { language }),
    math_block (attrs: { source }),
    mermaid_block (attrs: { source }),
    table,
    table_row,
    table_cell (attrs: { colspan, rowspan, alignment }),
    horizontal_rule,
    image (attrs: { src, alt, title }),
    footnote_ref,
    footnote_block,
    alert_block (attrs: { type: info|warning|danger|success }),
    html_block,
    text,
    hard_break,
    soft_break,
  },
  marks: {
    bold,
    italic,
    strikethrough,
    highlight,
    code_inline,
    link (attrs: { href, title }),
    subscript,
    superscript,
    kbd,
    math_inline,
    underline,
  }
});
```

### 3.4 实时渲染策略（Typora 核心交互复刻）

Typora 的核心交互是"光标所在行显示源码语法，非聚焦行显示渲染结果"。Copora 通过 ProseMirror 装饰器实现：

1. **聚焦节点：** 光标所在的 Markdown 语法节点显示原始语法文本（如 `**bold**`）
2. **非聚焦节点：** 其他节点渲染为成品样式（如 **bold**）
3. **切换时机：** 光标移入节点时即时切换为源码显示，移出时即时渲染

---

## 4. 主题系统架构

### 4.1 CSS 变量驱动

```css
:root[data-theme="github-light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f6f8fa;
  --text-primary: #1f2328;
  --text-secondary: #656d76;
  --border-color: #d1d9e0;
  --accent-color: #0969da;
  --code-bg: #f6f8fa;
  --blockquote-border: #d1d9e0;
  --table-border: #d1d9e0;
  --heading-weight: 600;
  --line-height: 1.6;
  --font-size-base: 16px;
  --font-family: "Source Sans Pro", sans-serif;
  --font-family-mono: "JetBrains Mono", monospace;
}
```

### 4.2 主题切换机制
- 全局 `data-theme` 属性切换
- CSS 变量即时生效，无闪烁
- 主题持久化到本地配置
- 支持用户自定义 CSS 覆盖

---

## 5. 文件系统架构

### 5.1 Electron 主进程文件操作

```
Renderer Process                  Main Process
┌──────────────┐    IPC Bridge   ┌──────────────┐
│ FileService  │ ──────────────► │ FileHandler  │
│ (前端调用)    │ ◄────────────── │ (Node.js fs) │
└──────────────┘                 └──────────────┘
```

**文件操作 API：**
- `fs:readFile` — 读取文件内容
- `fs:writeFile` — 写入文件
- `fs:readDir` — 读取目录列表
- `fs:watch` — 监听文件变更
- `fs:stat` — 获取文件信息
- `fs:rename` — 重命名
- `fs:delete` — 删除
- `fs:mkdir` — 创建目录
- `fs:copyFile` — 复制文件
- `fs:showInExplorer` — 在资源管理器中显示

### 5.2 自动保存与备份策略

```
编辑内容变更
     │
     ▼
防抖 500ms
     │
     ▼
写入临时备份文件 (.copora-backup)
     │
     ▼
定时/手动保存到原文件
     │
     ▼
清理备份文件
```

---

## 6. 导出引擎架构

### 6.1 PDF 导出流程

```
Markdown → HTML (markdown-it + 主题 CSS)
     │
     ▼
Puppeteer headless Chrome
     │
     ▼
PDF 文件（矢量公式/图表/嵌入字体）
```

### 6.2 多格式导出

| 格式 | 实现方案 |
|------|----------|
| PDF | Puppeteer → PDF |
| HTML | markdown-it + 内联 CSS |
| DOCX | html-to-docx |
| TXT | 纯文本提取 |
| LaTeX | markdown-it → LaTeX 转换 |
| EPUB | html-to-epub |
| PNG/SVG | html-to-image / Puppeteer screenshot |

---

## 7. 性能优化策略

### 7.1 大文档优化
- ProseMirror 虚拟滚动：仅渲染可视区域节点
- CodeMirror 6 原生虚拟滚动
- Mermaid 图表懒渲染：进入视口时才渲染
- 图片懒加载：滚动到可视区域才加载

### 7.2 编辑性能
- 输入防抖：连续快速输入时延迟渲染复杂元素
- 增量解析：仅重新解析变更的文档区域
- Web Worker：Mermaid/MathJax 渲染放入 Worker 线程

### 7.3 内存优化
- 非活跃标签页文档模型序列化存储
- 图片缓存 LRU 策略
- 定期 GC 触发

---

## 8. IPC 通信协议

### 8.1 通信模式

```
Renderer → Main:  ipcRenderer.invoke(channel, ...args)  # 请求-响应
Renderer ← Main:  ipcMain.handle(channel, handler)       # 处理请求
Main → Renderer:  webContents.send(channel, ...args)     # 主动推送
```

### 8.2 核心 Channel 定义

| Channel | 方向 | 描述 |
|---------|------|------|
| `fs:readFile` | R→M | 读取文件 |
| `fs:writeFile` | R→M | 写入文件 |
| `fs:readDir` | R→M | 读取目录 |
| `fs:watch` | M→R | 文件变更通知 |
| `window:minimize` | R→M | 最小化窗口 |
| `window:maximize` | R→M | 最大化窗口 |
| `window:close` | R→M | 关闭窗口 |
| `export:pdf` | R→M | 导出 PDF |
| `export:html` | R→M | 导出 HTML |
| `menu:action` | M→R | 菜单动作 |
| `session:restore` | M→R | 会话恢复 |
| `auto-save:trigger` | R→M | 触发自动保存 |

---

## 9. 安全架构

### 9.1 Electron 安全策略
- `contextIsolation: true` — 上下文隔离
- `nodeIntegration: false` — 禁用 Node 集成
- `sandbox: true` — 渲染进程沙箱化
- `preload` 脚本仅暴露必要 API

### 9.2 内容安全
- HTML 内嵌内容沙箱化（iframe sandbox）
- 网络图片可选加载策略
- 禁止自动执行内嵌脚本

---

## 10. 构建与分发

### 10.1 构建流程
```
vite build (Renderer) → dist/renderer/
tsc (Main Process)    → dist/main/
electron-builder      → 安装包/便携版
```

### 10.2 跨平台打包
- Windows: NSIS 安装包 + 便携版 (.exe)
- macOS: DMG + .app
- Linux: AppImage + .deb + .rpm

### 10.3 自动更新
- electron-updater 集成
- GitHub Releases 分发
- 增量更新支持
