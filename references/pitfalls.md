# 踩过的坑（Muse 第 01 期实测）

| 现象 | 原因 | 做法 |
|---|---|---|
| 截图逐帧录屏只有 7 帧/秒 | `screencapture -l` 每帧起进程 | 用 `scripts/winrec.swift`（ScreenCaptureKit），约 30 帧 |
| `winrec` 启动就断言失败 `CGS_REQUIRE_INIT` | 命令行程序没初始化 AppKit | 代码里先 `_ = NSApplication.shared`，主线程跑 `RunLoop` |
| 设置页镜头全对不上 | 设置是独立窗口，1600×1200，不是主窗口的 2150×1600 | 每段记录源尺寸，`s()` 传 `sw, sh` |
| 窗口中途变宽，画面下方黑边 | ScreenCaptureKit 按开录时尺寸等比缩放 | `sh` 取实际内容高度，镜头不越过内容区；尽量不在录制中改窗口大小 |
| 后台点击不生效，搜索弹窗关不掉 | 部分 Electron/WebView 弹窗不接受后台事件 | 申请全屏控制，切到 App 所在显示器再点 |
| 后台输入中文没反应 | 后台键盘事件对输入法无效 | 全屏模式下用 `type` |
| 录屏点到另一个 App 被拦 | 系统设置等未授权 App 跑到前台 | `open_application` 把目标 App 拉回；不要去操作未授权 App |
| 云端浏览器出现验证码 | 目标网站风控 | 不代过验证码，等它自己换路线；可作为“边界”素材 |
| 直接用 mov 剪辑跳帧 | ScreenCaptureKit 输出可变帧率 | 先转 30fps 恒定帧率 mp4 |
| whisper 输出繁体，对齐率很低 | base 模型默认繁体 | `--prompt` 写一句简体中文 |
| 某句字幕只闪一下 | whisper 时间戳在长句后漂移 | 截段重转写 + 停顿检测，手动校准该段 |
| React 报 hook 错误 | 在模块顶层的场景数组里调用了 `usePop` | 需要 hook 的元素包成小组件（如 `BubbleAt`） |
| `tsc` 报“使用前声明” | 小组件写在 `SCENES` 数组之后 | 小组件放在场景表前面 |
| 全片渲染到中途 `ECONNRESET`、超时 | 并发 6 时多路高清视频解帧压力大 | `--concurrency=4 --timeout=120000` |
| git 推送大文件反复断开 | 本机代理对单次大上传不稳定 | 私有仓库 + 4MB 切块 + 一次推一个提交 + `http.postBuffer=16MB` |
| zsh 里 `$sha:refs/...` 变成怪字符串 | zsh 把 `:r` 当变量修饰符 | 写 `${sha}:refs/heads/main`，复杂逻辑写成 bash 脚本 |
| zsh 循环里 `for c in $grp` 不拆分 | zsh 默认不按空格拆变量 | 用 bash 脚本或数组 |
