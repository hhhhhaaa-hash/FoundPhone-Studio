# 剧情脚本 v1

机器可读规范：schemas/story.schema.json。权威校验器：src/story-engine/compiler.ts，输出继续使用现有 Work formatVersion1，不更换运行时结构。

|字段|用途|
|---|---|
|scriptVersion/id/title/revision|脚本版本1、稳定作品ID、标题、正整数内容修订号|
|description/phone|简介；机主owner、date、time、passcode、wallpaper、theme等|
|installedApps|注册 App ID，或完整 App 配置（名称、图标、文件夹、Dock、visible、installed）；顺序即桌面顺序|
|contacts|id、name、phone、avatar、bio；owner 保留给机主|
|chats|稳定会话id、app、title、participants、messages；消息需要id/body，可带senderId、time、media、kind等|
|content|按 App ID 保存 Item 数组；记录id/title/body/time、hidden、password、unlock、folder、meta等|
|variables|字符串/数字/布尔初值|
|events|节点id/label/type/event/target、conditions、actions、next、delayMs；参见原 WORK_FORMAT|
|tests|name、steps、ending、expectUnlocked；所有ending节点至少一个通过的实际引擎路径|

各ID全局唯一且稳定；不要使用随机UUID。默认值由编译器补齐，未知字段拒绝，不会执行脚本。时间线使用 time 事件、delay节点及 date/time动作；来电使用call动作，接听callAnswered。条件使用变量以及 read:/visited:/unlocked:/completed:/clue:/ui: 等原引擎作用域。unlock动作解锁隐藏内容；password是内容密码，测试read前必须提供正确password。玩家选择用choice节点的next或choice动作关联目标节点。商店/账单/社交/通话/日历使用对应 App 的content与meta字段，详见APP_DEVELOPMENT.md。

测试step支持event/target、password、advanceMs、choose。测试是指定路径的可达性证据，不是对任意用户自定义条件的数学穷举证明。未知密码、隐藏内容、悬空引用、无测试结局会失败。

电话 App 的“通讯录”与独立通讯录 App 共用 `data.contacts`，并遵守原有内容可见性规则。机主名片可在 `content.contacts` 添加一条记录，设置 `meta.self: "true"` 和 `meta.phone`；姓名使用该记录的 `title`。通话记录继续放在 `content.phone`，支持 `meta.number`、`meta.phone`（详情号码）、`meta.status`（`未接` 显示红色）、`meta.label` 和 `meta.duration`，按 `time` 倒序显示。服务短信放在 `content.messages`，相同 `title` 归入同一会话，按会话内消息时间顺序编写。

媒体仅支持safeMedia允许的内嵌data URL格式。禁止HTML/JS脚本；富文本为安全结构化JSON。作品脚本是公开静态数据，谜题密码不属于安全保密机制。

构建发布时，相册 `content.photos` 的图片会在编译校验后另存到 `public/story-media/`，发布记录使用 `./story-media/<SHA-256>.jpg` 等受限本地路径。相册按需加载图片，不把全部照片塞进首次打开的作品数据；浏览过的图片由播放器离线缓存。其他 App 的原有内嵌媒体保持不变。创作脚本继续使用下述 `asset:media/` 机制，不填写远程图片地址。

使用校验、测试和构建 CLI 时，`media` 与 `avatar` 也可填写 `asset:media/文件名.jpg`，素材放在脚本所在目录的 `media/` 下。仅支持 JPG、PNG、GIF、WebP，单张不超过10MB；路径不能越界，也不能引用远程地址或脚本。CLI 会在调用编译器前将其转换为原有安全 data URL，因此发布后的玩家不依赖额外的素材请求，原有内嵌媒体继续兼容。直接调用编译器的工具应先调用 `scripts/story-media.mjs` 的 `resolveStoryMedia`。

默认空白模板：stories/blank/story.json。引擎回归样例位于tests/fixtures/story-example，不作为内置作品。自然语言原稿：tests/fixtures/story-example/STORY.md。只改故事数据就能改变手机内容。
