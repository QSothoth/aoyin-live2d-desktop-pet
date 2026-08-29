# 桌宠互动调研与 0.3 设计取舍

## 调研结论

- [VPet](https://github.com/LorisYounger/VPet/blob/main/README_en.md) 把摸头、提起、攀墙、工作、对话等拆为大量可组合动画；关键不是持续播放，而是动作种类和情境切换。
- [Shimeji-ee](https://github.com/gil/shimeji-ee) 采用可配置动作/动画定义，让角色自由游走并在屏幕上活动；这支持把环境位置纳入行为选择。
- [claude-pet](https://github.com/xtrimsystems/claude-pet) 的闲置角色会沿边缘走、攀爬、坐下、踢腿和跳跃，说明“桌面几何 + 低频自主动作”比纯点击菜单更有生命感。
- [VPet 的公开介绍](https://store.steampowered.com/app/1920960/) 强调摸头、身体互动、提起、跳舞、攀墙等多样动作；社区成熟方案普遍把被动互动和自主生活感同时保留。
- Electron 自带 Chromium，安装体积存在固定下限；[Tauri 桌宠案例](https://crabnebula.dev/blog/building-a-desktop-pet-with-tauri/) 说明原生 WebView 路线可显著减小体积，但跨平台透明窗、托盘和重新签名都需要一次完整迁移。因此 0.2 先通过语言包裁剪、最高压缩和资源去重做低风险减重，后续再评估 Tauri 迁移。
- [Live2D Cubism Web SDK](https://docs.live2d.com/en/cubism-sdk-manual/use-framework-web/) 将模型、物理、姿态、眨眼、表情和动作都组织在 `.model3.json` 引用图中；0.3 不再把逐帧图片称为 Live2D。
- [untitled-pixi-live2d-engine](https://github.com/Untitled-Story/untitled-pixi-live2d-engine) 基于 PixiJS 8，支持 Cubism 3/4/5、高 DPI renderer resolution、动作优先级与末帧保持，适合透明 Electron 窗口和边缘姿态。
- [Live2DPet](https://github.com/x380kkm/Live2DPet) 与 [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) 都把桌宠窗口、模型动作和上层交互分开；0.3 同样采用“窗口环境 → 行为意图 → 模型动作组”的适配层，而不是把角色动作写死到 DOM。

## 0.3 行为原则

1. 闲置画面以“停住”为主；眨眼是偶发事件，不是 7 FPS 永久循环。
2. 自主动作必须有 45 秒以上的间隔，走动至少间隔 4 分钟，台词至少间隔 10 分钟。
3. 动作可被拖动、点击和菜单命令打断，避免角色与用户争夺控制权。
4. 环境触发优先于随机触发：放到屏幕工作区边缘时，使用专门的趴伏观察动画。
5. 眼镜和狼形态属于角色设定，不用 SVG、CSS 变形冒充 Live2D；正式效果由 Cubism Motion Group 驱动，旧逐帧素材只负责缺模型时回退。
6. 自动台词短、低频且不是每个动作的说明字幕；用户可在托盘菜单关闭自主活动。
7. 直接互动 > 拖动/漫步 > 边缘姿态 > 自主动作 > Idle；新动作开始时必须取消低优先级动作，避免两个调度器争夺模型参数。
8. 边缘动作使用末帧保持，离开边缘后才强制恢复 Idle；这让“趴在窗口边看人”成为状态，而不是播完就忘的一次性动画。
