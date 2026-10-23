import type { CourtDef, CourtKey } from '../types'

/** Court presiders, exactly as they appear in a court cause-title. */
export const COURTS: CourtDef[] = [
  {
    key: 'jmfc',
    hi: 'न्यायिक मजिस्ट्रेट प्रथम श्रेणी',
    en: 'Judicial Magistrate First Class',
    short: 'एन.एम.एफ.सी.',
    tier: 'magistrate',
    headingHi: (place) =>
      `माननीय न्यायालय श्रीमान/श्रीमती न्यायिक मजिस्ट्रेट प्रथम श्रेणी${place ? ', ' + place : ''}`,
    headingEn: (place) =>
      `In the Court of Judicial Magistrate First Class${place ? ', ' + place : ''}`,
    power:
      'धारा 287 बी.एन.एस.एस. के अंतर्गत सीमित सजा — अधिकतम 03 वर्ष कारावास एवं/अथवा जुर्माना। संज्ञेय अपराधों में विचारण। अग्रिम जमानत प्रदान करने का अधिकार नहीं।',
    competent: ['जमानत आवेदन (धारा 480)', 'परिवाद (धारा 223)', 'स्थगन (धारा 346)', 'प्रतिभूति संबंधी आवेदन'],
  },
  {
    key: 'acjm',
    hi: 'अपर मुख्य न्यायिक मजिस्ट्रेट',
    en: 'Additional Chief Judicial Magistrate',
    short: 'ए.सी.जे.एम.',
    tier: 'magistrate',
    headingHi: (place) =>
      `माननीय न्यायालय श्रीमान/श्रीमती अपर मुख्य न्यायिक मजिस्ट्रेट${place ? ', ' + place : ''}`,
    headingEn: (place) =>
      `In the Court of Additional Chief Judicial Magistrate${place ? ', ' + place : ''}`,
    power:
      'धारा 287 बी.एन.एस.एस. के अंतर्गत — अधिकतम 03 वर्ष कारावास एवं/अथवा जुर्माना। मुख्य न्यायिक मजिस्ट्रेट की अनुपस्थिति में प्रशासनिक कार्य भी। अग्रिम जमानत का अधिकार नहीं।',
    competent: ['जमानत आवेदन (धारा 480)', 'परिवाद (धारा 223)', 'मिसल तलब (धारा 94)', 'स्थगन (धारा 346)'],
  },
  {
    key: 'adsj',
    hi: 'अपर जिला एवं सत्र न्यायाधीश',
    en: 'Additional District & Sessions Judge',
    short: 'ए.डी.जे.',
    tier: 'sessions',
    headingHi: (place) =>
      `माननीय न्यायालय श्रीमान/श्रीमती अपर जिला एवं सत्र न्यायाधीश${place ? ', ' + place : ''}`,
    headingEn: (place) =>
      `In the Court of Additional District & Sessions Judge${place ? ', ' + place : ''}`,
    power:
      'धारा 483 बी.एन.एस.एस. के अंतर्गत जमानत; धारा 482 के अंतर्गत अग्रिम जमानत; सत्र विचारण में मृत्युदंड (उच्च न्यायालय की पुष्टि के अधीन) सहित किसी भी दंड का अधिकार।',
    competent: ['अग्रिम जमानत (धारा 482)', 'जमानत (धारा 483)', 'दोषमुक्ति हेतु उन्मोचन (धारा 250)', 'अपील (धारा 415)', 'निलंबन (धारा 430)'],
  },
  {
    key: 'cjm',
    hi: 'मुख्य न्यायिक मजिस्ट्रेट',
    en: 'Chief Judicial Magistrate',
    short: 'सी.जे.एम.',
    tier: 'magistrate',
    headingHi: (place) => `माननीय न्यायालय श्रीमान/श्रीमती मुख्य न्यायिक मजिस्ट्रेट${place ? ', ' + place : ''}`,
    headingEn: (place) => `In the Court of Chief Judicial Magistrate${place ? ', ' + place : ''}`,
    power:
      'धारा 287 बी.एन.एस.एस. के अंतर्गत — मृत्युदंड, आजीवन कारावास अथवा 07 वर्ष से अधिक कारावास को छोड़कर किसी भी दंड का अधिकार। अग्रिम जमानत का अधिकार नहीं।',
    competent: ['जमानत (धारा 480)', 'परिवाद (धारा 223)', 'धारा 175(3) आवेदन', 'तलब (धारा 94)'],
  },
  {
    key: 'dsj',
    hi: 'जिला एवं सत्र न्यायाधीश',
    en: 'District & Sessions Judge',
    short: 'डी.जे.',
    tier: 'sessions',
    headingHi: (place) => `माननीय न्यायालय श्रीमान/श्रीमती जिला एवं सत्र न्यायाधीश${place ? ', ' + place : ''}`,
    headingEn: (place) => `In the Court of District & Sessions Judge${place ? ', ' + place : ''}`,
    power:
      'धारा 482 (अग्रिम जमानत), धारा 483 (जमानत) तथा सत्र विचारण की सम्पूर्ण शक्तियाँ; मृत्युदंड उच्च न्यायालय की पुष्टि के अधीन।',
    competent: ['अग्रिम जमानत (धारा 482)', 'अपील (धारा 415)', 'पुनरीक्षण (धारा 438)', 'स्थानांतरण (धारा 447)'],
  },
  {
    key: 'custom',
    hi: 'अन्य न्यायालय (स्वयं लिखें)',
    en: 'Other Court (custom)',
    short: 'कस्टम',
    tier: 'custom',
    headingHi: (place) => `${place}`,
    headingEn: (place) => `${place}`,
    power: 'न्यायालय का नाम एवं स्थान स्वयं भरें — शीर्षक यथावत् प्रयुक्त होगा।',
    competent: [],
  },
]

export const courtByKey = (k: CourtKey): CourtDef =>
  COURTS.find((c) => c.key === k) ?? COURTS[0]

/** Court heading for the current case details. */
export function courtHeading(cd: { court: CourtKey; customCourt?: string; place?: string }, hi = true) {
  if (cd.court === 'custom') return cd.customCourt ?? ''
  const c = courtByKey(cd.court)
  return hi ? c.headingHi(cd.place ?? '') : c.headingEn(cd.place ?? '')
}

export const PAGE_SIZES: Record<string, { hi: string; w: number; h: number; note: string }> = {
  legal: { hi: 'लीगल (Legal) — 8.5 × 14 इंच', w: 8.5, h: 14, note: 'भारतीय न्यायालयों में प्रचलित फूलस्केप / लीगल पेपर' },
  legal13: { hi: 'लीगल 13 — 8.5 × 13 इंच', w: 8.5, h: 13, note: 'कुछ राज्यों में प्रयुक्त लीगल 13' },
  a4: { hi: 'ए-4 (A4) — 8.27 × 11.69 इंच', w: 8.27, h: 11.69, note: 'मानक ISO A4' },
  letter: { hi: 'लेटर — 8.5 × 11 इंच', w: 8.5, h: 11, note: 'US Letter' },
}

export const DEFAULT_PAGE = {
  size: 'legal' as const,
  orientation: 'portrait' as const,
  marginTop: 1,
  marginRight: 1,
  marginBottom: 1,
  marginLeft: 1.25,
  headerBand: 0.55,
  footerBand: 0.5,
  lineNumbers: false,
  showGuides: false,
  watermark: 'none' as const,
  watermarkText: '',
  headerText: '',
  footerText: '',
  pageNumbers: true,
  firstPageHeader: false,
  borderFrame: false,
}

export const DEFAULT_CASE = {
  court: 'jmfc' as const,
  customCourt: '',
  place: '',
  courtRoom: '',
  caseNo: '',
  firNo: '',
  policeStation: '',
  sections: '',
  partyA: '',
  partyALabel: 'अभियुक्त',
  partyB: 'राज्य',
  partyBLabel: 'अभियोजन',
  clientName: '',
  clientAddress: '',
  clientPhone: '',
  counselName: '',
  counselRegNo: '',
  counselAddress: '',
  counselPhone: '',
  nextDate: '',
  today: new Date().toISOString().slice(0, 10),
}
