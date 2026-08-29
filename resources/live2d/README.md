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
