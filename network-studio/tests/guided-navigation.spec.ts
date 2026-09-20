import { expect, test, type Page } from "@playwright/test";

const chapters = [
  { id: "intro", total: 4 },
  { id: "scale", total: 14 },
  { id: "hardware", total: 5 },
  { id: "media", total: 8 },
  { id: "routing", total: 4 },
  { id: "dns", total: 10 },
  { id: "packets", total: 7 },
  { id: "speed", total: 3 },
  { id: "security", total: 3 },
  { id: "recap", total: 5 },
] as const;

async function expectCue(page: Page, id: string, step: number, total: number) {
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  await expect(page.getByTestId("presentation-cue")).toHaveAttribute(
    "data-step",
    String(step),
  );
  await expect(page.getByTestId("presentation-cue")).toHaveAttribute(
    "data-total",
    String(total),
  );
}

async function assertModelCue(page: Page, id: string, step: number) {
  if (id === "intro") {
    if (step === 3)
      await expect(page.locator(".music-buffer .received")).toHaveCount(0);
    if (step === 4)
      await expect(page.locator(".music-buffer .received")).toHaveCount(4);
  }
  if (id === "scale") {
    const positions: Record<number, string[]> = {
      1: ["—", "—", "—"],
      2: ["A", "—", "—"],
      3: ["A", "A", "A"],
      4: ["A", "A", "A"],
      5: ["B", "A", "A"],
      6: ["B", "B", "B"],
      7: ["B", "B", "B"],
      8: ["B", "B", "B"],
      9: ["A", "B", "B"],
      10: ["A", "A", "A"],
    };
    if (step <= 10) {
      await expect(page.locator(".lan-state output")).toHaveText(
        positions[step],
      );
      await expect(page.locator(".traffic-pill")).toHaveText(
        "Тоглолтын WAN өгөгдөл: 0",
      );
    }
    if (step >= 7 && step <= 10)
      await expect(
        page.getByRole("button", { name: "Интернэт салгасан", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
    if (step >= 11)
      await expect(
        page.getByRole("button", {
          name: ["PAN", "CAN", "MAN", "WAN"][step - 11],
          exact: true,
        }),
      ).toHaveAttribute("aria-pressed", "true");
  }
  if (id === "hardware" && step === 5)
    await expect(page.locator(".demo-status-line")).toContainText(
      "хандалтын цэгийн",
    );
  if (id === "media") {
    const medium =
      step < 3 ? "Зэс кабель" : step < 6 ? "Шилэн кабель" : "Wi-Fi";
    await expect(
      page.getByRole("button", { name: medium, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    if (step === 7 || step === 8)
      await expect(page.locator(".demo-status-line")).toContainText(
        step === 7 ? "Төхөөрөмж → хандалтын цэг" : "Хандалтын цэг → төхөөрөмж",
      );
  }
  if (id === "routing") {
    if (step === 1 || step === 3)
      await expect(page.locator(".lab-result")).toContainText(
        "Мэдээлэл F-д хүрлээ",
      );
    if (step === 2)
      await expect(page.locator(".lab-result")).toContainText("A → C → E → F");
    if (step === 4) {
      await expect(page.locator(".lab-result")).toContainText("Хүрэх зам алга");
      await expect(
        page.getByRole("button", { name: "Илгээх", exact: true }),
      ).toBeDisabled();
    }
  }
  if (id === "dns") {
    if (step === 8) {
      await expect(page.locator(".lab-result")).toContainText(
        "school.example → 192.0.2.10",
      );
      await expect(page.locator(".lab-cache-count")).toHaveText("Кэш: 1 нэр");
    }
    if (step === 9 || step === 10) {
      await expect(page.locator(".lab-result-number")).toHaveText(
        `${step - 8}/2`,
      );
      await expect(page.locator(".lab-dns-node.is-unused")).toHaveCount(3);
    }
    if (step === 10)
      await expect(page.locator(".lab-badge")).toHaveText("Кэшээс хариулав");
  }
  if (id === "packets") {
    if (step === 1) {
      await expect(page.locator(".lab-application strong")).toHaveText(
        "Одоогоор хоосон",
      );
      await expect(
        page.locator(".lab-packet-receiver.is-buffered"),
      ).toHaveCount(1);
    }
    if (step === 7) {
      await expect(page.locator(".lab-application strong")).toHaveText(
        "Сүлжээ биднийг холбоно.",
      );
      await expect(page.locator(".lab-ack-return")).toContainText(
        "Бүх өгөгдлийг баталлаа",
      );
    }
  }
  if (id === "speed" && step > 0) {
    await expect(page.locator(".lab-formula")).toContainText(
      ["", "0.90 секунд", "0.50 секунд", "0.70 секунд"][step],
    );
    await expect(
      page.getByRole("progressbar", {
        name: "Хүлээн авсан өгөгдөл",
        exact: true,
      }),
    ).toHaveAttribute("value", "1");
  }
  if (id === "security") {
    if (step === 1)
      await expect(page.locator(".lab-security-payload")).toHaveClass(
        /is-encrypted/,
      );
    if (step === 2) {
      await expect(page.locator(".lab-result")).toContainText(
        "холболтыг хориглолоо",
      );
      await expect(page.locator(".lab-result")).toContainText(
        "TLS холбоо үүсээгүй",
      );
    }
    if (step === 3) {
      await expect(page.locator(".lab-security-payload")).toContainText(
        "demo-pass",
      );
      await expect(page.locator(".lab-security-payload")).not.toHaveClass(
        /is-encrypted/,
      );
      await expect(page.locator(".lab-result")).toContainText(
        "80 порт нээлттэй",
      );
    }
  }
  if (id === "recap" && step === 5) {
    await expect(page.locator(".lab-quiz-feedback")).toBeVisible();
    await expect(page.locator(".lab-score")).toContainText("Оноонд тооцоогүй");
    await expect(page.locator(".lab-score")).not.toContainText(/\d\s*\/\s*\d/);
  }
}

test("guided Next demonstrates every chapter before advancing and never invents quiz answers", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#intro");
  const next = page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Дараагийн алхам", exact: true });
  await expect(
    page
      .locator(".presentation-footer")
      .getByRole("button", { name: "Өмнөх алхам", exact: true }),
  ).toBeDisabled();

  for (const chapter of chapters) {
    await expectCue(page, chapter.id, 0, chapter.total);
    for (let step = 1; step <= chapter.total; step++) {
      await next.click();
      await expectCue(page, chapter.id, step, chapter.total);
      await assertModelCue(page, chapter.id, step);
    }
    await next.click();
  }
  await expectCue(page, "intro", 0, 4);
  await expect(page.locator(".music-buffer .received")).toHaveCount(0);
});

test("Back reverses model state and crosses into the previous chapter's final cue", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#speed");
  await expectCue(page, "speed", 0, 3);
  await page.locator("#main-screen").focus();
  await page.keyboard.press("ArrowLeft");
  await expectCue(page, "packets", 7, 7);
  await assertModelCue(page, "packets", 7);
  await page.keyboard.press("PageUp");
  await expectCue(page, "packets", 6, 7);
  await expect(page.locator(".lab-application strong")).not.toHaveText(
    "Сүлжээ биднийг холбоно.",
  );
  await page.keyboard.press("ArrowRight");
  await expectCue(page, "packets", 7, 7);
  await page.keyboard.press("PageDown");
  await expectCue(page, "speed", 0, 3);

  await page.locator(".chapter-progress button").nth(1).click();
  await expectCue(page, "scale", 0, 14);
  await page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Өмнөх алхам", exact: true })
    .click();
  await expectCue(page, "intro", 4, 4);
  await assertModelCue(page, "intro", 4);
  await page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Дараагийн алхам", exact: true })
    .click();
  await expectCue(page, "scale", 0, 14);

  await page.locator(".chapter-progress button").nth(6).click();
  const previous = page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Өмнөх алхам", exact: true });
  await previous.click();
  await expectCue(page, "dns", 10, 10);
  await assertModelCue(page, "dns", 10);
  await previous.click();
  await expectCue(page, "dns", 9, 10);
  await previous.click();
  await expectCue(page, "dns", 8, 10);
  await expect(page.locator(".lab-cache-count")).toHaveText("Кэш: 1 нэр");
  await previous.click();
  await expectCue(page, "dns", 7, 10);
  await expect(page.locator(".lab-cache-count")).toHaveText("Кэш: 0 нэр");
});

test("chapter progress, overview, Home, End, and hash changes jump directly to an initial cue", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#dns");
  await expectCue(page, "dns", 0, 10);
  const next = page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Дараагийн алхам", exact: true });
  for (let i = 0; i < 3; i++) await next.click();
  await expectCue(page, "dns", 3, 10);
  await page.locator(".chapter-progress button").nth(7).click();
  await expectCue(page, "speed", 0, 3);
  await page.getByRole("button", { name: "Бүх бүлэг", exact: true }).click();
  await page.locator(".chapter-menu button").nth(5).click();
  await expectCue(page, "dns", 0, 10);
  await expect(page.locator(".lab-cache-count")).toHaveText("Кэш: 0 нэр");
  await next.click();
  await page.locator(".chapter-progress button").nth(5).click();
  await expectCue(page, "dns", 0, 10);

  await page.locator("#main-screen").focus();
  await page.keyboard.press("Home");
  await expectCue(page, "intro", 0, 4);
  await page.keyboard.press("End");
  await expectCue(page, "recap", 0, 5);
  await page.evaluate(() => {
    window.location.hash = "security";
  });
  await expectCue(page, "security", 0, 3);
});

test("keyboard presentation shortcuts advance one cue, reverse, and ignore held-key repeats", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#packets");
  await expectCue(page, "packets", 0, 7);
  await page.locator("#main-screen").focus();
  for (const [i, key] of ["ArrowRight", "PageDown", "Space"].entries()) {
    await page.keyboard.press(key);
    await expectCue(page, "packets", i + 1, 7);
  }
  for (const [i, key] of ["ArrowLeft", "PageUp", "Shift+Space"].entries()) {
    await page.keyboard.press(key);
    await expectCue(page, "packets", 2 - i, 7);
  }
  await page.keyboard.down("ArrowRight");
  await expectCue(page, "packets", 1, 7);
  await page.keyboard.down("ArrowRight");
  await expectCue(page, "packets", 1, 7);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expectCue(page, "packets", 2, 7);
});

test("Space activates a native button once, range keys stay local, and dialogs block presentation shortcuts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#dns");
  await expectCue(page, "dns", 0, 10);
  await page.locator(".lab-controls .lab-button-primary").focus();
  await page.keyboard.press("Space");
  await expectCue(page, "dns", 1, 10);
  await expect(page.locator(".lab-result-number")).toHaveText("1/8");

  await page
    .getByRole("button", { name: "Тайлбар ба баримтууд", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (const key of ["ArrowRight", "PageDown", "ArrowLeft", "Home", "End"]) {
    await page.keyboard.press(key);
    await expectCue(page, "dns", 1, 10);
    await expect(dialog).toBeVisible();
  }
  await dialog
    .getByRole("button", { name: "Цонхыг хаах", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await expect(dialog).not.toBeVisible();
  await expectCue(page, "dns", 1, 10);

  await page.locator(".chapter-progress button").nth(7).click();
  const bandwidth = page.getByRole("slider", {
    name: "Зурвасын өргөн",
    exact: true,
  });
  await bandwidth.focus();
  await page.keyboard.press("ArrowRight");
  await expect(bandwidth).toHaveValue("11");
  await expectCue(page, "speed", 1, 3);
  await page.keyboard.press("ArrowLeft");
  await expect(bandwidth).toHaveValue("10");
  await expectCue(page, "speed", 0, 3);
  await page.keyboard.press("End");
  await expect(bandwidth).toHaveValue("100");
  await expectCue(page, "speed", 1, 3);
  await page.keyboard.press("Home");
  await expect(bandwidth).toHaveValue("1");
  await expectCue(page, "speed", 1, 3);
  await page.keyboard.press("End");

  // A manually selected scenario must run before Next can leave it.
  const received = page.getByRole("progressbar", {
    name: "Хүлээн авсан өгөгдөл",
    exact: true,
  });
  await expect(received).toHaveAttribute("value", "0");
  const next = page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Дараагийн алхам", exact: true });
  await next.click();
  await expectCue(page, "speed", 2, 3);
  await expect(bandwidth).toHaveValue("100");
  await expect(page.locator(".lab-formula")).toContainText("0.18 секунд");
  await expect(received).toHaveAttribute("value", "1");
  await next.click();
  await expectCue(page, "speed", 3, 3);
  await expect(page.locator(".lab-formula")).toContainText("0.38 секунд");

  // Range arrows must stay local even when the current cue is the final one.
  await bandwidth.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(bandwidth).toHaveValue("99");
  await expectCue(page, "speed", 2, 3);
  await expect(received).toHaveAttribute("value", "0");
  await next.click();
  await expectCue(page, "speed", 3, 3);
  await expect(bandwidth).toHaveValue("99");
  await bandwidth.focus();
  await page.keyboard.press("ArrowRight");
  await expect(bandwidth).toHaveValue("100");
  await expectCue(page, "speed", 2, 3);
});

test("normal-motion guided cues animate without automatically skipping the next explanation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#intro");
  await expectCue(page, "intro", 0, 4);
  const next = page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Дараагийн алхам", exact: true });
  await next.click();
  await expectCue(page, "intro", 1, 4);
  await expect(page.locator(".demo-status-line")).toContainText("гэрийн Wi-Fi");
  await page.waitForTimeout(2600);
  await expectCue(page, "intro", 1, 4);
  await expect(page.locator(".music-buffer .received")).toHaveCount(0);
  await next.click();
  await expectCue(page, "intro", 2, 4);

  await page.locator(".chapter-progress button").nth(7).click();
  await expectCue(page, "speed", 0, 3);
  const received = page.getByRole("progressbar", {
    name: "Хүлээн авсан өгөгдөл",
    exact: true,
  });
  const receivedValue = async () =>
    Number(await received.getAttribute("value"));
  await next.click();
  await expectCue(page, "speed", 1, 3);
  await expect(
    page.getByRole("button", { name: "Түр зогсоох", exact: true }),
  ).toBeVisible();
  await expect.poll(receivedValue).toBeGreaterThan(0.05);
  const partial = await receivedValue();
  expect(partial).toBeLessThan(1);
  await expect.poll(receivedValue).toBeGreaterThan(partial);
  await expect(received).toHaveAttribute("value", "1");
  await expect(
    page.getByRole("button", { name: "Харьцуулж тоглуулах", exact: true }),
  ).toBeVisible();
  await expectCue(page, "speed", 1, 3);

  await next.click();
  await expectCue(page, "speed", 2, 3);
  await expect(
    page.getByRole("slider", { name: "Зурвасын өргөн", exact: true }),
  ).toHaveValue("20");
  await expect(
    page.getByRole("button", { name: "Түр зогсоох", exact: true }),
  ).toBeVisible();
  expect(await receivedValue()).toBeLessThan(1);
  await expect(page.locator(".lab-formula")).toContainText("0.50 секунд");
  await expect(received).toHaveAttribute("value", "1");
  await expectCue(page, "speed", 2, 3);
});

test("guided quiz explanations count only answers the learner actually selected", async ({
  page,
}) => {
  await page.goto("/#recap");
  await expectCue(page, "recap", 0, 5);
  await page.locator(".lab-answer-options button").nth(1).click();
  await expectCue(page, "recap", 1, 5);
  await expect(page.locator(".lab-quiz-feedback")).toContainText(
    "Зөв таамаглалаа",
  );
  const next = page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Дараагийн алхам", exact: true });
  for (let step = 2; step <= 5; step++) {
    await next.click();
    await expectCue(page, "recap", step, 5);
  }
  await expect(page.locator(".lab-score")).toContainText(/1\s*\/\s*1/);
  await expect(page.locator(".lab-score")).not.toContainText(/3\s*\/\s*3/);
});

test("mobile Next and Back keep the model reachable while reconstructing and reversing a message", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#packets");
  await expectCue(page, "packets", 0, 7);
  const next = page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Дараагийн алхам", exact: true });
  const previous = page
    .locator(".presentation-footer")
    .getByRole("button", { name: "Өмнөх алхам", exact: true });
  for (let step = 1; step <= 7; step++) {
    await expect(next).toBeInViewport();
    await next.click();
    await expectCue(page, "packets", step, 7);
    await expect(page.locator(".lab-message")).toBeInViewport();
  }
  expect(
    await page.locator("#main-screen").evaluate((main) => main.scrollTop),
  ).toBeGreaterThan(0);
  await assertModelCue(page, "packets", 7);
  await page.locator(".lab-application").scrollIntoViewIfNeeded();
  await expect(page.locator(".lab-application strong")).toBeInViewport();
  await expect(previous).toBeInViewport();
  await previous.click();
  await expectCue(page, "packets", 6, 7);
  await expect(page.locator(".lab-application strong")).not.toHaveText(
    "Сүлжээ биднийг холбоно.",
  );
  await expect(page.locator(".lab-message")).toBeInViewport();
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("navigation stays on the requested chapter while its model is loading", async ({
  page,
}) => {
  let releaseModule!: () => void;
  const moduleGate = new Promise<void>((resolve) => {
    releaseModule = resolve;
  });
  await page.route(
    /\/(?:src\/labs\.tsx|assets\/labs-[^/]+\.js)(?:\?.*)?$/,
    async (route) => {
      await moduleGate;
      await route.continue();
    },
  );
  await page.goto("/#dns", { waitUntil: "domcontentloaded" });
  try {
    await expect(page.getByTestId("presentation-cue")).toContainText(
      "Бэлдэж байна",
    );
    await expect(
      page
        .locator(".presentation-footer")
        .getByRole("button", { name: "Дараагийн алхам", exact: true }),
    ).toBeDisabled();
    await page.locator("#main-screen").focus();
    for (const key of ["ArrowRight", "PageDown", "Space", "ArrowLeft"]) {
      await page.keyboard.press(key);
      await expect(page).toHaveURL(/#dns$/);
      await expect(page.getByTestId("presentation-cue")).not.toHaveAttribute(
        "data-step",
      );
    }
  } finally {
    releaseModule();
  }
  await expectCue(page, "dns", 0, 10);
});
