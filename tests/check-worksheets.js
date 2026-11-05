/* Checks the paid worksheets box: hidden until configured, shown only to
   individuals, plain link with no checker answers attached.
   Usage: node tests/check-worksheets.js  (site served on :8765) */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = process.env.BASE_URL || "http://localhost:8765/";
const ORDER = "https://docs.google.com/forms/d/e/TEST/viewform";

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const ok = (c, m) => { if (!c) { failures++; console.log("FAIL: " + m); } };
  const run = async (page, answers) => {
    await page.goto(BASE);
    for (const v of answers) await page.click(`#stepBody .opt[data-v="${v}"]`);
    await page.click("#stepBody [data-continue]");
    await page.waitForSelector("#result:not([hidden])");
  };

  const real = fs.readFileSync(path.join(__dirname, "..", "js", "config.js"), "utf8");
  const withValues = (url, price) => real
    .replace(/orderUrl: "[^"]*"/, "orderUrl: " + JSON.stringify(url))
    .replace(/price: "[^"]*"/, "price: " + JSON.stringify(price));

  // 1. Placeholder price: box hidden
  let ctx0 = await browser.newContext({ viewport: { width: 360, height: 740 } });
  await ctx0.route("**/js/config.js", r => r.fulfill({ contentType: "application/javascript", body: withValues(ORDER, "PLACEHOLDER_PRICE") }));
  let page = await ctx0.newPage();
  await run(page, ["individual", "no", "early", "below", "no", "none"]);
  ok(!(await page.$(".worksheets")), "box hidden while price is a placeholder");
  await ctx0.close();

  // 2. Configured: serve a filled-in config
  const cfg = withValues(ORDER, "₱199");
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme });
    await ctx.route("**/js/config.js", r => r.fulfill({ contentType: "application/javascript", body: cfg }));
    page = await ctx.newPage();
    await run(page, ["individual", "no", "early", "below", "no", "unpaid"]);
    ok(await page.isVisible(".worksheets"), "box shown for individual");
    const href = await page.getAttribute("#wsBtn", "href");
    ok(href === ORDER, "link is exactly the order URL (no answers attached): " + href);
    ok(await page.getAttribute("#wsBtn", "target") === "_blank", "opens in new tab");
    ok(await page.getAttribute("#wsBtn", "rel") === "noopener", "rel=noopener");
    const t = await page.textContent(".worksheets");
    ok(t.includes("₱199") && t.includes("stay free") && !t.includes("PLACEHOLDER"), "box text");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no overflow");
    if (scheme === "light") await page.locator(".worksheets").screenshot({ path: process.env.SHOT || "/dev/null" }).catch(() => {});
    await run(page, ["corp", "early", "below", "no", "unpaid"]);
    ok(!(await page.$(".worksheets")), "box hidden for corporations");
    await ctx.close();
  }
  await browser.close();
  console.log(failures ? "FAILED: " + failures : "PASSED");
  process.exit(failures ? 1 : 0);
})();
