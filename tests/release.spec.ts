import { test, expect } from "@playwright/test";
test("published default matches full test preview, four dock apps and updated status bar", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const preview = await (await request.get("/test-work.json")).json();
  expect(work.id).toBe("ui-test-phone-v2");
  expect(work.phone.passcode).toBe("980705");
  expect(work.phone.wallpaper).toBe("custom-photo");
  expect(work.apps).toEqual(preview.apps);
  expect({
    ...work.data,
    douyin: work.data.douyin.filter(
      (i: { meta: Record<string, string> }) => i.meta.profile !== "true",
    ),
    wechat: work.data.wechat.filter(
      (i: { meta: Record<string, string>; folder: string }) =>
        i.meta.profile !== "true" &&
        i.meta.contact !== "true" &&
        i.folder !== "朋友圈",
    ),
  }).toEqual(preview.data);
  expect(
    work.apps.filter((a: { installed: boolean }) => a.installed),
  ).toHaveLength(49);
  expect(work.nodes).toHaveLength(0);
  expect(
    work.apps.filter(
      (a: { installed: boolean; dock: boolean }) => a.installed && a.dock,
    ),
  ).toHaveLength(4);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁" }).waitFor();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/lock.png" });
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await expect(page.locator(".passcode-dots i")).toHaveCount(6);
  for (const digit of "000000")
    await page
      .getByRole("button", { name: "密码键" + digit, exact: true })
      .click();
  await expect(page.getByText("密码不正确", { exact: true })).toBeVisible();
  await expect(page.locator(".lock-screen")).toHaveCount(1);
  for (const digit of "980705")
    await page
      .getByRole("button", { name: "密码键" + digit, exact: true })
      .click();
  await expect(page.locator(".lock-screen")).toHaveCount(0);
  await expect(page.locator(".interactive-home")).toHaveCSS("opacity", "1");
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(4);
  await expect(page.locator(".status-silent")).toBeVisible();
  await expect(page.locator(".status-cellular")).toBeVisible();
  await expect(page.locator(".status-wifi")).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/home.png" });
  await page
    .locator(".status-bar")
    .screenshot({ path: "outputs/release/status-bar.png" });
  await page
    .getByRole("button", { name: "打开App Store", exact: true })
    .click();
  await page.getByPlaceholder("搜索全部App").fill("X");
  const x = page.locator(".runtime-library-row").filter({
    has: page.locator(".library-app-title strong", { hasText: /^X$/ }),
  });
  await expect(x.locator("[data-original-icon=twitter] img")).toHaveAttribute(
    "src",
    /twitter\.svg$/,
  );
  await x.getByRole("button", { name: "打开", exact: true }).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await page
    .getByRole("button", { name: "打开App Store", exact: true })
    .click();
  await page.getByPlaceholder("搜索全部App").fill("设置");
  await page
    .locator(".runtime-library-row")
    .getByRole("button", { name: "打开", exact: true })
    .click();
  await expect(page.getByRole("switch", { name: "飞行模式" })).toBeVisible();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/settings.png" });
  await page.reload();
  await page.getByRole("button", { name: "轻触解锁" }).click();
  for (const digit of "980705")
    await page
      .getByRole("button", { name: "密码键" + digit, exact: true })
      .click();
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("renamed friends stay linked to birthday likes and Douyin displays its public account snapshot", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const wxItems = work.data.wechat;
  const expected = [
    ["wechat-linyuan-profile", "安子"],
    ["wechat-zhouyu-profile", "大周"],
    ["wechat-xuzhixia-profile", "Dior 许"],
  ];
  const birthday = wxItems.find(
    (i: { id: string }) => i.id === "wechat-birthday-20260705",
  );
  for (const [id, title] of expected) {
    expect(wxItems.find((i: { id: string }) => i.id === id).title).toBe(title);
    expect(JSON.parse(birthday.meta.likeContactIds)).toContain(id);
  }
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开抖音", exact: true }).click();
  const dy = page.locator(".douyin-ui");
  await expect(dy.locator(".douyin-profile")).toHaveCount(0);
  await dy
    .locator(".catalog-tabs")
    .getByRole("button", { name: "我", exact: true })
    .click();
  await expect(dy.locator(".douyin-profile h1")).toHaveText("章明伯");
  await expect(
    dy.getByText("抖音号：Mingbo619", { exact: true }),
  ).toBeVisible();
  await expect(dy.locator(".douyin-profile-stats")).toContainText("257.0万");
  await expect(dy.locator(".douyin-profile-stats")).toContainText("16.1万");
  const avatar = dy.locator(".douyin-profile-heading img");
  expect(
    await avatar.evaluate(
      (i: HTMLImageElement) => i.complete && i.naturalWidth > 0,
    ),
  ).toBe(true);
  const link = dy.getByRole("link", { name: "在抖音查看主页", exact: true });
  await expect(link).toHaveAttribute(
    "href",
    /^https:\/\/www\.douyin\.com\/user\//,
  );
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    dy.getByText("作品暂未导入，可前往抖音查看。", { exact: true }),
  ).toBeVisible();
  await dy
    .locator(".catalog-tabs")
    .getByRole("button", { name: "推荐", exact: true })
    .click();
  await expect(dy.locator(".vertical-video")).toHaveCount(
    work.data.douyin.filter(
      (i: { meta: Record<string, string> }) => i.meta.profile !== "true",
    ).length,
  );
});

test("July 5 birthday Moments shows its photo, seven friends and exact replies", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const items = work.data.wechat;
  const post = items.find(
    (i: { id: string }) => i.id === "wechat-birthday-20260705",
  );
  expect(post.time).toBe("2026-07-05");
  expect(post.body).toBe("🎂");
  expect(post.likes).toBe(7);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  const wx = page.locator(".wechat-ui");
  await wx.getByRole("button", { name: "我", exact: true }).click();
  await wx
    .locator(".wx-profile-menu")
    .getByRole("button", { name: /朋友圈/ })
    .click();
  const card = wx.locator('[data-post-id="wechat-birthday-20260705"]');
  await expect(card.locator(".wx-moment-caption")).toHaveText("🎂");
  await expect(card.locator("small")).toHaveText("2026年7月5日");
  const photo = card.locator(".wx-moment-photo img");
  await photo.scrollIntoViewIfNeeded();
  await expect(photo).toHaveAttribute("src", post.media);
  expect(
    await photo.evaluate(
      (i: HTMLImageElement) => i.complete && i.naturalWidth > 0,
    ),
  ).toBe(true);
  const owner = items.find(
    (i: { id: string }) => i.id === "wechat-owner-profile",
  );
  await expect(card.locator(".skin-avatar img")).toHaveAttribute(
    "src",
    owner.avatar,
  );
  await expect(wx.getByAltText("朋友圈背景")).toHaveAttribute(
    "src",
    owner.media,
  );
  const likerIds = JSON.parse(post.meta.likeContactIds);
  expect(likerIds).toHaveLength(7);
  for (const id of likerIds) {
    const contact = items.find((i: { id: string }) => i.id === id);
    expect(contact.meta.contact).toBe("true");
    await expect(card.getByLabel("点赞名单")).toContainText(contact.title);
  }
  await expect(card.locator(".wx-moment-comment")).toHaveText([
    "妈妈：生日快乐，宝贝！",
    "Mingbo 回复 妈妈：谢谢妈妈带我来这个世界！",
    "爸爸：生日快乐，儿子。",
    "Mingbo 回复 爸爸：谢谢爸！",
    "Matt💙：陪你過的第一個生日。",
    "Mingbo 回复 Matt💙：以后还有很多个呢",
  ]);
});

test("Matt is pinned, has a separate nickname and shares Mingbo's Moments cover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const digit of "980705")
    await page
      .getByRole("button", { name: "密码键" + digit, exact: true })
      .click();
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  const wx = page.locator(".wechat-ui");
  const pinned = wx.locator(".wx-chat-row").first();
  await expect(pinned).toHaveAttribute("data-pinned", "true");
  await expect(pinned.locator("strong")).toHaveText("Matt💙");
  const avatarSource = await pinned.locator("img").getAttribute("src");
  expect(
    await pinned
      .locator("img")
      .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
  ).toBe(true);
  await pinned.click();
  await expect(wx.locator(".skin-message")).toHaveCount(0);
  await wx.getByRole("button", { name: "聊天详情", exact: true }).click();
  await wx
    .getByRole("button", { name: "查看Matt💙的资料", exact: true })
    .click();
  await expect(wx.locator(".wx-contact-profile h2")).toHaveText("Matt💙");
  await expect(
    wx.getByText("昵称：Matthew Han", { exact: true }),
  ).toBeVisible();
  await expect(wx.locator(".wx-contact-profile img")).toHaveAttribute(
    "src",
    avatarSource || "",
  );
  await wx.getByRole("button", { name: /朋友圈/ }).click();
  await expect(wx.locator(".wx-moment-owner strong")).toHaveText("Matthew Han");
  const coverSource = await wx.getByAltText("朋友圈背景").getAttribute("src");
  expect(
    await wx
      .getByAltText("朋友圈背景")
      .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
  ).toBe(true);
  await wx.getByRole("button", { name: "返回", exact: true }).click();
  await wx.getByRole("button", { name: "发消息", exact: true }).click();
  await wx.getByRole("button", { name: "返回", exact: true }).click();
  await wx.getByRole("button", { name: "通讯录", exact: true }).click();
  await wx.locator(".wx-contact").filter({ hasText: "Matt💙" }).click();
  await expect(
    wx.getByText("昵称：Matthew Han", { exact: true }),
  ).toBeVisible();
  await wx.getByRole("button", { name: "返回", exact: true }).click();
  await wx.getByRole("button", { name: "我", exact: true }).click();
  await wx
    .locator(".wx-profile-menu")
    .getByRole("button", { name: /朋友圈/ })
    .click();
  await expect(wx.getByAltText("朋友圈背景")).toHaveAttribute(
    "src",
    coverSource || "",
  );
});

test("WeChat personal profile and Moments use authored images without leaking into chats", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const digit of "980705")
    await page
      .getByRole("button", { name: "密码键" + digit, exact: true })
      .click();
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  const wechat = page.locator(".wechat-ui");
  await expect(wechat.getByText("Mingbo", { exact: true })).toHaveCount(0);
  await wechat.getByRole("button", { name: "我", exact: true }).click();
  await expect(wechat.locator(".wx-profile h2")).toHaveText("Mingbo");
  await expect(wechat.locator(".wx-profile small")).toHaveText(
    "微信号：Rick0705",
  );
  const avatar = wechat.locator(".wx-profile img");
  const avatarSource = await avatar.getAttribute("src");
  await expect(avatar).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
  expect(
    await avatar.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
    ),
  ).toBe(true);
  await wechat
    .locator(".wx-profile-menu")
    .getByRole("button", { name: /朋友圈/ })
    .click();
  const cover = wechat.getByAltText("朋友圈背景");
  await expect(cover).toBeVisible();
  expect(
    await cover.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
    ),
  ).toBe(true);
  await expect(wechat.locator(".wx-moment-owner strong")).toHaveText("Mingbo");
  await expect(wechat.locator(".wx-moment-owner img")).toHaveAttribute(
    "src",
    avatarSource || "",
  );
});
