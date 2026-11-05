/* Checks buttons, navigation and edge cases outside the main question paths.
   Usage: node tests/check-features.js  (with the site served on :8765) */
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://localhost:8765/";

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const fail = m => { failures++; console.log("FAIL: " + m); };
  const ok = (cond, m) => { if (!cond) fail(m); };

  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce", permissions: ["clipboard-read", "clipboard-write"] });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(BASE);
    const title = () => page.textContent("#stepTitle");
    const pick = v => page.click('#stepBody .opt[data-v="' + v + '"]');

    // In-page Back button
    ok(await page.isHidden("#backBtn"), "Back hidden on Q1");
    await pick("individual");
    ok((await title()).includes("salary"), "Q2 is salary question");
    await page.click("#backBtn");
    ok((await title()).includes("Who is filing"), "Back returns to Q1");
    ok(await page.getAttribute('#stepBody .opt[data-v="individual"]', "aria-pressed") === "true", "previous answer shown as selected");

    // Phone/browser Back button
    await pick("individual"); await pick("yes"); await pick("early");
    ok((await title()).includes("mixed-income"), "mixed reminder shown");
    await page.goBack();
    ok((await title()).includes("When did you register"), "browser Back goes to previous question");
    await page.goBack(); await page.goBack();
    ok((await title()).includes("Who is filing"), "browser Back to Q1");
    ok(page.url().startsWith(BASE), "still on the page");

    // Switching individual -> corporation drops the salary question
    await pick("corp");
    ok((await page.textContent("#stepCount")) === "Question 2 of 5", "corp path has 5 questions: " + await page.textContent("#stepCount"));

    // Double-tap must not skip a question
    await page.dblclick('#stepBody .opt[data-v="early"]');
    ok((await title()).includes("gross sales"), "double-tap did not skip: " + await title());
    await pick("below"); await pick("no");

    // Multi-select: exclusive options, continue disabled with none selected
    ok(await page.isDisabled("#stepBody [data-continue]"), "continue disabled with nothing picked");
    await pick("unpaid"); await pick("assessment"); await pick("none");
    ok(await page.getAttribute('#stepBody .opt[data-v="unpaid"]', "aria-checked") === "false", "'None' clears others");
    await pick("unpaid");
    ok(await page.getAttribute('#stepBody .opt[data-v="none"]', "aria-checked") === "false", "picking an issue clears 'None'");
    await pick("unpaid");
    ok(await page.isDisabled("#stepBody [data-continue]"), "continue disabled after unpicking all");
    await pick("unfiled");
    await page.click("#stepBody [data-continue]");
    await page.waitForSelector("#result:not([hidden])");
    ok(await page.evaluate(() => document.activeElement.id) === "resultTitle", "focus moves to result title");
    ok((await page.textContent("#resultBody")).includes("MC351"), "corporation ATC shown");

    // Countdown numbers sane (56 days on Nov 5, 2026 PH time)
    const days = Number(await page.textContent("#bigCountdown .unit b"));
    ok(days >= 0 && days <= 60, "countdown days " + days);

    // Checklist + copy
    await page.check("#checklist input[data-i='1']");
    ok((await page.textContent("#checkCount")).startsWith("1 of"), "checklist count");
    await page.click("#copyBtn");
    await page.waitForSelector("#toast.show");
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    ok(clip.includes("My Micro Taxpayer checklist") && clip.includes("[x] ") && clip.includes("[ ] ") && clip.includes("General information only"), "copied text");
    ok(!/undefined|null/.test(clip), "copied text clean");

    // Link to #checker while result showing goes to result
    await page.click("#topCountdown a");
    ok(await page.evaluate(() => document.activeElement.id) === "resultTitle", "#checker link focuses result");

    // Change my answers -> last question; Back once -> previous question
    await page.click("#changeBtn");
    await page.waitForSelector("#checker:not([hidden])");
    ok((await title()).includes("Do any of these apply"), "change answers returns to last question");
    ok(await page.getAttribute('#stepBody .opt[data-v="unfiled"]', "aria-checked") === "true", "answers kept");
    await page.click("#backBtn");
    ok((await title()).includes("VAT"), "Back from last question goes to VAT question: " + await title());
    await pick("no"); await page.click("#stepBody [data-continue]");
    await page.waitForSelector("#result:not([hidden])");

    // Browser Back from result -> checker
    await page.goBack();
    await page.waitForSelector("#checker:not([hidden])");
    ok((await title()).includes("Do any of these apply"), "browser Back from result");
    await page.goForward(); // must not break anything
    await page.waitForTimeout(100);
    await page.click("#stepBody [data-continue]");
    await page.waitForSelector("#result:not([hidden])");

    // Start over
    await page.click("#restartBtn");
    await page.waitForSelector("#checker:not([hidden])");
    await page.waitForTimeout(100);
    ok((await title()).includes("Who is filing"), "start over goes to Q1");
    ok(await page.isHidden("#backBtn"), "Back hidden after start over");
    ok(await page.getAttribute('#stepBody .opt[data-v="corp"]', "aria-pressed") === "false", "answers cleared");
    await page.goBack(); await page.waitForTimeout(100);
    ok(page.url() === "about:blank" || !page.url().startsWith(BASE) || (await title()).includes("Who is filing"), "Back after restart doesn't resurrect old answers");

    // Theme toggle cycles and sets attribute
    await page.goto(BASE);
    await page.click("#themeToggle");
    ok(await page.getAttribute("html", "data-theme") === "light", "theme light");
    await page.click("#themeToggle");
    ok(await page.getAttribute("html", "data-theme") === "dark", "theme dark");
    ok(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) === "rgb(22, 26, 26)", "dark background applied");
    await page.click("#themeToggle");
    ok(await page.getAttribute("html", "data-theme") === null, "theme auto");

    // Language placeholder
    await page.click("#langToggle");
    await page.waitForSelector("#toast.show");
    ok((await page.textContent("#toast")).includes("Filipino"), "language toast");

    // FAQ opens; every answer has a source
    const n = await page.$$eval("#faqList details", d => d.length);
    for (let i = 0; i < n; i++) await page.click(`#faqList details:nth-child(${i + 1}) summary`);
    ok(await page.$$eval("#faqList details", d => d.every(x => x.open)), "all FAQ open");
    ok(await page.$$eval("#faqList .fact", f => f.every(x => x.querySelector(".src"))), "FAQ sources");

    // Keyboard: skip link, then options reachable by Tab and Enter
    await page.goto(BASE);
    await page.keyboard.press("Tab");
    ok(await page.evaluate(() => document.activeElement.className) === "skip", "skip link first");
    await page.keyboard.press("Enter");
    ok(await page.evaluate(() => document.activeElement.id) === "main", "skip link moves focus");
    await page.focus('#stepBody .opt[data-v="individual"]');
    await page.keyboard.press("Enter");
    ok((await title()).includes("salary"), "Enter answers question");
    await page.focus('#stepBody .opt[data-v="no"]');
    await page.keyboard.press("Space");
    ok((await title()).includes("register"), "Space answers question");

    // Deadlines: exactly one "Next up"
    ok(await page.$$eval(".timeline .status.next", e => e.length) === 1, "one next-up deadline");

    if (errors.length) fail(scheme + " JS errors: " + errors.join("; "));
    await ctx.close();
  }
  await browser.close();
  console.log(failures ? "FAILED: " + failures : "PASSED");
  process.exit(failures ? 1 : 0);
})();
