# 敖隐桌宠

一个面向 Windows 与 macOS 的透明桌面宠物。角色资产严格依据仓库内的敖隐设定图制作，并遵循 OpenAI `hatch-pet` 的 8×9 动画图集规范；没有使用 SVG、几何占位图或代码绘制角色。

## 0.2.0：灵动行为版

- 保留 hatch-pet 的 9 种基础语义动画，新增摘镜擦拭、整理尾巴、边缘趴看、人形变狼与狼形自主活动。
- 稀疏眨眼（约 7–16 秒一次），拖动步态由 12 FPS 降到 6.5 FPS；不再持续眨眼或高速踏步。
- 自主行为导演：每 45–110 秒选择一次安静动作，每 4–9 分钟短距离散步；所有行为都有冷却且可被用户操作打断。
- 拖到屏幕工作区边缘后会蹲下、趴伏并抬眼观察；狼形态约每 15–30 分钟偶发一次。
- 气泡改为低频、短句、带 10 分钟冷却；启动时不再弹出固定欢迎气泡。
- 透明、置顶、跨桌面窗口；支持拖动、单击、双击与右键菜单。
- 右键可立即预览擦眼镜、狼形态与自主散步，也可关闭“自主活动”。
- 小/标准/大三档尺寸，锁定位置，回到屏幕右下角，托盘显示/隐藏。
- 可选 45 分钟休息提醒与开机启动。
- 同一份 `resources/pets/aoyin/pet.json + spritesheet.webp` 也符合 Codex pet 包结构。

## 下载与运行

构建制品位于仓库的 `dist/` 目录。受 GitHub 插件单次传输限制，每个平台拆成 3–4 个分卷；下载对应平台的全部 `.part` 文件与重组脚本即可：

- Windows：在 `dist/` 双击 `assemble-windows.bat`，得到 `Aoyin-Desktop-Pet-0.2.0-Windows-x64.exe`，再双击运行。
- macOS：在 `dist/` 执行 `sh assemble-macos.sh`；脚本会按当前 Mac 架构生成对应 `.tar.xz` 并解压，随后把 `.app` 拖入“应用程序”。也可传入 `arm64` 或 `x64` 明确选择。

重组后可使用 `SHA256SUMS.txt` 核对完整制品与每个分卷。

当前样品没有 Apple Developer ID / Windows EV 代码签名。macOS 首次打开若被 Gatekeeper 阻止，请在“系统设置 → 隐私与安全性”中选择仍要打开；Windows SmartScreen 可能要求选择“更多信息 → 仍要运行”。

## 交互

| 操作 | 敖隐的反应 |
|---|---|
| 点击上半身 | 克制回应；台词不会每次出现 |
| 点击下半身 | 躲开或跳起 |
| 双击 | 坐下整理尾巴 |
| 拖向左/右 | 对应方向的低频步态 |
| 放到屏幕边缘 | 趴下并抬眼观察 |
| 右键 | 打开完整互动菜单 |
| 托盘单击 | 显示或隐藏 |

## 本地开发

要求 Node.js 20+。

```bash
npm install
npm test
npm start
```

只在本机打包，不需要也不包含 GitHub Actions：

```bash
npm run pack:win
npm run pack:mac
```

## 资产 QA

`artifacts/aoyin-pet-run/qa/` 保存基础图集和新增动作的 contact sheet、逐行动画预览；`final/validation.json` 保存基础图集确定性校验结果。角色一致性标准记录于 `docs/CHARACTER_SPEC.md`，行为调研与取舍记录于 `docs/BEHAVIOR_RESEARCH.md`。

## 许可

应用源代码采用 MIT License。敖隐角色设定、参考图、生成角色资产和相关美术素材不随 MIT License 授权，权利由其原权利人保留，不得据此进行商业再分发。
