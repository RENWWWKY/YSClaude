# YSClaude

YSClaude 是一款 Android 端个人 AI Agent 应用，支持日常聊天、语音与视频通话、联网与网页交互、对话文件、自动化工作流、手机数据调用及设备控制等功能。

> 本 README 主要介绍如何安装和使用。更完整的操作说明见 [YSClaude 使用教程](docs/YSClaude%20使用教程.md)，版本变化见 [更新记录](docs/更新记录.md)。

## 获取源码

主仓库：[winter-bit-cry/YSClaude](https://github.com/winter-bit-cry/YSClaude)

部分功能需要另行部署服务：

- [YSClaude Keepalive Server](https://github.com/winter-bit-cry/YSClaude-keepalive-server)：Prompt 缓存远程保活与消息离线推送。
- [YSClaude LiveKit Brain](https://github.com/winter-bit-cry/ysclaude-livekit-brain)：LiveKit Agents 实时语音、视频和屏幕共享通话。
- [NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)：导入网易云账号歌单。

## 安装与打包

项目包含 Android 原生工程，不能使用 Expo Go 运行。构建前请安装 [Node.js LTS](https://nodejs.org/)，然后在项目根目录执行：

```powershell
npm.cmd install --legacy-peer-deps
```

LiveKit Agents 与 ElevenLabs 使用的 WebRTC 依赖声明暂不一致，因此需要使用 `--legacy-peer-deps`。不要为了消除依赖提示随意降级 `@livekit/react-native-webrtc`。

### EAS 云端构建

无需在本机安装 Android SDK，登录 Expo 账号后执行：

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build --profile preview --platform android
```

- `preview`：生成可直接安装的 APK，适合自用和测试。
- `development`：开发调试包，需要配合开发服务器。
- `production`：生成用于正式发布的 AAB。

首次构建可让 EAS 自动生成 Android Keystore。请妥善备份签名；以后只有包名和签名均一致的新版本才能覆盖安装旧版本。

### Android Studio 本地构建

1. 安装 [Android Studio](https://developer.android.com/studio)，打开项目中的 `android` 文件夹。
2. 等待 Gradle Sync 和依赖下载完成。
3. 选择 `Build` → `Generate Signed Bundle / APK`。
4. 选择 `APK`、`app` 模块和自己的 Keystore。
5. 选择 `release`，完成构建。

APK 通常位于：

```text
android\app\build\outputs\apk\release\app-release.apk
```

也可以在 `android` 目录执行：

```powershell
.\gradlew.bat assembleRelease
```

当前命令行 `release` 默认使用调试签名，适合自行安装测试；长期更新或正式发布请配置并保存自己的 Release Keystore。详细图形化打包步骤见 [使用教程：应用打包](docs/YSClaude%20使用教程.md#应用打包)。

## 开始使用

### 1. 配置对话 API

进入“设置 → 对话设置”，填写 OpenAI 兼容接口的地址、Key 和模型信息。可按需配置：

- Thinking 强度与返回渠道；
- Prompt Cache 及远程保活；
- 多段 System Prompt 预设、发送身份与排列顺序；
- 当前对话加载数量和不发送给 AI 的隐藏消息；
- 数据导入、导出、数据库诊断和 API 使用日志。

如使用 Claude Code 渠道，自定义提示词建议以 `user` 身份发送，避免被渠道自身的 System Prompt 覆盖。

### 2. 配置常用能力

在设置页按需启用对应能力：

- **生图**：配置 OpenAI 兼容的 GPT Image 接口，可使用基础提示词和锁脸参考图。
- **聊天语音**：STT 支持 OpenAI Whisper、Fish Audio、Deepgram；TTS 支持 MiniMax、Fish Audio、Deepgram、Mossland。
- **实时通话**：可选择 LiveKit Agents 或 ElevenLabs；LiveKit Agents 需要部署 Brain 服务。
- **联网搜索**：填写 Tavily Key。
- **热榜查询**：填写 UAPI Key。
- **定位**：授权定位并填写腾讯地图 Key，AI 可获得逆解析后的真实位置。
- **自定义 MCP**：连接自己的搜索、记忆或其他 MCP 服务。
- **远程命令与对话文件**：两者同时开启后，AI 可在本地文件与 SSH 服务器文件之间互传。
- **Shizuku 与无障碍服务**：用于本机 Shell、屏幕观察、点击、输入等 Android 操作，请只授予可信配置使用。

### 3. 使用聊天页

聊天页会随系统切换日间和夜间主题。AI 回复下方支持复制、收藏、TTS 播放、正负 Emoji Reaction 和重新生成。

![聊天页日间模式](docs/1.png)

![聊天页夜间模式](docs/2.png)

长按消息可以隐藏单条消息；隐藏内容仍保留在记录中，但不会继续发送给 AI。应用也支持导入 `conversation.js` 格式的既有对话数据。

### 4. 使用扩展功能

- **日记与来信**：收藏日记可作为近期记忆；到设定日期后可由 AI 生成来信。
- **悬浮球**：长按唤出菜单；开启无障碍后可发送当前界面节点树或让 AI 操作手机。
- **桌面小组件**：显示今日待办。
- **表情包**：支持相册单张上传或链接批量导入，并可分别提供给用户和 AI 使用。
- **工作流**：支持自定义工作流及后台触发器，规则见 [工作流代码触发器编辑规则](docs/工作流代码触发器编辑规则.md)。
- **聊天页美化**：支持贴图、气泡圆角、颜色、字号等快捷配置；自定义样式参考 [主聊天页自定义 CSS 类](docs/主聊天页自定义CSS类.md)。

## 使用时的注意事项

- 数据备份可以保存到手机文件或任意网盘，不限于 Google Drive。
- 导入数据或更换包名、签名前，建议先完整导出备份。
- Keystore、Alias 和密码丢失后，将无法用新版覆盖安装原应用。
- 来信功能默认会调用项目内置记忆库；如使用自己的记忆服务，请先替换相应接口。
- QQ、微信和 Discord Bot 属于外部消息渠道，与应用内聊天相互独立，部分渠道需要额外服务。
- 设备控制、短信、联系人、Shell 等能力涉及敏感权限，请按需开启，并检查 AI 可调用的工具范围。

## 最近更新

### 2026.07.25

- 更新工具调用结构，采用 Claude Code 工具结果插入结构。
- 更新子 Agent。

### 2026.07.23

- 新增自定义工作流与后台保活。
- 新增天气、剪贴板、联系人编辑、短信与拨号工具。
- 新增 Discord Bot 工具和模拟 iOS 灵动岛。

### 2026.07.20—07.21

- 新增支持向量搜索和关键词搜索的内置记忆库。
- 优化音乐页面，新增主页推荐歌单和个人主页。

### 2026.07.17—07.19

- 新增 Shizuku 本机 Shell、Android 屏幕观察与控制、悬浮终端。
- 新增跨窗口聊天记录读取、多段 System Prompt、QQ/微信消息工具、Reaction 和选项卡工具。
- 优化聊天页、设置页及一起听歌页面。

### 2026.07.10—07.16

- 新增对话文件与 SSH 服务器文件互传、真实定位、待办与安卓小组件、记账。
- 新增 LiveKit Agents 语音、视频和屏幕共享通话。
- 优化历史对话、日历、设置页，并修复共读导入 TXT 中文乱码。

完整逐日记录见 [docs/更新记录.md](docs/更新记录.md)。

## 文档

- [完整使用教程](docs/YSClaude%20使用教程.md)
- [更新记录](docs/更新记录.md)
- [工作流代码触发器编辑规则](docs/工作流代码触发器编辑规则.md)
- [主聊天页自定义 CSS 类](docs/主聊天页自定义CSS类.md)
- [LiveKit Agents 语音通话](docs/livekit-agents-voice-call.md)
- [ElevenLabs 语音引擎](docs/elevenlabs-speech-engine.md)

## License

本项目采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。未经额外商业授权，不得将本项目或其修改版本用于商业用途。

Copyright © 2026 YSClaude contributors.
