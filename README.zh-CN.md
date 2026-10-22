# Rokid AIUI Starter Kit

[English](README.md) | 简体中文 | [日本語](README.ja.md)

面向 Hackathon 的两个可编辑 AIUI 0.19.0 Demo 工程。先选一个已有的功能起点，再在编码工具中使用你的 [Rokid AIUI Agent DevKit Skill](https://github.com/BreezeLife/rokid-aiui-agent-skill)，把它改成自己的作品。

**选择 Demo → 安装并加载 DevKit → 修改 → 验证 → 在 Studio 和眼镜上演示。**

Starter Kit 使用独立的 [GitHub 仓库](https://github.com/BreezeLife/rokid-aiui-starter-kit)。Skill 仍保留在自己的仓库中，作为开发工具使用，App 运行不依赖 Skill。克隆 Starter Kit，再在编码工具中打开它的文件夹：

```bash
git clone https://github.com/BreezeLife/rokid-aiui-starter-kit.git
cd rokid-aiui-starter-kit
```

也可以从 GitHub 下载仓库 ZIP，解压后打开文件夹。

## 选择起点

| Demo | 可以演示什么 | 网络与密钥 | Studio 导入目录 |
| --- | --- | --- | --- |
| [Cook Along](demos/cook-along/README.zh-CN.md) · 食 | 选择咖啡或意面，逐步操作，开始、暂停、继续计时 | 不需要应用 API、账号或 Key；打开后的核心流程可离线运行 | `demos/cook-along/app` |
| [Style Lens](demos/style-lens/README.zh-CN.md) · 衣 | 选择场合，查看三条建议；Live 模式可拍摄衣物并请求建议 | Sample 模式使用内置文字，不需要 API 或 Key；Live 模式需要相机权限、HTTPS 后端、团队令牌，以及保存在服务端的视觉模型 Key | `demos/style-lens/app` |

初版 App 界面为**英文**，开发说明提供英文、简体中文、日文三个版本。两个 Demo 都是普通工程，不是额外的 Skill。以后可以继续增加生活场景，不需要改变 DevKit 的组织方式。

## Demo 截图

以下是使用修补版 Ink 0.19.0 运行时获得的真实浏览器截图，仅用于有限的诊断界面观察，不是 AIUI Studio 或实体眼镜证据。

![Cook Along 在修补版 Ink 0.19.0 浏览器诊断中的计时界面](verification/screenshots/cook-running-final.png)

Cook Along：菜谱步骤与运行中的计时器。

![Style Lens 在修补版 Ink 0.19.0 浏览器诊断中的 Sample 界面](verification/screenshots/style-sample-final.png)

Style Lens：明确标注 Sample 的示例建议与场合选项，图中没有真实模型结果。

## 1. 安装并加载 DevKit

使用支持 Agent Skills、能读写本工作区并运行终端命令的编码工具。Skills 安装器需要 Node.js **22.20 或更高版本**；本地验证还需要 Python 3。安装前先查看 [Skill 及其脚本](https://github.com/BreezeLife/rokid-aiui-agent-skill/tree/main/skills/rokid-aiui-agent)。

以 Codex 为例，在终端运行：

```bash
node --version
npx skills add BreezeLife/rokid-aiui-agent-skill --skill rokid-aiui-agent --agent codex --global
npx skills list --agent codex --global
```

列表中应出现 `rokid-aiui-agent`。安装命令读取 Skill 仓库默认分支。更新时重新运行安装命令，并检查工具报告的 revision。

| 编码工具 | 将 `--agent codex` 替换为 | 在聊天中加载 Skill |
| --- | --- | --- |
| Codex | `--agent codex` | 在需求中写 `$rokid-aiui-agent` |
| Claude Code | `--agent claude-code` | 以 `/rokid-aiui-agent` 开头 |
| Cursor | `--agent cursor` | 输入 `/`，选择 `rokid-aiui-agent`，再描述需求 |

安装和列表命令都使用同样的替换方式。如果暂时找不到 Skill，重新打开会话，并确认安装与开发使用的是同一台机器和同一个用户。修改前让编码 AI 读取 Skill，并说明实际读取的 `SKILL.md` 路径；安装成功不等于本次任务已经加载。完整流程见 [DevKit 使用指南](https://github.com/BreezeLife/rokid-aiui-agent-skill/blob/main/docs/usage.zh-CN.md)。

## 2. 做第一次修改

打开 Starter Kit 文件夹，选好 Demo，将以下内容发送到**聊天输入框**，而不是终端。示例适用于 Codex；其他工具按上表调整调用方式。

```text
$rokid-aiui-agent
先读本项目的 AGENTS.md 和项目连续性文件，再读取已安装的 Skill 并说明路径。
将 demos/cook-along/app 改成泡茶指南，保留 AIUI 0.19.0、英文界面、本地数据、
步骤导航和暂停/继续计时。保持 app 目录完整、可独立导入。
运行项目测试和严格验证，再执行已安装 AIX CLI 支持的操作。
更新项目级 UX 表和逐能力表。交付准确的源码、产物路径及真实检查结果；
未执行的 Studio 和眼镜验证保留 BLOCKED。
```

每个 Demo 的 README 都列出了修改入口和三条可复制提示词。建议先改内容，再改交互。测试、后端、报告和生成的 `.aix` 都放在 `app/` 目录之外。

## 3. 运行本地检查

在 Starter Kit 根目录运行：

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run verify
```

`npm test` 运行确定性的 App 和后端测试，不调用付费模型。`npm run verify` 会再次运行这些测试，并调用外部 DevKit，执行 AIUI 0.19.0 严格验证、源码指纹和能力清单检查。如果找不到已安装的 Skill，将 `AIUI_SKILL_DIR` 设为实际包含 `SKILL.md` 和 `scripts/` 的目录：

```bash
# 仅为示例路径：请替换为实际解析到的 Skill 目录。
export AIUI_SKILL_DIR="/absolute/path/to/rokid-aiui-agent"
npm run verify
```

锁定的 AIX 依赖可通过以下脚本使用；脚本先检查 CLI 帮助，再执行支持的操作。在同一根目录运行，打包还需要 Bash：

```bash
npm run preview -- cook-along
npm run preview -- style-lens
npm run pack
```

预览 HTML 写入 `output/previews/`，生成 HTML 不等于渲染成功。打包会检查两个 Demo，并在导入根之外的 `output/packages/` 生成独立命名的 `.aix`。压缩包是完整可编辑源码的附加产物。

### 可选的浏览器诊断预览

原始预览存在下文所述的启动失败时，可以使用单独的诊断工具检查界面。工具下载经校验和固定的官方 Ink 0.19.0 包，仅在被忽略的 `output/previews/diagnostic-runtime/` 中应用兼容补丁；不会修改 App，也不会把原生预览结果改为通过。需要 Node.js 和 Python 3。

```bash
npm run preview:diagnostic -- cook-along
npm run preview:diagnostic -- style-lens
python3 -m http.server 8768 --bind 127.0.0.1 --directory output/previews
```

保持本地服务器运行，打开 [Cook Along 诊断页](http://127.0.0.1:8768/cook-along-diagnostic.html)或 [Style Lens 诊断页](http://127.0.0.1:8768/style-lens-diagnostic.html)。页面会标明运行时经过修改。它只用于有限的布局与点击检查，Studio 和真机结果仍需单独记录。完成后按 Ctrl+C 停止服务器。

## 4. 导入并演示

在 AIUI Studio 中选择**直接包含 `app.json` 的准确 `app/` 目录**：

```text
Cook Along: demos/cook-along/app
Style Lens: demos/style-lens/app
```

以上路径相对于 Starter Kit 文件夹。不要把整个仓库、Demo 的父目录、后端目录或 `.aix` 文件作为源码导入根。

使用 **GitHub 导入**时，两个 Demo 共用以下仓库和 ref，再选择各自的准确子目录：

```text
Repository: https://github.com/BreezeLife/rokid-aiui-starter-kit
Ref: main
```

| Demo | Directory |
| --- | --- |
| Cook Along | `demos/cook-along/app` |
| Style Lens | `demos/style-lens/app` |

`main` 是当前开发分支。复现历史检查时，应选择对应 commit，并比对其验证报告中的 App 指纹。

按各 Demo README 的简短演示步骤操作。按各 Demo 声明的显示目标检查：Cook Along 覆盖对话内 `_current` 和全屏 `_blank`，Style Lens 使用 `_blank`。检查焦点与点击、异常恢复，以及关闭后重新打开，再到目标 Rokid Glasses 上验证。Cook Along 的本地逻辑不能证明宿主可以离线启动 App；Style Lens 的 Sample 模式也不能证明相机或真实模型流程已经通过。

## 验证状态

确定性的 App/后端测试和 AIUI 0.19.0 严格源码验证已通过。已执行的检查与打包结果见 [verification/README.md](verification/README.md)，DevKit 与官方资料的固定版本见 [verification/source-pins.json](verification/source-pins.json)。本地检查输出保存在 `output/verification/local-results.json`。

未经修改的 AIX 0.8.2 浏览器预览目前在 Ink 0.19 启动时失败，两份 App 都尚未加载即进入 **FAIL**。另行修补的诊断预览可以渲染两份 App 并检查按钮，但不能据此把原生预览记为通过。Studio、实体眼镜和真实模型服务仍为 **BLOCKED**。本地检查、诊断渲染和源码绑定审计不等于已达到发布条件。

已提供固定版本的 [GitHub Actions 模板](docs/ci/README.md)，但当前发布凭据缺少 workflow 写入权限，因此 **CI 尚未启用**。模板中的安装、测试、严格验证、审计、打包检查和 HTML 导出命令已在干净本地副本中通过。以后启用 CI，也不能替代浏览器、Studio、眼镜和真实模型验证。

## 目录说明

```text
rokid-aiui-starter-kit/
├── README.md / README.zh-CN.md / README.ja.md
├── AGENTS.md                 # 编码 AI 指南，调用外部 DevKit
├── PROJECT.md / MEMORY.md / TASKS.md / WORKLOG.md
├── demos/
│   ├── cook-along/
│   │   ├── app/              # 完整 Studio 导入根
│   │   └── tests/            # 本地行为测试
│   └── style-lens/
│       ├── app/              # 完整 Studio 导入根
│       ├── server/           # 单独部署的视觉模型代理
│       └── tests/            # 本地行为测试
└── scripts/                  # 调用外部 DevKit 的检查
```

两个 App 均以 AIUI **0.19.0** 为目标，使用[固定在 `7d62c2d` 的官方资料](https://github.com/yodaos-project/AIUI/tree/7d62c2d9ac1cdc1389ba06ed0651b395903accff)。各自的 `app/AGENTS.md` 描述运行时 Agent 行为；根目录的 `AGENTS.md` 指导编码 AI。
