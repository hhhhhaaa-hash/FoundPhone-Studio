import { readFile, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
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
  ".mp4": "video/mp4",
};
function matchesImage(bytes, mime) {
  if (mime === "video/mp4")
    return bytes.length >= 12 && bytes.subarray(4, 8).toString() === "ftyp";
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
      !/^media\/[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(?:jpg|jpeg|png|gif|webp|mp4)$/.test(
        asset,
      )
    )
      throw Error("图片素材必须使用 asset:media/文件名，且仅允许本地图片");
    root ??= await realpath(dirname(resolve(storyFile)));
    const target = await realpath(resolve(root, asset));
    const inside = relative(root, target);
    if (isAbsolute(inside) || !inside.startsWith(`media${sep}`))
      throw Error("图片素材不能离开故事的 media 目录");
    let bytes = await readFile(target);
    if (extname(asset) === ".mp4") {
      let manifest;
      try {
        manifest = JSON.parse(await readFile(`${target}.parts.json`, "utf8"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      if (manifest) {
        if (
          !Array.isArray(manifest.parts) ||
          manifest.parts.length < 1 ||
          manifest.parts.length > 32 ||
          !Number.isInteger(manifest.bytes) ||
          manifest.bytes > 10 * 1024 * 1024 ||
          !/^[a-f0-9]{64}$/.test(manifest.sha256)
        )
          throw Error("无效视频分片清单");
        const chunks = [];
        for (const name of manifest.parts) {
          if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.mp4\.part-\d{2}$/.test(name))
            throw Error("无效视频分片路径");
          const chunk = await realpath(resolve(root, "media", name));
          const chunkInside = relative(root, chunk);
          if (isAbsolute(chunkInside) || !chunkInside.startsWith(`media${sep}`))
            throw Error("视频分片不能离开素材目录");
          chunks.push(await readFile(chunk));
          if (
            chunks.reduce((total, b) => total + b.length, 0) >
            10 * 1024 * 1024
          )
            throw Error("视频分片总计不能超过10MB");
        }
        bytes = Buffer.concat(chunks);
        if (
          bytes.length !== manifest.bytes ||
          createHash("sha256").update(bytes).digest("hex") !== manifest.sha256
        )
          throw Error("视频分片校验失败");
      }
    }
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