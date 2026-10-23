/* ------------------------------------------------------------------
   साझा प्रारूप-खंड (reusable blocks) — सभी मसौदों में प्रयुक्त
   ------------------------------------------------------------------ */

export const P = (t: string) => `<p>${t}</p>`

/** court heading — centered bold */
export const COURT = `<p class="doc-court">{{COURT_HEAD}}</p>`

/** case number line — right aligned */
export const CASENO = `<p class="doc-caseno">{{CASE}}</p>`

/** cause title */
export const CAUSE = `<p class="doc-party"><strong>{{PARTYA_LABEL}}:</strong> {{PARTYA}}<br><em>बनाम</em><br><strong>{{PARTYB_LABEL}}:</strong> {{PARTYB}}</p>`

/** subject line */
export const SUBJECT = (s: string) =>
  `<p class="doc-subject"><strong>विषय: ${s}</strong></p>`

/** FIR / police particulars line */
export const FIRLINE = `<p class="doc-note">एफ.आई.आर. संख्या {{FIR}} अंतर्गत थाना {{PS}}, धाराएँ {{SECTIONS}}</p>`

export const OPENING = `<p class="doc-body">सविनय निवेदन है कि उपरोक्त प्रकरण में निवेदक/प्रार्थी की ओर से निम्नलिखित तथ्यों एवं विधिक आधारों पर यह आवेदन पत्र सादर प्रस्तुत है —</p>`

export const SALUTATION = `<p class="doc-body">माननीय न्यायालय महोदय,</p>`

export const PRAYER = (body: string) =>
  `<p class="doc-prayer"><strong>प्रार्थना</strong></p><p class="doc-body">${body}</p>`

export const CLOSING = `<p class="doc-sign">दिनांक: {{DATE}}</p><p class="doc-sign">स्थान: {{PLACE}}</p>
<p class="doc-sign"><strong>प्रार्थी/निवेदक</strong><br>{{CLIENT}}<br>प्रार्थी अधिवक्ता: {{ADV}}</p>`

export const VERIFY = (name = '{{CLIENT}}') =>
  `<p class="doc-verify"><strong>सत्यापन</strong><br>मैं, ${name}, उपरोक्त आवेदन में अंकित तथ्यों की सत्यता की पुष्टि करता/करती हूँ। मेरे ज्ञान एवं विश्वास में ये तथ्य सत्य एवं सही हैं तथा इनमें कोई भी तथ्य छिपाया नहीं गया है। सत्यापित — स्थान {{PLACE}}, दिनांक {{DATE}}।</p>
<p class="doc-sign"><strong>सत्यापनकर्ता</strong><br>${name}</p>`

export const ANNEX = (items: string[]) =>
  `<p class="doc-note"><strong>संलग्नक</strong></p><p class="doc-note">${items
    .map((i, n) => `${n + 1}. ${i}`)
    .join('<br>')}</p>`

export const NOTE = (t: string) => `<p class="doc-note">${t}</p>`

export const FIELDS = {
  accused: '[अभियुक्त का नाम एवं पता]',
  date: '[दिनांक]',
  grounds: '[आधार यहाँ लिखें]',
  prayer: '[अभीष्ट राहत यहाँ लिखें]',
}

/** standard BNSS/BNS reference disclaimer used in drafts */
export const DISCLAIMER =
  '<p class="doc-note"><em>नोट: यह मसौदा प्रारूप-सहायता हेतु है। अंतिम प्रारूप से पूर्व तथ्यों, संलग्नकों एवं लागू धाराओं (विशेषतः 01.07.2024 से लागू बी.एन.एस./बी.एन.एस.एस./बी.एस.ए.) का मिलान अवश्य करें।</em></p>'
