// Renderizador de markdown minimalista y SEGURO para Vórtex Notes.
// Estrategia: primero se escapa TODO el HTML crudo y solo despues se aplican
// las transformaciones markdown, por lo que nunca se inyecta HTML del usuario.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeHref(url: string): string | null {
  const u = url.trim()
  if (/^(https?:\/\/|mailto:)/i.test(u)) return u
  return null
}

function inline(md: string): string {
  let out = md
  // codigo en linea `x` (evita conflictos con el resto)
  out = out.replace(/`([^`]+)`/g, (_m, c: string) => `<code>${c}</code>`)
  // enlaces [texto](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    const href = safeHref(url)
    if (!href) return text
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
  })
  // negrita y cursiva
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return out
}

// Devuelve HTML como string (se usa con dangerouslySetInnerHTML en la vista previa).
export function renderMarkdown(md: string): string {
  const escaped = escapeHtml(md.replace(/\r\n/g, '\n'))
  const lines = escaped.split('\n')
  const html: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let inCode = false
  let codeBuf: string[] = []
  let paraBuf: string[] = []

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }
  const flushPara = () => {
    if (paraBuf.length) {
      html.push(`<p>${paraBuf.map(inline).join('<br/>')}</p>`)
      paraBuf = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine

    if (inCode) {
      if (/^```/.test(line.trim())) {
        html.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`)
        codeBuf = []
        inCode = false
      } else {
        codeBuf.push(line)
      }
      continue
    }

    if (/^```/.test(line.trim())) {
      flushPara()
      closeList()
      inCode = true
      continue
    }

    if (line.trim() === '') {
      flushPara()
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      flushPara()
      closeList()
      const level = Math.min(heading[1].length + 1, 5) // h2..h5
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }

    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      flushPara()
      closeList()
      html.push('<hr/>')
      continue
    }

    const quote = line.match(/^\s*&gt;\s?(.*)$/)
    if (quote) {
      flushPara()
      closeList()
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`)
      continue
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${inline(ul[1])}</li>`)
      continue
    }

    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (ol) {
      flushPara()
      if (listType !== 'ol') {
        closeList()
        html.push('<ol>')
        listType = 'ol'
      }
      html.push(`<li>${inline(ol[1])}</li>`)
      continue
    }

    closeList()
    paraBuf.push(line)
  }

  if (inCode) html.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`)
  flushPara()
  closeList()

  return html.join('\n')
}

// Recuento aproximado de palabras para el editor.
export function wordCount(text: string): number {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).length
}
