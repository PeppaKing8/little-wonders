# 小小奇遇 🐰

> 一只住在 Mac 菜单栏里的小兔子。每天早上，它会从口袋里掏出三件很小、很轻、有一点奇怪的小事，放在你的桌面上。

<p align="center"><img src="docs/preview.png" width="360" alt="小小奇遇的窗口：三张小卡片，和一只抱着小花的兔子"></p>

## 它是干什么的

有些日子，连「起床」都像一座山。这种时候别提什么宏大计划了，能做成一件三十秒的小事，就已经很了不起。

小小奇遇就是为这种日子准备的。它每天给你三件事：

- 🫧 **照顾自己** ── 比如「用温水洗一次脸」「双手捧着一杯温水，小口喝三口」
- 🔎 **看看世界** ── 比如「在附近找一点绿色」「给家里的角落取一个地名」
- 🥔 **可爱一下** ── 比如「给土豆画一个想象中的脸」「给一只袜子起个艺名」

每件事大概 30 秒到 3 分钟。做完一件，点一下小圆圈。三件都做完，兔子会给你放一场小小的礼花。

<p align="center"><img src="docs/celebration.png" width="360" alt="三件事都完成后，屏幕上飘起彩纸和小星星"></p>

## 它不会做的事

这一部分可能比上一部分更重要。

- **没有连续打卡。** 不会有「你已经坚持 0 天」这种话。
- **没有补作业。** 昨天没做的，今天就消失了，像没发生过一样。
- **没有提醒，没有推送。** 它不会主动来烦你。你想起它了，就点一下菜单栏的 🐰。
- **不联网、不要账号、不要 API key。** 你做没做，只有这台 Mac 知道。
- **不喜欢就换。** 每张卡片右下角有个「换一个」，随便换，不用解释。

做一点点就很好，不着急。

## 怎么玩

1. 点菜单栏的 🐰，或者双击桌面上的「小小奇遇」。
2. 看看今天的三件事。想做哪件就做哪件，顺序随意。
3. 做完了点右边的小圆圈。点错了再点一次就撤销。
4. 三个都点亮了，会有礼花。想再看一次，有个「再放一次小礼花」的按钮。

窗口顶部那行英文字可以拖着走。⌖ 是「保持在其他窗口上面」，− 是「先收起来」。关掉再打开，今天的进度还在。

新的一天按你这台 Mac 的日期来。半夜十二点一过，兔子就会悄悄换上三张新卡。

## 想养一只吗

它是一个 macOS 小应用（macOS 13 以上，Apple Silicon）。在这个文件夹里跑两行命令就好：

```bash
bash scripts/build.sh
```

```bash
bash scripts/install.sh
```

第二行会把它放进 `~/Applications`，在桌面留一个快捷方式，并且设置成登录时自动打开。

### 想让它休息一下

不想它开机就出现，可以关掉登录启动（应用和进度都会留着）：

```bash
launchctl bootout "gui/$(id -u)/local.littlewonders.desktop" && mv ~/Library/LaunchAgents/local.littlewonders.desktop.plist{,.disabled}
```

想让它回来，重新跑一次 `install.sh` 就行。

### 想和它告别

先做上面那步，然后把 `~/Applications/小小奇遇.app` 和桌面上的快捷方式拖进废纸篓。它记的东西在 `~/Library/Application Support/LittleWonders/`，留不留由你。

## 这些小事是哪来的

一部分是原创的，一部分改编自几个认真研究「怎么让人稍微好受一点」的地方：

- [Action for Happiness](https://actionforhappiness.org/calendar-monthly) 的每月行动日历
- [SuperBetter](https://janemcgonigal.com/2014/01/06/) 里那些「给响指数到五十」式的小挑战
- [CCI](https://cci.health.wa.gov.au/-/media/CCI/Consumer-Modules/Back-from-The-Bluez/Back-from-the-Bluez---02---Behavioural-Strategies.pdf) 的「有趣活动清单」

每张卡片底下都写着出处，点一下能看到改编说明。改编成中文短句的时候，只借了点子，没有借任何「这样做你就会好起来」的承诺。

## 一句认真的话

这个小工具背后的想法叫「行为激活」：心情低落的时候，先做一件很小的事，不等有心情了再做。这是 [NHS 也在用的一种方法](https://www.gmmh.nhs.uk/behavioural-activation)。

但小小奇遇只是一只桌面上的兔子，不是治疗，也不能代替医生、心理咨询师或者任何专业帮助。如果你正在经历很难的时期，请也去找真人聊聊。兔子会在这里等你回来。

## 给好奇的人

<details>
<summary>它是怎么做出来的</summary>

- 外壳是一个很小的 AppKit 程序（`Sources/App.m`），里面装着一个 WKWebView。
- 界面是一个 HTML 文件加几个 JS 文件（`Resources/`）。任务库在 `tasks.js` 和 `sources.js` 里，一共 84 件小事。
- 每天的三件事由 `model.js` 挑选：三类各一件，优先避开最近七天见过的，并且至少有一件是有出处的。
- 状态存在 `~/Library/Application Support/LittleWonders/state.json`，只有这一个文件。
- 跑测试：`node --test tests/model.test.js`。`tests/ui.cjs` 是开发时用的浏览器截图检查，需要本机有 Playwright 和 Chrome。
- 构建脚本写死了 macOS 14.5 SDK 的路径，换台 Mac 的话改成本机有的那个。

</details>

## 小小的历史

- **1.0** ── 兔子搬进菜单栏。三张卡片，一场礼花。
- **1.1** ── 卡片底下加上了出处。顺便试了一下「每日小实验室」和「作品架」。
- **1.2** ── 实验室和作品架搬走了。现在只有今日奇遇，兔子觉得这样刚刚好。

---

*献给每一个「今天也只做了一点点」的日子。*
