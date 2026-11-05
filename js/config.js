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
