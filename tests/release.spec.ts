import { test, expect } from "@playwright/test";
test("Taobao has premium orders with status filters and logistics", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  expect(
    work.data.taobao.filter((i: { folder: string }) => i.folder === "订单"),
  ).toHaveLength(23);
  const newOrders = work.data.taobao.filter(
    (i: { folder: string; id: string }) =>
      i.folder === "订单" && !/^taobao-order-\d+$/.test(i.id),
  );
  expect(newOrders).toHaveLength(9);
  for (const order of newOrders) {
    const bill = work.data.alipay.find(
      (i: { meta: Record<string, string> }) =>
        i.meta.taobaoOrderId === order.id,
    );
    expect(bill.time).toBe(order.time);
    expect(bill.meta.amount).toBe("-" + order.meta.price);
    expect(bill.meta.goods).toBe(order.title);
  }
  expect(
    work.data.taobao.some((i: { title: string }) =>
      /专业摄影机身|笔记本电脑|机械腕表|平板电脑|划船机|旅行箱套组/.test(
        i.title,
      ),
    ),
  ).toBe(false);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开淘宝", exact: true }).click();
  const app = page.locator(".taobao-ui");
  await expect(app.locator(".taobao-order")).toHaveCount(23);
  await expect(app.locator(".taobao-order").first()).toContainText(
    "Brunello Cucinelli 夹克外套",
  );
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/taobao-orders.png" });
  await app.getByRole("button", { name: "待收货", exact: true }).click();
  await expect(app.locator(".taobao-order")).toHaveCount(2);
  await app
    .locator(".catalog-tabs")
    .getByRole("button", { name: "物流", exact: true })
    .click();
  await expect(app.locator(".taobao-order")).toHaveCount(8);
  await expect(app.locator(".taobao-order").first()).toContainText("运输中");
  await app.locator(".taobao-order").first().click();
  await expect(page.locator(".app-screen:not([inert])")).toContainText(
    "HEAD 网球拍",
  );
});
test("Alipay shows authored luxury and daily bills with readable details", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.data.alipay).toHaveLength(35);
  expect(
    work.data.alipay.filter(
      (i: { meta: Record<string, string> }) => i.meta.category === "奢侈品",
    ),
  ).toHaveLength(8);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开支付宝", exact: true }).click();
  const app = page.locator(".alipay-ui");
  await expect(app.locator(".alipay-bill")).toHaveCount(29);
  const dior = app
    .locator(".alipay-bill")
    .filter({ hasText: "DIOR迪奥" })
    .first();
  await expect(dior).toContainText("-128,800.00");
  await expect(
    app
      .locator(".alipay-bill")
      .filter({ hasText: "VALENTINO华伦天奴" })
      .first(),
  ).toContainText("VALENTINO华伦天奴");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/alipay-bills.png" });
  await dior.click();
  await expect(page.locator(".app-screen:not([inert])")).toContainText(
    "皮具与成衣",
  );
  await expect(page.locator(".app-screen:not([inert])")).toContainText(
    "银行卡",
  );
  await page.getByRole("button", { name: "返回", exact: true }).click();
  await app
    .locator(".catalog-tabs")
    .getByRole("button", { name: "卡包", exact: true })
    .click();
  await expect(app.locator(".alipay-bank-card")).toHaveCount(6);
  await expect(app.locator('.alipay-bank-card[data-tier="gold"]')).toHaveCount(
    1,
  );
  await expect(app.locator('.alipay-bank-card[data-tier="black"]')).toHaveCount(
    1,
  );
  await expect(app.locator(".alipay-bank-card").first()).toContainText(
    "••••  ••••  ••••  8886",
  );
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/alipay-cards.png" });
});
test("Xiubo group has exactly three members and weather lists eight cities", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const group = work.data.wechat.find(
    (i: { id: string }) => i.id === "wechat-group-xiubo99",
  );
  expect(group.meta.members.split(",")).toHaveLength(3);
  const cities = [
    "北京市",
    "中国香港",
    "中国澳门",
    "广州",
    "永康",
    "曼谷",
    "清迈",
    "中山",
  ];
  expect(work.data.weather.map((i: { title: string }) => i.title)).toEqual(
    cities,
  );
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  const wx = page.locator(".wechat-ui");
  await wx.locator(".wx-chat-row").filter({ hasText: "修伯99" }).click();
  await expect(wx.locator(".wx-nav > strong")).toHaveText("修伯99 (3)");
  await expect(wx.locator(".skin-message")).toHaveCount(0);
  await wx.getByRole("button", { name: "聊天详情", exact: true }).click();
  await expect(wx.locator(".wx-group-member small")).toHaveText([
    "汉堡",
    "Matt",
    "Mingbo",
  ]);
  await expect(wx.locator(".wx-group-member")).toHaveCount(3);
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/group-xiubo99.png" });
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await page.getByRole("button", { name: "打开天气", exact: true }).click();
  const weather = page.locator(".calibrated-weather");
  await expect(weather.locator("h1")).toHaveText("北京市");
  await expect(weather.locator(".weather-native-current > small")).toHaveText(
    "当前位置",
  );
  await weather.getByRole("button", { name: "城市列表", exact: true }).click();
  await expect(weather.locator(".weather-city-row strong")).toHaveText(cities);
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/weather-cities.png" });
  for (const city of cities) {
    await weather
      .locator(".weather-city-row")
      .filter({ has: page.getByText(city, { exact: true }) })
      .click();
    await expect(weather.locator("h1")).toHaveText(city);
    await expect(
      weather.locator(".weather-native-current output"),
    ).not.toHaveText("—°");
    await weather
      .getByRole("button", { name: "城市列表", exact: true })
      .click();
  }
});
test("delivery orders preserve fixed dates and open item details", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const orders = work.data.delivery.filter(
    (i: { folder: string }) => i.folder === "订单",
  );
  expect(orders).toHaveLength(18);
  expect(
    orders.find((i: { sender: string }) => i.sender === "第一医药").time,
  ).toBe("2026-10-13 23:37");
  expect(
    orders.find((i: { time: string }) => i.time === "2026-10-12 18:22").title,
  ).toBe("麦辣鸡翅、双层吉士堡");
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开外卖", exact: true }).click();
  const app = page.locator(".delivery-ui");
  await expect(app.locator(".delivery-order")).toHaveCount(18);
  await expect(app.getByText("测试内容", { exact: true })).toHaveCount(0);
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/delivery-orders.png" });
  await app.getByPlaceholder("搜索商家或订单").fill("第一医药");
  await expect(app.locator(".delivery-order")).toHaveCount(1);
  await expect(app.locator(".delivery-order")).toContainText("避孕套、润滑液");
  await expect(app.locator(".delivery-order")).toContainText(
    "2026-10-13 23:37",
  );
  await app.getByRole("button", { name: "查看订单", exact: true }).click();
  await expect(page.locator(".app-screen:not([inert])")).toContainText(
    "避孕套、润滑液",
  );
});
test("Netease profile shares WeChat avatar and playlist has seventeen ordered songs", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const owner = work.data.wechat.find(
    (i: { id: string }) => i.id === "wechat-owner-profile",
  );
  const expected = [
    "和你有关这一生",
    "相依为命",
    "独家记忆",
    "Wonderful Tonight",
    "此生不换",
    "天下无双",
    "葡萄成熟时",
    "老派约会之必要",
    "爱久见人心",
    "千千阙歌",
    "永不失联的爱",
    "Yellow",
    "交叉线",
    "淤青",
    "星星都亮了",
    "我是一只鱼",
    "泪桥",
  ];
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page
    .getByRole("button", { name: "打开网易云音乐", exact: true })
    .click();
  const app = page.locator(".netease-ui");
  await app
    .locator(".netease-shelves button")
    .filter({ hasText: "和你有关这一生" })
    .click();
  await expect(app.locator(".netease-profile h2")).toHaveText("我真的是章明伯");
  await expect(app.locator(".netease-profile img")).toHaveAttribute(
    "src",
    owner.avatar,
  );
  await app
    .locator(".netease-profile img")
    .evaluate((el: HTMLImageElement) => el.decode());
  await expect(app.locator("h3")).toHaveText("和你有关这一生");
  await expect(app.locator(".netease-track strong")).toHaveText(expected);
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/netease-playlist.png" });
});
test("old saved desktop adopts removed apps without losing widgets", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const removed = [
    "tiktok",
    "telegram",
    "discord",
    "youtube",
    "line",
    "snapchat",
    "facebook",
    "messenger",
    "reddit",
    "netflix",
    "pinterest",
    "kakao",
    "qq",
    "bilibili",
    "forum",
    "whatsapp",
    "spotify",
  ];
  await page.addInitScript(
    ({ work }) => {
      const key = "foundphone-layout-v1:" + work.id;
      if (!localStorage.getItem(key))
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            workId: work.id,
            previewLayoutRevision: 1,
            apps: work.apps.map(
              (a: { installed: boolean; visible: boolean }) => ({
                ...a,
                installed: true,
                visible: true,
              }),
            ),
            widgets: [{ id: "widget-clock", type: "clock", size: "small" }],
            order: ["widget-clock", "wechat", "telegram"],
            cleared: [],
            positions: {},
          }),
        );
    },
    { work },
  );
  await page.setViewportSize({ width: 393, height: 852 });
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto("/");
    await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
    for (const n of "980705")
      await page
        .getByRole("button", { name: "密码键" + n, exact: true })
        .click();
    for (const id of removed)
      await expect(page.locator(`[data-home-key="${id}"]`)).toHaveCount(0);
    await expect(page.locator('[data-home-key="widget-clock"]')).toHaveCount(1);
    const saved = await page.evaluate(
      (id) => JSON.parse(localStorage.getItem("foundphone-layout-v1:" + id)!),
      work.id,
    );
    expect(
      saved.apps.filter((a: { installed: boolean }) => a.installed),
    ).toHaveLength(32);
    expect(saved.widgets).toHaveLength(1);
  }
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/migrated-desktop.png" });
});
test("Huan contact avatar and PDF dialogue preserve speakers, times and images", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const messages = work.data.wechat.filter((i: { id: string }) =>
    i.id.startsWith("wechat-huan-chat-"),
  );
  expect(messages).toHaveLength(63);
  expect(
    messages.filter((i: { outgoing: boolean }) => i.outgoing),
  ).toHaveLength(29);
  expect(
    messages.filter((i: { outgoing: boolean }) => !i.outgoing),
  ).toHaveLength(34);
  const avatar = work.data.wechat.find(
    (i: { id: string }) => i.id === "wechat-friend-1",
  ).avatar;
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  const wx = page.locator(".wechat-ui");
  const rowNames = await wx.locator(".wx-chat-row").allTextContents();
  const huanIndex = rowNames.findIndex((t) => t.includes("嬛嬛"));
  expect(huanIndex).toBeGreaterThan(-1);
  expect(rowNames[huanIndex + 1]).toContain("🍔");
  await wx.locator(".wx-chat-row").filter({ hasText: "嬛嬛" }).click();
  await expect(wx.locator(".skin-message")).toHaveCount(97);
  await expect(
    wx.locator(".skin-message:not(.outgoing) .skin-avatar img").first(),
  ).toHaveAttribute("src", avatar);
  await expect(wx.locator(".skin-date")).toHaveCount(9);
  await expect(wx.locator(".skin-date").first()).toHaveText(
    "9月9日 星期三 23:08",
  );
  await expect(wx.locator(".skin-date").last()).toHaveText(
    "9月29日 星期二 10:16",
  );
  await expect(wx.locator(".wx-transfer-card")).toHaveCount(2);
  await expect(wx.locator(".wx-transfer-main strong")).toHaveText([
    "¥88888.00",
    "¥88888.00",
  ]);
  await expect(wx.locator(".wx-transfer-main span")).toHaveText([
    "已被接收",
    "已收款",
  ]);
  for (const card of await wx.locator(".wx-transfer-bubble").all()) {
    await expect(card).toHaveCSS("background-color", "rgb(250, 208, 160)");
    await expect(card).toHaveCSS("padding", "0px");
    expect(
      await card.evaluate(
        (el) => getComputedStyle(el, ":before").backgroundColor,
      ),
    ).toBe("rgb(250, 208, 160)");
  }
  await wx.locator(".wx-transfer-card").first().scrollIntoViewIfNeeded();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/huan-transfer.png" });
  await expect(wx.locator(".skin-message").last()).toContainText("震撼首发");
  const images = wx.locator(".skin-bubble > img");
  await expect(images).toHaveCount(6);
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((el: HTMLImageElement) => el.decode());
  }
  await wx.locator(".skin-message").first().scrollIntoViewIfNeeded();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/huan-dialogue.png" });
  await wx.getByRole("button", { name: "返回", exact: true }).click();
  await wx.getByRole("button", { name: "通讯录", exact: true }).click();
  await wx.locator(".wx-contact").filter({ hasText: "嬛嬛" }).click();
  await expect(wx.locator(".wx-contact-profile img")).toHaveAttribute(
    "src",
    avatar,
  );
});
test("heart album hides photos until password and relocks when closed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开相册", exact: true }).click();
  const gallery = page.locator(".native-photos");
  await expect(gallery.locator(".photo-mosaic img")).toHaveCount(35);
  await gallery.getByRole("button", { name: "相簿", exact: true }).click();
  const card = gallery
    .locator(".album-grid button")
    .filter({ has: page.getByText("💓", { exact: true }) });
  await expect(card.locator("img")).toHaveCount(0);
  await card.click();
  await expect(gallery.locator(".photo-mosaic img")).toHaveCount(0);
  await gallery.getByLabel("相簿密码").fill("0000");
  await gallery.getByRole("button", { name: "解锁相簿", exact: true }).click();
  await expect(gallery.getByRole("alert")).toHaveText("密码不正确");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/heart-locked.png" });
  await gallery.getByLabel("相簿密码").fill("1031");
  await gallery.getByRole("button", { name: "解锁相簿", exact: true }).click();
  await expect(gallery.locator(".photo-mosaic img")).toHaveCount(9);
  for (const photo of await gallery.locator(".photo-mosaic img").all()) {
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate((img: HTMLImageElement) => img.decode());
  }
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/heart-album.png" });
  await gallery.getByRole("button", { name: "查看💓 01", exact: true }).click();
  await page
    .locator(".native-photo-stage img")
    .evaluate((img: HTMLImageElement) => img.decode());
  await page.getByRole("button", { name: "返回", exact: true }).click();
  await gallery.getByRole("button", { name: "锁定相簿", exact: true }).click();
  await expect(gallery.getByLabel("相簿密码")).toBeVisible();
  await expect(gallery.locator(".photo-mosaic img")).toHaveCount(0);
  await gallery.getByRole("button", { name: "返回", exact: true }).click();
  await card.click();
  await expect(gallery.getByLabel("相簿密码")).toBeVisible();
});
test("photo library contains all 35 supplied photos in order and opens the album and full image", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const photos = work.data.photos.filter((i: { id: string }) =>
    i.id.startsWith("album-20261030-"),
  );
  expect(photos).toHaveLength(35);
  expect(
    photos.map((i: { meta: Record<string, string> }) => Number(i.meta.order)),
  ).toEqual(Array.from({ length: 35 }, (_, n) => n + 1));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开相册", exact: true }).click();
  const gallery = page.locator(".native-photos");
  await expect(gallery.locator(".photo-mosaic img")).toHaveCount(35);
  for (const photo of await gallery.locator(".photo-mosaic img").all()) {
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate((img: HTMLImageElement) => img.decode());
    expect(
      await photo.evaluate((img: HTMLImageElement) => img.naturalWidth > 0),
    ).toBe(true);
  }
  await gallery.getByRole("button", { name: "相簿", exact: true }).click();
  await gallery
    .locator(".album-grid button")
    .filter({ has: page.getByText("生活相册", { exact: true }) })
    .click();
  await expect(gallery.locator(".photo-mosaic button")).toHaveCount(35);
  await gallery
    .getByRole("button", { name: "查看照片 01", exact: true })
    .click();
  const full = page.locator(".native-photo-stage img");
  await expect(full).toHaveAttribute("src", photos[0].media);
  await full.evaluate((img: HTMLImageElement) => img.decode());
  await expect(full).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/album-photo.png" });
  await page.getByRole("button", { name: "返回", exact: true }).click();
  await gallery
    .locator(".photo-mosaic button")
    .first()
    .scrollIntoViewIfNeeded();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/album-grid.png" });
});
test("phone shares contacts and own card, separates missed calls, and service SMS opens by sender", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.data.phone).toHaveLength(12);
  expect(work.data.contacts.every((i: { body: string }) => i.body === "")).toBe(
    true,
  );
  expect(
    work.data.phone.filter(
      (i: { meta: Record<string, string> }) => i.meta.status === "未接",
    ),
  ).toHaveLength(5);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const d of "980705")
    await page.getByRole("button", { name: "密码键" + d, exact: true }).click();
  await page.getByRole("button", { name: "打开电话", exact: true }).click();
  const phone = page.locator(".native-phone");
  await expect(phone.locator(".call-row")).toHaveCount(12);
  await expect(phone.locator(".call-row").first()).toContainText("顺丰快递 李");
  await expect(phone.locator(".call-row.missed")).toHaveCount(5);
  await expect(
    phone.locator(".call-row.missed").filter({ hasText: "贷款营销" }),
  ).toContainText("未接");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/recent-calls.png" });
  await phone.getByRole("button", { name: "通讯录", exact: true }).click();
  const rows = phone.locator(".catalog-row");
  await expect(rows).toHaveCount(15);
  await expect(phone.locator(".call-row")).toHaveCount(0);
  await phone.locator(".contact-self").click();
  await expect(page.locator(".native-contact-hero h1")).toHaveText("Mingbo");
  await expect(page.locator(".native-detail-group .native-blue")).toHaveText(
    "+86 199 0000 0705",
  );
  await page.getByRole("button", { name: "返回", exact: true }).click();
  const mother = work.data.contacts.find(
    (i: { title: string }) => i.title === "妈妈",
  );
  await phone
    .getByRole("textbox", { name: "搜索", exact: true })
    .fill(mother.meta.phone);
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("妈妈");
  await rows.click();
  await expect(page.locator(".native-detail-group .native-blue")).toHaveText(
    mother.meta.phone,
  );
  await expect(
    page.locator(".native-detail-group").getByText("备注", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await page.getByRole("button", { name: "打开信息", exact: true }).click();
  const sms = page.locator(".native-messages");
  await expect(sms.locator(".catalog-chat")).toHaveCount(7);
  await sms.getByRole("button", { name: "未读", exact: true }).click();
  await expect(sms.locator(".catalog-chat")).toHaveCount(1);
  await sms.getByRole("button", { name: "全部", exact: true }).click();
  await sms
    .locator(".catalog-chat")
    .filter({ has: page.getByText("顺丰速运", { exact: true }) })
    .click();
  await expect(sms.locator(".catalog-message")).toHaveCount(2);
  await expect(sms.locator(".catalog-message").last()).toContainText(
    "取件码 07-0528",
  );
  for (const [sender, text] of [
    ["菜鸟驿站", "快递已放在家门口"],
    ["淘宝闪购", "【淘宝闪购】"],
    ["DIOR迪奥", "秋日会员礼遇"],
    ["巴黎世家", "新季精选"],
    ["LOUIS VUITTON", "秋日精选礼遇"],
  ]) {
    await sms.getByRole("button", { name: "返回", exact: true }).click();
    await sms
      .locator(".catalog-chat")
      .filter({ has: page.getByText(sender, { exact: true }) })
      .click();
    await expect(sms.locator(".catalog-bubbles")).toContainText(text);
  }
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/service-sms.png" });
});
test("published default matches full test preview, four dock apps and updated status bar", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const preview = await (await request.get("/test-work.json")).json();
  expect(work.id).toBe("ui-test-phone-v2");
  expect(work.phone.passcode).toBe("980705");
  expect(work.phone.wallpaper).toBe("custom-photo");
  const removed = [
    "tiktok",
    "telegram",
    "discord",
    "youtube",
    "line",
    "snapchat",
    "facebook",
    "messenger",
    "reddit",
    "netflix",
    "pinterest",
    "kakao",
    "qq",
    "bilibili",
    "forum",
    "whatsapp",
    "spotify",
  ];
  expect(
    work.apps.filter((a: { installed: boolean }) => a.installed),
  ).toHaveLength(32);
  for (const id of removed) {
    expect(work.apps.find((a: { id: string }) => a.id === id).installed).toBe(
      false,
    );
    expect(work.data[id] || []).toEqual([]);
  }
  for (const id of ["photos", "wechat", "phone", "contacts", "messages"]) {
    expect(
      work.data[id].some(
        (i: { id: string; title: string }) =>
          i.id.startsWith("test-") || i.title.includes("测试"),
      ),
    ).toBe(false);
  }
  expect(work.data.photos).toHaveLength(44);
  expect(
    work.data.contacts.filter((i: { id: string }) =>
      i.id.startsWith("phone-person-"),
    ),
  ).toHaveLength(15);
  for (const id of ["notes", "calendar", "mail", "music", "douyin"]) {
    if (id !== "douyin") expect(work.data[id]).toEqual(preview.data[id]);
  }
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
  for (const id of removed)
    await expect(page.locator(`[data-home-key="${id}"]`)).toHaveCount(0);
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

test("July 5 birthday Moments shows its photo, all authored friends and exact replies", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const items = work.data.wechat;
  const post = items.find(
    (i: { id: string }) => i.id === "wechat-birthday-20260705",
  );
  expect(post.time).toBe("2026-07-05 00:00");
  expect(post.body).toBe("🎂");
  expect(post.likes).toBe(49);
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
  await expect(card.locator("small")).toHaveText("2026年7月5日 00:00");
  const photo = card.locator(".wx-moment-photo img");
  await photo.scrollIntoViewIfNeeded();
  await photo.evaluate((img: HTMLImageElement) => img.decode());
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
  expect(likerIds).toHaveLength(49);
  expect(new Set(likerIds)).toEqual(
    new Set(
      items
        .filter(
          (i: { meta: Record<string, string> }) => i.meta.contact === "true",
        )
        .map((i: { id: string }) => i.id),
    ),
  );
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

test("exclusive memory has three ordered photos, exact timestamp, like order and replies", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  const photos = work.data.wechat
    .filter(
      (i: { meta: Record<string, string> }) =>
        i.meta.momentId === "wechat-memory-20260706",
    )
    .sort(
      (
        a: { meta: Record<string, string> },
        b: { meta: Record<string, string> },
      ) => Number(a.meta.order) - Number(b.meta.order),
    );
  const post = work.data.wechat.find(
    (i: { id: string }) => i.id === "wechat-memory-20260706",
  );
  expect(post.time).toBe("2026-07-06 15:20");
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
  for (const n of "980705")
    await page.getByRole("button", { name: "密码键" + n, exact: true }).click();
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  const wx = page.locator(".wechat-ui");
  await expect(
    wx.locator(".wx-chat-row").filter({ hasText: "独家记忆" }),
  ).toHaveCount(0);
  await wx.getByRole("button", { name: "我", exact: true }).click();
  await wx
    .locator(".wx-profile-menu")
    .getByRole("button", { name: /朋友圈/ })
    .click();
  const card = wx.locator('[data-post-id="wechat-memory-20260706"]');
  await expect(wx.locator(".wx-moment-post").first()).toHaveAttribute(
    "data-post-id",
    "wechat-trip-20260811",
  );
  await expect(card.locator(".wx-moment-caption")).toHaveText("独家记忆");
  await expect(card.locator("small")).toHaveText("2026年7月6日 15:20");
  await expect(card.locator(".wx-moment-gallery img")).toHaveCount(3);
  const sources = [
    post.media,
    ...photos.map((p: { media: string }) => p.media),
  ];
  for (let n = 0; n < 3; n++) {
    const photo = card.locator(".wx-moment-gallery img").nth(n);
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate((img: HTMLImageElement) => img.decode());
    await expect(photo).toHaveAttribute("src", sources[n]);
    expect(
      await photo.evaluate(
        (i: HTMLImageElement) => i.complete && i.naturalWidth > 0,
      ),
    ).toBe(true);
  }
  await expect(card.getByLabel("点赞名单")).toContainText(
    "妈妈，Matt💙，🍔，爸爸，安子，大周，Dior 许",
  );
  await expect(card.getByLabel("点赞名单")).toContainText("陆li");
  await expect(card.locator(".wx-moment-comment")).toHaveText([
    "妈妈：圆满完成！",
    "Mingbo 回复 妈妈：开心！",
    "Matt💙：Don't be shy.",
    "Mingbo 回复 Matt💙：人老实话不多",
  ]);
  await card
    .getByRole("button", { name: "查看朋友圈配图2", exact: true })
    .click();
  await expect(page.locator(".detail-content img")).toHaveAttribute(
    "src",
    sources[1],
  );
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
  await expect(wx.locator(".skin-message")).toHaveCount(288);
  const voice = wx.locator('[data-message-id="wechat-matt-oct-034"]');
  await expect(
    voice.getByRole("button", { name: "语音消息6秒", exact: true }),
  ).toBeVisible();
  await expect(voice.locator(".wx-voice-bar")).toContainText("6″");
  await expect(voice.locator(".wx-voice-transcript")).toHaveText(
    "等你回来看看我虚不虚。",
  );
  await voice.scrollIntoViewIfNeeded();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/matt-voice.png" });
  await expect(wx.locator(".skin-message.outgoing")).toHaveCount(172);
  await expect(wx.locator(".skin-message:not(.outgoing)")).toHaveCount(116);
  await expect(wx.locator(".skin-date")).toHaveCount(35);
  await expect(
    wx.locator('[data-message-id="wechat-matt-more-018"]'),
  ).toContainText("视频通话13:48");
  await expect(wx.locator(".skin-message").last()).toContainText("………………..");
  await expect(wx.locator(".skin-date").first()).toHaveText(
    "8月27日 星期四 16:20",
  );
  await expect(wx.locator(".skin-date").last()).toHaveText(
    "10月15日 星期四 23:00",
  );
  await expect(wx.locator(".skin-message").first()).toHaveClass(/outgoing/);
  await expect(
    wx.locator(".wx-time-label").filter({ hasText: "9月11日 星期五 13:50" }),
  ).toHaveCount(1);
  await expect(
    wx.locator('[data-message-id="wechat-matt-chat-014"] .skin-bubble'),
  ).toContainText("山鸡哥，我想喝奶茶！");
  await expect(
    wx.locator('[data-message-id="wechat-matt-chat-014-line-2"] .skin-bubble'),
  ).toContainText("隆延茶铺吧");
  await expect(
    wx.locator('[data-message-id="wechat-matt-chat-014-line-3"] .skin-bubble'),
  ).toContainText("山谷黄杏 冰 三分糖");
  expect(
    await wx
      .locator(".skin-bubble")
      .evaluateAll((els) =>
        els.every((el) => !el.childNodes[0]?.textContent?.includes("\n")),
      ),
  ).toBe(true);
  await expect(
    wx.locator('[data-message-id="wechat-matt-chat-083"]'),
  ).toContainText("咋呢");
  await expect(
    wx.locator(".skin-message:not(.outgoing) .skin-avatar img").first(),
  ).toHaveAttribute("src", avatarSource || "");
  await expect(wx.getByText("通话时长02:48:52", { exact: false })).toHaveCount(
    1,
  );
  const photos = wx.locator(".skin-bubble > img");
  await expect(photos).toHaveCount(17);
  const imageBubble = wx.locator(".skin-image-bubble").first();
  await expect(imageBubble).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(imageBubble).toHaveCSS("padding", "0px");
  for (const photo of await photos.all()) {
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate((img: HTMLImageElement) => img.decode());
    expect(
      await photo.evaluate((img: HTMLImageElement) => img.naturalWidth > 0),
    ).toBe(true);
  }
  await wx.locator(".skin-message").first().scrollIntoViewIfNeeded();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "outputs/release/matt-dialogue.png" });
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