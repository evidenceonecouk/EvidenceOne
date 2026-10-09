import type { LanguageStrings } from './types'

export const es: LanguageStrings = {
  code: 'es',
  notice: {
    inYourLanguage: 'En su idioma',
    aiLocal:
      'Traducción con IA. Solo orientativa. El texto en inglés es la versión de referencia.',
    showEnglish: 'Mostrar inglés',
    hideEnglish: 'Ocultar inglés',
    legalNote:
      'El texto jurídico se mantiene en inglés. Debajo se muestra una traducción.',
    translationLabel: 'Traducción',
  },
  guidance: {
    invite:
      'Le han invitado a confirmar su identidad en relación con una empresa. La verificación la realizará el ACSP indicado. Evidence One es su proveedor de tecnología.',
    contact:
      'Enviaremos un código de un solo uso a su correo electrónico y otro a su móvil, para comprobar que esos datos son suyos.',
    details:
      'Estos datos proceden del registro de Companies House. Revíselos. Si algo es incorrecto, puede solicitar una modificación.',
    personal:
      'Indique su nombre, nombres anteriores, fecha de nacimiento y direcciones de los últimos 12 meses. Su ACSP los comparará con el registro.',
    suggest:
      'Un ACSP es una empresa autorizada para verificar identidades ante Companies House. Sugerimos empresas con criterios claros, como su país, su documento y su idioma. Usted elige.',
    instruct:
      'Esta es la empresa que verificará su identidad. Es responsable de la verificación y fija su propia tarifa. Evidence One es su proveedor de tecnología.',
    payment:
      'Usted paga al ACSP indicado. Evidence One cobra en su nombre como agente. Los datos de la tarjeta se introducen en un proveedor de pago seguro.',
    document:
      'Elija un documento de identidad. Normalmente basta con uno. Todo se hace en el navegador, sin instalar nada.',
    scan: 'Fotografíe su documento o suba una foto nítida. Deben verse las cuatro esquinas y todo el texto.',
    selfie:
      'Un vídeo corto muestra que hay una persona real y compara su cara con la foto del documento.',
    checks:
      'Las comprobaciones se hacen solas: documento, vídeo y listas de control. Permanezca en esta página.',
    address:
      'Pedimos a todas las personas un justificante de su domicilio actual, con fecha de los últimos {n} meses. No es un segundo documento de identidad.',
    evidence:
      'Su ACSP necesita un documento de apoyo, de los admitidos, con fecha de los últimos {n} meses.',
    review:
      'Revise lo que va a enviar y lea las declaraciones. Al enviar, su ACSP estudiará su caso y decidirá.',
    status:
      'Esta página muestra en qué punto está su caso. Decide su ACSP. Companies House le enviará el código personal directamente por correo electrónico.',
    'option-2':
      'Si las comprobaciones en el navegador no admiten su documento, su ACSP puede organizar una comprobación con una persona formada.',
  },
  helper: {
    title: '¿Qué documento puedo usar?',
    intro: 'Pregunte por los documentos que acepta Evidence One.',
    placeholder: 'Escriba su pregunta',
    ask: 'Preguntar',
    chips: {
      list: '¿Qué puedo usar?',
      bank: 'Extracto bancario',
      utility: 'Factura de suministros o impuesto municipal',
      months: '¿Qué antigüedad puede tener?',
      identity: '¿Es un segundo documento de identidad?',
    },
    answers: {
      list: 'Evidence One acepta cualquiera de estos documentos, con fecha de los últimos {n} meses: un extracto bancario o de tarjeta de crédito con movimientos recientes; una factura de suministros o del impuesto municipal; una póliza de seguro que muestre su domicilio; prueba de un uso reciente del pasaporte.',
      bank: 'Sí. Puede usar un extracto bancario o de tarjeta de crédito si muestra movimientos recientes, su nombre y su domicilio, y tiene fecha de los últimos {n} meses.',
      utility:
        'Sí. Puede usar una factura de suministros o del impuesto municipal si muestra su nombre y su domicilio y tiene fecha de los últimos {n} meses.',
      insurance:
        'Sí. Puede usar una póliza de seguro si muestra su domicilio y tiene fecha de los últimos {n} meses.',
      passport_use:
        'Sí. Puede usar una prueba de uso reciente del pasaporte, con fecha de los últimos {n} meses.',
      months:
        'El documento debe tener fecha de los últimos {n} meses, contados desde el día en que lo suba. Si es más antiguo, su ACSP le pedirá uno más reciente.',
      identity:
        'No. No es un segundo documento de identidad. Es un documento de apoyo que muestra su domicilio actual o su nombre. Su documento de identidad se comprueba por separado.',
    },
    outside:
      'Solo puedo ayudarle con los documentos que acepta Evidence One. Su ACSP le aconsejará sobre cualquier otra cosa.',
  },
  declarations: {
    truth:
      'Confirmo que la información que he facilitado es verdadera y completa, y que el documento de identidad que he utilizado es mío.',
    consent:
      'Encargo a {acsp} que realice mi verificación de identidad. Entiendo que {acsp} emite la declaración de verificación y conserva mis registros, y que Evidence One es su proveedor de tecnología.',
  },
}
