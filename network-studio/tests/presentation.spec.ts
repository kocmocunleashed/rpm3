import { expect, test } from "@playwright/test";
const slideIds = [
  "intro",
  "scale",
  "hardware",
  "media",
  "routing",
  "dns",
  "packets",
  "speed",
  "security",
  "recap",
];

test("all ten screens fit the desktop and support direct chapter navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#intro");
  for (let i = 0; i < slideIds.length; i++) {
    await page.locator(".chapter-progress button").nth(i).click();
    await expect(page).toHaveURL(new RegExp(`#${slideIds[i]}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".experiment-stage")).toBeVisible();
    expect(
      await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      })),
    ).toEqual({ width: 1366, height: 768 });
  }
  expect(errors).toEqual([]);
});

test("native dialogs keep focus, escape closes, PDF sources load", async ({
  page,
}) => {
  await page.goto("/#dns");
  await page
    .getByRole("button", { name: "Тайлбар ба баримтууд", exact: true })
    .click();
  const notes = page.getByRole("dialog");
  await expect(notes).toBeVisible();
  await expect(
    notes.getByRole("button", { name: "Цонхыг хаах", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(
    await notes.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(notes).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Тайлбар ба баримтууд", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Эх сурвалжууд", exact: true })
    .click();
  await expect(page.locator(".source-list a")).toHaveCount(20);
  const pdf = await page.request.get("/source.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("pdf");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Бүх бүлэг", exact: true }).click();
  await page.locator(".chapter-menu button").nth(7).click();
  await expect(page).toHaveURL(/#speed$/);
});

test("Spotify returns audio chunks before playback and preserves a paused journey", async ({
  page,
}) => {
  await page.goto("/#intro");
  await expect(page.locator(".music-buffer .received")).toHaveCount(0);
  await page.getByRole("button", { name: "Play дарах", exact: true }).click();
  await expect(page.locator(".demo-status-line")).toContainText("гэрийн Wi-Fi");
  await page.getByRole("button", { name: "Түр зогсоох", exact: true }).click();
  const pausedStatus = await page.locator(".demo-status-line").textContent();
  await page.waitForTimeout(2600);
  await expect(page.locator(".demo-status-line")).toHaveText(pausedStatus!);
  await expect(page.locator(".music-buffer .received")).toHaveCount(0);
  await page.getByRole("button", { name: "Үргэлжлүүлэх", exact: true }).click();
  await expect(page.locator(".demo-status-line")).toContainText("CDN-д хүрнэ");
  await expect(page.locator(".demo-status-line")).toContainText(
    "эхний хэсгүүд ирж",
  );
  await expect(page.locator(".music-buffer .received")).toHaveCount(0);
  await expect(page.locator(".demo-status-line")).toContainText(
    "дараагийн хэсгүүд ирсээр",
  );
  await expect(page.locator(".music-buffer .received")).toHaveCount(4);
  await expect(page.locator(".music-buffer .buffer-blocks i")).toHaveCount(8);
  await expect(page.locator(".music-buffer")).toContainText("Тоглож байна");
  await page.getByRole("button", { name: "Түр зогсоох", exact: true }).click();
  await expect(page.locator(".music-buffer")).not.toContainText("Тоглож байна");
  await expect(page.locator(".music-buffer .received")).toHaveCount(4);
  await page.getByRole("button", { name: "Үргэлжлүүлэх", exact: true }).click();
  await expect(page.locator(".music-buffer")).toContainText("Тоглож байна");
  await page
    .getByRole("button", { name: "Аяллыг эхнээс нь", exact: true })
    .click();
  await expect(page.locator(".music-buffer .received")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Play дарах", exact: true }),
  ).toBeVisible();
});

test("LAN clients share server updates while the internet is disconnected", async ({
  page,
}) => {
  await page.goto("/#scale");
  await page
    .getByRole("button", { name: "Интернэт салгах", exact: true })
    .click();
  await expect(page.locator(".lan-proof")).toContainText("Интернэт салсан ч");
  await expect(page.locator(".traffic-pill")).toHaveText(
    "Тоглолтын WAN өгөгдөл: 0",
  );
  const positions = page.locator(".lan-state output");
  await expect(positions).toHaveText(["—", "—", "—"]);
  await page
    .getByRole("button", { name: "Тоглолтод нэгдэх", exact: true })
    .click();
  await expect(page.locator(".demo-status-line")).toContainText(
    "свичээр серверт",
  );
  await expect(
    page.getByRole("button", { name: "Өгөгдөл солилцож байна", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".demo-status-line")).toContainText(
    "эхний төлөвийг хоёр клиентэд буцаана",
  );
  await expect(positions).toHaveText(["A", "—", "—"]);
  await expect(positions).toHaveText(["A", "A", "A"]);
  await page
    .getByRole("button", { name: "Тоглогч 1-ийг хөдөлгөх", exact: true })
    .click();
  await expect(page.locator(".demo-status-line")).toContainText(
    "оролт серверт очиж байна",
  );
  await expect(positions).toHaveText(["A", "A", "A"]);
  await expect(page.locator(".demo-status-line")).toContainText(
    "шинэ төлөвийг хоёр тоглогчид тарааж байна",
  );
  await expect(positions).toHaveText(["B", "A", "A"]);
  await expect(page.locator(".demo-status-line")).toContainText(
    "Хоёр дэлгэцэд ижил шинэ байрлал",
  );
  await expect(positions).toHaveText(["B", "B", "B"]);
  await expect(page.locator(".traffic-pill")).toHaveText(
    "Тоглолтын WAN өгөгдөл: 0",
  );
  await expect(
    page.getByRole("button", { name: "Интернэт салгасан", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("router geometry responds under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#hardware");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
  const slider = page.getByRole("slider", {
    name: "Давхаргыг салгах",
    exact: true,
  });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");
  await page.waitForTimeout(180);
  const closed = await page.locator("canvas").screenshot();
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("1");
  await page.waitForTimeout(180);
  const open = await page.locator("canvas").screenshot();
  expect(closed.equals(open)).toBe(false);
  await page.getByRole("button", { name: "Радио хэсэг", exact: true }).click();
  await expect(page.locator(".demo-status-line")).toContainText(
    "хандалтын цэгийн",
  );
  // Choosing the last part also selects the final guided cue.
  await expect(page.getByTestId("presentation-cue")).toHaveAttribute(
    "data-step",
    "5",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#media$/);
  await expect(page.getByTestId("presentation-cue")).toHaveAttribute(
    "data-step",
    "0",
  );
});

test("media selections show distinct models, controllable signals, and two-way Wi-Fi", async ({
  page,
}) => {
  await page.goto("/#media");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
  const copper = await page.locator("canvas").screenshot();
  await page.getByRole("button", { name: "Шилэн кабель", exact: true }).click();
  await expect(page.locator(".demo-status-line")).toContainText(
    "гэрлийн дохио",
  );
  const fiber = await page.locator("canvas").screenshot();
  expect(copper.equals(fiber)).toBe(false);
  await page
    .getByRole("button", { name: "Дохиог ажиглах", exact: true })
    .click();
  await page.waitForTimeout(400);
  const signalA = await page.locator("canvas").screenshot();
  await page.waitForTimeout(400);
  const signalB = await page.locator("canvas").screenshot();
  expect(signalA.equals(signalB)).toBe(false);
  await page.getByRole("button", { name: "Зогсоох", exact: true }).click();
  await page.waitForTimeout(300);
  const stoppedA = await page.locator("canvas").screenshot();
  await page.waitForTimeout(400);
  const stoppedB = await page.locator("canvas").screenshot();
  expect(stoppedA.equals(stoppedB)).toBe(true);
  await page.getByRole("button", { name: "Wi-Fi", exact: true }).click();
  await expect(page.locator(".demo-status-line")).toContainText("радио дохио");
  await expect(
    page.getByRole("slider", { name: "Кабелийг задлах", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Хүсэлт ба хариу", exact: true })
    .click();
  await expect(page.locator(".demo-status-line")).toContainText(
    "Төхөөрөмж → хандалтын цэг",
  );
  await expect(page.locator(".demo-status-line")).toContainText(
    "Хандалтын цэг → төхөөрөмж",
  );
  await page.getByRole("button", { name: "Зогсоох", exact: true }).click();
  await expect(page.locator(".demo-status-line")).toContainText(
    "Хоёр тал ээлжлэн",
  );
});

test("routing actually reroutes and correctly reports disconnection", async ({
  page,
}) => {
  await page.goto("/#routing");
  await expect(page.locator(".lab-result")).toContainText("A → B → D → F");
  await page
    .getByRole("button", { name: "B–D холбоосыг таслах", exact: true })
    .click();
  await expect(page.locator(".lab-result")).toContainText("A → C → E → F");
  await page.getByRole("button", { name: "Илгээх", exact: true }).click();
  await expect(page.locator(".lab-result")).toContainText(
    "Мэдээлэл F-д хүрлээ",
  );
  await page
    .getByRole("button", { name: "A–B холбоосыг таслах", exact: true })
    .click();
  await page
    .getByRole("button", { name: "A–C холбоосыг таслах", exact: true })
    .click();
  await expect(page.locator(".lab-result")).toContainText("Хүрэх зам алга");
  await expect(
    page.getByRole("button", { name: "Илгээх", exact: true }),
  ).toBeDisabled();
});

test("DNS cache is learned per domain and eliminates external queries on a repeat", async ({
  page,
}) => {
  await page.goto("/#dns");
  await expect(page.locator(".lab-intro")).toContainText(
    "Бодит хүсэлт илгээхгүй",
  );
  await expect(page.locator(".lab-badge")).toHaveText("Кэшэд алга");
  for (let i = 0; i < 8; i++)
    await page.locator(".lab-controls .lab-button-primary").click();
  await expect(page.locator(".lab-result")).toContainText(
    "school.example → 192.0.2.10",
  );
  await expect(page.locator(".lab-cache-count")).toHaveText("Кэш: 1 нэр");
  await expect(page.locator(".lab-badge")).toHaveText("Хариу кэшлэгдлээ");
  await page.getByRole("button", { name: "Дахин асуух", exact: true }).click();
  await expect(page.locator(".lab-result-number")).toHaveText("0/2");
  await expect(page.locator(".lab-badge")).toHaveText("Кэшэд байна");
  await expect(page.locator(".lab-dns-node.is-unused")).toHaveCount(3);
  for (let i = 0; i < 2; i++)
    await page.locator(".lab-controls .lab-button-primary").click();
  await expect(page.locator(".lab-badge")).toHaveText("Кэшээс хариулав");
  await page.getByLabel("Домэйн сонгох").selectOption("library.example");
  await expect(page.locator(".lab-badge")).toHaveText("Кэшэд алга");
  await expect(page.locator(".lab-result-number")).toHaveText("0/8");
  for (let i = 0; i < 8; i++)
    await page.locator(".lab-controls .lab-button-primary").click();
  await expect(page.locator(".lab-result")).toContainText(
    "library.example → 192.0.2.20",
  );
  await expect(page.locator(".lab-cache-count")).toHaveText("Кэш: 2 нэр");
  await page.getByRole("button", { name: "Кэш цэвэрлэх", exact: true }).click();
  await expect(page.locator(".lab-cache-count")).toHaveText("Кэш: 0 нэр");
});

test("packet arrivals preserve gaps until automatic retransmission fills them", async ({
  page,
}) => {
  await page.goto("/#packets");
  const next = page.getByRole("button", { name: "Нэг алхам", exact: true });
  await next.click();
  await expect(page.locator(".lab-application strong")).toHaveText(
    "Одоогоор хоосон",
  );
  await expect(page.locator(".lab-packet-receiver.is-buffered")).toHaveCount(1);
  for (let i = 0; i < 3; i++) await next.click();
  await expect(page.locator(".lab-ack-return")).toContainText("3-р хэсгийн");
  await expect(page.locator(".lab-packet-receiver.is-buffered")).toHaveCount(1);
  await expect(page.locator(".lab-application strong")).not.toHaveText(
    "Сүлжээ биднийг холбоно.",
  );
  for (let i = 0; i < 3; i++) await next.click();
  await expect(page.locator(".lab-application strong")).toHaveText(
    "Сүлжээ биднийг холбоно.",
  );
  await expect(page.locator(".lab-packet-receiver.is-buffered")).toHaveCount(0);
  await expect(page.locator(".lab-ack-return")).toContainText(
    "Бүх өгөгдлийг баталлаа",
  );
});

test("packet playback pause preserves the current state and reaches completion", async ({
  page,
}) => {
  await page.goto("/#packets");
  await page.getByRole("button", { name: "Тоглуулах", exact: true }).click();
  await expect(page.locator(".lab-counter")).not.toHaveText("1 / 8");
  await page.getByRole("button", { name: "Түр зогсоох", exact: true }).click();
  const counter = await page.locator(".lab-counter").textContent();
  await page.waitForTimeout(1500);
  await expect(page.locator(".lab-counter")).toHaveText(counter!);
  await page.getByRole("button", { name: "Тоглуулах", exact: true }).click();
  await expect(page.locator(".lab-application strong")).toHaveText(
    "Сүлжээ биднийг холбоно.",
    { timeout: 12000 },
  );
});

test("bandwidth and delay controls produce the stated numerical model", async ({
  page,
}) => {
  await page.goto("/#speed");
  await expect(page.locator(".lab-formula")).toContainText("0.90 секунд");
  const bandwidth = page.getByRole("slider", {
    name: "Зурвасын өргөн",
    exact: true,
  });
  await bandwidth.focus();
  await page.keyboard.press("Home");
  await expect(page).toHaveURL(/#speed$/);
  await expect(page.locator(".lab-formula")).toContainText("8.10 секунд");
  await page.keyboard.press("End");
  await expect(page.locator(".lab-formula")).toContainText("0.18 секунд");
  await page
    .getByRole("slider", {
      name: "Нэг чиглэлийн тархалтын саатал",
      exact: true,
    })
    .focus();
  await page.keyboard.press("End");
  await expect(page.locator(".lab-formula")).toContainText("0.38 секунд");
  await page
    .getByRole("button", { name: "Харьцуулж тоглуулах", exact: true })
    .click();
  await expect(
    page.getByRole("progressbar", {
      name: "Хүлээн авсан өгөгдөл",
      exact: true,
    }),
  ).toHaveAttribute("value", "1", { timeout: 8000 });
});

test("firewall filtering remains independent of TLS encryption", async ({
  page,
}) => {
  await page.goto("/#security");
  await expect(page.locator(".lab-security-payload")).toContainText(
    "Холболтын хүсэлт",
  );
  await expect(page.locator(".lab-security-payload")).not.toHaveClass(
    /is-encrypted/,
  );
  await page
    .getByRole("checkbox", { name: "443 портыг зөвшөөрөх", exact: true })
    .uncheck();
  await page
    .getByRole("button", { name: "Хүсэлтийг шалгах", exact: true })
    .click();
  await expect(page.locator(".lab-result")).toContainText(
    "холболтыг хориглолоо",
  );
  await expect(page.locator(".lab-security-payload")).toContainText(
    "Холболт үүссэнгүй",
  );
  await expect(page.locator(".lab-result")).toContainText(
    "TLS холбоо үүсээгүй",
  );
  await expect(page.locator(".lab-security-payload")).not.toHaveClass(
    /is-encrypted/,
  );
  await page.getByRole("button", { name: "HTTP", exact: true }).click();
  await page
    .getByRole("button", { name: "Хүсэлтийг шалгах", exact: true })
    .click();
  await expect(page.locator(".lab-result")).toContainText("80 порт нээлттэй");
  await expect(page.locator(".lab-security-payload")).toContainText(
    "demo-pass",
  );
  await expect(page.locator(".lab-security-payload")).not.toHaveClass(
    /is-encrypted/,
  );
  await page.getByRole("button", { name: "HTTPS", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "443 портыг зөвшөөрөх", exact: true })
    .check();
  await expect(page.locator(".lab-security-payload")).toContainText(
    "Холболтын хүсэлт",
  );
  await page
    .getByRole("button", { name: "Хүсэлтийг шалгах", exact: true })
    .click();
  await expect(page.locator(".lab-security-payload")).toContainText(
    "Шифрлэсэн өгөгдөл",
  );
  await expect(page.locator(".lab-security-payload")).toHaveClass(
    /is-encrypted/,
  );
  await expect(page.locator(".lab-security-server")).toContainText("demo-pass");
});

test("prediction answers give explanatory feedback and a resettable score", async ({
  page,
}) => {
  await page.goto("/#recap");
  for (const correct of [1, 2, 0]) {
    await page.locator(".lab-answer-options button").nth(correct).click();
    await expect(page.locator(".lab-quiz-feedback")).toContainText(
      "Зөв таамаглалаа",
    );
    if (correct !== 0)
      await page
        .getByRole("button", { name: "Дараагийн асуулт", exact: true })
        .click();
  }
  await expect(page.locator(".lab-score")).toContainText("3 / 3");
  await page.getByRole("button", { name: "Дахин шалгах", exact: true }).click();
  await expect(
    page.locator(".lab-answer-options button").first(),
  ).toBeEnabled();
});

test("mobile shell and all notes remain reachable without document overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#intro");
  const takeaways: string[] = [];
  await page.getByRole("button", { name: "Бүх бүлэг", exact: true }).click();
  const overview = await page
    .locator(".chapter-menu button > div > span")
    .allTextContents();
  expect(overview).toHaveLength(10);
  expect(new Set(overview).size).toBe(10);
  await page.keyboard.press("Escape");
  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: "Бүх бүлэг", exact: true }).click();
    await page.locator(".chapter-menu button").nth(i).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const takeaway = page.locator(".lesson-takeaway mark");
    await expect(takeaway).toBeVisible();
    takeaways.push((await takeaway.textContent())!);
    await page
      .getByRole("button", { name: "Тайлбар ба баримтууд", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".fact-strip > div")).toHaveCount(2);
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth === innerWidth &&
          document.documentElement.scrollHeight === innerHeight,
      ),
    ).toBe(true);
  }
  expect(takeaways).toEqual(overview);
});

test("reduced motion supports stepwise packet reconstruction", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#packets");
  await expect(
    page.getByRole("button", { name: "Тоглуулах", exact: true }),
  ).toHaveCount(0);
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "Нэг алхам", exact: true }).click();
  await expect(page.locator(".lab-application strong")).toHaveText(
    "Сүлжээ биднийг холбоно.",
  );
});

test("tall portrait media keeps its heading near the top and bounds the model", async ({
  page,
}) => {
  await page.setViewportSize({ width: 980, height: 1900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#media");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  const bounds = await page.evaluate(() => {
    const heading = document.querySelector("h1")!.getBoundingClientRect();
    const main = document
      .querySelector(".screen-main")!
      .getBoundingClientRect();
    const stage = document
      .querySelector(".experiment-stage")!
      .getBoundingClientRect();
    const scene = document
      .querySelector(".scene-area")!
      .getBoundingClientRect();
    return {
      headingTop: heading.top,
      mainTop: main.top,
      headingBottom: heading.bottom,
      stageTop: stage.top,
      sceneHeight: scene.height,
    };
  });
  expect(
    bounds.headingTop - bounds.mainTop,
    "A portrait heading must not be vertically centered hundreds of pixels down",
  ).toBeLessThan(180);
  expect(
    bounds.stageTop,
    "The interactive model must stack below its heading in portrait",
  ).toBeGreaterThanOrEqual(bounds.headingBottom);
  expect(
    bounds.sceneHeight,
    "A tall viewport must not stretch the 3D scene into a giant blank area",
  ).toBeLessThanOrEqual(500);
});

for (const viewport of [
  { width: 980, height: 1900 },
  { width: 390, height: 844 },
]) {
  test(`portrait ${viewport.width}×${viewport.height}: all chapters stack, render, and keep their controls reachable`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#intro");

    for (let index = 0; index < slideIds.length; index++) {
      const id = slideIds[index];
      if (index > 0) {
        await page
          .getByRole("button", { name: "Бүх бүлэг", exact: true })
          .click();
        await page.locator(".chapter-menu button").nth(index).click();
      }
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      const heading = page.getByRole("heading", { level: 1 });
      const stage = page.locator(".experiment-stage");
      await expect(heading).toBeVisible();
      await expect(stage).toBeVisible();
      const layout = await page.evaluate(() => {
        const heading = document.querySelector("h1")!.getBoundingClientRect();
        const stage = document
          .querySelector(".experiment-stage")!
          .getBoundingClientRect();
        const example = document
          .querySelector(".lesson-example")!
          .getBoundingClientRect();
        const main = document.querySelector(".screen-main")!;
        const mainBounds = main.getBoundingClientRect();
        return {
          headingTop: heading.top,
          headingBottom: heading.bottom,
          exampleBottom: example.bottom,
          stageTop: stage.top,
          stageLeft: stage.left,
          stageWidth: stage.width,
          mainTop: mainBounds.top,
          mainLeft: mainBounds.left,
          mainWidth: mainBounds.width,
          horizontalOverflow: main.scrollWidth - main.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
        };
      });
      expect(
        layout.headingTop - layout.mainTop,
        `${id}: heading starts near the top`,
      ).toBeLessThan(180);
      expect(
        layout.stageTop,
        `${id}: stage follows the heading instead of sitting beside it`,
      ).toBeGreaterThanOrEqual(layout.headingBottom - 1);
      expect(
        layout.stageTop - layout.exampleBottom,
        `${id}: no giant blank gap between the example and interactive stage`,
      ).toBeLessThan(40);
      expect(
        Math.abs(layout.stageLeft - layout.mainLeft),
        `${id}: stage aligns with the portrait content column`,
      ).toBeLessThanOrEqual(32);
      expect(
        layout.stageWidth / layout.mainWidth,
        `${id}: stage uses the portrait content width`,
      ).toBeGreaterThan(0.88);
      expect(
        layout.horizontalOverflow,
        `${id}: content does not overflow horizontally`,
      ).toBeLessThanOrEqual(1);
      expect(layout.documentWidth).toBe(viewport.width);

      if (index < 4) {
        const canvas = page.locator("canvas");
        await expect(canvas).toBeVisible({ timeout: 15000 });
        await expect
          .poll(
            () =>
              canvas.evaluate((element) => {
                const bounds = element.getBoundingClientRect();
                const scene = element
                  .closest(".scene-area")!
                  .getBoundingClientRect();
                return (
                  Math.abs(bounds.width - scene.width) +
                  Math.abs(bounds.height - scene.height)
                );
              }),
            {
              message: `${id}: wait for the canvas ResizeObserver to fill its scene`,
            },
          )
          .toBeLessThanOrEqual(2);
        const geometry = await canvas.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const scene = element.closest(".scene-area")!.getBoundingClientRect();
          const stage = element
            .closest(".experiment-stage")!
            .getBoundingClientRect();
          const controls = element
            .closest(".experiment-stage")!
            .querySelector(".demo-console")!
            .getBoundingClientRect();
          return {
            width: bounds.width,
            height: bounds.height,
            sceneWidth: scene.width,
            sceneHeight: scene.height,
            top: bounds.top,
            bottom: bounds.bottom,
            stageTop: stage.top,
            stageBottom: stage.bottom,
            controlsTop: controls.top,
            controlsBottom: controls.bottom,
            bufferWidth: element.width,
            bufferHeight: element.height,
          };
        });
        expect(
          geometry.width,
          `${id}: canvas has usable width`,
        ).toBeGreaterThan(200);
        expect(
          geometry.height,
          `${id}: model is not collapsed`,
        ).toBeGreaterThanOrEqual(220);
        expect(
          geometry.height,
          `${id}: scene height is bounded independently of a tall viewport`,
        ).toBeLessThanOrEqual(500);
        expect(
          Math.abs(geometry.width - geometry.sceneWidth),
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(geometry.height - geometry.sceneHeight),
        ).toBeLessThanOrEqual(1);
        expect(geometry.bufferWidth).toBeGreaterThanOrEqual(
          Math.floor(geometry.width),
        );
        expect(geometry.bufferHeight).toBeGreaterThanOrEqual(
          Math.floor(geometry.height),
        );
        expect(geometry.top).toBeGreaterThanOrEqual(geometry.stageTop);
        expect(geometry.bottom).toBeLessThanOrEqual(geometry.stageBottom + 1);
        expect(
          geometry.controlsTop - geometry.bottom,
          `${id}: controls stay close to the model`,
        ).toBeLessThanOrEqual(180);
        expect(
          geometry.controlsBottom,
          `${id}: the complete controls must fit inside their stage`,
        ).toBeLessThanOrEqual(geometry.stageBottom + 1);

        // Compare the rendered WebGL canvas with the same region without its pixels.
        // A blank canvas cannot pass merely because its element has dimensions.
        await canvas.scrollIntoViewIfNeeded();
        const rendered = await canvas.screenshot({ animations: "disabled" });
        let empty: Buffer;
        await canvas.evaluate((element) => {
          element.style.opacity = "0";
        });
        try {
          empty = await canvas.screenshot({ animations: "disabled" });
        } finally {
          await canvas.evaluate((element) => {
            element.style.opacity = "";
          });
        }
        expect(
          rendered.equals(empty),
          `${id}: the full canvas actually contains rendered model pixels`,
        ).toBe(false);
      } else {
        const lab = page.locator(".lab");
        await expect(lab).toBeVisible();
        const nestedScroll = await lab.evaluate((element) => ({
          overflow: getComputedStyle(element).overflowY,
          excess: element.scrollHeight - element.clientHeight,
          bottom: element.getBoundingClientRect().bottom,
          stageBottom: element
            .closest(".experiment-stage")!
            .getBoundingClientRect().bottom,
        }));
        expect(
          nestedScroll.excess,
          `${id}: portrait labs use the main scroller, not a clipped inner viewport`,
        ).toBeLessThanOrEqual(1);
        expect(
          nestedScroll.bottom,
          `${id}: lab content is contained by its stage`,
        ).toBeLessThanOrEqual(nestedScroll.stageBottom + 1);
        if (id === "security" && viewport.width <= 700) {
          const path = await page.evaluate(() => {
            const bounds = (selector: string) => {
              const rect = document
                .querySelector(selector)!
                .getBoundingClientRect();
              return {
                top: rect.top,
                bottom: rect.bottom,
                center: rect.left + rect.width / 2,
              };
            };
            return {
              firewall: bounds(".lab-firewall"),
              arrow: bounds(".lab-security-final-arrow"),
              server: bounds(".lab-security-server"),
            };
          });
          expect(
            path.arrow.top,
            "The firewall output continues down toward the wrapped server",
          ).toBeGreaterThanOrEqual(path.firewall.bottom);
          expect(
            path.server.top,
            "The server follows the output arrow",
          ).toBeGreaterThanOrEqual(path.arrow.bottom);
          expect(
            Math.abs(path.arrow.center - path.firewall.center),
          ).toBeLessThanOrEqual(1);
          expect(
            Math.abs(path.server.center - path.arrow.center),
          ).toBeLessThanOrEqual(1);
        }
        const caveat = lab.locator(".lab-note, .lab-security-takeaway").last();
        if (await caveat.count()) {
          await caveat.scrollIntoViewIfNeeded();
          const noteBounds = await caveat.evaluate((element) => ({
            bottom: element.getBoundingClientRect().bottom,
            mainBottom: document
              .querySelector(".screen-main")!
              .getBoundingClientRect().bottom,
          }));
          expect(
            noteBounds.bottom,
            `${id}: the complete model caveat is reachable above the fixed footer`,
          ).toBeLessThanOrEqual(noteBounds.mainBottom + 1);
        }
      }
      const lastControl = stage
        .locator(
          "button:visible:not([disabled]), input:visible:not([disabled]), select:visible",
        )
        .last();
      await expect(lastControl).toBeVisible();
      await lastControl.scrollIntoViewIfNeeded();
      await expect(lastControl).toBeInViewport();
      await lastControl.click({ trial: true });
      const stickySummary = await page
        .locator(".lesson-summary")
        .evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const main = document
            .querySelector(".screen-main")!
            .getBoundingClientRect();
          const takeaway = element
            .querySelector(".lesson-takeaway")!
            .getBoundingClientRect();
          return {
            top: bounds.top,
            mainTop: main.top,
            takeawayBottom: takeaway.bottom,
            mainBottom: main.bottom,
          };
        });
      expect(
        stickySummary.top,
        `${id}: the core summary remains above the scrolled controls`,
      ).toBeGreaterThanOrEqual(stickySummary.mainTop - 1);
      expect(
        stickySummary.top - stickySummary.mainTop,
        `${id}: the summary stays near the top`,
      ).toBeLessThan(40);
      expect(
        stickySummary.takeawayBottom,
        `${id}: the complete takeaway remains visible`,
      ).toBeLessThanOrEqual(stickySummary.mainBottom);
    }
    expect(errors).toEqual([]);
  });
}
