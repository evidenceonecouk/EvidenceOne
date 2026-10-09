/*
  A deliberately small PDF writer: monospaced text on A4 landscape pages. It is
  enough for a downloadable monthly statement in the demo, with no dependency.
*/

const PAGE_W = 842
const PAGE_H = 595
const MARGIN = 40
const LEADING = 13
const FONT_SIZE = 9

const clean = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7e\xa3]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

export function buildPdf(lines: string[]): Blob {
  const perPage = Math.floor((PAGE_H - MARGIN * 2) / LEADING)
  const pages: string[][] = []
  for (let i = 0; i < lines.length; i += perPage)
    pages.push(lines.slice(i, i + perPage))
  if (!pages.length) pages.push([''])

  // Objects: 1 catalog, 2 pages, 3 font, then a content stream and a page for each page of text.
  const objects: string[] = []
  const pageIds = pages.map((_, i) => 5 + i * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'
  pages.forEach((pageLines, i) => {
    const content = [
      'BT',
      `/F1 ${FONT_SIZE} Tf`,
      `${LEADING} TL`,
      `${MARGIN} ${PAGE_H - MARGIN} Td`,
      ...pageLines.map((l) => `(${clean(l)}) '`),
      'ET',
    ].join('\n')
    objects[4 + i * 2] =
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
    objects[5 + i * 2] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${4 + i * 2} 0 R >>`
  })

  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = out.length
    out += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }
  const xref = out.length
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let id = 1; id < objects.length; id++)
    out += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  const bytes = new Uint8Array(out.length)
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff
  return new Blob([bytes], { type: 'application/pdf' })
}
