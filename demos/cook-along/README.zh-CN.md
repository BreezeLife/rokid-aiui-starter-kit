# Cook Along

[English](README.md) | 简体中文 | [日本語](README.ja.md) · [Starter Kit](../../README.zh-CN.md)

Rokid Glasses 上的本地菜谱步骤与计时 Demo，可改成咖啡、泡茶、手工教学或其他简短操作指南。

![Cook Along 诊断浏览器截图，使用修补版 Ink 0.19.0](../../verification/screenshots/cook-running-final.png)

使用修补版 Ink 0.19.0 获得的 Cook Along 真实浏览器截图，仅为界面诊断证据，不代表 AIUI Studio 或实体眼镜验证。

| 基本信息 | 本 Demo |
| --- | --- |
| 运行版本 / 界面 | AIUI 0.19.0；英文 Page 界面；`_current` 和 `_blank` |
| 核心流程 | 选择菜谱 → 按步骤操作 → 为等待步骤计时 → 完成或重来 |
| 预置内容 | `coffee`：手冲咖啡；`pasta`：番茄意面 |
| 网络 / 密钥 / 权限 | 不发出应用网络请求，不需要外部 API、API Key 或相机权限 |
| 源码导入根 | Starter Kit 根目录下的 `demos/cook-along/app` |
| 开发工具 | 外部 `rokid-aiui-agent` DevKit Skill |

“离线”指 Page 打开后的菜谱与计时核心流程。宿主启动、云端语音和安装不在此声明范围内，需要单独进行真机验证。这个 Demo 在运行时不调用 AI 模型。

## 开始使用

1. 按[根目录安装指南](../../README.zh-CN.md)，在 Codex、Claude Code 或 Cursor 中安装并**加载**你的 DevKit。
2. 在编码工具中打开 Starter Kit 根目录，读完本 Demo 说明，选择下面一条提示词。
3. 从 **Starter Kit 根目录**运行检查：

   ```bash
   npm test
   npm run verify
   ```

4. 在 AIUI Studio 中选择直接包含 `app.json` 的 `demos/cook-along/app`，不要选择 Demo 的父目录。在 Studio 和眼镜上分别执行后文演示步骤。

从 GitHub 导入时使用以下准确坐标。复现已记录的源码快照时，应将 `main` 替换为对应 commit。

```text
Repository: https://github.com/BreezeLife/rokid-aiui-starter-kit
Ref: main
Directory: demos/cook-along/app
```

## 功能与边界

先从选择页打开一份菜谱，再使用上一步、下一步操作；带计时的步骤支持开始、暂停、继续和重置。离开当前步骤会取消其计时。可以重做菜谱、完成菜谱，或返回选择另一份。

咖啡预置 30 秒闷蒸和 90 秒滤滴；意面预置 120 秒酱汁步骤和 480 秒煮面步骤，实际煮面时间以包装说明为准。以上内容都是可修改的演示数据。计时结束不会自动切换步骤。

计时依据绝对结束时间。Page 隐藏时停止界面刷新，重新显示时计算剩余时间；关闭 Page 会清除本次会话。没有系统闹钟、声音、后台服务或持久化计时恢复。按钮支持焦点与点击，硬件输入仍需眼镜验证。

## 优先修改这些文件

下列路径相对于 `demos/cook-along/`。

| 文件 | 修改内容 |
| --- | --- |
| `app/lib/recipes.js` | 菜谱 ID、名称、步骤说明和计时时长 |
| `app/pages/index.ink` | 英文界面、布局、步骤流程、计时显示和焦点/点击处理 |
| `app/app.json` | App 元信息和 Page 声明 |
| `app/AGENTS.md` | 运行时 Agent 如何打开本 Page |
| `tests/` | 修改行为对应的回归测试 |

新增菜谱 ID 时，还要同步修改 `app/pages/index.ink` 的 Page schema 枚举和 `app/AGENTS.md` 运行时说明。每一步都应能快速读懂。App 不应引用其他 Demo 或自己 `app/` 目录之外的文件。

## 三条可复制提示词

按[根目录指南](../../README.zh-CN.md)选择工具对应的调用方式。以下示例使用 Codex，在聊天中发送。

**1. 替换内容**

```text
$rokid-aiui-agent
在 demos/cook-along/app 中，把咖啡和意面预置替换成两份泡茶指南。
修改本地菜谱数据，保留英文界面、步骤导航、暂停/继续计时，以及 AIUI 0.19.0。
运行现有测试和严格验证，报告真实结果。
```

**2. 翻译 App 界面**

```text
$rokid-aiui-agent
将 demos/cook-along/app 的菜谱和控件文案改成日文，保持现有行为和导入根。
检查长文本、焦点状态，以及 _current/_blank 两种布局；运行测试和严格验证。
不要把未观察到的 Studio 或真机结果写成通过。
```

**3. 改造流程**

```text
$rokid-aiui-agent
把 demos/cook-along/app 改成初学者手工指南，只使用本地步骤和可选计时。
保留暂停/继续、切换步骤时取消计时、hide/show 时间校准和 unload 清理。
增加有意义的回归测试，更新项目级 UX 表和逐能力表。
交付准确的源码根目录，并列出仍为 BLOCKED 的 Studio 或眼镜检查。
```

## 简短演示

1. 打开选择页，选择 **Pour-over coffee**。
2. 进入闷蒸步骤，开始计时，再暂停和继续；检查剩余时间是否符合预期。
3. 进入下一步，确认上一计时已经停止。继续到完成页，再返回选择页。
4. 验证离线时，在打开后断网并重复核心流程，记录实际设备、宿主和结果；这不代表离线启动已经通过。

还应检查计时中隐藏 Page 再返回、关闭后重开，以及两种显示模式。简短演示不需要等待全部预置时长；测试完成状态时，可使用可控时钟，或明确标注为测试而缩短本地预置时间。

如需在浏览器中进行有限的布局与点击检查，参照[可选诊断预览说明](../../README.zh-CN.md#可选的浏览器诊断预览)。工具仅修补 `output/` 下的独立运行时，其观察结果不代表原生预览、Studio 或真机通过。

## 验证状态

确定性本地测试和 AIUI 0.19.0 严格源码验证已通过。源码绑定的 UX/能力检查见 [verification/AUDIT.md](verification/AUDIT.md)，已执行的检查和打包结果见[根目录验证报告](../../verification/README.md)。未经修改的 AIX 浏览器预览在 App 加载前失败；另行修补的诊断预览能显示界面，但不能把原生预览记为通过。Studio 和实体眼镜检查仍为 **BLOCKED**。 离线宿主启动也保留 **BLOCKED**。本地检查不能证明 Studio 验收或某一型号眼镜行为已通过。
