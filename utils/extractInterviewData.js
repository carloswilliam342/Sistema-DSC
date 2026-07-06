/**
 * Extrai os dados dos entrevistados a partir do relatório estruturado
 * gerado pela IA. Tolerante a formatos variados (bullets, negrito markdown,
 * separadores `:` ou `-`).
 *
 * @param {string} text texto do relatório estruturado
 * @returns {Array<Object>} lista de entrevistados com campos como
 *   nome, idade, cidade, estadoCivil, renda, genero, resposta
 */
export function extractInterviewData(text) {
  const entries = [];
  const lines = String(text || "").split(/\r?\n/);
  let current = {};

  const pushCurrent = () => {
    if (Object.keys(current).length > 0) {
      // normaliza chaves
      if (!current.resposta) current.resposta = current.resposta || "";
      entries.push(current);
      current = {};
    }
  };

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      // linha em branco separa entrevistados
      pushCurrent();
      continue;
    }

    // Normaliza: remove bullets/asteriscos iniciais e marcadores de negrito
    // para casar rótulos como '* Cidade: Recife' ou '**Cidade**: Recife'.
    const normalized = line
      .replace(/^[\s\-•\*]+/, "") // remove bullets/espaços/asteriscos iniciais
      .replace(/\*\*/g, "") // remove marcadores de negrito
      .replace(/\*/g, "")
      .trim();

    let m;
    m = normalized.match(/^Nome\s*[:\-]\s*(.+)/i);
    if (m) { current.nome = m[1].trim(); continue; }

    m = normalized.match(/^Idade\s*[:\-]\s*(.+)/i);
    if (m) { current.idade = m[1].trim(); continue; }

    m = normalized.match(/^Cidade\s*[:\-]\s*(.+)/i);
    if (m) { current.cidade = m[1].trim(); continue; }

    m = normalized.match(/^(?:Estado\s*civil|Estado\s*Civil)\s*[:\-]\s*(.+)/i);
    if (m) { current.estadoCivil = m[1].trim(); continue; }

    m = normalized.match(/^Renda\s*[:\-]\s*(.+)/i);
    if (m) { current.renda = m[1].trim(); continue; }

    m = normalized.match(/^G[eê]nero\s*[:\-]\s*(.+)/i);
    if (m) { current.genero = m[1].trim(); continue; }

    // resposta/opinião pode aparecer com prefixo 'Resposta' ou 'Resposta/opinião'
    m = normalized.match(/^(?:Resposta(?:\/opini[oõ]o)?|Resposta \/ Opini[oõ]o)\s*[:\-]\s*(.+)/i);
    if (m) { current.resposta = m[1].trim(); pushCurrent(); continue; }

    // Linha de texto livre e longa, com nome já definido → é a resposta
    if (line.length > 40 && current.nome && !current.resposta) {
      current.resposta = (current.resposta ? current.resposta + "\n" : "") + line;
      pushCurrent();
    }
  }
  // adiciona o último em aberto
  pushCurrent();
  return entries;
}
