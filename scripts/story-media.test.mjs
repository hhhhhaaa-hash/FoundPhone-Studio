import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  rmdir,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { resolveStoryMedia } from "./story-media.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "foundphone-media-test-"));
  await mkdir(join(root, "media"));
  t.after(async () => {
    const target = resolve(root);
    assert.equal(dirname(target), resolve(tmpdir()));
    assert.ok(basename(target).startsWith("foundphone-media-test-"));
    await rm(target, { recursive: true, force: true });
  });
  return { root, file: join(root, "story.json") };
}
const jpeg = Buffer.from([255, 216, 255, 224, 0, 0]);

test("local images resolve in every author media container without changing input or inline data", async (t) => {
  const { root, file } = await fixture(t);
  await writeFile(join(root, "media", "photo.jpg"), jpeg);
  const media = "asset:media/photo.jpg",
    inline = "data:image/jpeg;base64,/9j/";
  const raw = {
    contacts: [{ avatar: media }],
    content: { wechat: [{ media, avatar: inline }] },
    chats: [{ messages: [{ media }] }],
  };
  const compiled = await resolveStoryMedia(raw, file);
  const expected = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  assert.equal(compiled.contacts[0].avatar, expected);
  assert.equal(compiled.content.wechat[0].media, expected);
  assert.equal(compiled.content.wechat[0].avatar, inline);
  assert.equal(compiled.chats[0].messages[0].media, expected);
  assert.equal(raw.content.wechat[0].media, media);
});

test("traversal, encoded paths, remote assets and executable extensions are rejected with field locations", async (t) => {
  const { file } = await fixture(t);
  for (const media of [
    "asset:../photo.jpg",
    "asset:media/../photo.jpg",
    "asset:media/%2e%2e.jpg",
    "asset:https://example.com/photo.jpg",
    "asset:media/photo.svg",
    "asset:media/photo.js",
  ]) {
    await assert.rejects(
      resolveStoryMedia({ content: { wechat: [{ media }] } }, file),
      (error) => error.field === "content.wechat.0.media",
    );
  }
});

test("invalid image contents, missing images and oversized assets fail validation", async (t) => {
  const { root, file } = await fixture(t);
  await writeFile(join(root, "media", "fake.jpg"), "<script>alert(1)</script>");
  await writeFile(
    join(root, "media", "large.jpg"),
    Buffer.alloc(10 * 1024 * 1024 + 1),
  );
  for (const name of ["fake.jpg", "missing.jpg", "large.jpg"]) {
    await assert.rejects(
      resolveStoryMedia(
        { content: { wechat: [{ media: `asset:media/${name}` }] } },
        file,
      ),
    );
  }
});

test("media directory junctions cannot escape the story root", async (t) => {
  const { root, file } = await fixture(t);
  const outside = await fixture(t);
  await writeFile(join(outside.root, "escape.jpg"), jpeg);
  await rmdir(join(root, "media"));
  try {
    await symlink(
      outside.root,
      join(root, "media"),
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch (error) {
    if (["EPERM", "EACCES"].includes(error.code)) {
      t.skip("This environment cannot create directory links");
      return;
    }
    throw error;
  }
  await assert.rejects(
    resolveStoryMedia(
      { content: { wechat: [{ media: "asset:media/escape.jpg" }] } },
      file,
    ),
    /不能离开/,
  );
});
