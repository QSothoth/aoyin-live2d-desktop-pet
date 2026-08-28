# 敖隐桌宠

一个面向 Windows 与 macOS 的透明桌面宠物。角色资产严格依据仓库内的敖隐设定图制作，并遵循 OpenAI `hatch-pet` 的 8×9 动画图集规范；没有使用 SVG、几何占位图或代码绘制角色。

## 已实现

- 9 种语义动画：待机、向右/向左拖动、挥手、跳跃、失败/困倦、等待回应、专注工作、审阅。
- 透明、置顶、跨桌面窗口；支持拖动、单击、双击与右键菜单。
- 喂罐头、摸头、陪伴工作、审阅、等待回应等互动。
- 小/标准/大三档尺寸，锁定位置，回到屏幕右下角，托盘显示/隐藏。
- 可选 45 分钟休息提醒与开机启动。
- 同一份 `resources/pets/aoyin/pet.json + spritesheet.webp` 也符合 Codex pet 包结构。

## 下载与运行

构建制品位于仓库的 `dist/` 目录。受 GitHub 插件单次传输限制，每个平台拆成 3–4 个分卷；下载对应平台的全部 `.part` 文件与重组脚本即可：

- Windows：在 `dist/` 双击 `assemble-windows.bat`，得到 `Aoyin-Desktop-Pet-0.1.0-Windows-x64.exe`，再双击运行。
- macOS：在 `dist/` 执行 `sh assemble-macos.sh`；脚本会按当前 Mac 架构生成对应 `.tar.xz` 并解压，随后把 `.app` 拖入“应用程序”。也可传入 `arm64` 或 `x64` 明确选择。

重组后可使用 `SHA256SUMS.txt` 核对完整制品与每个分卷。

当前样品没有 Apple Developer ID / Windows EV 代码签名。macOS 首次打开若被 Gatekeeper 阻止，请在“系统设置 → 隐私与安全性”中选择仍要打开；Windows SmartScreen 可能要求选择“更多信息 → 仍要运行”。

## 交互

| 操作 | 敖隐的反应 |
|---|---|
| 单击 | 挥手回应 |
| 双击 | 跳起来 |
| 拖向左/右 | 对应方向的奔跑动作 |
| 右键 | 打开完整互动菜单 |
| 18 分钟不理他 | 耳朵垂下、蜷起来小憩 |
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

`artifacts/aoyin-pet-run/qa/` 保存最终 contact sheet 与逐行动画预览；`final/validation.json` 保存确定性图集校验结果。角色一致性标准记录于 `docs/CHARACTER_SPEC.md`。

## 许可

应用源代码采用 MIT License。敖隐角色设定、参考图、生成角色资产和相关美术素材不随 MIT License 授权，权利由其原权利人保留，不得据此进行商业再分发。
