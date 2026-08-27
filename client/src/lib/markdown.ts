function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface ParsedContent {
  html: string
  headings: { level: number; text: string; id: string }[]
}

export function parseMarkdownToHtml(raw: string): ParsedContent {
  const headings: { level: number; text: string; id: string }[] = []
  const usedIds = new Set<string>()

  const html = raw.replace(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, inner) => {
    const cleanText = inner.replace(/<[^>]+>/g, '').trim()
    if (!cleanText) return _match

    let id = slugify(cleanText)
    if (usedIds.has(id)) {
      let n = 2
      while (usedIds.has(`${id}-${n}`)) n++
      id = `${id}-${n}`
    }
    usedIds.add(id)

    headings.push({ level: Number(level), text: cleanText, id })
    return `<h${level} id="${id}">${inner}</h${level}>`
  })

  return { html, headings }
}
