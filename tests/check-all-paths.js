/* Clicks through EVERY path of the checker at phone and laptop sizes.
   Usage:
     python3 -m http.server 8765      (in the repo folder, separate terminal)
     node tests/check-all-paths.js    (needs Playwright installed)
   Optional: BASE_URL=http://localhost:8765/ SHOTS=folder node tests/check-all-paths.js */

const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8765/";
const SHOTS = process.env.SHOTS || "";
const VIEWPORTS = [
  { name: "phone", width: 360, height: 740 },
  { name: "laptop", width: 1280, height: 800 }
].filter(v => !process.env.VP || v.name === process.env.VP);
const WHO = [
  { entity: "individual", mixed: "no" },
  { entity: "individual", mixed: "yes" },
  { entity: "corp" }
];
const REG = ["early", "older", "late", "none", "unsure"];
const SALES = ["below", "above", "unsure"];
const VAT = ["no", "yes", "unsure"];
const ISSUES = [["none"], ["unsure"], ["unfiled"], ["unpaid", "assessment", "stopped"]];

(async () => {
  const browser = await chromium.launch();
  let failures = 0, paths = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    // Fail if anything tries to leave the page during the checker.
    const requests = [];
    page.on("request", r => { if (!r.url().startsWith(BASE) && !r.url().startsWith("data:")) requests.push(r.url()); });

    await page.goto(BASE);
    const fail = (path, msg) => { failures++; console.log("FAIL [" + vp.name + "] " + JSON.stringify(path) + ": " + msg); };

    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (await overflow()) fail("home", "horizontal overflow on home");

    for (const who of WHO) for (const reg of REG) for (const sales of SALES) for (const vat of VAT) for (const issues of ISSUES) {
      const path = { ...who, reg, sales, vat, issues };
      paths++;
      let questions = 0;
      const click = async v => { await page.click('#stepBody .opt[data-v="' + v + '"]'); };
      const counter = async () => (await page.textContent("#stepCount")).match(/of (\d+)/)[1];

      questions++;
      await click(who.entity);
      if (who.mixed) { questions++; await click(who.mixed); }
      questions++; await click(reg);
      if (who.mixed === "yes") { questions++; await page.click("#stepBody [data-continue]"); }
      questions++; await click(sales);
      questions++; await click(vat);
      questions++;
      const total = Number(await counter());
      if (!(await page.textContent("#stepCount")).startsWith("Question " + total + " ")) fail(path, "last question not numbered as last");
      for (const i of issues) await click(i);
      await page.click("#stepBody [data-continue]");

      if (questions !== total) fail(path, "counter said " + total + " questions but path had " + questions);
      if (questions < 5 || questions > 7) fail(path, "question count " + questions);

      await page.waitForSelector("#result:not([hidden])");
      const text = await page.textContent("#resultBody");
      for (const bad of ["undefined", "NaN", "null", "[object"]) if (text.includes(bad)) fail(path, "result contains " + bad);
      for (const need of ["Your likely classification", "Benefits that may apply", "Your annual return", "One-Time Abatement Program", "Your checklist", "Copy my checklist", "General information only, not tax advice", "As of November 2026", "December 31, 2026"])
        if (!text.includes(need)) fail(path, "missing: " + need);
      // Each fact paragraph must carry a source.
      const unsourced = await page.$$eval("#resultBody .fact", els => els.filter(e => !e.querySelector(".src")).length);
      if (unsourced) fail(path, unsourced + " facts without source");
      const itemsNoSrc = await page.$$eval("#checklist li", els => els.filter(e => !e.querySelector(".src")).length);
      if (itemsNoSrc) fail(path, "checklist items without source");

      // Abatement logic sanity
      const abPill = await page.textContent("#resultBody .r-block:nth-of-type(4) .pill");
      if (sales === "above" && !/does not apply/.test(abPill)) fail(path, "abatement should not apply: " + abPill);
      if (issues[0] === "none" && sales !== "above" && !/not needed/.test(abPill)) fail(path, "abatement pill: " + abPill);
      if (sales === "below" && reg !== "none" && issues[0] === "unfiled" && !/May apply to you/.test(abPill)) fail(path, "abatement pill: " + abPill);
      const hasCountdown = await page.$("#resultBody .countdown-big");
      if (!/not needed|does not apply/.test(abPill) && !hasCountdown) fail(path, "missing countdown");
      if (who.entity === "corp" && !text.includes("MC351") && !/not needed|does not apply/.test(abPill)) fail(path, "corp ATC missing");
      if (who.entity === "individual" && !text.includes("1701-MS")) fail(path, "1701-MS missing");

      // Checklist: tick one and copy
      await page.check("#checklist input[data-i='0']");
      const cnt = await page.textContent("#checkCount");
      if (!/^1 of \d+ done$/.test(cnt)) fail(path, "count " + cnt);

      if (await overflow()) fail(path, "horizontal overflow on result");

      if (SHOTS && reg === "early" && vat === "no" && issues[0] === "unfiled" && who.mixed !== "yes")
        await page.screenshot({ path: SHOTS + "/result-" + vp.name + "-" + who.entity + "-" + sales + ".png", fullPage: true });

      await page.click("#restartBtn");
      await page.waitForSelector("#checker:not([hidden])");
    }

    // Back button + change answers
    await page.click('#stepBody .opt[data-v="individual"]');
    await page.click("#backBtn");
    if (!(await page.textContent("#stepTitle")).includes("Who is filing")) fail("back", "back did not return to Q1");

    if (errors.length) { failures++; console.log("JS errors [" + vp.name + "]:", errors); }
    if (requests.length) { failures++; console.log("Unexpected network requests [" + vp.name + "]:", requests); }
    await ctx.close();
  }

  await browser.close();
  console.log((failures ? "FAILED: " + failures + " problem(s)" : "PASSED") + " — " + paths + " paths checked across " + VIEWPORTS.length + " viewports");
  process.exit(failures ? 1 : 0);
})();
