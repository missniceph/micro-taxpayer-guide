# Micro Taxpayer Guide

A free, mobile-first guide by **Nice to Know ([@missniceph](https://instagram.com/missniceph))**. It helps Filipino self-employed people, freelancers and small business owners find out whether they are a BIR **micro taxpayer** and what that means for them.

- Plain HTML, CSS and JavaScript. No backend, no tracking, no ads, no paid services.
- Checker answers stay in the browser. They are never saved or sent.
- The only thing ever sent anywhere is the optional email sign-up (email + consent) to a Google Form.

---

## What's here and how to update it

| File | What it is | When to edit it |
|---|---|---|
| `js/facts.js` | **Every** fact, source, deadline and FAQ answer on the site | Whenever a rule, date or source changes. **This is the main file.** |
| `js/config.js` | Google Form settings for the email sign-up, and your privacy contact email | Only if you make a new form or change your contact email |
| `index.html` | Page layout, intro wording, page title and share-preview text | To change the intro, title or share text |
| `js/app.js` | Checker logic: which facts to show for which answers, and the checklist lines | Rarely (see the placeholder list below) |
| `css/styles.css` | Colors and layout, light and dark mode | Rarely |
| `assets/` | Favicon, home-screen icon and the share preview image (`og-image.png`, drawn from `og-image.svg`) | To change the share image |
| `tests/` | Automatic checks (optional, see "Testing") | No |

**Quick updates**

- **A fact changed:** edit its `text` and `src` in `js/facts.js` (see "How to edit a fact" below).
- **Filled in a [To confirm] item:** see "How to fill in the [To confirm] items" below.
- **New month:** change `AS_OF` at the top of `js/facts.js`.
- **New year:** see "How to update deadlines next year" below.
- **Abatement deadline extended:** see "The abatement countdown" below.
- **New Google Form:** see "Connect or change the email sign-up" below.

Edit on GitHub: open the file, tap the ✏️ pencil, make the change, then tap **Commit changes**. The live site updates in a minute or two.

---

## How to edit a fact

1. Open `js/facts.js` (on GitHub: click the file, then the ✏️ pencil icon).
2. Find the fact. Each one looks like this:

   ```js
   microDef: { text: "You are a Micro taxpayer if your gross sales are less than ₱3,000,000 for a taxable year.", src: CLASSIFY },
   ```

   - `text` is what readers see. Keep it short and plain.
   - `src` is the source shown in small text under the fact. It can be a group name (`CLASSIFY`, `CONCESSIONS`, `RETURN`, `ABATE`) or a list like `["RMC 30-2026"]`.
3. Change only the words inside the quotes. Keep the quotes, commas and brackets.
4. Click **Commit changes**. GitHub Pages updates the site in a minute or two.

**Adding a new source issuance:** add a line to `SOURCES` near the top of `js/facts.js`, for example:

```js
"RMC 99-2027": { name: "Revenue Memorandum Circular No. 99-2027 (March 2027)", usedFor: "What this guide uses it for" },
```

Then use `"RMC 99-2027"` in any fact's `src`. Every source in `SOURCES` shows up in the footer's source list.

**Changing the "As of" date:** edit `AS_OF` near the top of `js/facts.js` (e.g. `"January 2027"`). It updates the disclaimers and copied checklists.

---

## How to fill in the [To confirm] items

Every placeholder is the text `[To confirm]`. The site shows it as a yellow highlighted label. To find them all, open `js/facts.js` and search for `TBC` (that's the code name for `[To confirm]`).

To fill one in, replace the `TBC` part with real words, and replace `[TBC]` in `src` with the real source. Example:

Before:

```js
percentageTax: { text: "Percentage tax rate: " + TBC, src: [TBC] },
```

After:

```js
percentageTax: { text: "Percentage tax rate: (your confirmed wording here).", src: ["RR 00-0000"] },
```

(Remember to add that issuance to `SOURCES` if it's new.)

### Placeholders left to fill in

In `js/facts.js`:

| Key | What's missing |
|---|---|
| `percentageTax` | Percentage tax rate (text and source) |
| `eightPercent` | 8% income tax option, including the ₱250,000 rule (text and source) |
| `books` | Books of accounts requirements for micro taxpayers (text and source) |
| `invoicing` | Invoicing requirements under RR 7-2024 (text). Source is already RR 7-2024 |
| `SOURCES["RR 7-2024"].usedFor` | Says "Invoicing requirements (details [To confirm])" — update once filled |
| `corpReturn` | Which annual income tax return corporations and partnerships use (not in the fact base) |
| `annualDeadline` | **Source** for "normal annual deadline is April 15" |
| `form1701q` | **Source** for the 2026 1701Q dates (May 15, Aug 15, Nov 15) |
| `form2551q` | **Source** for the 2551Q "25th day after the quarter ends" rule |
| `DEADLINES.dates` | **Source** for the 2551Q Q1 and three 1701Q entries |
| `DEADLINES.rules` | **Source** for all three standing rules |

Also in `js/app.js` (these repeat the placeholders above, so they fill in automatically once you update facts.js, except these lines with their own text):

- Checklist item for corporations: "Find out which annual return applies to my corporation or partnership: [To confirm]"
- Checklist item: "If I file BIR Form 2551Q … Percentage tax rate: [To confirm]"
- Checklist items: "Check the books of accounts I need to keep: [To confirm]" and "Check invoicing requirements: [To confirm]"
- Footer source list line: "[To confirm] — Source issuance for the 1701Q and 2551Q quarterly deadlines and the April 15 annual deadline is being confirmed." (in `renderSources`). Delete this line once those sources are filled in.

In `js/config.js`:

| Setting | What's missing |
|---|---|
| `privacyContactEmail` | Done: delacruzcrystaleunice@gmail.com. Change it here if needed |

Tip: in `js/app.js`, search for `TBC` to find the checklist lines.

---

## How to update deadlines next year

1. Open `js/facts.js` and find `DEADLINES`.
2. Change `year` (e.g. `2027`).
3. Replace each entry in `dates`. Each looks like:

   ```js
   { date: "2027-05-15", title: "BIR Form 1701Q, Q1", note: "Quarterly income tax for individuals.", src: ["RMC 00-2027"] },
   ```

   - `date` must be written `YYYY-MM-DD`.
   - The site works out "Passed", "Next up" and "Upcoming" by itself, using Philippine time.
4. Update the matching facts too: `form1701q`, `annualDeadline`, `ty2025` (or rename it to the new year), and the 1701Q checklist line in `js/app.js` (search for `Mark the 1701Q deadlines`).
5. Update the section heading text "Key 2026 dates" in `index.html` if you like.

### The abatement countdown

The countdown uses `ABATEMENT_DEADLINE` in `js/facts.js`:

```js
label: "December 31, 2026",
iso: "2026-12-31T23:59:59+08:00",
```

If the Secretary of Finance extends the deadline, change both `label` and `iso` (keep the `+08:00` at the end, which means Philippine time), and update the `abateDeadline` fact and the "Do all of this before December 31, 2026" checklist line in `js/app.js`. After the deadline passes, the site automatically says the deadline has passed.

---

## Connect or change the email sign-up

The sign-up box appears on the result page, after the checklist. It is optional and never blocks the result.

**Where the settings live:** `js/config.js`. It currently points to your Google Form:

```js
formResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScmW6NcLSSLixJEOIKIRzrnKgjZgpMM5fGZVlzAK_TPWFbadA/formResponse",
entries: {
  email: "entry.556632391",
  consent: "entry.17754293"
},
consentValue: "Yes",
```

**What gets sent:** only the email and, when the consent box is ticked, `Yes` for the consent field. The site checks the email format and requires the consent box before sending anything. Checker answers are never sent.

**How it sends:** a `POST` request with `mode: "no-cors"`. Google doesn't let the page read the reply, so the site shows the success message once the request is sent, and an error message only if the network request itself fails (e.g. no internet). That also means if the entry IDs are wrong, Google silently drops the answer while the site still says "success". Always test with a real submission after changing anything (see step 5 below).

### If you make a new form

1. In Google Forms, create your questions: one short-answer for **email**, one checkbox for **consent** with a single option whose text is exactly `Yes` (or change `consentValue` to match your option text exactly).
2. **Get the submission URL:** open the form's share link. It ends in `/viewform`. Change the end to `/formResponse`. Paste it into `formResponseUrl`.
3. **Get the entry IDs:** in the form editor, click ⋮ → **Get pre-filled link**, type anything into each field, click **Get link** and paste it somewhere. You'll see parts like `entry.556632391=...`. Copy each `entry.NUMBER` into `entries.email` and `entries.consent`.
4. In Google Forms settings, turn **off** "Collect email addresses" and "Limit to 1 response" / sign-in requirements. Otherwise Google rejects submissions from the site.
5. Commit, wait for the site to update, then submit your own email on the live site and check it appears in the form's **Responses** tab.

The text people see next to the consent box is `consentLabel` in the same file. The deletion contact is `privacyContactEmail`.

To turn the sign-up off temporarily, set `formResponseUrl` to `"PLACEHOLDER_FORM_RESPONSE_URL"`. The box then shows "Email sign-up isn't open yet" and sends nothing.

> Note: Google Forms can't email people automatically. Sending the checklist and the December reminder is something you'll do yourself from the response sheet (or with a mailing tool). Because checker answers are never sent, the email checklist will be a general one, not each person's personalised list.

---

## Share preview and icons

When someone shares the link on Facebook, Messenger, Viber or X, they see `assets/og-image.png` with the title and description from the `og:` lines in `index.html`.

- **To change the share text:** edit the `og:title` and `og:description` lines in `index.html`.
- **To change the image:** edit the words in `assets/og-image.svg` (it's plain text), then convert it to a 1200×630 PNG with any SVG-to-PNG converter and save it as `assets/og-image.png`.
- **If you move the site to your own domain:** update the web address in the `canonical`, `og:url` and `og:image` lines.
- **Facebook keeps showing an old preview:** paste the link into Facebook's Sharing Debugger and click **Scrape Again**.

---

## Publish on GitHub Pages

1. On GitHub: **Settings → Pages**.
2. Under "Build and deployment", choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
3. The site appears at `https://missniceph.github.io/micro-taxpayer-guide/` within a few minutes.

---

## Testing (optional, for developers)

With [Playwright](https://playwright.dev) installed:

```bash
python3 -m http.server 8765
```

```bash
node tests/check-all-paths.js
```

```bash
node tests/check-signup.js
```

```bash
node tests/check-features.js
```

- `check-all-paths.js` clicks through every combination of checker answers (540 paths) at phone (360px), tablet (768px) and laptop (1280px) widths. It checks each result for missing sections, unsourced facts, layout overflow, errors and unexpected network requests.
- `check-signup.js` checks the sign-up form's validation and confirms that only email and consent are sent. It intercepts the request, so nothing reaches your real form.
- `check-features.js` checks the buttons and edge cases: Back (on the page and the phone's own Back button), Change my answers, Start over, double-taps, the theme and language buttons, copying the checklist, the FAQ, and keyboard use.

---

## Disclaimer

General information only, not tax advice. Confirm with your Revenue District Office (RDO) or a tax professional.
