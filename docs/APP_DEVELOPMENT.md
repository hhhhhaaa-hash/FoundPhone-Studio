# App development

App definitions live in `src/registry.ts`. Add a stable ID, display name, engine kind, legal generic Lucide icon, color and navigation tabs. Register app settings in a Work and add default Items. Unknown custom IDs fall back to the document engine.

The shared Phone routes through engine kind, so adding templates does not require rebuilding the phone shell. Each Item supports ID, title/conversation, sender, time, type, text, structured rich text, safe media, folder/tab, hidden status, unlock variable, password, favorites, read flag, fictional likes and comments.

For full app-specific behavior, introduce typed engine records (contacts, threads, group members, replies, order status, playlists) and registered Editor/Player components, with migrations from format v1. Keep messaging and story state separate from UI skins. Existing 47 names are templates, not claims of complete feature parity with their real counterparts.

Brand assets must carry explicit compatible rights. Do not copy official product icon bundles or proprietary fonts. Do not imply affiliation. Replaceable app icon text and color are currently supported; custom icon bitmap upload is supported.

## 0.2.0 app lifecycle and independent skins

Register all catalog identities as before, but use `installed` to control availability and `visible` to control home membership. Use helpers in apps.ts rather than deleting app metadata for uninstall. Explicit content removal is the only uninstall branch that deletes data[appId]. Keep author confirmation and preserve story references for author repair.

WeChat, WhatsApp and Instagram now have independent components in AppSkins.tsx, selected inside existing AppContent. They receive filtered Items and existing read/edit/add callbacks. Add future independent skins at that boundary rather than replacing Phone, store, engine or the exporter. In 0.3.0 skins/catalog.tsx registers 42 further components, grouped into lazy-loaded System/Messaging/Social/Media/Commerce modules. Calculator and settings retain existing dedicated UI. Use fields.ts for bounded app metadata. Use useSkinState for persisted player state and invoke read callbacks on authored content access. Primary page coverage still does not imply full platform parity.

## 0.4 appearance

Moments accept date-only or local `YYYY-MM-DD HH:mm` timestamps and render newest first. Multiple photos reuse separate safe-media items in `folder: "朋友圈配图"` with `meta.momentId` referencing the post and numeric `meta.order` defining their sequence after the post's own `media`. These items are excluded from chats and feeds; each thumbnail opens its original media item through the existing detail view.

Douyin supports an optional static public-account snapshot as an item in `content.douyin` with `folder: "个人主页"` and `meta.profile: "true"`. Set `title`, safe embedded `avatar`, optional `body`, and metadata `handle`, `following`, `followers`, `totalLikes`, `works`, `location`, `importedAt`, and `sourceUrl`. The "我" tab renders this profile and excludes it from the video feed. Only HTTPS links to Douyin hosts are offered as external profile links. Public count snapshots do not imply account login, live synchronization, or imported videos. Actual authored works remain separate items in "我" or "个人主页"; absent works show an explicit empty state. Existing recommendation and follow feeds retain their behavior when no profile is configured.

WeChat Moments reuse `kind: "post"`, `folder: "朋友圈"`, `sender`, `body`, `time`, `media`, `likes` and `comments`. Set `meta.authorId: "owner"` to reuse the owner's avatar. `meta.likeContactIds` is a JSON array of authored contact IDs; the UI resolves their current remarks for the like list. Without it, the existing numeric `likes` count is used. Each plain-text comment can be written as `Name：text` or `Name 回复 Recipient：text`; it is rendered as text, never HTML. A contact's own feed only includes posts linked to that contact, while the owner's feed shows all authored Moments.

WeChat contacts can be authored as items with `folder: "通讯录"` and `meta.contact: "true"`. Use a stable item ID, `title` for the remark, `meta.nickname` for the display name, `avatar` for the embedded photo, and `meta.pinned: "true"` to pin the empty or populated conversation. `meta.momentsCover: "owner"` reuses the owner's cover; otherwise `media` provides a separate cover. These configuration items never render as messages. Contacts open a profile from the address book or chat details, with message and Moments navigation. Match future conversation titles to the remark; link Moments posts with `meta.contactId` or the remark in `sender`.

WeChat's optional personal profile is a content item in `content.wechat` with `folder: "我"` and `meta.profile: "true"`. Set `title` to the nickname, `meta.wechatId` to the WeChat ID, `avatar` to a safe embedded image, and `media` to a safe embedded Moments cover image. This configuration item is excluded from personal menu entries and conversations. Without it, the original owner name, placeholder avatar, and cover remain available. The profile does not change other Apps' owner names.

AppArtwork.tsx has code-redrawn app artwork. Do not call these official files or claim pixel fidelity. AppIcon keeps user-provided image/text overrides first. ios18.css sets canonical device-point metrics with uniform zoom; avoid adding per-viewport internal dimensions again. Keep brand/app skins separate from host Studio styling. Player-only root headers may be visually clipped; detail navigation remains available. BRAND_NOTICE.txt ships with Studio and exported players.
