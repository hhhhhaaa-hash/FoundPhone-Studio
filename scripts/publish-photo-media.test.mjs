import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { publishPhotoMedia } from "./publish-photo-media.mjs";

test("gallery images publish as deterministic local files without changing messages or input", async () => {
  const dir = await mkdtemp(join(tmpdir(), "foundphone-gallery-"));
  try {
    const media = "data:image/jpeg;base64,/9j/4AAA";
    const work = {
      data: {
        photos: [{ media }, { media }, { media: "" }],
        wechat: [{ media }],
      },
    };
    const a = await publishPhotoMedia(work, dir);
    const b = await publishPhotoMedia(work, dir);
    assert.deepEqual(a, b);
    assert.equal(work.data.photos[0].media, media);
    assert.equal(a.data.wechat[0].media, media);
    assert.match(
      a.data.photos[0].media,
      /^\.\/story-media\/[a-f0-9]{64}\.jpg$/,
    );
    assert.equal(a.data.photos[0].media, a.data.photos[1].media);
    assert.equal((await readdir(join(dir, "story-media"))).length, 1);
    assert.deepEqual(
      await readFile(join(dir, a.data.photos[0].media)),
      Buffer.from("/9j/4AAA", "base64"),
    );
  } finally {
    assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
    assert.ok(basename(dir).startsWith("foundphone-gallery-"));
    await rm(dir, { recursive: true, force: true });
  }
});
