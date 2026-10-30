import { expect, it } from "vitest";
import { safeMedia } from "./schema";

it("allows only generated hash-named local gallery paths, never arbitrary URLs or traversal", () => {
  const hash = "a".repeat(64);
  const local = `./story-media/${hash}.jpg`;
  expect(safeMedia(local)).toBe(local);
  for (const bad of [
    `https://example.com/story-media/${hash}.jpg`,
    `//example.com/story-media/${hash}.jpg`,
    `./story-media/../${hash}.jpg`,
    `./story-media/%2e%2e/${hash}.jpg`,
    `./story-media/${hash}.svg`,
    `./story-media/${hash}.jpg?script=1`,
    "./story-media/private.jpg",
  ])
    expect(safeMedia(bad)).toBe("");
});
