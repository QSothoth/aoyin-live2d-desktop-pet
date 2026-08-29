# Live2D 资产放置说明

应用会优先读取 `aoyin/pet.live2d.json`，并加载同目录下的
`aoyin.model3.json`。一个可运行的 Cubism 模型目录至少应包含：

- `aoyin.model3.json`
- 该文件引用的 `.moc3`、纹理、`.physics3.json`、表情和动作文件
- 官方 Cubism SDK for Web 中的 `live2dcubismcore.min.js`，放到
  `runtime/live2dcubismcore.min.js`

仓库不会伪造 `.moc3`，也不默认再分发 Live2D 的专有 Cubism Core。
把 Cubism Editor 导出的完整模型目录复制到这里后，`npm start` 和打包命令
会自动启用 Live2D；缺少模型或 Core 时会回退到稳定的精灵动画，不会黑屏。

动作组映射在 `pet.live2d.json` 中。建模时建议提供 `Idle`、`TapHead`、
`TapBody`、`Walk`、`Think`、`Glasses`、`Tail`、`Edge` 和 `Wolf` 组；不存在的
动作会被安全忽略并回到 Idle。

## 建模验收重点

- `Idle` 至少做 3 条：轻呼吸/重心微移、耳尾异步反应、短暂环顾。不要把眨眼烘焙成高频循环，交给 Cubism EyeBlink。
- 参数建议保留 `ParamAngleX/Y/Z`、`ParamEyeBallX/Y`、`ParamBodyAngleX`、呼吸参数和耳尾物理。运行时会让视线跟随鼠标，并在无人操作时低频游移。
- `Glasses` 应包含摘下、擦拭、重新戴好完整闭环；`Wolf` 至少包含变身与狼形态待机，不能只做一次贴图切换。
- `Edge` 的四个方向分别制作并保持末帧，拖到屏幕边缘后持续趴看，离开边缘才恢复待机。
- 纹理建议 2048px 或 4096px；不要在 motion 内写模型整体 Scale。窗口尺寸只由宿主控制，以免再次出现动作开始时突然放大。
