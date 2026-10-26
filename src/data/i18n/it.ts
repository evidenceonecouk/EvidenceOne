import type { LanguageStrings } from './types'

export const it: LanguageStrings = {
  code: 'it',
  notice: {
    inYourLanguage: 'Nella tua lingua',
    aiLocal:
      'Traduzione con IA. Solo a scopo orientativo. Fa fede il testo in inglese.',
    showEnglish: 'Mostra l’inglese',
    hideEnglish: 'Nascondi l’inglese',
    legalNote:
      'Il testo legale resta in inglese. Sotto è riportata una traduzione.',
    translationLabel: 'Traduzione',
  },
  guidance: {
    invite:
      'Sei stato invitato a confermare la tua identità in relazione a una società. La verifica sarà eseguita dall’ACSP indicato. Evidence One è il suo fornitore di tecnologia.',
    contact:
      'Invieremo un codice monouso alla tua e-mail e un altro al tuo cellulare, per accertare che questi recapiti siano tuoi.',
    details:
      'Questi dati provengono dal registro di Companies House. Controllali. Se qualcosa è sbagliato, puoi chiedere una modifica.',
    personal:
      'Indica nome, eventuali nomi precedenti, data di nascita e indirizzi degli ultimi 12 mesi. Il tuo ACSP li confronterà con il registro.',
    suggest:
      'Un ACSP è uno studio autorizzato a verificare le identità per Companies House. Proponiamo studi in base a criteri chiari: paese, documento e lingua. Scegli tu.',
    instruct:
      'Questo è lo studio che verificherà la tua identità. È responsabile della verifica e stabilisce da sé il proprio compenso. Evidence One è il suo fornitore di tecnologia.',
    payment:
      'Paghi l’ACSP indicato. Evidence One incassa il pagamento a suo nome, come agente. I dati della carta si inseriscono presso un fornitore di pagamenti sicuro. La carta viene autorizzata ora e l’addebito avviene solo quando l’ACSP approva la verifica.',
    document:
      'Scegli un documento d’identità. Di solito ne basta uno. Tutto avviene nel browser, senza installare nulla.',
    scan: 'Fotografa il documento o carica una foto nitida. Devono essere visibili i quattro angoli e tutto il testo.',
    selfie:
      'Un breve video mostra che c’è una persona reale e confronta il tuo volto con la foto del documento.',
    checks:
      'I controlli avvengono in automatico: documento, video ed elenchi di controllo. Resta su questa pagina.',
    address:
      'Chiediamo a tutti un documento che provi l’indirizzo attuale, datato negli ultimi {n} mesi. Non è un secondo documento d’identità.',
    evidence:
      'Il tuo ACSP ha bisogno di un documento di supporto tra quelli accettati, datato negli ultimi {n} mesi.',
    review:
      'Controlla ciò che invii e leggi le dichiarazioni. Dopo l’invio, il tuo ACSP esamina il caso e decide.',
    status:
      'Questa pagina mostra a che punto è il tuo caso. Decide il tuo ACSP. Companies House ti invierà il codice personale direttamente per e-mail.',
    'option-2':
      'Se i controlli nel browser non supportano il tuo documento, il tuo ACSP può organizzare un controllo con una persona formata.',
  },
  helper: {
    title: 'Quale documento posso usare?',
    intro: 'Chiedi quali documenti accetta Evidence One.',
    placeholder: 'Scrivi la tua domanda',
    ask: 'Chiedi',
    chips: {
      list: 'Cosa posso usare?',
      bank: 'Estratto conto bancario',
      utility: 'Bolletta o tassa comunale',
      months: 'Quanto deve essere recente?',
      identity: 'È un secondo documento d’identità?',
    },
    answers: {
      list: 'Evidence One accetta uno qualsiasi di questi documenti, datato negli ultimi {n} mesi: un estratto conto bancario o di carta di credito con movimenti recenti; una bolletta o una tassa comunale; una polizza assicurativa che indichi il tuo indirizzo; la prova di un uso recente del passaporto.',
      bank: 'Sì. Puoi usare un estratto conto bancario o di carta di credito se mostra movimenti recenti, il tuo nome e il tuo indirizzo, ed è datato negli ultimi {n} mesi.',
      utility:
        'Sì. Puoi usare una bolletta o una tassa comunale se mostra il tuo nome e il tuo indirizzo ed è datata negli ultimi {n} mesi.',
      insurance:
        'Sì. Puoi usare una polizza assicurativa se indica il tuo indirizzo ed è datata negli ultimi {n} mesi.',
      passport_use:
        'Sì. Puoi usare la prova di un uso recente del passaporto, datata negli ultimi {n} mesi.',
      months:
        'Il documento deve essere datato negli ultimi {n} mesi, contati dal giorno in cui lo carichi. Se è più vecchio, il tuo ACSP te ne chiederà uno più recente.',
      identity:
        'No. Non è un secondo documento d’identità. È un documento di supporto che mostra il tuo indirizzo attuale o il tuo nome. Il tuo documento d’identità viene controllato separatamente.',
    },
    outside:
      'Posso aiutarti solo con i documenti che Evidence One accetta. Per qualsiasi altra cosa ti consiglierà il tuo ACSP.',
  },
  declarations: {
    truth:
      'Confermo che le informazioni fornite sono vere e complete e che il documento d’identità usato è mio.',
    consent:
      'Incarico {acsp} di eseguire la verifica della mia identità. Comprendo che {acsp} rilascia la dichiarazione di verifica e conserva i miei registri, e che Evidence One è il suo fornitore di tecnologia.',
  },
}
