# 希音 Healing · Demo

基于 [`docs/希音_Healing_App-产品需求文档.md`](../docs/希音_Healing_App-产品需求文档.md) 生成的可交互 H5 产品 Demo。

- 技术栈：React 18 + Vite + React Router（Hash 模式）
- 设计风格：极简主义、黑白配色、衬线字体（Cormorant Garamond / Noto Serif SC）
- 包含模块：登录、首页、曲库、调音台、专注配置、专注画布（参数曲线实时绘制 + 完成奖励文学摘录）、画廊、我的（含热力图、统计、设置）

## 启动方式

```bash
cd demo
npm install
npm run dev
```

默认会在 `http://localhost:5173/` 启动。建议在浏览器中开启移动端调试视图（375 × 812 等）以获得最佳观感。

## 演示要点

1. **登录页**：任意手机号 / 邮箱 + 密码即可登录（Demo 模式，无后端校验）。
2. **首页**：点击「Begin」进入专注配置；推荐、Blog 模块展示静态数据。
3. **调音台**：可选主音乐、白噪音 / 氛围音（最多 2 个）、双耳节拍频段，并保存为方案。
4. **专注模式**：
   - 3 秒倒计时过渡 → 画布开始用参数方程（Lissajous / Rhodonea / Hypotrochoid / Logarithmic Spiral / Butterfly 中随机一种）实时绘制曲线；
   - 为方便预览，Demo 将「1 分钟」压缩为「1 秒」，因此 25 min 的专注大约 25 秒结束；
   - 完成后展示文学摘录奖励页，点击可保存到画廊；
   - 右上角「Abandon」可中途放弃并以半透明残卷形式保存。
5. **画廊**：网格展示画作，残卷整体半透明并带「残卷」角标。
6. **我的**：包含热力图占位、统计数据、专注 / 账号 / 关于 设置组、退出登录。

## 目录结构

```
demo/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── store.jsx          # 全局状态（用户、收藏、混音方案、画作）
    ├── data.js            # 静态演示数据
    ├── styles.css         # 全局极简黑白样式
    ├── components/
    │   └── BottomNav.jsx
    └── pages/
        ├── Login.jsx
        ├── Home.jsx
        ├── Library.jsx
        ├── Mixer.jsx
        ├── Gallery.jsx
        ├── Profile.jsx
        ├── FocusConfig.jsx
        └── FocusSession.jsx
```
