/* Micro Taxpayer Guide — app logic.
   All facts come from js/facts.js. This file only decides WHICH facts to
   show for a set of answers. Nothing is stored (no cookies, no
   localStorage) and checker answers are never sent anywhere. */

(function () {
  "use strict";

  const { TBC, AS_OF, SOURCES, F, ABATEMENT_DEADLINE, DEADLINES, FAQ } = window.FACTS;
  const CFG = window.SIGNUP_CONFIG || {};
  const WS = window.WORKSHEETS_CONFIG || {};
  const $ = (sel, root) => (root || document).querySelector(sel);

  /* ---------------- Helpers ---------------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  // Escape, then highlight every [To confirm] placeholder.
  function rich(s) {
    return esc(s).split(esc(TBC)).join('<span class="tbc">' + esc(TBC) + "</span>");
  }
  function srcHtml(src) {
    return '<small class="src">' + src.map(rich).join(", ") + "</small>";
  }
  function factHtml(key, opts) {
    const f = F[key];
    if (!f) throw new Error("Unknown fact: " + key);
    opts = opts || {};
    let body = "<p>" + rich(f.text) + "</p>";
    if (f.table) {
      body += '<table class="tier-table"><caption class="sr-only">Taxpayer groups by gross sales</caption><tbody>' + f.table.map(r =>
        '<tr' + (opts.highlight === r[0] ? ' class="me"' : "") + '><th scope="row">' + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"
      ).join("") + "</tbody></table>";
    }
    return '<div class="fact">' + body + srcHtml(f.src) + "</div>";
  }
  function factsHtml(keys, opts) { return keys.map(k => factHtml(k, opts)).join(""); }
  function srcText(src) { return "(Source: " + src.join(", ") + ")"; }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* Philippine time helpers (UTC+8, no DST) */
  const PH_OFFSET_MS = 8 * 3600 * 1000;
  function phTodayISO(now) {
    return new Date((now || Date.now()) + PH_OFFSET_MS).toISOString().slice(0, 10);
  }
  function fmtDate(iso, opts) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", Object.assign({ timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }, opts || {}));
  }
  function timeLeft() {
    const ms = new Date(ABATEMENT_DEADLINE.iso).getTime() - Date.now();
    if (ms <= 0) return null;
    return {
      days: Math.floor(ms / 86400000),
      hours: Math.floor(ms / 3600000) % 24,
      mins: Math.floor(ms / 60000) % 60
    };
  }

  /* ---------------- Static sections ---------------- */

  document.querySelectorAll("[data-asof]").forEach(el => { el.textContent = AS_OF; });

  $("#introFacts").innerHTML = factsHtml(["microDef", "grossSales"]);

  function renderTopCountdown() {
    const el = $("#topCountdown");
    const t = timeLeft();
    if (!t) {
      el.innerHTML = "<p><strong>The One-Time Abatement Program deadline (" + esc(ABATEMENT_DEADLINE.label) + ") has passed</strong> unless it was extended. Check with your RDO." + srcHtml(ABATEMENT_DEADLINE.src) + "</p>";
      return;
    }
    el.innerHTML =
      '<div class="cd-num"><b>' + t.days + "</b><small>" + (t.days === 1 ? "day" : "days") + " left</small></div>" +
      "<p><strong>Old BIR problems?</strong> The One-Time Abatement Program for micro taxpayers ends <strong>" + esc(ABATEMENT_DEADLINE.label) + "</strong>. " +
      '<a href="#checker">Check if it may apply to you</a>.' + srcHtml(ABATEMENT_DEADLINE.src) + "</p>";
  }

  function renderDeadlines() {
    const today = phTodayISO();
    $("#todayLabel").textContent = fmtDate(today, { weekday: "long" });
    const items = DEADLINES.dates.slice().sort((a, b) => a.date.localeCompare(b.date));
    const nextDate = (items.find(d => d.date >= today) || {}).date;
    $("#deadlineList").innerHTML = items.map(d => {
      const cls = d.date < today ? "past" : d.date === nextDate ? "next" : "soon";
      const label = cls === "past" ? "Passed" : cls === "next" ? (d.date === today ? "Today" : "Next up") : "Upcoming";
      const mon = fmtDate(d.date, { month: "short", day: undefined, year: undefined });
      const day = Number(d.date.slice(8, 10));
      return '<li class="' + cls + '"><div class="dl-date" aria-hidden="true"><small>' + esc(mon) + "</small><b>" + day + "</b></div>" +
        '<div class="dl-body"><h3>' + esc(d.title) + ' <span class="status ' + cls + '">' + label + "</span></h3>" +
        "<p><span class=\"sr-only\">" + esc(fmtDate(d.date)) + ". </span>" + rich(d.note) + "</p>" + srcHtml(d.src) + "</div></li>";
    }).join("");
    $("#deadlineRules").innerHTML = DEADLINES.rules.map(r => "<li>" + rich(r.text) + srcHtml(r.src) + "</li>").join("");
  }

  function renderFaq() {
    $("#faqList").innerHTML = FAQ.map(item =>
      "<details><summary>" + esc(item.q) + '</summary><div class="faq-a">' + factsHtml(item.a) + "</div></details>"
    ).join("");
  }

  function renderSources() {
    $("#sourceList").innerHTML = Object.keys(SOURCES).map(k =>
      '<li><span class="k">' + esc(k) + "</span> — " + esc(SOURCES[k].name) + '<span class="u">Used for: ' + rich(SOURCES[k].usedFor) + "</span></li>"
    ).join("") + '<li><span class="k"><span class="tbc">' + esc(TBC) + "</span></span> — Source issuance for the 1701Q and 2551Q quarterly deadlines and the April 15 annual deadline is being confirmed.</li>";
  }

  /* ---------------- Theme & language toggles ---------------- */
  // Theme is kept in memory only (nothing stored on the device).
  const themes = ["auto", "light", "dark"];
  let theme = "auto";
  $("#themeToggle").addEventListener("click", () => {
    theme = themes[(themes.indexOf(theme) + 1) % themes.length];
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
    $("#themeLabel").textContent = theme[0].toUpperCase() + theme.slice(1);
    $("#themeIcon").textContent = theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "🌓";
    $("#themeToggle").setAttribute("aria-label", "Color theme: " + $("#themeLabel").textContent + ". Tap to change.");
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      m.setAttribute("content", theme === "auto" ? m.dataset.auto : theme === "dark" ? "#161a1a" : "#fbf7f1");
    });
  });
  // Placeholder for the future Filipino version.
  $("#langToggle").addEventListener("click", () => toast("Malapit na ang Filipino version. Abangan!"));

  /* ---------------- Checker ---------------- */

  const STEPS = [
    {
      id: "entity",
      title: "Who is filing?",
      help: "Pick the one that describes how you are registered (or would register) with the BIR.",
      options: [
        { v: "individual", ico: "🧑", label: "An individual", sub: "Self-employed, freelancer, professional, or mixed-income earner" },
        { v: "corp", ico: "🏢", label: "A corporation or partnership" }
      ]
    },
    {
      id: "mixed",
      dep: "entity",
      when: s => s.entity === "individual",
      title: "Do you also get a salary from an employer?",
      help: "Earning both a salary and business or freelance income is called mixed income.",
      options: [
        { v: "no", ico: "💼", label: "No, only business or freelance income" },
        { v: "yes", ico: "🔀", label: "Yes, salary plus business or freelance income", sub: "Mixed-income earner" }
      ]
    },
    {
      id: "reg",
      title: "When did you register with the BIR?",
      help: "This affects your starting classification.",
      options: [
        { v: "early", ico: "📅", label: "In 2023 or 2024, before April 27, 2024" },
        { v: "older", ico: "🗂️", label: "Before 2023" },
        { v: "late", ico: "🆕", label: "After April 27, 2024" },
        { v: "none", ico: "✏️", label: "I'm not registered yet" },
        { v: "unsure", ico: "🤔", label: "I'm not sure" }
      ]
    },
    {
      id: "mixedNote",
      dep: "mixed",
      when: s => s.mixed === "yes",
      info: true,
      title: "Quick reminder for mixed-income earners",
      body: () => '<div class="note-box">' + factHtml("mixed") + "</div><p>So for the next question, think only about your business or freelance sales. Leave out your salary.</p>",
      cta: "Got it, continue"
    },
    {
      id: "sales",
      title: s => s.mixed === "yes" ? "Are your annual gross sales from your business below ₱3,000,000?" : "Are your annual gross sales below ₱3,000,000?",
      help: () => factHtml("grossSales"),
      options: [
        { v: "below", ico: "✅", label: "Yes, below ₱3,000,000" },
        { v: "above", ico: "📈", label: "No, ₱3,000,000 or more" },
        { v: "unsure", ico: "🤔", label: "I'm not sure" }
      ]
    },
    {
      id: "vat",
      title: "Are you VAT-registered?",
      help: s => s.reg === "none" ? "If you are not registered yet, choose \"No\"." : "If you don't know, choose \"I'm not sure\".",
      options: [
        { v: "no", ico: "➖", label: "No" },
        { v: "yes", ico: "🧾", label: "Yes, I'm VAT-registered" },
        { v: "unsure", ico: "🤔", label: "I'm not sure" }
      ]
    },
    {
      id: "issues",
      multi: true,
      title: "Do any of these apply to you?",
      help: "Pick all that apply. This helps check if the One-Time Abatement Program may help.",
      options: [
        { v: "unfiled", ico: "📭", label: "Old returns I never filed" },
        { v: "unpaid", ico: "💸", label: "Taxes I haven't paid" },
        { v: "assessment", ico: "📨", label: "A BIR assessment or notice", sub: "Preliminary or final, disputed or not" },
        { v: "stopped", ico: "🚪", label: "A business I stopped but never closed with the BIR" },
        { v: "none", ico: "🙂", label: "None of these", exclusive: true },
        { v: "unsure", ico: "🤔", label: "I'm not sure", exclusive: true }
      ],
      cta: "See my result"
    }
  ];

  let state = {};
  let trail = []; // previous step indexes, for Back
  let stepIndex = 0;

  const val = (x, s) => (typeof x === "function" ? x(s) : x);
  // Steps whose deciding answer isn't given yet are counted, so the
  // "of N" total can only shrink as you answer, never grow.
  function stepCounts(st, s) {
    if (!st.when || st.when(s)) return true;
    if (!st.dep || s[st.dep] !== undefined) return false;
    const parent = STEPS.find(x => x.id === st.dep);
    return stepCounts(parent, s); // only if the deciding question will be asked
  }
  const activeSteps = s => STEPS.filter(st => stepCounts(st, s));

  function resetState() { state = { issues: [] }; trail = []; stepIndex = 0; }

  function renderStep(focus) {
    const steps = activeSteps(state);
    const step = STEPS[stepIndex];
    const pos = steps.indexOf(step);
    const total = steps.length;
    $("#progressBar").style.width = Math.round((pos / total) * 100) + "%";
    $("#stepCount").textContent = "Question " + (pos + 1) + " of " + total;
    $("#backBtn").hidden = trail.length === 0;

    let html = '<h3 tabindex="-1" id="stepTitle">' + esc(val(step.title, state)) + "</h3>";
    const help = val(step.help, state);
    if (help) html += '<div class="help">' + (help.startsWith("<") ? help : "<p>" + esc(help) + "</p>") + "</div>";

    if (step.info) {
      html += step.body(state);
      html += '<button type="button" class="btn btn-primary btn-lg continue" data-continue>' + esc(step.cta) + " →</button>";
    } else if (step.multi) {
      const sel = state[step.id] || [];
      html += '<div class="options" role="group" aria-labelledby="stepTitle">' + step.options.map(o =>
        '<button type="button" class="opt" role="checkbox" aria-checked="' + sel.includes(o.v) + '" data-v="' + o.v + '"' + (o.exclusive ? " data-exclusive" : "") + ">" +
        '<span class="box" aria-hidden="true">✓</span><span>' + esc(o.label) + (o.sub ? '<span class="opt-sub">' + esc(o.sub) + "</span>" : "") + "</span></button>"
      ).join("") + "</div>";
      html += '<button type="button" class="btn btn-primary btn-lg continue" data-continue' + (sel.length ? "" : " disabled") + ">" + esc(step.cta) + " →</button>";
      html += '<p class="help" id="multiHint">' + (sel.length ? "" : "Pick at least one option to continue.") + "</p>";
    } else {
      html += '<div class="options">' + step.options.map(o =>
        '<button type="button" class="opt" aria-pressed="' + (state[step.id] === o.v) + '" data-v="' + o.v + '">' +
        '<span class="ico" aria-hidden="true">' + o.ico + "</span><span>" + esc(o.label) + (o.sub ? '<span class="opt-sub">' + esc(o.sub) + "</span>" : "") + "</span></button>"
      ).join("") + "</div>";
    }
    $("#stepBody").innerHTML = html;
    if (focus) $("#stepTitle").focus({ preventScroll: true });
  }

  function nextStep() {
    for (let i = stepIndex + 1; i < STEPS.length; i++) {
      if (!STEPS[i].when || STEPS[i].when(state)) {
        trail.push(stepIndex);
        stepIndex = i;
        pushNav();
        renderStep(true);
        scrollToChecker();
        return;
      }
    }
    pushNav();
    showResult();
  }

  /* Phone/browser Back button: each new screen adds a browser history
     entry, so Back goes to the previous question instead of leaving
     the page. Nothing is written to the address bar or stored. */
  let navDepth = 0;
  let restarting = false;
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) { /* ignore */ }

  function pushNav() {
    try { history.pushState({ mtg: navDepth + 1 }, ""); navDepth++; } catch (e) { /* ignore */ }
  }
  function backOne() {
    if (!$("#result").hidden) { hideResult(); return; }
    if (!trail.length) return;
    stepIndex = trail.pop();
    renderStep(true);
    scrollToChecker();
  }
  function goBack() {
    if (navDepth > 0) history.back();
    else backOne();
  }
  window.addEventListener("popstate", e => {
    const d = (e.state && e.state.mtg) || 0;
    if (restarting) { restarting = false; navDepth = d; doRestart(); return; }
    if (d > navDepth) { history.go(navDepth - d); return; } // Forward: stay put
    while (navDepth > d) { navDepth--; backOne(); }
  });

  function hideResult() {
    $("#result").hidden = true;
    $("#resultBody").innerHTML = "";
    $("#checker").hidden = false;
    renderStep(true);
    $("#checker").scrollIntoView({ block: "start" });
  }
  function doRestart() {
    resetState();
    $("#result").hidden = true;
    $("#resultBody").innerHTML = "";
    $("#checker").hidden = false;
    renderStep(true);
    $("#checker").scrollIntoView({ block: "start" });
  }
  function restart() {
    if (navDepth > 0) { restarting = true; history.go(-navDepth); }
    else doRestart();
  }

  // Links to the checker while a result is showing go to the result instead.
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href="#checker"]');
    if (a && $("#checker").hidden) {
      e.preventDefault();
      $("#result").scrollIntoView({ block: "start" });
      $("#resultTitle").focus({ preventScroll: true });
    }
  });

  function scrollToChecker() {
    const card = $("#checkerCard");
    const top = card.getBoundingClientRect().top;
    if (top < 60 || top > window.innerHeight * 0.4) card.scrollIntoView({ block: "start" });
  }

  $("#stepBody").addEventListener("click", e => {
    const step = STEPS[stepIndex];
    const opt = e.target.closest(".opt");
    // e.detail > 1 is the 2nd tap of a double-tap: ignore it so it can't
    // answer the next question by accident.
    if (e.target.closest("[data-continue]")) { if (e.detail <= 1) nextStep(); return; }
    if (!opt) return;
    const v = opt.dataset.v;
    if (step.multi) {
      let sel = (state[step.id] || []).slice();
      if (sel.includes(v)) sel = sel.filter(x => x !== v);
      else if (opt.hasAttribute("data-exclusive")) sel = [v];
      else sel = sel.filter(x => !step.options.find(o => o.v === x).exclusive).concat(v);
      state[step.id] = sel;
      step.options.forEach(o => {
        const b = $('.opt[data-v="' + o.v + '"]', $("#stepBody"));
        b.setAttribute("aria-checked", sel.includes(o.v));
      });
      $("[data-continue]").disabled = sel.length === 0;
      $("#multiHint").textContent = sel.length ? "" : "Pick at least one option to continue.";
    } else {
      if (e.detail > 1) return;
      state[step.id] = v;
      // Clear answers to steps that no longer apply (e.g. switched to corporation).
      if (step.id === "entity" && v === "corp") delete state.mixed;
      nextStep();
    }
  });

  $("#backBtn").addEventListener("click", goBack);

  /* ---------------- Result logic ---------------- */

  function classify(s) {
    const r = { reasons: [], highlight: null };
    const vatYes = s.vat === "yes";
    if (s.sales === "above") {
      r.tone = "no";
      r.label = "Probably not Micro";
      r.short = "Probably not Micro (gross sales ₱3,000,000 or more)";
      r.summary = "You said your gross sales are ₱3,000,000 or more. Micro is for gross sales below ₱3,000,000. You are likely Small or bigger, depending on your sales.";
      r.reasons.push("tiers");
      r.highlight = "Small";
      return r;
    }
    if (s.sales === "unsure") {
      r.tone = "mid";
      r.label = "Not sure yet";
      r.short = "Not sure yet (need to work out gross sales)";
      r.summary = "Your classification depends on your gross sales for the taxable year. Work out your gross sales first, then check the table below.";
      r.reasons.push("grossSales", "tiers");
      if (s.reg === "early") r.reasons.push("initialEarly", "stays");
      if (s.reg === "late" || s.reg === "none") r.reasons.push("initialLate");
      return r;
    }
    // Below ₱3M
    r.highlight = "Micro";
    if (s.reg === "early" && vatYes) {
      r.tone = "mid";
      r.label = "Micro by sales, but likely starting as Small";
      r.short = "Micro by sales; likely initially classified as Small because VAT-registered";
      r.summary = "Your sales fit Micro. But because you registered in 2023 or 2024 before April 27, 2024 and you are VAT-registered, the BIR likely started you as Small. That stays until you are reclassified.";
      r.reasons.push("microDef", "initialEarly", "stays", "reclass");
    } else if (s.reg === "early") {
      r.tone = "good";
      r.label = "Likely Micro";
      r.short = "Likely Micro";
      r.summary = "Your sales are below ₱3,000,000, and taxpayers who registered in 2023 or 2024 before April 27, 2024 start as Micro (unless VAT-registered).";
      r.reasons.push("microDef", "initialEarly", "stays");
      if (s.vat === "unsure") r.reasons.push("reclass");
    } else if (s.reg === "late") {
      r.tone = "good";
      r.label = "Likely Micro";
      r.short = "Likely Micro (check what you declared when you registered)";
      r.summary = "Your sales are below ₱3,000,000. Because you registered after April 27, 2024, your starting classification depends on what you declared in your registration form.";
      r.reasons.push("microDef", "initialLate", "stays", "reclass");
    } else if (s.reg === "none") {
      r.tone = "good";
      r.label = "Likely Micro once you register";
      r.short = "Likely Micro once registered";
      r.summary = "Your expected sales are below ₱3,000,000. When you register, your starting classification is based on what you declare in your registration form.";
      r.reasons.push("microDef", "initialLate", "stays");
    } else {
      r.tone = "good";
      r.label = "Likely Micro";
      r.short = "Likely Micro (confirm your current classification with your RDO)";
      r.summary = "Your sales are below ₱3,000,000, which fits the Micro group. Confirm your current classification with your RDO.";
      r.reasons.push("microDef");
      if (s.reg === "older" || s.reg === "unsure") r.reasons.push("initial2022");
      if (s.reg === "unsure") r.reasons.push("initialEarly", "initialLate");
      r.reasons.push("stays", "reclass");
    }
    if (s.vat === "yes" && s.reg !== "early") r.vatNote = true;
    return r;
  }

  function abatementStatus(s) {
    const issues = s.issues || [];
    const hasIssue = issues.some(x => ["unfiled", "unpaid", "assessment", "stopped"].includes(x));
    if (s.sales === "above") return { pill: "no", label: "Likely does not apply", why: "The program is for micro taxpayers with gross sales not exceeding ₱3,000,000." };
    if (issues.includes("none")) return { pill: "no", label: "Probably not needed", why: "You said none of these apply to you. Keep this in mind in case you find old issues later." };
    if (s.reg === "none" && !hasIssue) return { pill: "no", label: "Probably not needed", why: "You are not registered yet, so old BIR cases are unlikely." };
    if (s.sales === "unsure") return { pill: "mid", label: "May apply. Check your gross sales first", why: "The program needs gross sales not exceeding ₱3,000,000." };
    if (issues.includes("unsure")) return { pill: "mid", label: "May apply. Check your BIR records", why: "Ask your RDO if you have open cases or unpaid accounts." };
    return { pill: "good", label: "May apply to you", why: "Based on your answers, you may have a case the program covers. Check the conditions below." };
  }

  function buildChecklist(s, c, ab) {
    const L = [];
    const add = (text, src) => L.push({ text, src });
    const ind = s.entity === "individual";

    if (s.sales !== "below") add("Work out my gross sales for the taxable year: total sales revenue, net of VAT, without other deductions.", F.grossSales.src);
    if (s.mixed === "yes") add("Count only my business income (not my salary) for classification.", F.mixed.src);
    if (s.reg === "none") add("Register with the BIR. My starting classification will be based on what I declare in BIR Form 1901 or 1903.", F.initialLate.src);
    else add("Confirm my current classification with my RDO.", F.stays.src);
    if ((s.reg === "early" && s.vat === "yes") || s.reg === "late" || s.reg === "older" || s.reg === "unsure" || s.vat === "unsure")
      add("If my classification is wrong, ask to be reclassified (for example, through ORUS at orus.bir.gov.ph). It takes effect once I get the BIR's notice.", F.reclass.src);

    if (ind) {
      if (s.sales !== "above") add("Get the Offline eBIRForms Package version 7.9.6 or later from bir.gov.ph to file BIR Form 1701-MS.", F.ebirforms.src);
      add("Mark the 1701Q deadlines: May 15, August 15 and November 15, 2026.", F.form1701q.src);
      add("Mark the annual income tax return deadline (normally April 15).", F.annualDeadline.src);
    } else {
      add("Find out which annual return applies to my corporation or partnership: " + TBC, [TBC]);
    }
    add("If I file BIR Form 2551Q, mark the 25th day after each quarter ends. Percentage tax rate: " + TBC, F.form2551q.src);
    add("Check the books of accounts I need to keep: " + TBC, F.books.src);
    add("Check invoicing requirements: " + TBC, F.invoicing.src);

    if (ab.pill !== "no") {
      add("Check that my covered basic tax liabilities and/or penalties are not more than ₱80,000 per taxable year.", F.abateWho.src);
      add("Check that my case is a delinquent account, a preliminary or final assessment, or an open stop-filer case as of December 31, 2025.", F.abateCovers.src);
      add("File BIR Form 2121 in three copies with the RDO where I'm registered.", F.abateStep1.src);
      add("Pay the ₱5,000 abatement fee per approved application with BIR Form 0605 (ATC " + (ind ? "MC350 for individuals" : "MC351 for corporations") + ").", F.abateStep2.src);
      add("Keep my Certificate of Availment confirming my case is closed.", F.abateStep3.src);
      add("Do all of this before December 31, 2026.", F.abateDeadline.src);
    }
    if ((s.issues || []).includes("stopped")) add("Look into the BIR's simplified process for closing a business registration.", F.closeBusiness.src);
    return L;
  }

  function countdownBig() {
    const t = timeLeft();
    if (!t) return '<div class="countdown-big" id="bigCountdown"><p class="label">The deadline (' + esc(ABATEMENT_DEADLINE.label) + ") has passed, unless it was extended.</p>" + srcHtml(ABATEMENT_DEADLINE.src) + "</div>";
    const u = (n, l) => '<div class="unit"><b>' + n + "</b><small>" + l + "</small></div>";
    return '<div class="countdown-big" id="bigCountdown" role="timer" aria-label="' + t.days + ' days left before the abatement deadline">' +
      '<p class="label">Time left to apply</p>' +
      '<div class="units" aria-hidden="true">' + u(t.days, t.days === 1 ? "day" : "days") + u(t.hours, "hours") + u(t.mins, "mins") + "</div>" +
      "<p>" + rich(F.abateDeadline.text) + "</p>" + srcHtml(F.abateDeadline.src) + "</div>";
  }

  let checklist = [];
  let done = [];
  let lastClass = null;

  function showResult() {
    const s = state;
    const c = classify(s);
    const ab = abatementStatus(s);
    const ind = s.entity === "individual";
    lastClass = c;
    checklist = buildChecklist(s, c, ab);
    done = checklist.map(() => false);

    let n = 0;
    const block = (title, inner) => '<section class="card r-block"><h3><span class="num" aria-hidden="true">' + (++n) + "</span>" + esc(title) + "</h3>" + inner + "</section>";

    let html = '<div class="result-head tone-' + c.tone + '"><p class="kicker">Your likely classification</p>' +
      '<h2 id="resultTitle" tabindex="-1">' + esc(c.label) + "</h2><p>" + esc(c.summary) + "</p>" +
      '<p class="fine">Based on your answers only. ' + (ind ? (s.mixed === "yes" ? "Individual, mixed income." : "Individual.") : "Corporation or partnership.") + "</p></div>";

    // 1. Why
    let why = factsHtml(c.reasons, { highlight: c.highlight });
    if (s.mixed === "yes") why += factHtml("mixed");
    if (c.vatNote) why += '<p class="help">You said you are VAT-registered. The rules in this guide only link VAT registration to the starting classification of taxpayers who registered in 2023 or 2024 before April 27, 2024, or who did not file their annual ITR for taxable year 2022. Confirm your classification with your RDO.</p>';
    html += block("Why", why);

    // 2. Benefits
    let ben;
    if (s.sales === "above") {
      ben = '<span class="pill mid">If you are Small (₱3,000,000 to less than ₱20,000,000)</span><p>These concessions are for micro <em>and</em> small taxpayers:</p>' + factsHtml(["penalty", "interest", "shortReturn", "concessionsStart"]);
    } else {
      ben = '<span class="pill good">' + (s.sales === "unsure" ? "If you are Micro or Small" : "Applies to micro and small taxpayers") + "</span>" + factsHtml(["penalty", "interest", "shortReturn", "concessionsStart"]);
    }
    html += block("Benefits that may apply", ben);

    // 3. Annual return
    let ret;
    if (ind) {
      ret = (s.sales === "above" ? '<span class="pill mid">If you are classified as Small</span>' : "") +
        factsHtml(["form1701ms", "ebirforms", "altForms", "annualDeadline", "ty2025"]);
    } else {
      ret = factHtml("corpReturn") + '<p class="help">BIR Form 1701-MS is for individuals only.</p>' + factHtml("form1701ms");
    }
    html += block("Your annual return", ret);

    // 4. Abatement
    let abHtml = '<span class="pill ' + ab.pill + '">' + esc(ab.label) + "</span><p>" + esc(ab.why) + "</p>";
    if (ab.pill !== "no") {
      abHtml += countdownBig();
      abHtml += "<h4>Who it's for</h4>" + factsHtml(["abateWho", "abateCovers", "abateWithholding"]);
      abHtml += "<h4>Check these conditions</h4><ul class=\"condlist\">" +
        "<li>Gross sales not exceeding ₱3,000,000.</li>" +
        "<li>Covered basic tax liabilities and/or penalties of not more than ₱80,000 per taxable year.</li>" +
        "<li>Your case is a delinquent account, a preliminary or final assessment (disputed or not), or an open stop-filer case as of December 31, 2025.</li></ul>" + srcHtml(F.abateWho.src);
      abHtml += "<h4>Steps</h4><ol class=\"steps\">" +
        ["abateStep1", "abateStep2", "abateStep3"].map(k => "<li>" + rich(F[k].text) + srcHtml(F[k].src) + "</li>").join("") + "</ol>";
      abHtml += factsHtml(["abateNoAudit", "abateFee"]);
    } else {
      abHtml += factHtml("abateWho") + '<p class="fine">Deadline: ' + esc(ABATEMENT_DEADLINE.label) + ".</p>";
    }
    if ((s.issues || []).includes("stopped")) abHtml += '<div class="note-box"><p><strong>Stopped your business?</strong></p>' + factHtml("closeBusiness") + "</div>";
    html += block("One-Time Abatement Program", abHtml);

    // 5. Still to confirm
    html += block("Also good to know", '<p class="help">These details are still being checked for this guide.</p>' +
      factsHtml(["percentageTax", "eightPercent", "books", "invoicing"]));

    // 6. Checklist
    html += block("Your checklist",
      '<p class="help">Tick items off as you go. Your ticks stay only while this page is open.</p>' +
      '<ul class="checklist" id="checklist">' + checklist.map((it, i) =>
        '<li><label><input type="checkbox" data-i="' + i + '"><span><span class="ci-text">' + rich(it.text) + "</span>" + srcHtml(it.src) + "</span></label></li>"
      ).join("") + "</ul>" +
      '<div class="check-meta"><span class="count" id="checkCount" aria-live="polite"></span>' +
      '<button type="button" class="btn btn-primary" id="copyBtn">📋 Copy my checklist</button></div>');

    // 7. Email sign-up
    html += signupHtml();

    // 8. Paid practice worksheets (optional, hidden until configured)
    html += worksheetsHtml(s);

    html += '<div class="disclaimer" role="note"><strong>General information only, not tax advice.</strong> Confirm with your Revenue District Office (RDO) or a tax professional. <span class="asof">As of ' + esc(AS_OF) + ".</span></div>";
    html += '<div class="cta-row"><button type="button" class="btn btn-ghost" id="changeBtn">← Change my answers</button><button type="button" class="btn btn-ghost" id="restartBtn">↺ Start over</button><a class="btn btn-link" href="#deadlines">See all deadlines</a></div>';

    $("#resultBody").innerHTML = html;
    $("#result").hidden = false;
    $("#checker").hidden = true;
    updateCount();
    wireResult();
    $("#result").scrollIntoView({ block: "start" });
    $("#resultTitle").focus({ preventScroll: true });
  }

  function updateCount() {
    const k = done.filter(Boolean).length;
    $("#checkCount").textContent = k + " of " + checklist.length + " done";
  }

  function checklistText() {
    const lines = [
      "My Micro Taxpayer checklist",
      "From the Micro Taxpayer Guide by Nice to Know (@missniceph), as of " + AS_OF,
      "Likely classification: " + lastClass.short,
      ""
    ];
    checklist.forEach((it, i) => lines.push((done[i] ? "[x] " : "[ ] ") + it.text + " " + srcText(it.src)));
    lines.push("", "General information only, not tax advice. Confirm with your Revenue District Office (RDO) or a tax professional.");
    return lines.join("\n");
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* fall through */ }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function wireResult() {
    $("#checklist").addEventListener("change", e => {
      const i = Number(e.target.dataset.i);
      done[i] = e.target.checked;
      updateCount();
    });
    $("#copyBtn").addEventListener("click", async () => {
      const ok = await copyText(checklistText());
      toast(ok ? "Checklist copied. Paste it in your notes!" : "Couldn't copy. Please select the list and copy it manually.");
    });
    $("#changeBtn").addEventListener("click", goBack);
    $("#restartBtn").addEventListener("click", restart);
    wireSignup();
  }

  /* ---------------- Email sign-up ---------------- */

  const isPlaceholder = v => !v || /PLACEHOLDER/i.test(v);

  /* ---------------- Paid worksheets (link out) ---------------- */

  function worksheetsHtml(s) {
    if (isPlaceholder(WS.orderUrl) || isPlaceholder(WS.price) || !/^https:\/\//.test(WS.orderUrl)) return "";
    if (WS.individualsOnly && s.entity !== "individual") return "";
    const list = (arr, tag) => {
      const items = (arr || []).filter(x => !isPlaceholder(x));
      return items.length ? "<" + tag + ' class="condlist">' + items.map(x => "<li>" + esc(x) + "</li>").join("") + "</" + tag + ">" : "";
    };
    return '<section class="card r-block worksheets" aria-labelledby="wsTitle">' +
      '<span class="pill paid">Paid · ' + esc(WS.price) + " one-time</span>" +
      '<h3 id="wsTitle">' + esc(WS.title || "Practice worksheets") + "</h3>" +
      "<p>Want to practise before you file? This is optional. The guide and your result stay free.</p>" +
      list(WS.includes, "ul") +
      (list(WS.steps, "ol") ? "<h4>How ordering works</h4>" + list(WS.steps, "ol") : "") +
      '<a class="btn btn-primary btn-lg continue" id="wsBtn" href="' + esc(WS.orderUrl) + '" target="_blank" rel="noopener">' +
      esc(WS.buttonLabel || "Order the worksheets") + " (" + esc(WS.price) + ') <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>' +
      '<p class="fine">Opens the order form in a new tab. Your checker answers are not shared with it. Practice worksheets are general information only, not tax advice.</p>' +
      "</section>";
  }
  function signupConfigured() {
    return !isPlaceholder(CFG.formResponseUrl) && CFG.entries &&
      !isPlaceholder(CFG.entries.email) && !isPlaceholder(CFG.entries.consent) && !isPlaceholder(CFG.consentValue) &&
      /^https:\/\/docs\.google\.com\/forms\/.+\/formResponse$/.test(CFG.formResponseUrl);
  }

  function signupHtml() {
    const contact = isPlaceholder(CFG.privacyContactEmail)
      ? '<span class="tbc">[Contact email to be added]</span>'
      : '<a href="mailto:' + esc(CFG.privacyContactEmail) + '">' + esc(CFG.privacyContactEmail) + "</a>";
    return '<section class="card r-block signup" aria-labelledby="signupTitle">' +
      '<h3 id="signupTitle"><span aria-hidden="true">✉️</span> Email me my checklist and a reminder before the ' + esc(ABATEMENT_DEADLINE.label) + " abatement deadline.</h3>" +
      '<p class="help">Optional. You already have your full result on this page.</p>' +
      '<form id="signupForm" novalidate>' +
      '<div class="field"><label for="suEmail">Email</label><input type="email" id="suEmail" name="email" autocomplete="email" inputmode="email" required aria-describedby="suEmailErr"><p class="err" id="suEmailErr" hidden></p></div>' +
      '<div class="hp" aria-hidden="true"><label for="suWebsite">Leave this empty</label><input type="text" id="suWebsite" tabindex="-1" autocomplete="off"></div>' +
      '<div class="field"><label class="consent"><input type="checkbox" id="suConsent" required aria-describedby="suConsentErr"><span>' + esc(CFG.consentLabel || "") + "</span></label>" +
      '<p class="err" id="suConsentErr" hidden></p></div>' +
      '<button type="submit" class="btn btn-primary btn-lg continue" id="suBtn">Sign me up</button>' +
      '<div id="suMsg" role="status" aria-live="polite"></div>' +
      "</form>" +
      '<div class="privacy"><p><strong>Privacy:</strong> We collect only your email address and your consent. They are saved in a Google Form run by Nice to Know. We use them only to email you about this guide and tax deadlines, including a reminder before ' + esc(ABATEMENT_DEADLINE.label) + '. Your checker answers are never sent. Your details are never sold or shared.</p>' +
      "<p>You can unsubscribe anytime. To have your details deleted, email " + contact + ".</p></div>" +
      "</section>";
  }

  function wireSignup() {
    const form = $("#signupForm");
    const email = $("#suEmail"), consent = $("#suConsent");
    const emailErr = $("#suEmailErr"), consentErr = $("#suConsentErr"), msg = $("#suMsg"), btn = $("#suBtn");
    const showMsg = (cls, text) => { msg.className = "form-msg " + cls; msg.textContent = text; };

    form.addEventListener("submit", async e => {
      e.preventDefault();
      msg.className = ""; msg.textContent = "";
      let ok = true;
      const em = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
        emailErr.textContent = em ? "That email doesn't look right. Please check it." : "Please enter your email.";
        emailErr.hidden = false; email.setAttribute("aria-invalid", "true"); ok = false;
      } else { emailErr.hidden = true; email.removeAttribute("aria-invalid"); }
      if (!consent.checked) {
        consentErr.textContent = "Please tick the box so we're allowed to email you.";
        consentErr.hidden = false; ok = false;
      } else consentErr.hidden = true;
      if (!ok) { (email.getAttribute("aria-invalid") ? email : consent).focus(); return; }

      // Honeypot: bots fill hidden fields. Pretend success, send nothing.
      if ($("#suWebsite").value) { showMsg("ok", "Thanks! You're on the list."); form.reset(); return; }

      if (!signupConfigured()) {
        showMsg("info", "Email sign-up isn't open yet. Please check back soon, or use \"Copy my checklist\" above. Nothing was sent.");
        return;
      }

      // ONLY email and consent are sent. No checker answers.
      // Consent is sent only when ticked (checked above; re-checked here).
      const body = new URLSearchParams();
      body.append(CFG.entries.email, em);
      if (consent.checked) body.append(CFG.entries.consent, CFG.consentValue);

      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        // Google Forms does not allow reading the reply (no-cors), so once
        // the request is sent we show success. Only a network failure errors.
        await fetch(CFG.formResponseUrl, { method: "POST", mode: "no-cors", body, signal: ctrl.signal, credentials: "omit", referrerPolicy: "no-referrer" });
        clearTimeout(timer);
        showMsg("ok", "Salamat! You're signed up. We'll email you before " + ABATEMENT_DEADLINE.label + ".");
        form.reset();
      } catch (err) {
        showMsg("bad", "Sorry, we couldn't sign you up just now. Please check your internet connection and try again. Your result above is still here.");
      } finally {
        btn.disabled = false; btn.textContent = "Sign me up";
      }
    });
  }

  /* ---------------- Init ---------------- */
  renderTopCountdown();
  renderDeadlines();
  renderFaq();
  renderSources();
  resetState();
  renderStep(false);
  setInterval(() => {
    renderTopCountdown();
    const big = $("#bigCountdown");
    if (big) big.outerHTML = countdownBig();
  }, 60000);
})();
