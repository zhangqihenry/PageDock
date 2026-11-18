# 设计规范 · 静泊 / Design System · Quiet Dock

[← 返回 README](../README.md) · [← Back to README](../README.md)

PageDock 的前端界面遵循一套名为 **静泊（Quiet Dock）** 的设计规范。本文是它的完整说明：理念、token、动效和组件，以及新增页面或功能时的检查清单。所有数值都定义在代码里，本文只解释它们的含义和用法——两者不一致时，以代码为准，并同步修正本文。

PageDock's frontend follows one design system, **Quiet Dock (静泊)**. This document is its full spec: philosophy, tokens, motion, components, and the checklist to run when adding a page or feature. Every value lives in code; this page explains what each one means and when to use it — if the two ever disagree, the code wins and this page gets fixed.

| 文件 / File | 内容 / Contents |
| --- | --- |
| `frontend/src/assets/tokens.css` | 全部 token：颜色、字号、间距、尺寸、圆角、阴影、层级、动效；明/暗主题与减少动态效果 / Every token, light + dark + reduced motion |
| `frontend/src/assets/base.css` | 元素默认样式、页面底色与光晕、焦点样式 / Element defaults, canvas, focus |
| `frontend/src/assets/components.css` | 公共组件类与过渡预设 / Shared component classes and transition presets |
| `frontend/src/components/ui/` | 公共 Vue 组件：`BaseModal`、`Segmented`、`Icon`、`ToastHost`、`FileDrop`、`BrandMark` / Shared Vue components |
| `frontend/src/theme/colorThemePalette.js` + `frontend/public/theme-init.js` | 可选配色的计算公式（两处必须保持一致）/ Color-theme formula (keep both in sync) |

---

## 1. 设计理念 / Philosophy

**静泊**：网页像船一样安静地停泊在港湾里——界面是港湾，不是船。界面本身退到后面，让访客一眼看清有哪些网页、一下打开想要的那个。

**Quiet Dock**: pages rest in a calm harbor — the UI is the harbor, not the ships. The interface steps back so a visitor sees at a glance what's here and opens what they want in one move.

**气质关键词 / Keywords**：静（calm）· 透（airy）· 序（ordered）· 柔（soft motion）

### 核心原则 / Principles

1. **内容为先 / Content first.** 网页标题和说明是主角。界面元素用低对比、少装饰；强调色只留给"可以点"和"当前所在"。
   Page titles and descriptions are the subject. Chrome stays low-contrast and unadorned; the accent is reserved for "you can act here" and "you are here".
2. **层次靠表面，不靠线条 / Depth from surfaces, not lines.** 用底色、卡片和柔和阴影分层，细线（hairline）只做分隔，不做框。
   Hierarchy comes from canvas → surface → raised layers and soft shadows; hairlines separate, they don't box things in.
3. **一套节奏 / One rhythm.** 所有间距落在 4px 网格上，所有颜色、字号、圆角、阴影、时长都来自 token。新功能用已有的组件和 token 拼出来，而不是新造。
   Every gap sits on the 4px grid; every color, size, radius, shadow and duration is a token. New features are assembled from existing parts, not invented.
4. **动效用来解释 / Motion explains.** 动画只用来说明"从哪来、到哪去、发生了什么"：进入、切换、反馈。快、短、不循环、不抢戏。
   Motion only tells where something came from, where it went, or what just happened. Short, eased, never looping, never the show.
5. **尊重访客的选择 / Respect the visitor's choices.** 明暗主题、36 种配色、字体字号、减少动态效果——访客的设置永远优先于默认值，所有组件都必须在任意组合下成立。
   Light/dark, 36 color themes, typography, reduced motion: the visitor's settings beat the defaults, and every component must hold up in any combination.

---

## 2. 色彩 / Color

### 2.1 语义 token / Semantic tokens

组件只能使用下面的语义名，不能写具体色值。标 **[T]** 的 14 个 token 会被可选配色覆盖；其余永远不随配色变化。

Components use only these semantic names, never raw values. The 14 tokens marked **[T]** are overridden by a color theme; the rest never change with it.

| Token | 用途 / Role | 默认浅色 / Light | 默认深色 / Dark |
| --- | --- | --- | --- |
| `--bg` [T] | 页面底色 / Page canvas | `#fafaf9` | `#0e0f12` |
| `--surface` [T] | 卡片、弹窗、毛玻璃页头 / Cards, modals, header glass | `#ffffff` | `#16171b` |
| `--surface-muted` [T] | 悬停填充、安静区域 / Hover fills, quiet wells | `#f3f3f1` | `#1e1f24` |
| `--surface-sunken` [T] | 输入框、滑轨 / Inputs, tracks | `#f5f5f3` | `#0b0c0e` |
| `--ink` [T] | 主要文字 / Primary text | `#17181c` | `#f2f2f0` |
| `--ink-muted` [T] | 次要文字 / Secondary text | `#5d5f66` | `#a4a6ad` |
| `--ink-faint` [T] | 元信息、占位符 / Meta, placeholders | `#8a8c93` | `#74767e` |
| `--border` [T] | 细分隔线 / Hairlines | `#e7e6e3` | `#26272d` |
| `--border-strong` [T] | 悬停/强调边框 / Hover & emphasis borders | `#cfcdc9` | `#3a3b43` |
| `--accent` [T] | 主操作、当前状态 / Primary action, current state | `#c1121f` | `#ff6a52` |
| `--accent-hover` [T] | 主操作悬停 / Primary hover | `#9c0f19` | `#ff8a75` |
| `--accent-ink` [T] | 强调色上的文字 / Text on accent | `#ffffff` | `#1a0f0c` |
| `--accent-soft` [T] | 强调色浅底 / Tinted fills | 8% accent | 13% accent |
| `--focus-ring` [T] | 输入框焦点光环 / Field focus ring | 32% accent | 42% accent |
| `--positive` / `-soft` | 成功、已启用 / Success, enabled | `#1a7f37` | `#4ac26b` |
| `--danger` / `-soft` | 错误、删除 / Errors, delete | `#c62f2f` | `#ff7b72` |
| `--info` / `-soft` | 链接类型等中性提示 / Neutral info (link badge) | `#3457d5` | `#86a3ff` |
| `--warning` / `-soft` | 预留的警告色 / Reserved warning | `#9a6700` | `#e3b341` |

**派生 token / Derived tokens**（用 `color-mix()` 从上表计算，自动跟随配色）：`--glass`（页头毛玻璃）、`--glow`（页面顶部光晕）、`--selection`（选中文字）、`--skeleton` / `--skeleton-shine`（骨架屏）、`--thumb`（分段控件滑块）、`--inverse-bg` / `--inverse-ink`（Toast）、`--overlay`（弹窗遮罩）。

**规则 / Rules**

- 强调色在一屏内只出现在少数位置：主按钮、当前选项卡指示器、焦点、悬停时的"前往"箭头。不要用强调色填大面积背景。
  The accent appears in few places per screen: the primary button, the active-tab indicator, focus, the hover "go" arrow. Never flood large areas with it.
- 删除和错误一律用 `--danger`，**不要**用 `--accent`——配色换成蓝色或绿色时，删除按钮仍必须是红色语义。
  Delete and errors always use `--danger`, never `--accent` — with a blue or green theme, delete must still read as destructive.
- 文字只用 `--ink` / `--ink-muted` / `--ink-faint` 三级；`--ink-faint` 只用于非关键的元信息。
  Text uses only the three ink levels; `--ink-faint` is for non-essential meta only.

### 2.2 可选配色如何映射 / How color themes map

可选配色（`colorThemePalette.js` 中的 36 个色相）只是一个色相值 `h`，通过同一个公式生成 14 个 [T] token。中性色只带一点色相（低饱和），只有强调色有真正的彩度，因此每一种配色都保持相同的对比度阶梯。`default` 不走公式，直接使用 `tokens.css` 的默认值（中性灰 + 红色强调）。

A color theme is just a hue `h`; one formula turns it into the 14 [T] tokens. Neutrals are only tinted (low saturation) and only the accent carries real chroma, so every theme keeps the same contrast steps. `default` skips the formula and uses the `tokens.css` values (neutral + red).

| Token | 浅色 / Light `hsl(h, S, L)` | 深色 / Dark `hsl(h, S, L)` |
| --- | --- | --- |
| `--bg` | 24%, 97.5% | 14%, 7% |
| `--surface` | 30%, 99.6% | 13%, 10.5% |
| `--surface-muted` | 20%, 94.5% | 12%, 14.5% |
| `--surface-sunken` | 20%, 95.5% | 14%, 5.5% |
| `--ink` | 22%, 13% | 14%, 94% |
| `--ink-muted` | 9%, 38% | 9%, 68% |
| `--ink-faint` | 7%, 54% | 7%, 49% |
| `--border` | 16%, 90% | 11%, 17% |
| `--border-strong` | 12%, 79% | 9%, 27% |
| `--accent` | 44%, 40% | 62%, 72% |
| `--accent-hover` | 48%, 33% | 70%, 79% |
| `--accent-ink` | `#ffffff` | 35%, 10% |
| `--accent-soft` | accent @ 9% | accent @ 13% |
| `--focus-ring` | `hsla(h, 60%, 48%, .32)` | accent @ 42% |

修改公式时必须同时修改 `colorThemePalette.js` 的 `computePalette()` 和 `public/theme-init.js`（后者在 Vue 挂载前应用配色，避免闪烁），并在全部 36 种配色的明暗两种模式下检查对比度。新增 token 如需随配色变化，要同时加入 `PALETTE_KEYS`。

To change the formula, change both `computePalette()` and `public/theme-init.js` (which applies the theme before Vue mounts, to avoid a flash), and check contrast for all 36 hues in both modes. A new token that should follow the theme must also be added to `PALETTE_KEYS`.

---

## 3. 字体与字号 / Typography

### 3.1 字体 / Families

- `--font-sans`：界面字体，系统 UI 字体栈（system-ui、苹方、微软雅黑……）。不引入网络字体：NAS 自托管、国内网络和隐私都不适合外链字体。
  `--font-sans`: the UI stack (system-ui, PingFang, Microsoft YaHei…). No web fonts — self-hosted NAS, mainland networks and privacy all argue against them.
- `--font-mono`：路径、版本号、数值。
  `--font-mono`: paths, versions, numbers.
- 目录内容（大标题、小标题、列表/方块的标题和说明、页脚）使用访客在"显示设置"中选择的字体，取自 `stores/typography.js` 的 `SANS_STACK` / `SERIF_STACK`，这两个字体栈是指定的，不要修改。
  Catalog content (title, subtitle, list/tile text, footer) uses the visitor's chosen stack from `stores/typography.js` (`SANS_STACK` / `SERIF_STACK`); those stacks are specified and must not change.

### 3.2 字号阶梯 / Type scale

| Token | 大小 / Size | 用途 / Use |
| --- | --- | --- |
| `--text-2xs` | 11px | 徽章、色板名称 / Badges, swatch captions |
| `--text-xs` | 12px | 元信息、时间、路径 / Meta, timestamps, paths |
| `--text-sm` | 13px | 辅助说明、字段标签、次要行 / Helper text, field labels |
| `--text-base` | 15px | 正文、按钮、输入框（桌面）/ Body UI, controls |
| `--text-md` | 16px | 列表标题、手机端输入框 / Row titles, inputs on phones |
| `--text-lg` | 18px | 分区标题 / Section titles |
| `--text-xl` | 22px | 弹窗标题 / Modal titles |
| `--text-2xl` | 28px | 页面标题 / Page titles |
| `--text-display` | 36px | 目录大标题（访客可调）/ Catalog hero (visitor-adjustable) |

字重只用 400 / 500 / 600 / 700（`--weight-*`）；行高只用 `--leading-tight` 1.2（标题）、`--leading-snug` 1.4（短文本、控件）、`--leading-normal` 1.6（正文）。标题使用 `--tracking-tight`；全大写的小标签（eyebrow、fieldset 图例）使用 `--tracking-wide`。数字用 `.tabular` 等宽对齐。

Weights: 400/500/600/700 only. Leading: tight 1.2 for headings, snug 1.4 for short text and controls, normal 1.6 for prose. Headings get `--tracking-tight`; uppercase eyebrows/legends get `--tracking-wide`. Numbers use `.tabular`.

### 3.3 访客可调字号 / Visitor typography

`stores/typography.js` 中的每个可调项都有固定的范围；默认值落在字号阶梯上。组件通过 CSS 变量读取访客设置，并以 token 作为回退值，例如 `font-size: var(--row-title-size, var(--text-md))`。

Every knob in `stores/typography.js` has a fixed range, and its default sits on the type scale. Components read the visitor's value through a CSS variable with the token as fallback, e.g. `font-size: var(--row-title-size, var(--text-md))`.

| 设置 / Setting | 元素 / Element | 默认 / Default | 范围 / Range | 对应 token / Token |
| --- | --- | --- | --- | --- |
| `h1Size` | 目录大标题 / Hero title | 36 | 20–64 | `--text-display` |
| `subtitleSize` | 小标题 / Subtitle | 16 | 10–24 | `--text-md` |
| `rowIndexSize` | 列表序号 / Row index | 13 | 10–20 | `--text-sm` |
| `listTitleSize` / `tileTitleSize` | 网页标题 / Page title | 16 | 12–28 | `--text-md` |
| `listDescSize` / `tileDescSize` | 网页说明 / Description | 13 | 10–20 | `--text-sm` |
| `footerSize` | 页脚 / Footer | 12 | 8–16 | `--text-xs` |
| `h1SpaceBefore/After`、`subtitleSpaceBefore/After` | 标题上下间距 / Hero spacing | 32 / 8 / 8 / 16 | 见代码 / see code | `--space-8` / `-2` / `-2` / `-4` |

**约束 / Constraints**：布局必须在每个范围的两端都成立（标题 64px 不溢出、说明 10px 仍可读）；可调项只影响目录内容，不影响界面控件；新增可调项时同时在本表登记。

Layouts must hold at both ends of every range (a 64px title never overflows, 10px descriptions stay legible); the knobs only affect catalog content, never controls; any new knob gets a row in this table.

---

## 4. 间距、尺寸、圆角、阴影、层级 / Space, size, radius, shadow, layers

**间距 / Space** — 4px 网格：`--space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 · `-10` 40 · `-12` 48 · `-16` 64 · `-20` 80（另有 `-0-5` 2、`-1-5` 6 用于紧凑控件内部）。组件内部用 2–4，组件之间用 4–6，区块之间用 8–16。
Inside a component 2–4, between components 4–6, between sections 8–16.

**尺寸 / Sizes** — 内容宽度 `--content-max` 52rem；窄页面 `--content-narrow` 28rem；正文行宽 `--measure` 36rem；控件高度 `--control-sm` 32 / `-md` 38 / `-lg` 44（触屏主操作用 `lg`）；图标 `--icon-sm` 14 / `-md` 17 / `-lg` 24；弹窗 `--modal-sm` 26rem / `--modal-md` 36rem；线宽 `--border-width` 1、`--stroke` 2、焦点 `--focus-width` 2。

**圆角 / Radius** — `--radius-xs` 6（小标签）· `-sm` 8（小按钮、分段滑块）· `-md` 10（按钮、输入框）· `-lg` 14（卡片）· `-xl` 20（弹窗、空状态）· `-pill`（徽章）。嵌套时内层圆角 ≤ 外层。
Nested radii never exceed their container's.

**阴影 / Shadow** — 四级，明暗主题各有一套：`--shadow-xs`（按钮）、`-sm`（静止卡片）、`-md`（悬停卡片、浮动操作栏）、`-lg`（弹窗、Toast）。阴影表示"浮起来了"，不用于装饰。
Four levels per theme; a shadow means "raised", never decoration.

**层级 / Layers** — `--z-base` 0 · `--z-raised` 1 · `--z-header` 50 · `--z-overlay` 100（弹窗）· `--z-toast` 200。不要写其他 z-index 数值。
No other z-index values.

**断点 / Breakpoints** — 只用四个：480（设置行纵向排列）、560（底部弹出面板、单列方块、页头按钮只显示图标）、640（表单单列、隐藏列表路径）、860（方块最多 2 列）。媒体查询里不能用 CSS 变量，所以这四个值直接写数字。
Only these four; they're literal because `@media` can't read custom properties.

---

## 5. 动效 / Motion

### 5.1 时长与缓动 / Durations & easing

| Token | 值 / Value | 用途 / Use |
| --- | --- | --- |
| `--dur-instant` | 90ms | 按下反馈 / Press feedback |
| `--dur-fast` | 150ms | 悬停、颜色、边框；所有退出 / Hover, color; exits |
| `--dur-base` | 240ms | 小位移、选项卡指示器、面板切换 / Small moves, tab indicator, swaps |
| `--dur-slow` | 360ms | 弹窗/面板进入、页面切换、主题切换 / Modal enter, route change, theme crossfade |
| `--dur-enter` | 520ms | 页面和列表的进入 / Page & list entrance |
| `--stagger` | 36ms | 列表逐项延迟，最多 12 项 / Per-item delay, capped at 12 |

| Token | 曲线 / Curve | 用途 / Use |
| --- | --- | --- |
| `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` | 状态变化 / State changes |
| `--ease-out` | `cubic-bezier(.16, 1, .3, 1)` | 进入：快起、缓停 / Entrances |
| `--ease-in` | `cubic-bezier(.4, 0, 1, 1)` | 退出：快速离开 / Exits |
| `--ease-spring` | `cubic-bezier(.34, 1.36, .64, 1)` | 只用于很小的弹出（≤ 4px / 1.08 倍）/ Tiny pops only |

位移 token：`--enter-distance` 10px（进入位移）、`--lift` -2px（卡片悬停上浮）、`--nudge` 3px（箭头朝目标方向轻移）。
Distance tokens: entrance offset, hover lift, arrow nudge.

**规则 / Rules**：进入用 `ease-out` + 较长时长，退出用 `ease-in` + 较短时长（离开总比到来快）；只动画 `opacity` 和 `transform`（以及颜色/阴影），不动画宽高和布局；不做循环的装饰动画——唯一的例外是表示"正在进行"的加载指示器。
Enter with ease-out and longer, exit with ease-in and shorter; animate only opacity/transform (plus color/shadow), never layout; no looping decoration — progress indicators are the only exception.

### 5.2 模式 / Patterns

| 模式 / Pattern | 实现 / How | 说明 / Notes |
| --- | --- | --- |
| 页面切换 / Route change | `App.vue` 中 `<Transition name="page" mode="out-in">` | 淡入 + 上移 `--enter-distance` |
| 区块/列表进入 / Block & list entrance | 元素加 `.enter-rise`，并设置 `style="--i: n"` | 逐项错开，第 12 项后不再等待；动画用 `backwards` 填充，结束后不影响悬停等后续过渡 |
| 面板切换 / Panel swap | `<Transition name="swap" mode="out-in">`，给内容一个随状态变化的 `key` | 首页分类与布局、后台选项卡、上传方式 |
| 悬停 / Hover | 卡片 `.card-interactive`：上浮 `--lift` + `--shadow-md`；列表行：底色变 `--surface-muted`，箭头变强调色并 `--nudge` | 只在指针设备上有意义，不承载信息 |
| 按下 / Press | `.btn` 缩放到 0.97，`.icon-btn` 0.94，`--dur-instant` | |
| 选项卡指示器 / Tab indicator | `Segmented` 组件内一个滑块，`transform` + `width` 过渡 `--dur-base` | 首次定位不做动画 |
| 弹窗 / Modal | `BaseModal`：遮罩淡入，面板从 97% 缩放 + 上移进入 | 手机宽度下变为底部弹出面板，从下方滑入 |
| Toast | `ToastHost`：弹性上移进入、缩小淡出、`toast-move` 重排 | |
| 列表增删和排序 / List add, remove, reorder | `<TransitionGroup name="list">` | FLIP 位移，例如分类上移/下移 |
| 主题切换 / Theme switch | `utils/motion.js` 的 `withViewTransition()` | 浏览器支持时整页交叉淡化 |
| 加载 / Loading | `.skeleton` 闪光、`.spinner` 旋转 | |

### 5.3 减少动态效果 / Reduced motion

`tokens.css` 在 `prefers-reduced-motion: reduce` 下把所有时长设为 1ms、所有位移设为 0、错开延迟设为 0。因此组件**只要只引用 token**，就自动支持减少动态效果，不需要自己写分支。例外需要单独处理：骨架屏闪光直接关闭；加载旋转保留但放慢（它本身就是反馈）；`withViewTransition()` 直接应用变化。

Under `prefers-reduced-motion: reduce`, `tokens.css` sets every duration to 1ms and every distance and stagger to 0, so a component that only references tokens supports reduced motion for free. Exceptions handled explicitly: skeleton shimmer is turned off; the spinner keeps turning but slower (it is the feedback); `withViewTransition()` applies the change directly.

---

## 6. 图标 / Iconography

只用 `components/ui/Icon.vue` 中的图标：24×24 网格、2px 圆头描边、`currentColor`，Lucide 风格。尺寸由父元素的 CSS 决定（`--icon-sm/md/lg`）。图标旁边有文字时是装饰性的（自动 `aria-hidden`）；单独使用的图标必须传 `label`，或者由所在按钮提供 `aria-label`。新图标加到 `Icon.vue` 的 `PATHS` 中，保持同样的描边风格。

Only icons from `Icon.vue`: 24×24, 2px round strokes, currentColor, Lucide style. Size comes from the parent's CSS. Next to text an icon is decorative (auto `aria-hidden`); alone it needs a `label` or an `aria-label` on its button. New icons go into `PATHS` in the same stroke style.

---

## 7. 组件 / Components

### 按钮 / Buttons

`.btn` 是唯一的按钮外观，裸 `<button>` 没有任何样式。

| 类 / Class | 用途 / Use |
| --- | --- |
| `.btn` | 次要操作（默认）：表面色 + 细边框 + `--shadow-xs` / Secondary (default) |
| `.btn-primary` | 每个区域最多一个的主操作 / At most one per region |
| `.btn-ghost` | 页头等低权重操作 / Low-emphasis (header) |
| `.btn-danger` | 删除等破坏性操作，文字为 `--danger` / Destructive |
| `.btn-sm` / `.btn-lg` / `.btn-block` | 32px / 44px / 占满宽度 |
| `.icon-btn` (`-sm`, `-outline`, `-danger`) | 只有图标的按钮，必须有 `aria-label` 和 `title` |

图标在文字前；提交中的按钮设 `:disabled` 和 `:aria-busy`，并在文字前放 `<span class="spinner">`。禁用的链接按钮用 `aria-disabled="true"`。

Icon before text. A submitting button gets `:disabled`, `:aria-busy` and a leading `.spinner`. A disabled link-button uses `aria-disabled="true"`.

### 输入框 / Fields

字段写成 `<label class="field">标签<input …><span class="field-hint">…</span></label>`；在 `.field` 内的 input / textarea / select 自动获得样式，`.field` 外单独使用的加 `.input`。输入框底色为 `--surface-sunken`，悬停边框 `--border-strong`，聚焦时边框变强调色并加 `--focus-ring` 光环。手机宽度下输入框字号为 16px，避免 iOS 自动放大。复选框和单选框用原生控件加 `.check`（`accent-color` 着色）；一组相关选项用 `<fieldset class="fieldset">`；文件选择用 `FileDrop`（支持点击和拖放，`v-model` 为 File）。

Write fields as `<label class="field">`. Inputs inside `.field` are styled automatically; standalone ones add `.input`. Sunken fill, strong border on hover, accent border + ring on focus, 16px on phones (no iOS zoom). Checkboxes/radios stay native with `.check`; groups use `.fieldset`; file pickers use `FileDrop`.

### 选项卡与分段控件 / Tabs & segmented control

所有"几选一"都用 `Segmented`：
- `mode="tabs"`：`role="tablist"`，方向键 / Home / End 切换，配合 `role="tabpanel"`（首页分类、后台选项卡）。
- `mode="group"`：带 `aria-pressed` 的切换按钮（明暗、布局、字体、上传方式）。
- `variant="pill"`：凹陷轨道 + 浮起滑块；`variant="underline"`：细线上的强调色下划线，用于页面级分区。
- 选项多时可横向滚动，切换时只滚动控件本身，不滚动页面。

Every "pick one of a few" uses `Segmented`: tabs mode (tablist, arrow keys, pair with a tabpanel) or group mode (aria-pressed); pill or underline variant; overflows scroll sideways without moving the page.

### 列表行 / List rows

分组卡片（`.card`）内的行，行间用细线分隔。行内结构：序号（`--ink-faint`，悬停变强调色）→ 主体（标题 / 说明 / 元信息）→ 路径标签 → 圆形"前往"箭头（悬停填充强调色并右移）。整行是一个链接，焦点轮廓向内偏移。后台的分类列表、站点列表遵循同样的"卡片 + 细线分隔"结构。

Rows live inside a grouped `.card`, separated by hairlines: index → main (title/description/meta) → path chip → round "go" arrow. The whole row is one link with an inset focus outline. Admin lists follow the same card + hairline structure.

### 卡片 / Cards

`.card` 是唯一的卡片外观（表面色、细边框、`--radius-lg`、`--shadow-sm`），内边距用 `.card-pad`。可点击的整卡加 `.card-interactive`（悬停上浮）。卡片内的分组区域用 `.panel-inset`。目录方块卡片：左上角首字母徽标（强调色浅底）、右上角状态徽章、标题、自适应高度的说明（底部渐隐）、底部元信息和路径。

`.card` is the only card look; `.card-pad` for padding, `.card-interactive` for whole-card links, `.panel-inset` for grouped regions inside. Catalog tiles: monogram, flags, title, fading description, meta foot.

### 弹窗 / Modal

所有弹窗都用 `BaseModal`（`title`、可选 `description`、`size="sm|md"`、`busy`）。它负责：传送到 body、遮罩与面板过渡、Esc 和点击遮罩关闭（`busy` 时不关闭）、打开时把焦点移入（内容可以自己聚焦第一个字段）、Tab 键焦点循环、关闭后焦点回到触发按钮、锁定页面滚动、手机宽度下变成底部面板。不要再手写遮罩。

Every dialog uses `BaseModal`, which owns teleporting, transitions, Esc/scrim close (blocked while `busy`), focus in/trap/restore, scroll lock and the phone bottom sheet. Never hand-roll a backdrop.

### Toast 与提示 / Toast & alerts

- **成功 → Toast**：`useToastStore().push(message)`，底部居中，反色背景，3.6 秒后自动消失，最多同时 3 条，`role="status"`。用于"已保存""已删除""已启用"等。
  **Success → toast**: bottom-center, inverse colors, auto-dismiss, max 3, `role="status"`.
- **错误 → 就地提示**：`<p class="alert alert-error" role="alert">` 放在出错表单或区域的上方，直到下次尝试才消失。错误永远不用 Toast。
  **Errors → inline alert** above the form/region, persistent until the next attempt. Errors are never toasts.

### 徽章 / Badges

`.badge`（中性）、`.badge-accent`（加密）、`.badge-info`（链接）、`.badge-positive`（已启用）、`.badge-danger`；`.badge-dot` 前面加状态圆点。徽章可以带一个 `Icon`。

### 空状态 / Empty state

`.empty-state`：虚线边框、`--radius-xl`、居中；上方是强调色浅底的图标块 `.empty-state-icon`，下方一句说明（最好告诉用户下一步做什么）。

Dashed outline, centered, an icon tile and one sentence — ideally saying what to do next.

### 加载 / Loading

- 有确定版式的区域（目录、站点列表、分类列表、解锁表单）用骨架屏：`.skeleton` + `.skeleton-title` / `.skeleton-line`，外层 `aria-busy="true"`，并附带一段 `.sr-only` 的"加载中…"。
  Known layouts use skeletons with `aria-busy` and an `.sr-only` loading message.
- 按钮触发的请求用按钮内的 `.spinner`。
  Button-triggered requests use an inline `.spinner`.

---

## 8. 无障碍 / Accessibility

- 所有交互都能用键盘完成；焦点统一为 2px 强调色轮廓（`:focus-visible`），输入框为光环。不要移除焦点样式。
  Everything works by keyboard; one focus style (accent outline, ring on fields). Never remove it.
- 只有图标的按钮必须有 `aria-label`；装饰性图标 `aria-hidden`。
- 选项卡用 `tablist/tab/tabpanel` 和漫游 tabindex；切换按钮用 `aria-pressed`；弹窗用 `role="dialog"`、`aria-modal`、`aria-labelledby`。
- 状态不能只靠颜色表达：已启用/已停用同时有文字，加密/链接同时有图标和文字。
- 正文文字对比度不低于 4.5:1；`--ink-faint` 只用于非关键信息。
- 新文案同时加入 `i18n/dictionaries.js` 的中文和英文。

---

## 9. 新增页面或功能时的检查清单 / Checklist for new pages & features

提交前逐项确认 / Confirm each item before committing:

1. **只用 token。** 样式里没有色值（`#…`、`rgb()`、`hsl()`）、没有自定义的 px/rem 间距、字号、圆角、阴影、z-index、时长或缓动。需要新值时先加到 `tokens.css` 并更新本文。
   **Tokens only** — no raw colors, spacing, sizes, radii, shadows, z-index, durations or easings. Need a new value? Add a token first and document it.
2. **复用组件。** 按钮用 `.btn`，字段用 `.field`，卡片用 `.card`，几选一用 `Segmented`，弹窗用 `BaseModal`，成功提示用 Toast，错误用 `.alert-error`，图标用 `Icon`。不要为一个页面新造同类组件。
   **Reuse components** — never invent a page-local button, field, card, tab strip, dialog or toast.
3. **结构一致。** 页面使用 `.container` + `.page`（窄页面加 `.page-narrow`）；有标题的页面用 `.page-head` + `.page-title`；区域标题用 eyebrow 样式或 `h3`。
   **Same skeleton** — `.container.page`, `.page-head`, eyebrow/`h3` section titles.
4. **四种状态齐全。** 加载（骨架屏或 spinner）、空状态、错误（就地提示）、成功（Toast）都有设计。
   **All four states** — loading, empty, error, success.
5. **动效走预设。** 进入用 `.enter-rise`，切换用 `swap`，增删用 `list`，没有自定义的 keyframes 和时长；在系统开启"减少动态效果"时检查一遍。
   **Preset motion only**, checked with reduced motion on.
6. **明暗 + 配色。** 在浅色、深色、`default` 以及至少一种其他配色（如 `sage`）下检查；不要假设强调色是红色或蓝色。
   **Light, dark, default and one other color theme.**
7. **手机宽度。** 在 375px 宽度检查：无横向滚动、触控目标 ≥ 32px、主操作可用 44px 高度、表单单列。
   **375px wide**: no sideways scroll, touch targets ≥ 32px, single-column forms.
8. **键盘与读屏。** Tab 顺序合理，焦点可见，图标按钮有名称，弹窗能用 Esc 关闭且焦点回到原处。
   **Keyboard & screen reader** pass.
9. **双语。** 新文案中英文都有，并在两种语言下检查长度（英文通常更长）。
   **Both languages**, checked for length.
10. **访客排版。** 如果新功能显示目录内容，确认它在字号范围两端都不破版。
    **Visitor typography** holds at both ends of every range.

## 10. 允许的例外 / Allowed exceptions

- 媒体查询中的四个断点数值（见第 4 节）。
- `.sr-only` 的 1px 技术写法；遮罩（`mask-image`）中的黑色——它表示透明度，不是颜色。
- 一次性的布局约束，例如某个滚动区域的最大高度或骨架屏的宽度，可以直接写 `rem`；但颜色、字号、间距、圆角、阴影、层级、时长不在此列。
- `BrandMark.vue` 和 `Icon.vue` 中 SVG 自身的几何坐标。

- The four breakpoint literals; `.sr-only`'s 1px technique; black inside `mask-image` (it's alpha, not color); one-off layout constraints in `rem` (a scroll area's max height, a skeleton's width) — but never colors, type sizes, spacing, radii, shadows, layers or durations; SVG geometry in `BrandMark.vue` / `Icon.vue`.
