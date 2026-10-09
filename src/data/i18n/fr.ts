import type { LanguageStrings } from './types'

export const fr: LanguageStrings = {
  code: 'fr',
  notice: {
    inYourLanguage: 'Dans votre langue',
    aiLocal:
      'Traduction par IA. À titre indicatif uniquement. Le texte anglais fait foi.',
    showEnglish: 'Afficher l’anglais',
    hideEnglish: 'Masquer l’anglais',
    legalNote:
      'Le texte juridique reste en anglais. Une traduction est affichée en dessous.',
    translationLabel: 'Traduction',
  },
  guidance: {
    invite:
      'Vous êtes invité(e) à confirmer votre identité pour une société. La vérification sera réalisée par l’ACSP désigné. Evidence One est son prestataire technologique.',
    contact:
      'Nous envoyons un code à usage unique à votre adresse e-mail et un autre à votre mobile, pour vérifier que ces coordonnées sont les vôtres.',
    details:
      'Ces informations viennent du registre de Companies House. Vérifiez-les. Si quelque chose est inexact, vous pouvez demander une modification.',
    personal:
      'Indiquez votre nom, vos anciens noms, votre date de naissance et vos adresses des 12 derniers mois. Votre ACSP les comparera avec le registre.',
    suggest:
      'Un ACSP est un cabinet autorisé à vérifier les identités pour Companies House. Nous proposons des cabinets selon des critères clairs : votre pays, votre document et votre langue. Vous choisissez.',
    instruct:
      'Voici le cabinet qui vérifiera votre identité. Il est responsable de la vérification et fixe lui-même ses honoraires. Evidence One est son prestataire technologique.',
    payment:
      'Vous payez l’ACSP désigné. Evidence One encaisse le paiement en son nom, en tant qu’agent. Les données de carte sont saisies chez un prestataire de paiement sécurisé.',
    document:
      'Choisissez un document d’identité. Un seul suffit en général. Tout se fait dans votre navigateur, sans rien installer.',
    scan: 'Photographiez votre document ou téléversez une photo nette. Les quatre coins et tout le texte doivent être visibles.',
    selfie:
      'Une courte vidéo montre qu’une vraie personne est présente et compare votre visage à la photo du document.',
    checks:
      'Les contrôles se font automatiquement : document, vidéo et listes de contrôle. Restez sur cette page.',
    address:
      'Nous demandons à chacun un justificatif de son adresse actuelle, daté de moins de {n} mois. Ce n’est pas un second document d’identité.',
    evidence:
      'Votre ACSP a besoin d’un document justificatif parmi ceux acceptés, daté de moins de {n} mois.',
    review:
      'Vérifiez ce que vous envoyez et lisez les déclarations. Une fois votre dossier envoyé, votre ACSP l’examine et décide.',
    status:
      'Cette page indique où en est votre dossier. C’est votre ACSP qui décide. Companies House vous enverra le code personnel directement par e-mail.',
    'option-2':
      'Si les contrôles dans le navigateur ne peuvent pas prendre en charge votre document, votre ACSP peut organiser un contrôle avec une personne formée.',
  },
  helper: {
    title: 'Quel document puis-je utiliser ?',
    intro: 'Posez une question sur les documents acceptés par Evidence One.',
    placeholder: 'Écrivez votre question',
    ask: 'Demander',
    chips: {
      list: 'Que puis-je utiliser ?',
      bank: 'Relevé bancaire',
      utility: 'Facture de services ou taxe locale',
      months: 'Quelle ancienneté maximale ?',
      identity: 'Est-ce un second document d’identité ?',
    },
    answers: {
      list: 'Evidence One accepte l’un de ces documents, daté de moins de {n} mois : un relevé bancaire ou de carte de crédit avec des opérations récentes ; une facture de services ou d’impôt local ; une attestation d’assurance indiquant votre adresse ; une preuve d’utilisation récente du passeport.',
      bank: 'Oui. Un relevé bancaire ou de carte de crédit convient s’il montre des opérations récentes, votre nom et votre adresse, et s’il est daté de moins de {n} mois.',
      utility:
        'Oui. Une facture de services ou d’impôt local convient si elle montre votre nom et votre adresse et si elle est datée de moins de {n} mois.',
      insurance:
        'Oui. Une attestation ou un contrat d’assurance convient s’il indique votre adresse et s’il est daté de moins de {n} mois.',
      passport_use:
        'Oui. Une preuve d’utilisation récente du passeport convient, datée de moins de {n} mois.',
      months:
        'Le document doit être daté de moins de {n} mois, à compter du jour où vous le téléversez. S’il est plus ancien, votre ACSP vous en demandera un plus récent.',
      identity:
        'Non. Ce n’est pas un second document d’identité. C’est un document justificatif qui montre votre adresse actuelle ou votre nom. Votre document d’identité est contrôlé séparément.',
    },
    outside:
      'Je ne peux aider que pour les documents qu’Evidence One accepte. Votre ACSP vous conseillera pour tout le reste.',
  },
  declarations: {
    truth:
      'Je confirme que les informations fournies sont exactes et complètes, et que le document d’identité utilisé est le mien.',
    consent:
      'Je charge {acsp} de vérifier mon identité. Je comprends que {acsp} établit la déclaration de vérification et conserve mes dossiers, et qu’Evidence One est son prestataire technologique.',
  },
}
