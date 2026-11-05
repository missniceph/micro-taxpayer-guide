/* Checks the email sign-up: validation, consent, and that ONLY email and
   consent are sent to Google Forms (the request is intercepted, nothing
   is really submitted).  Usage: node tests/check-signup.js */
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://localhost:8765/";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 740 } });
  let failures = 0;
  const fail = m => { failures++; console.log("FAIL: " + m); };
  const sent = [];
  let mode = "ok";
  await page.route("https://docs.google.com/**", async route => {
    sent.push({ url: route.request().url(), body: route.request().postData() });
    if (mode === "fail") return route.abort("internetdisconnected");
    return route.fulfill({ status: 200, body: "ok" });
  });
  await page.goto(BASE);
  for (const v of ["individual", "no", "early", "below", "no", "unfiled"]) await page.click('#stepBody .opt[data-v="' + v + '"]');
  await page.click("#stepBody [data-continue]");
  await page.waitForSelector("#signupForm");

  if (await page.$("#suName")) fail("first name field should not exist");

  // 1. Empty email
  await page.click("#suBtn");
  if (!(await page.isVisible("#suEmailErr"))) fail("empty email not flagged");
  // 2. Bad email
  await page.fill("#suEmail", "juan@bad");
  await page.check("#suConsent");
  await page.click("#suBtn");
  if (!(await page.isVisible("#suEmailErr"))) fail("bad email not flagged");
  // 3. No consent
  await page.fill("#suEmail", "juan@example.com");
  await page.uncheck("#suConsent");
  await page.click("#suBtn");
  if (!(await page.isVisible("#suConsentErr"))) fail("missing consent not flagged");
  if (sent.length) fail("sent something before the form was valid");
  // 4. Valid
  await page.check("#suConsent");
  await page.click("#suBtn");
  await page.waitForSelector("#suMsg.form-msg.ok", { timeout: 5000 }).catch(() => fail("no success message"));
  if (sent.length !== 1) fail("expected 1 request, got " + sent.length);
  else {
    const r = sent[0];
    if (r.url !== "https://docs.google.com/forms/d/e/1FAIpQLScmW6NcLSSLixJEOIKIRzrnKgjZgpMM5fGZVlzAK_TPWFbadA/formResponse") fail("wrong URL " + r.url);
    const p = new URLSearchParams(r.body);
    const keys = [...p.keys()].sort().join(",");
    if (keys !== "entry.17754293,entry.556632391") fail("unexpected fields: " + keys);
    if (p.get("entry.556632391") !== "juan@example.com") fail("email value");
    if (p.get("entry.17754293") !== "Yes") fail("consent value " + p.get("entry.17754293"));
    console.log("Sent body:", r.body);
  }
  console.log("Success message:", await page.textContent("#suMsg"));
  // 5. Network failure
  mode = "fail";
  await page.fill("#suEmail", "maria@example.com");
  await page.check("#suConsent");
  await page.click("#suBtn");
  await page.waitForSelector("#suMsg.form-msg.bad", { timeout: 5000 }).catch(() => fail("no error message on network failure"));
  console.log("Error message:", await page.textContent("#suMsg"));
  if (!(await page.isEnabled("#suBtn"))) fail("button stuck disabled");

  await browser.close();
  console.log(failures ? "FAILED: " + failures : "PASSED");
  process.exit(failures ? 1 : 0);
})();
