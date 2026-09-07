export class DscError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const fail = message => { throw new DscError(message); };
function text(value, label, max = 200, optional = false) {
  if (optional && (value === undefined || value === null || value === "")) return "";
  if (typeof value !== "string" || !value.trim() || value.length > max) fail(`${label}: preencha um texto de até ${max} caracteres.`);
  return value.trim();
}
function list(value, label, max) {
  if (!Array.isArray(value) || value.length > max) fail(`${label}: lista inválida (máximo ${max}).`);
  return value;
}
function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}: estrutura inválida.`);
  return value;
}
export function validateStudy(body) {
  object(body, "Estudo");
  const categorias = list(body.categorias, "Categorias", 30).map((c, i) => { object(c, "Categoria"); return { id: `c${i + 1}`, nome: text(c.nome, "Categoria", 120), descricao: text(c.descricao, "Descrição da categoria", 1000, true) }; });
  if (!categorias.length) fail("Cadastre pelo menos uma categoria antes de continuar.");
  if (new Set(categorias.map(c => c.nome.toLocaleLowerCase("pt-BR"))).size !== categorias.length) fail("As categorias devem ter nomes diferentes.");
  const respondentes = list(body.respondentes, "Respondentes", 100).map((r, i) => {
    object(r, "Respondente");
    const result = { id: `r${i + 1}`, nome: text(r.nome, "Nome ou pseudônimo"), depoimento: text(r.depoimento, "Depoimento", 20000) };
    result.depoimento = r.depoimento; // Preserva inclusive espaços e quebras do original validado.
    for (const key of ["idade", "sexo", "cor", "renda", "escolaridade", "cidade", "estado", "regiao", "ocupacao", "outros"]) result[key] = text(r[key], key, key === "outros" ? 1000 : 200, true);
    if (result.idade && (!/^\d{1,3}$/.test(result.idade) || Number(result.idade) > 130)) fail("Idade deve ser um número entre 0 e 130 ou ficar em branco.");
    return result;
  });
  if (!respondentes.length) fail("Cadastre pelo menos um respondente e seu depoimento.");
  if (respondentes.reduce((total, r) => total + r.depoimento.length, 0) > 200000) fail("Os depoimentos devem somar no máximo 200.000 caracteres por estudo.");
  return { titulo: text(body.titulo, "Título"), pergunta: text(body.pergunta, "Pergunta da entrevista", 2000), categorias, respondentes };
}
export function parseModelJson(raw) {
  try {
    if (typeof raw !== "string" || raw.length > 1000000) throw new Error();
    return JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch { throw new DscError("A IA retornou uma estrutura inválida. Tente novamente.", 502); }
}
export function validateAnalysis(raw, data) {
  const rows = list(raw?.respondentes, "Análise dos respondentes", 100);
  rows.forEach(r => object(r, "Respondente analisado"));
  if (rows.length !== data.respondentes.length) fail("A análise precisa incluir todos os respondentes.");
  const ids = new Set();
  return { respondentes: data.respondentes.map(source => {
    const row = rows.find(r => r.id === source.id);
    if (!row || ids.has(row.id)) fail("Identificação de respondente inválida.");
    ids.add(row.id);
    const palavrasChave = list(row.palavrasChave, "Palavras-chave", 15).map(w => text(w, "Palavra-chave", 100));
    const unidades = list(row.unidades, "Unidades de sentido", 50).map((u, i) => {
      object(u, "Unidade de sentido");
      const expressao = text(u.expressao, "Expressão-chave", 20000);
      if (!source.depoimento.includes(expressao)) fail(`A expressão-chave de ${source.id} não é um trecho literal do depoimento.`);
      if (u.categoriaId !== null && !data.categorias.some(c => c.id === u.categoriaId)) fail("Categoria não cadastrada no estudo.");
      let ancoragem = null;
      if (u.ancoragem != null) {
        ancoragem = { expressao: text(u.ancoragem.expressao, "Trecho da ancoragem", 20000), descricao: text(u.ancoragem.descricao, "Ancoragem", 1000) };
        if (!source.depoimento.includes(ancoragem.expressao)) fail("A ancoragem deve conter uma citação literal do depoimento.");
      }
      return { id: `${source.id}u${i + 1}`, expressao, ideiaCentral: text(u.ideiaCentral, "Ideia central", 1000), ancoragem, categoriaId: u.categoriaId, justificativa: text(u.justificativa, "Justificativa", 1000, true) };
    });
    return { id: source.id, palavrasChave, unidades };
  }) };
}
// Hífens e apóstrofos internos pertencem à palavra; pontuação isolada não conta.
export function countWords(value) { return (value.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length; }
export function validateGeneration(raw, data, analysis) {
  const rows = list(raw?.discursos, "DSCs", 30);
  rows.forEach(r => object(r, "DSC"));
  if (rows.length !== data.categorias.length || new Set(rows.map(r => r.categoriaId)).size !== rows.length) fail("A geração deve conter exatamente um resultado por categoria.");
  return data.categorias.map(c => {
    const row = rows.find(r => r.categoriaId === c.id);
    if (!row) fail("Categoria ausente na geração.");
    const fontes = analysis.respondentes.flatMap(r => r.unidades.filter(u => u.categoriaId === c.id).map(u => ({ respondenteId: r.id, unidadeId: u.id })));
    if (!fontes.length) return { categoriaId: c.id, texto: null, pendencia: "Sem expressões-chave nesta categoria.", fontes, palavras: 0 };
    if (row.texto === null) return { categoriaId: c.id, texto: null, pendencia: text(row.pendencia, "Pendência", 1000), fontes, palavras: 0 };
    const texto = text(row.texto, "DSC", 500);
    const palavras = countWords(texto);
    if (palavras < 1 || palavras > 10) fail("O DSC inteiro deve ter no máximo 10 palavras.");
    if (/[.!?…]\s*\S/u.test(texto) || /[\r\n]/u.test(texto)) fail("O DSC deve conter apenas uma frase.");
    return { categoriaId: c.id, texto, pendencia: null, fontes, palavras };
  });
}
