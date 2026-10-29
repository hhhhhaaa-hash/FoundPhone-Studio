import { readFile, realpath } from "node:fs/promises";
import {
  dirname,
  resolve,
  relative,
  isAbsolute,
  sep,
  extname,
} from "node:path";

const mimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};
function matchesImage(bytes, mime) {
  if (mime === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/png")
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/gif")
    return ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString());
  return (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
  );
}

// Only the build/validation CLI reads local files; compiled players still use safe data URLs.
export async function resolveStoryMedia(raw, storyFile) {
  const story = structuredClone(raw);
  const cache = new Map();
  let root;
  async function image(value) {
    if (cache.has(value)) return cache.get(value);
    const asset = value.slice("asset:".length);
    if (
      !/^media\/[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(?:jpg|jpeg|png|gif|webp)$/.test(
        asset,
      )
    )
      throw Error("图片素材必须使用 asset:media/文件名，且仅允许本地图片");
    root ??= await realpath(dirname(resolve(storyFile)));
    const target = await realpath(resolve(root, asset));
    const inside = relative(root, target);
    if (isAbsolute(inside) || !inside.startsWith(`media${sep}`))
      throw Error("图片素材不能离开故事的 media 目录");
    const bytes = await readFile(target);
    if (bytes.length > 10 * 1024 * 1024)
      throw Error("单张图片素材不能超过10MB");
    const mime = mimeTypes[extname(asset)];
    if (!matchesImage(bytes, mime)) throw Error("图片素材内容与扩展名不一致");
    const embedded = `data:${mime};base64,${bytes.toString("base64")}`;
    cache.set(value, embedded);
    return embedded;
  }
  async function record(item, field) {
    if (!item || typeof item !== "object") return;
    for (const key of ["media", "avatar"]) {
      if (typeof item[key] !== "string" || !item[key].startsWith("asset:"))
        continue;
      try {
        item[key] = await image(item[key]);
      } catch (error) {
        error.field = `${field}.${key}`;
        throw error;
      }
    }
  }
  if (Array.isArray(story?.contacts))
    for (const [n, item] of story.contacts.entries())
      await record(item, `contacts.${n}`);
  if (story?.content && typeof story.content === "object")
    for (const [app, items] of Object.entries(story.content))
      if (Array.isArray(items))
        for (const [n, item] of items.entries())
          await record(item, `content.${app}.${n}`);
  if (Array.isArray(story?.chats))
    for (const [n, chat] of story.chats.entries())
      if (Array.isArray(chat?.messages))
        for (const [m, item] of chat.messages.entries())
          await record(item, `chats.${n}.messages.${m}`);
  if (Buffer.byteLength(JSON.stringify(story)) > 100 * 1024 * 1024)
    throw Error("解析图片后的脚本不能超过100MB");
  return story;
}
