import type { LanguageStrings } from './types'

export const en: LanguageStrings = {
  code: 'en',
  notice: {
    inYourLanguage: 'In your language',
    aiLocal:
      'AI translation. Advisory only. The English text is the version of record.',
    showEnglish: 'Show English',
    hideEnglish: 'Hide English',
    legalNote:
      'Legal wording stays in English. A translation is shown beneath it.',
    translationLabel: 'Translation',
  },
  guidance: {
    invite:
      'You have been invited to confirm your identity for a company. The ACSP named for you will carry out the verification. Evidence One is its technology provider.',
    contact:
      'We send a one-time code to your email and another to your mobile. This confirms that these details are yours before anything else.',
    details:
      'These details come from the Companies House register. Please check them. If something is wrong, you can ask for an amendment.',
    personal:
      'Please give your name, any former names, your date of birth and your addresses for the last 12 months. Your ACSP compares them with the register.',
    suggest:
      'An ACSP is a firm authorised to verify identities for Companies House. We suggest firms using clear criteria such as your country, your document and your language. You choose.',
    instruct:
      'This is the firm that will verify your identity. It is responsible for the verification and sets its own fee. Evidence One is its technology provider.',
    payment:
      'You pay the named ACSP. Evidence One collects the payment on its behalf as its agent. Card details are entered with a secure payment provider. Your card is authorised now and you are only charged when the ACSP approves your verification.',
    document:
      'Choose one identity document. One is usually enough. Everything happens in your browser and you do not need to install anything.',
    scan: 'Take a photo of your document or upload a clear picture. All four corners and all of the text must be visible.',
    selfie:
      'A short video shows that a real person is present and matches you to the photo on your document.',
    checks:
      'The checks run on their own. They look at the document, the video and screening lists. Please stay on this page.',
    address:
      'We ask everyone for one proof of their current address, dated within the last {n} months. This is not a second identity document.',
    evidence:
      'Your ACSP needs one supporting document. It must be one of the accepted documents, dated within the last {n} months.',
    review:
      'Check what you are sending and read the declarations. When you submit, your ACSP reviews your case and decides.',
    status:
      'This page shows where your case is. Your ACSP decides. Companies House emails the personal code directly to you.',
    'option-2':
      'If the browser checks cannot support your document, the certified identity provider’s trained reviewers can check your documents instead. Your ACSP completes any further checks and makes the decision.',
  },
  helper: {
    title: 'Which document can I use?',
    intro: 'Ask about the documents Evidence One accepts.',
    placeholder: 'Type your question',
    ask: 'Ask',
    chips: {
      list: 'What can I use?',
      bank: 'Bank statement',
      utility: 'Utility or council tax bill',
      months: 'How recent must it be?',
      identity: 'Is this a second ID?',
    },
    answers: {
      list: 'Evidence One accepts any one of these, dated within the last {n} months: a bank or credit card statement with recent transactions; a utility or council tax bill; an insurance policy document showing your home address; evidence of recent passport use.',
      bank: 'Yes. A bank or credit card statement can be used if it shows recent transactions, your name and your home address, and is dated within the last {n} months.',
      utility:
        'Yes. A utility bill or a council tax bill can be used if it shows your name and your home address and is dated within the last {n} months.',
      insurance:
        'Yes. An insurance policy document can be used if it shows your home address and is dated within the last {n} months.',
      passport_use:
        'Yes. Evidence of recent passport use can be used, dated within the last {n} months.',
      months:
        'The document must be dated within the last {n} months, counted back from the day you upload it. If it is older, your ACSP will ask you for a more recent one.',
      identity:
        'No. This is not a second identity document. It is one supporting document that shows your current address or your name. Your identity document is checked separately.',
    },
    outside:
      'I can only help with the documents Evidence One accepts. Your ACSP will advise on anything else.',
  },
  declarations: {
    truth:
      'I confirm that the information I have given is true and complete, and that the identity document I have used is mine.',
    consent:
      'I instruct {acsp} to carry out my identity verification. I understand that {acsp} makes the verification statement and keeps my records, with Evidence One as its technology provider.',
  },
}
