# 2468 游戏

经典数字合并游戏（类 2048），使用 HTML5 Canvas 开发。

## 快速体验

### 浏览器直接打开
```bash
npx serve www -p 8080
```
然后浏览器访问 `http://localhost:8080`

### 在手机上测试
确保手机和电脑在同一局域网，用电脑 IP 替换 localhost：
```
http://192.168.x.x:8080
```

## 玩法
- **手机**：在游戏区域滑动屏幕（上下左右）
- **电脑**：按方向键或 WASD
- 相同数字碰撞后合并（2→4→8→16→32...→2048）
- 达到 2048 即为胜利，可继续挑战更高分

## 打包 Android APK

### 环境要求
- Android Studio (含 Android SDK)
- Java JDK 17+
- Node.js 18+

### 步骤
```bash
# 1. 同步 web 文件到 Android 项目
npx cap sync

# 2. 用 Android Studio 打开并构建
npx cap open android
```

然后在 Android Studio 中：Build → Build Bundle(s) / APK(s) → Build APK(s)

APK 文件位于：`android/app/build/outputs/apk/debug/app-debug.apk`

## 项目结构
```
├── www/          → Capacitor web 资源
├── js/game.js    → 核心游戏逻辑
├── js/render.js  → Canvas 渲染引擎
├── css/style.css → 样式
├── index.html    → 主页面
├── manifest.json → PWA 配置
├── sw.js         → Service Worker
└── android/      → Android 原生项目 (cap add android 生成)
```
