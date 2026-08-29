# 敖隐桌宠

一个面向 Windows 与 macOS 的透明桌面宠物。运行时优先使用 Live2D Cubism 模型；在模型尚未安装时，以仓库内遵循 OpenAI `hatch-pet` 8×9 图集规范的敖隐精灵资产安全回退。

## 0.3.0：Live2D 渲染重构

- 渲染器优先加载 Cubism 3/4/5 `.model3.json`，支持物理、表情、动作组和高 DPI WebGL 渲染。
- 使用 PixiJS 8 的 `autoDensity + devicePixelRatio`，模型按自然边界一次拟合；窗口缩放保留脚底锚点，不再做瞬时拉伸动画。
- 修复附加动作把 6–8 帧横条放大到窗口 552%–736% 的根因。精灵回退现在只在 Canvas 内裁取单帧，DOM 尺寸始终稳定。
- 自主行为降频并防止连续重复；直接操作、拖动、边缘姿态、自主动作具有明确优先级。
- 边缘行为细分为左、右、上、下四组；Live2D 模型可以分别制作趴看、探头或悬挂姿态。
- 点击按头部/身体分流；擦眼镜、整理尾巴、狼形态都映射为独立 Cubism Motion Group。
- 缺少 Live2D 模型或 Cubism Core 时自动回退到现有精灵素材，不会黑屏。
- 透明、置顶、跨桌面窗口；支持拖动、单击、双击与右键菜单。
- 右键可立即预览擦眼镜、狼形态与自主散步，也可关闭“自主活动”。
- 小/标准/大三档尺寸，锁定位置，回到屏幕右下角，托盘显示/隐藏。
- 可选 45 分钟休息提醒与开机启动。
- 同一份 `resources/pets/aoyin/pet.json + spritesheet.webp` 也符合 Codex pet 包结构。

## 本地运行（当前 0.3.0 源码）

要求 Node.js 20+：

```bash
npm install
npm test
npm start
```

`npm start` 会先生成浏览器渲染包。本次只提交源码，不生成新的 Windows/macOS 安装包；`dist/` 中已有文件仍是旧版本制品。

## 放入敖隐 Live2D 模型

将 Cubism Editor 导出的完整模型放进 `resources/live2d/aoyin/`，入口命名为 `aoyin.model3.json`；将官方 Cubism SDK for Web 的 `live2dcubismcore.min.js` 放进 `resources/live2d/runtime/`。动作组映射可在 `resources/live2d/aoyin/pet.live2d.json` 调整，详细清单见 `resources/live2d/README.md`。

`.moc3` 是经过分层、参数绑定和物理设置后由 Cubism Editor 导出的模型数据，不能从当前几张动作条带可靠推导。因此仓库已经完成真正 Live2D 的运行管线与行为契约，但最终的敖隐形变质量仍由后续建模资产决定。

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

## 本地打包

不需要也不包含 GitHub Actions：

```bash
npm run pack:win
npm run pack:mac
```

## 资产 QA

`artifacts/aoyin-pet-run/qa/` 保存基础图集和新增动作的 contact sheet、逐行动画预览；`final/validation.json` 保存基础图集确定性校验结果。角色一致性标准记录于 `docs/CHARACTER_SPEC.md`，行为调研与取舍记录于 `docs/BEHAVIOR_RESEARCH.md`。

## 许可

应用源代码采用 MIT License。敖隐角色设定、参考图、生成角色资产和相关美术素材不随 MIT License 授权，权利由其原权利人保留，不得据此进行商业再分发。
