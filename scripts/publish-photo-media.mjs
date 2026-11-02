import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Publish gallery images separately so opening other apps does not load the album.
// Compiler validation still runs against the original embedded image bytes.
export async function publishPhotoMedia(work, publicDir) {
  const published = structuredClone(work);
  const extensions = { jpeg: "jpg", png: "png", gif: "gif", webp: "webp" };
  const written = new Set();
  const records = [
    ...(published.data.photos ?? []),
    ...Object.entries(published.data)
      .filter(([app]) => app !== "photos")
      .flatMap(([app, items]) =>
        items.filter(
          (i) =>
            i.kind === "video" || (app === "redbook" && i.kind === "image"),
        ),
      ),
  ];
  for (const photo of records) {
    const match =
      /^data:(?:image\/(jpeg|png|gif|webp)|video\/(mp4));base64,([a-zA-Z0-9+/=\s]+)$/.exec(
        photo.media ?? "",
      );
    if (!match) continue;
    const bytes = Buffer.from(match[3], "base64");
    const hash = createHash("sha256").update(bytes).digest("hex");
    const file = `${hash}.${match[2] || extensions[match[1]]}`;
    if (!written.has(file)) {
      await mkdir(join(publicDir, "story-media"), { recursive: true });
      await writeFile(join(publicDir, "story-media", file), bytes);
      written.add(file);
    }
    photo.media = `./story-media/${file}`;
  }
  return published;
}