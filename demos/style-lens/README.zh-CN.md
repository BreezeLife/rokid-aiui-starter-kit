# Style Lens

[English](README.md) | 简体中文 | [日本語](README.ja.md) · [Starter Kit](../../README.zh-CN.md)

Rokid Glasses 上的衣物搭配建议起点。选择工作、周末或晚间场合，阅读三条简短建议。先用内置 Sample 体验流程，再连接自己的视觉模型服务，验证真实拍照流程。

![Style Lens 诊断浏览器截图，使用修补版 Ink 0.19.0](../../verification/screenshots/style-sample-final.png)

使用修补版 Ink 0.19.0 获得的 Style Lens 真实浏览器截图，仅为界面诊断证据，不代表 AIUI Studio 或实体眼镜验证。 Style Lens 处于 Sample 模式，未展示真实模型结果。

| 基本信息 | 本 Demo |
| --- | --- |
| 运行版本 / 界面 | AIUI 0.19.0；英文 Page 界面；全屏 `_blank` |
| 默认模式 | **Sample**：使用内置蓝色衬衫示例，不拍照、不请求网络，不是对当前视野的模型分析 |
| Live 流程 | 选择 Live → 拍照并发送 → 等待 → 阅读最多三条建议，或从错误中恢复 |
| Live 要求 | 相机权限、可访问的 HTTPS 代理、短期团队令牌、服务端模型 Key，以及支持图片输入的模型 |
| 源码导入根 | Starter Kit 根目录下的 `demos/style-lens/app` |
| 后端 | `demos/style-lens/server`；单独部署，不导入 Studio |
| 开发工具 | 外部 `rokid-aiui-agent` DevKit Skill |

## 先使用 Sample 模式

1. 按[根目录指南](../../README.zh-CN.md)，在编码工具中安装并**加载** DevKit。
2. 打开 Starter Kit 根目录。修改和体验 Sample 模式不需要模型服务账号或 Key。
3. 从 **Starter Kit 根目录**运行：

   ```bash
   npm test
   npm run verify
   ```

4. 将直接包含 `app.json` 的 `demos/style-lens/app` 导入 AIUI Studio。打开 Page，保持 **Sample** 模式，尝试三个场合。

从 GitHub 导入时使用以下准确坐标。复现已记录的源码快照时，应将 `main` 替换为对应 commit。

```text
Repository: https://github.com/BreezeLife/rokid-aiui-starter-kit
Ref: main
Directory: demos/style-lens/app
```

每次打开 Page 都从 Sample 模式开始。可选的 `occasion` 参数接受 `work`、`weekend`、`evening`，默认 `work`；它不会启用 Live。拍照始终由用户明确操作触发。

## 连接 Live 模式

代理通过 `POST /api/style` 接收图片和场合，再调用可配置的 OpenAI 兼容视觉 API。选择团队可以使用、支持图片输入的服务商和模型；本工程不预置或开通某个模型服务。

从 Starter Kit 根目录开始：

```bash
cd demos/style-lens/server
cp -n .env.example .env
# 启动前编辑 .env；如果已有 .env，请直接编辑，不要覆盖。
node --env-file=.env server.mjs
```

使用根目录安装流程中的 Node.js 22.20+ 环境。在服务端 `.env` 中配置：

| 变量 | 用途 |
| --- | --- |
| `VISION_API_KEY` | 模型服务商 Key，只保存在服务端 |
| `VISION_MODEL` | 该服务商支持、能够接收图片的模型 ID |
| `VISION_API_BASE_URL` | 服务商基础地址；模板默认 `https://api.openai.com/v1` |
| `TEAM_TOKEN` | 至少 32 个字符的随机团队令牌；将相同的临时令牌配置到 Demo App |
| `TEAM_TOKEN_EXPIRES_AT` | 未来的 ISO 时间戳，最多 24 小时后过期；后续演示需续期 |
| `HOST`、`PORT` | 本地默认 `127.0.0.1` 和 `8787` |
| `UPSTREAM_TIMEOUT_MS` | 模型请求超时，默认 `25000` |
| `ALLOWED_ORIGIN` | 可选，准确的 HTTPS 浏览器来源；留空表示禁用浏览器跨域访问 |

本地服务用于开发。在眼镜上使用时，将代理部署到可访问的 **HTTPS** 地址，再修改 `app/config.js`：

```js
backendUrl: 'https://your-backend.example/api/style',
teamToken: 'your-temporary-per-team-token'
```

以上域名和令牌都是占位示例。任何 App 文件中都不要放 `VISION_API_KEY`。团队令牌是演示用的临时凭据，不能替代生产环境身份验证；分享源码前移除，演示后撤销或轮换。`.env` 应保留在 Studio 导入根之外，也不进入版本管理。

配置后再选择 **Try Live** 和 **Capture & send**，并按提示授予相机权限。Live 会通过代理将照片发送给所配置的服务商；Sample 不会。App 和代理不保存照片，所选服务商的保留政策在此未确认。取消不能撤回已发送的照片或已产生的模型费用。初始限制为每张图片 4 MiB、App 请求 45 秒超时、模型请求 25 秒超时。取消、拒绝权限、配置缺失、网络/服务错误和无效响应都应进入明确、可恢复的状态。可以切回不需要 Key 的 Sample，但不能把示例结果说成真实请求成功。

## 优先修改这些文件

下列路径相对于 `demos/style-lens/`。

| 文件 | 修改内容 |
| --- | --- |
| `app/data/samples.js` | 工作、周末、晚间的示例建议 |
| `app/config.js` | 后端地址、临时团队令牌、请求超时与图片限制 |
| `app/pages/index/index.ink` | 英文界面、场合/模式选择、拍照/请求流程及恢复 |
| `server/prompt.mjs` | 真实模型的系统提示词 |
| `server/server.mjs` | 模型请求、响应格式、身份验证与限制 |
| `server/.env.example` | 服务端配置模板；真实值只放入本地 `.env` |
| `app/AGENTS.md`、`app/app.json` | 运行时调用、Page 元信息和权限声明 |
| `tests/` | 使用桩而非付费模型的 App/代理回归测试 |

## 三条可复制提示词

按[根目录指南](../../README.zh-CN.md)选择工具对应的调用方式。以下示例使用 Codex，在聊天中发送。

**1. 不接 API，先改场景**

```text
$rokid-aiui-agent
在 demos/style-lens/app 中，把 Sample 场景改成校园日常、求职面试和周末散步。
保留英文界面和清楚的 Sample 标识，更新内置建议和测试。
Sample 不得拍照或调用后端。运行测试和 AIUI 0.19.0 严格验证。
```

**2. 修改真实模型提示词**

```text
$rokid-aiui-agent
把 demos/style-lens 改成旅行打包助手，修改后端视觉提示词和对应的 Sample
文字，保持一至三条简短建议的响应格式。模型凭据仍只放服务端，测试使用桩，
不要调用付费模型。检查正常流程、错误、取消和过期响应，真实服务检查
保留 BLOCKED。
```

**3. 准备团队演示**

```text
$rokid-aiui-agent
为 Hackathon 检查 demos/style-lens/app 和 server。检查 Sample/Live 标识、
配置错误、权限拒绝、超时、令牌过期、取消和 unload 清理。
执行本地测试、严格验证和 AIX 支持的操作，更新 UX 表和逐能力表，
报告准确的导入与产物路径。Studio、眼镜和真实模型服务在实际执行前保留 BLOCKED。
```

## 简短演示

1. 打开 **Sample**，选择 **Work**，展示三条内置建议，并明确它们是示例数据。
2. 切换到 **Weekend** 或 **Evening**，查看对应结果。这一步不拍照，也不请求模型。
3. 点击 **Try Live**。初始未配置时确认出现 **Setup needed**，再点击 **Use Sample** 返回。
4. 单独配置 Live 后，点击 **Try Live**，对准一件衣服，点击 **Capture & send**。展示等待状态和真实返回的建议。
5. 尝试后端不可用或拒绝权限，再返回 Sample。不要把回退结果当作真实图片分析。

Live 的响应时间取决于服务商和网络，因此简短 Sample 演示不承诺固定的 Live 响应时间。使用全屏 `_blank`，还应检查焦点/点击、取消、请求中离开 Page，以及重新打开后回到 Sample。

如需在浏览器中进行有限的布局与点击检查，参照[可选诊断预览说明](../../README.zh-CN.md#可选的浏览器诊断预览)。工具仅修补 `output/` 下的独立运行时，其观察结果不代表原生预览、Studio 或真机通过。

## 验证状态

确定性本地测试和 AIUI 0.19.0 严格源码验证已通过。源码绑定的 UX/能力检查见 [verification/AUDIT.md](verification/AUDIT.md)，已执行的检查和打包结果见[根目录验证报告](../../verification/README.md)。未经修改的 AIX 浏览器预览在 App 加载前失败；另行修补的诊断预览能显示界面，但不能把原生预览记为通过。Studio 和实体眼镜检查仍为 **BLOCKED**。 本地代理测试使用假服务商，真实视觉服务和相机硬件仍为 **BLOCKED**。Sample 结果不能作为实时推理成功的证据。
