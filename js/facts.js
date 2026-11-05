/* =====================================================================
   FACT BASE — Micro Taxpayer Guide
   ---------------------------------------------------------------------
   Every rule, rate, form, amount and deadline shown on the site lives
   in THIS file. To change what the site says, edit the text here.

   - `text`  : what the reader sees (plain English, short sentences).
   - `src`   : the issuance(s) the fact comes from. Keys must match an
               entry in SOURCES below. Shown in small text under the fact.
   - "[To confirm]" anywhere in a text (or as a src) is shown as a
     highlighted placeholder. Search this file for "[To confirm]" to
     find every one that still needs filling in.

   See README.md for step-by-step instructions.
   ===================================================================== */

window.FACTS = (function () {
  "use strict";

  const TBC = "[To confirm]";

  /* -------------------------------------------------------------
     Date shown in the disclaimer and on copied checklists.
     ------------------------------------------------------------- */
  const AS_OF = "November 2026";

  /* -------------------------------------------------------------
     SOURCES — the full source list shown in the footer.
     `usedFor` explains what this guide uses the issuance for.
     ------------------------------------------------------------- */
  const SOURCES = {
    "RA 11976": { name: "Republic Act No. 11976 (Ease of Paying Taxes Act)", usedFor: "Taxpayer classification; concessions for micro and small taxpayers" },
    "RR 8-2024": { name: "Revenue Regulations No. 8-2024", usedFor: "Taxpayer classification" },
    "RMO 37-2024": { name: "Revenue Memorandum Order No. 37-2024", usedFor: "Taxpayer classification" },
    "RR 6-2024": { name: "Revenue Regulations No. 6-2024 (effective April 27, 2024)", usedFor: "Reduced penalties and interest; simplified annual return" },
    "RR 7-2024": { name: "Revenue Regulations No. 7-2024", usedFor: "Invoicing requirements (details " + TBC + ")" },
    "RMC 36-2026": { name: "Revenue Memorandum Circular No. 36-2026 (April 2026)", usedFor: "BIR Form 1701-MS" },
    "RMC 37-2026": { name: "Revenue Memorandum Circular No. 37-2026 (April 2026)", usedFor: "BIR Form 1701-MS" },
    "RMC 30-2026": { name: "Revenue Memorandum Circular No. 30-2026", usedFor: "Extended deadline for taxable year 2025 annual returns" },
    "RMC 47-2026": { name: "Revenue Memorandum Circular No. 47-2026 (May 2026)", usedFor: "Simplified closing of business registration" },
    "RR 4-2026": { name: "Revenue Regulations No. 4-2026 (issued June 22, 2026)", usedFor: "One-Time Abatement Program for Micro Taxpayers" },
    "RMC 84-2026": { name: "Revenue Memorandum Circular No. 84-2026 (July 23, 2026)", usedFor: "One-Time Abatement Program for Micro Taxpayers" }
  };

  /* Common source groups */
  const CLASSIFY = ["RA 11976", "RR 8-2024", "RMO 37-2024"];
  const CONCESSIONS = ["RA 11976", "RR 6-2024"];
  const RETURN = ["RMC 36-2026", "RMC 37-2026"];
  const ABATE = ["RR 4-2026", "RMC 84-2026"];

  /* -------------------------------------------------------------
     FACTS — referenced by key from the checker, results and FAQ.
     ------------------------------------------------------------- */
  const F = {
    /* Classification */
    microDef: { text: "You are a Micro taxpayer if your gross sales are less than ₱3,000,000 for a taxable year.", src: CLASSIFY },
    tiers: {
      text: "The BIR groups taxpayers by gross sales for a taxable year:",
      table: [
        ["Micro", "Less than ₱3,000,000"],
        ["Small", "₱3,000,000 to less than ₱20,000,000"],
        ["Medium", "₱20,000,000 to less than ₱1,000,000,000"],
        ["Large", "₱1,000,000,000 and above"]
      ],
      src: CLASSIFY
    },
    grossSales: { text: "Gross sales means your total sales revenue for the taxable year, net of VAT, without any other deductions.", src: CLASSIFY },
    mixed: { text: "If you earn both a salary and business income (mixed income), only your business income counts for classification.", src: CLASSIFY },
    initialEarly: { text: "Taxpayers registered in 2023 and 2024 before April 27, 2024 are initially classified as Micro. If VAT-registered, they are initially classified as Small.", src: CLASSIFY },
    initial2022: { text: "Taxpayers who did not file the annual ITR for taxable year 2022 are likewise initially classified as Micro, or Small if VAT-registered.", src: CLASSIFY },
    initialLate: { text: "Taxpayers registering after April 27, 2024 are initially classified based on what they declare in BIR Form 1901 or 1903.", src: CLASSIFY },
    stays: { text: "Your initial classification stays until you are reclassified.", src: CLASSIFY },
    reclass: { text: "Reclassification can be started by you (for example, through ORUS at orus.bir.gov.ph) or by the BIR. It takes effect once you receive the BIR's notice.", src: CLASSIFY },

    /* Concessions for micro and small taxpayers */
    penalty: { text: "Civil penalty is reduced to 10% instead of 25%. The 50% surcharge for willful or fraudulent cases still applies.", src: CONCESSIONS },
    interest: { text: "Interest is reduced to 50% of the Tax Code rate (for example, 6% instead of 12%).", src: CONCESSIONS },
    shortReturn: { text: "You get a simplified annual income tax return of at most two pages.", src: CONCESSIONS },
    concessionsStart: { text: "These concessions for micro and small taxpayers took effect on April 27, 2024.", src: ["RR 6-2024"] },

    /* Annual return */
    form1701ms: { text: "BIR Form 1701-MS is the simplified Annual Income Tax Return for individuals classified as Micro or Small.", src: RETURN },
    ebirforms: { text: "You can file 1701-MS electronically using the Offline eBIRForms Package, version 7.9.6 or later, downloadable from bir.gov.ph.", src: RETURN },
    altForms: { text: "Micro and small individuals may instead use BIR Form 1701 or 1701A.", src: RETURN },
    annualDeadline: { text: "The normal deadline for the annual income tax return is April 15.", src: [TBC] },
    ty2025: { text: "Past example: for taxable year 2025, the deadline was extended to May 15, 2026.", src: ["RMC 30-2026"] },
    corpReturn: { text: "Annual income tax return for corporations and partnerships: " + TBC, src: [TBC] },

    /* Quarterly */
    form1701q: { text: "BIR Form 1701Q (quarterly income tax for individuals) is due May 15 (Q1), August 15 (Q2) and November 15 (Q3) in 2026. There is no Q4 return. The annual ITR covers it.", src: [TBC] },
    form2551q: { text: "BIR Form 2551Q (quarterly percentage tax) is due on the 25th day after the quarter ends. For example, April 25 for Q1.", src: [TBC] },

    /* One-Time Abatement Program */
    abateWho: { text: "The One-Time Abatement Program is for micro taxpayers with gross sales not exceeding ₱3,000,000 and covered basic tax liabilities and/or penalties of not more than ₱80,000 per taxable year.", src: ABATE },
    abateCovers: { text: "It covers delinquent accounts, preliminary or final assessments (disputed or not), and open stop-filer cases as of December 31, 2025. This includes taxpayers who have already stopped their business.", src: ABATE },
    abateWithholding: { text: "Withholding tax liabilities of micro taxpayers are covered.", src: ABATE },
    abateStep1: { text: "File BIR Form 2121 (One-Time Abatement for Micro Taxpayers Application Form) in three copies with the RDO where you are registered.", src: ABATE },
    abateStep2: { text: "Pay the ₱5,000 abatement fee per approved application using BIR Form 0605 (ATC MC350 for individuals, MC351 for corporations).", src: ABATE },
    abateStep3: { text: "Receive a Certificate of Availment confirming your case is closed.", src: ABATE },
    abateNoAudit: { text: "You will not be audited because you filed an application.", src: ABATE },
    abateFee: { text: "The ₱5,000 fee is nonrefundable.", src: ABATE },
    abateDeadline: { text: "Deadline: December 31, 2026, unless extended by the Secretary of Finance.", src: ABATE },
    closeBusiness: { text: "Separately, the BIR has simplified closing a business registration.", src: ["RMC 47-2026"] },

    /* TO CONFIRM — fill these in (see README) */
    percentageTax: { text: "Percentage tax rate: " + TBC, src: [TBC] },
    eightPercent: { text: "8% income tax option, including the ₱250,000 rule: " + TBC, src: [TBC] },
    books: { text: "Books of accounts requirements for micro taxpayers: " + TBC, src: [TBC] },
    invoicing: { text: "Invoicing requirements: " + TBC, src: ["RR 7-2024"] }
  };

  /* -------------------------------------------------------------
     ABATEMENT DEADLINE used by the countdown (Philippine time).
     ------------------------------------------------------------- */
  const ABATEMENT_DEADLINE = {
    label: "December 31, 2026",
    // End of day, Manila time (UTC+8)
    iso: "2026-12-31T23:59:59+08:00",
    src: ABATE
  };

  /* -------------------------------------------------------------
     DEADLINES — the "Know your deadlines" section.
     `date` is YYYY-MM-DD (Philippine date). Items are sorted by date.
     `rules` are standing rules shown under the list.
     ------------------------------------------------------------- */
  const DEADLINES = {
    year: 2026,
    dates: [
      { date: "2026-04-25", title: "BIR Form 2551Q, Q1", note: "Quarterly percentage tax (example given: 25th day after Q1 ends).", src: [TBC] },
      { date: "2026-05-15", title: "BIR Form 1701Q, Q1", note: "Quarterly income tax for individuals.", src: [TBC] },
      { date: "2026-05-15", title: "Annual ITR for taxable year 2025", note: "Extended from April 15. Past example only.", src: ["RMC 30-2026"] },
      { date: "2026-08-15", title: "BIR Form 1701Q, Q2", note: "Quarterly income tax for individuals.", src: [TBC] },
      { date: "2026-11-15", title: "BIR Form 1701Q, Q3", note: "Quarterly income tax for individuals. No Q4 return; the annual ITR covers it.", src: [TBC] },
      { date: "2026-12-31", title: "One-Time Abatement Program ends", note: "Unless extended by the Secretary of Finance.", src: ABATE }
    ],
    rules: [
      { text: "Annual income tax return: normally due April 15.", src: [TBC] },
      { text: "BIR Form 2551Q: due on the 25th day after each quarter ends.", src: [TBC] },
      { text: "BIR Form 1701Q: no Q4 return. The annual ITR covers it.", src: [TBC] }
    ]
  };

  /* -------------------------------------------------------------
     FAQ — each answer is a list of fact keys from F above.
     ------------------------------------------------------------- */
  const FAQ = [
    { q: "What is a micro taxpayer?", a: ["microDef", "tiers"] },
    { q: "What counts as \"gross sales\"?", a: ["grossSales"] },
    { q: "I have a job and a side business. Does my salary count?", a: ["mixed"] },
    { q: "I registered before April 27, 2024. What is my classification?", a: ["initialEarly", "initial2022", "stays"] },
    { q: "I registered after April 27, 2024. How was I classified?", a: ["initialLate", "stays"] },
    { q: "How do I get reclassified?", a: ["reclass"] },
    { q: "What do micro and small taxpayers get?", a: ["penalty", "interest", "shortReturn", "concessionsStart"] },
    { q: "What is BIR Form 1701-MS and how do I file it?", a: ["form1701ms", "ebirforms", "altForms"] },
    { q: "When is the annual return due?", a: ["annualDeadline", "ty2025"] },
    { q: "Do I file a Q4 1701Q?", a: ["form1701q"] },
    { q: "What is the One-Time Abatement Program?", a: ["abateWho", "abateCovers", "abateWithholding"] },
    { q: "How do I apply for the abatement, and how much does it cost?", a: ["abateStep1", "abateStep2", "abateStep3", "abateFee", "abateDeadline"] },
    { q: "Will I be audited if I apply for the abatement?", a: ["abateNoAudit"] },
    { q: "I stopped my business but never closed it. What now?", a: ["abateCovers", "closeBusiness"] },
    { q: "What about percentage tax and the 8% option?", a: ["percentageTax", "eightPercent", "form2551q"] },
    { q: "Do I need books of accounts and invoices?", a: ["books", "invoicing"] }
  ];

  return { TBC, AS_OF, SOURCES, F, ABATEMENT_DEADLINE, DEADLINES, FAQ };
})();
