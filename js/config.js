/* =====================================================================
   EMAIL SIGN-UP SETTINGS (Google Form)
   ---------------------------------------------------------------------
   The sign-up box on the result page posts to this Google Form.
   Only the email and the consent answer are sent.
   Checker answers are NEVER sent.

   If you make a new form, update the values below
   (step-by-step in README.md, "Connect or change the email sign-up").
   ===================================================================== */

window.SIGNUP_CONFIG = {
  // Your form's URL ending in /formResponse (not /viewform).
  formResponseUrl: "https://docs.google.com/forms/d/e/1FAIpQLScmW6NcLSSLixJEOIKIRzrnKgjZgpMM5fGZVlzAK_TPWFbadA/formResponse",

  entries: {
    email: "entry.556632391",
    consent: "entry.17754293"
  },

  // Sent for the consent field ONLY when the box is ticked.
  // Must match the checkbox option text in your Google Form exactly.
  consentValue: "Yes",

  // Text shown next to the consent checkbox on the site.
  consentLabel: "I agree to receive emails from Nice to Know (@missniceph) about this guide and tax deadlines. I can unsubscribe anytime.",

  // Shown in the privacy notice for deletion requests.
  privacyContactEmail: "delacruzcrystaleunice@gmail.com"
};

/* =====================================================================
   PAID PRACTICE WORKSHEETS (optional)
   ---------------------------------------------------------------------
   Shows a small "Paid" box on the result page that links to YOUR order
   form (a Google Form, or any checkout/shop link). The guide stays free.

   The box stays HIDDEN until both orderUrl and price are filled in.
   Nothing from the checker is sent to the order form; it's a plain link.

   Steps in README.md, "Paid practice worksheets".
   ===================================================================== */

window.WORKSHEETS_CONFIG = {
  // Your Google Form's share link (ends in /viewform) or a checkout link.
  orderUrl: "https://forms.gle/JdGz7NXfn9VbrR6L6",

  // One-time price as you want it shown, e.g. "₱199".
  price: "PLACEHOLDER_PRICE",

  // Show the box only to individuals (the ITR and 1701Q are for individuals).
  individualsOnly: true,

  title: "Practice worksheets for your ITR and quarterly filing",

  // What's inside. Edit to match your actual worksheets.
  includes: [
    "PLACEHOLDER: what's included (e.g. annual ITR practice worksheet)",
    "PLACEHOLDER: what's included (e.g. quarterly filing practice worksheet)"
  ],

  // How ordering works. Edit to match your process.
  steps: [
    "Fill in the short order form.",
    "We email you the payment details.",
    "Once your payment is confirmed, we email you the worksheets."
  ],

  buttonLabel: "Order the worksheets"
};
