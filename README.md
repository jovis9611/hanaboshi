# From Blossom to Starlight 🌸✨

> ふたりの歩幅で。  
> Through Every Season, Beyond the Stars.

日系和风电影感的新婚互动祝福网站：樱花、四季、星河，以及一封温暖但不肉麻的朋友祝福信。**面向收礼人的全部文案与界面已经改为英文为主，短句点缀原创日文，不需要懂中文。**

## 实际体验

1. **序章**：轻触屏幕中的花瓣，开启礼物（英文介绍，日文小题词）。
2. **第一幕 · 花开之时**：樱花树盛开，讲述相遇与彼此频率。
3. **第二幕 · 四季**：用季节导航、左右滑动或触控板滚动，依次体验春 / 夏 / 秋 / 冬。春天是期待，夏天是快乐，秋天是默契，冬天是陪伴。
4. **第三幕 · 星海**：轻触或拖动两颗星星，让它们靠近、同步闪烁，但仍保有各自的光。核心句：**“May you both keep your own light, and still brighten the same sky.”** 日文：**「それぞれの光を持ったまま。」**
5. **尾声**：打开和纸祝福信、查看最后的 P.S. 彩蛋。

场景使用 **Three.js** 实现程序化 3D 樱树、飘落花瓣、萤火虫、雪、星海粒子和两颗发光星星；文字、按钮和信件采用 HTML，适合手机触控与桌面操作。出于方便分享，**无需后端、无需安装依赖、无需付费服务**。无法连接 Three.js CDN、WebGL 不可用或系统启用减少动画时，会保留 CSS/SVG 插画式降级场景与全部基本内容和互动。

## ① 修改朋友和送礼人的名字

打开项目根目录里的 `config.js`，修改这两个值：

```js
export const gift = {
  friendName: 'Mina',
  senderName: 'Alex',
};
```

如想修改每一幕的文案，打开 `main.js` 顶部的 `page` 文案数据；结尾祝福信的正文位于 `index.html` 中 `<div class="letter-content">` 部分。

## ② 本地预览

项目是**纯静态网站**，不需要运行 `npm install` 或 `npm run build`。由于浏览器安全限制，不建议直接双击 `index.html`；请使用本地 HTTP 服务器：

```bash
cd hanaboshi-wedding
python3 -m http.server 8000
```

然后访问 http://localhost:8000/ 。Python 不可用时，也可以使用 VS Code Live Server 或任何静态文件服务器。

**注意：** Three.js 从公共 CDN 动态加载，3D 效果需要联网；若离线，本地预览会展示网站自带的轻量插画版。

## ③ 发布到 GitHub Pages，让朋友通过 github.io 打开

**第一次发布：**

1. 登录 GitHub，新建一个 repository，例如命名 `hanaboshi-wedding`，建议选择 **Public**。
2. 把本项目**所有文件和文件夹**上传到该仓库的 `main` 分支，**包括隐藏的 `.github/workflows/deploy.yml`**。不要只上传 ZIP，需先解压后上传文件。Git 命令行也可以：
   ```bash
   git init
   git add .
   git commit -m "Create interactive wedding gift"
   git branch -M main
   git remote add origin https://github.com/<你的GitHub用户名>/hanaboshi-wedding.git
   git push -u origin main
   ```
3. 打开仓库的 **Settings → Pages**，将 **Build and deployment → Source** 设为 **GitHub Actions**。
4. 打开仓库的 **Actions**，查看 `Publish wedding website` 工作流；如需要可手动点 `Run workflow`，等待部署成功。
5. 网站地址通常为：

   **`https://<你的GitHub用户名>.github.io/hanaboshi-wedding/`**

> GitHub Pages 可能需要片刻才能生效。地址只是格式示例；要以 GitHub Actions 实际输出的 Page URL 为准。本项目已经配好发布工作流，但在上传并授权部署前还没有真实上线地址。

**如果想使用最短的网址：** 建一个名为 `<你的GitHub用户名>.github.io` 的仓库，并用相同方式发布。网址通常是 `https://<你的GitHub用户名>.github.io/`。

## 项目文件

| 文件 | 用途 |
|---|---|
| `index.html` | 页面结构、结尾祝福信和可访问的互动按钮 |
| `style.css` | 日系电影感排版、季节调色、插画降级场景和响应式布局 |
| `main.js` | 三幕文字、交互逻辑、滑动切换、音效与开信 |
| `scene.js` | Three.js 3D 树、叶片、萤火虫、宇宙粒子与星星同频动画 |
| `config.js` | 朋友昵称和署名 |
| `favicon.svg` | 樱花图标 |
| `assets/audio/*.mp3` | 三首 BGMer BGM，本地部署，支持循环和跨幕淡入淡出 |
| `.github/workflows/deploy.yml` | 一键 GitHub Pages 自动部署 |

## 互动和无障碍

- 手机：轻触花瓣、横向滑动四季、轻触两颗星星、打开祝福信。
- 桌面：鼠标点击或拖动；四季支持触控板滚动与方向键 `←` / `→`。
- 音乐：朋友首次点击樱花瓣时播放第一首 BGM；右上角「Music · On / Off」可随时静音或恢复。音乐跨幕柔和淡入淡出，三首 MP3 已随项目打包。星星互动另有轻柔风铃和音。
- 辅助使用：HTML 文案不依赖 WebGL，按钮可键盘聚焦；开启系统「减少动态效果」时会使用低动态的 CSS/SVG 版本。

## 技术说明

- Three.js ESM 版本 `0.180.0` 通过 jsDelivr CDN 加载，失败时尝试 unpkg；静态部署无需 npm。
- 星空和花瓣均为程序化生成，无需单独图片或音频文件。
- 无 Cookie、无数据采集、无后端、无需账号登录。
- BGM 来自 BGMer，使用用户手动下载的文件（见下方音乐授权说明）。
- 如需在完全离线的环境中使用 3D，可自行下载 Three.js ESM 及其依赖文件并将 `main.js` 的 CDN 地址改为本地路径。

祝你的朋友新婚快乐！正文英文字句与日文点缀是为本礼物原创写作，不是日本文学的直接引用。


## 音乐来源与场景

本网站含送礼人自行从 [BGMer](https://bgmer.net/) 下载的原版 MP3，随静态站点部署。演示与使用前请再次确认官方[利用规约](https://bgmer.net/terms/)，不得将音源作为独立音乐产品再分发。

| 场景 | 曲目 | 文件 / 来源 |
|---|---|---|
| 初触花瓣、樱花与四季 | **あなたのために** | `assets/audio/for-you.mp3` · https://bgmer.net/music/321/ |
| 进入宇宙、两颗星星同频 | **プラネタリウム** | `assets/audio/planetarium.mp3` · https://bgmer.net/music/362/ |
| 打开祝福信与最后彩蛋 | **手紙を出すよ** | `assets/audio/letter.mp3` · https://bgmer.net/music/210/ |

点击花瓣是首次播放的用户手势，遵循手机浏览器对音乐播放的要求。此前手动静音的选择会得到尊重。三段音乐按互动场景而非固定计时切换；为照顾慢慢阅读的朋友，所有曲目可循环播放。

### 本次排版修复

针对小屏幕与高度较低的桌面视窗，为 Act I、Act III 与星星同频后的文字设置了避开顶部品牌的安全区；文字过长时可在内容区域内滚动，不会遮住 `HANABOSHI / WEDDING WISH`；手机端星星交互区域也调整到下方。
