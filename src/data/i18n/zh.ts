import type { LanguageStrings } from './types'

export const zh: LanguageStrings = {
  code: 'zh',
  notice: {
    inYourLanguage: '您的语言',
    aiLocal: 'AI 翻译，仅供参考。以英文文本为准。',
    showEnglish: '显示英文',
    hideEnglish: '隐藏英文',
    legalNote: '法律措辞保持英文，译文显示在其下方。',
    translationLabel: '译文',
  },
  guidance: {
    invite:
      '您受邀就一家公司确认身份。验证将由为您指定的 ACSP 进行，Evidence One 是其技术服务提供方。',
    contact:
      '我们会向您的电子邮箱和手机各发送一个一次性验证码，以确认这些联系方式属于您。',
    details:
      '这些信息来自 Companies House 登记册。请核对。如有错误，您可以申请更正。',
    personal:
      '请填写姓名、曾用名、出生日期以及最近 12 个月的住址。您的 ACSP 会将其与登记册核对。',
    suggest:
      'ACSP 是获准为 Companies House 核实身份的机构。我们根据明确的标准推荐，例如您的国家、证件和语言。由您选择。',
    instruct:
      '这是将为您核实身份的机构。它对核实负责，并自行确定收费。Evidence One 是其技术服务提供方。',
    payment:
      '您向指定的 ACSP 付款。Evidence One 作为其代理代收款项。银行卡信息在安全的支付服务商处输入。',
    document:
      '请选择一份身份证件，通常一份就够了。全程在浏览器中完成，无需安装任何软件。',
    scan: '请拍摄证件或上传清晰的照片。四个角和所有文字都必须可见。',
    selfie:
      '一段简短的视频用来确认是真人在场，并将您与证件上的照片比对。',
    checks:
      '检查会自动进行，包括证件、视频和筛查名单。请留在此页面。',
    address:
      '我们请每个人提供一份证明当前住址的文件，日期须在最近 {n} 个月内。这不是第二份身份证件。',
    evidence:
      '您的 ACSP 需要一份支持文件，须属于可接受的文件之一，日期在最近 {n} 个月内。',
    review:
      '请核对要提交的内容并阅读声明。提交后，您的 ACSP 将审核并作出决定。',
    status:
      '此页面显示您的案件进度。决定由您的 ACSP 作出。Companies House 会通过电子邮件将个人验证码直接发送给您。',
    'option-2':
      '如果浏览器检查无法支持您的证件，您的 ACSP 可以安排由受过培训的人员进行检查。',
  },
  helper: {
    title: '我可以使用哪些文件？',
    intro: '请询问 Evidence One 接受的文件。',
    placeholder: '输入您的问题',
    ask: '提问',
    chips: {
      list: '我可以用什么？',
      bank: '银行对账单',
      utility: '水电燃气账单或市政税账单',
      months: '日期要多近？',
      identity: '这是第二份身份证件吗？',
    },
    answers: {
      list: 'Evidence One 接受以下任意一份文件，日期须在最近 {n} 个月内：含近期交易的银行或信用卡对账单；水电燃气账单或市政税账单；显示您家庭住址的保险单据；近期使用护照的证明。',
      bank: '可以。银行或信用卡对账单如果显示近期交易、您的姓名和家庭住址，且日期在最近 {n} 个月内，就可以使用。',
      utility:
        '可以。水电燃气账单或市政税账单如果显示您的姓名和家庭住址，且日期在最近 {n} 个月内，就可以使用。',
      insurance:
        '可以。保险单据如果显示您的家庭住址，且日期在最近 {n} 个月内，就可以使用。',
      passport_use:
        '可以。近期使用护照的证明可以使用，日期须在最近 {n} 个月内。',
      months:
        '文件日期须在最近 {n} 个月内，从您上传当天往前计算。如果更早，您的 ACSP 会请您提供更新的文件。',
      identity:
        '不是。这不是第二份身份证件。它是一份支持文件，用来显示您的当前住址或姓名。您的身份证件会单独检查。',
    },
    outside:
      '我只能就 Evidence One 接受的文件提供帮助。其他问题请咨询您的 ACSP。',
  },
  declarations: {
    truth: '我确认所提供的信息真实、完整，并确认所使用的身份证件属于我本人。',
    consent:
      '我委托 {acsp} 对我的身份进行核实。我理解 {acsp} 出具核实声明并保存我的记录，Evidence One 是其技术服务提供方。',
  },
}
