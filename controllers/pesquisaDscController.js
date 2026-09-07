import ClientGemini from "../client.js";
import PesquisaDSC from "../models/PesquisaDSC.js";
import { analysisPrompt, generationPrompt, PROMPT_VERSION } from "../utils/dscMethodology.js";
import { DscError, validateStudy, validateAnalysis, validateGeneration, parseModelJson } from "../utils/dscValidation.js";
import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import PDFDocument from "pdfkit";

// Retenta uma única vez respostas estruturalmente inválidas, sem salvar saídas inválidas.
async function structured(prompt, validate) {
  let lastError;
  for (let i = 0; i < 2; i++) {
    const raw = await ClientGemini(prompt + (i ? `\nA tentativa anterior falhou na validação: ${lastError.message}. Refaça respeitando o contrato JSON e as fontes.` : ""), { responseMimeType: "application/json", temperature: 0.2, httpOptions: { timeout: 60000 } });
    try { return validate(parseModelJson(raw)); }
    catch (error) { lastError = error; }
  }
  throw new DscError(`Não foi possível validar a resposta da IA: ${lastError.message}`, 502);
}

function handleError(error, res) {
  if (error instanceof DscError) return res.status(error.status).json({ erro: error.message });
  // Não registrar depoimentos, dados pessoais ou respostas do provedor.
  console.error("Falha no fluxo DSC:", error.name, "mensagem:", error.message, "status:", error.status, "código:", error.cause?.code);
  return res.status(500).json({ erro: "Não foi possível concluir a operação. Verifique a conexão com o banco e o serviço de IA e tente novamente." });
}
async function owned(req) {
  if (!/^\d+$/.test(String(req.params.id))) throw new DscError("Pesquisa não encontrada.", 404);
  const study = await PesquisaDSC.findOne({ where: { id: req.params.id, usuarioId: req.session.usuario.id } });
  if (!study) throw new DscError("Pesquisa não encontrada.", 404);
  return study;
}

export async function analisarPesquisa(req, res) {
  try {
    const dados = validateStudy(req.body);
    const analise = await structured(analysisPrompt(dados), raw => validateAnalysis(raw, dados));
    const study = await PesquisaDSC.create({ usuarioId: req.session.usuario.id, titulo: dados.titulo, dados, analise, sugestaoOriginal: analise, versoes: [] });
    return res.status(201).json(study);
  } catch (error) { return handleError(error, res); }
}

export async function listarPesquisas(req, res) {
  try {
    const page = Math.max(0, Math.min(100000, Number.parseInt(req.query.pagina, 10) || 0));
    const result = await PesquisaDSC.findAndCountAll({ where: { usuarioId: req.session.usuario.id }, attributes: ["id", "titulo", "createdAt", "updatedAt", "revisao"], order: [["createdAt", "DESC"], ["id", "DESC"]], limit: 20, offset: page * 20 });
    return res.json({ pesquisas: result.rows, total: result.count, pagina: page });
  } catch (error) { return handleError(error, res); }
}
export async function obterPesquisa(req, res) {
  try { return res.json(await owned(req)); }
  catch (error) { return handleError(error, res); }
}

export async function gerarPesquisa(req, res) {
  try {
    const study = await owned(req);
    if (req.body.revisao !== study.revisao) throw new DscError("Esta pesquisa foi atualizada em outra aba. Reabra pelo histórico antes de gerar.", 409);
    if (req.body.revisado !== true) throw new DscError("Revise e confirme as categorias e expressões-chave antes de gerar.");
    const analise = validateAnalysis(req.body.analise, study.dados);
    const comando = req.body.comando ?? "";
    if (typeof comando !== "string" || comando.length > 1000) throw new DscError("O comando deve ter até 1.000 caracteres.");
    if (study.versoes.length >= 100) throw new DscError("Este estudo atingiu 100 versões. Crie um novo estudo para continuar.");
    const discursos = await structured(generationPrompt(study.dados, analise, comando), raw => validateGeneration(raw, study.dados, analise));
    const versao = { numero: study.versoes.length + 1, criadaEm: new Date().toISOString(), promptVersion: PROMPT_VERSION, comando, analise, discursos };
    const versoes = [...study.versoes, versao];
    // Comparação atômica protege o histórico de gerações simultâneas.
    const [updated] = await PesquisaDSC.update({ analise, versoes, revisao: study.revisao + 1 }, { where: { id: study.id, usuarioId: req.session.usuario.id, revisao: study.revisao } });
    if (!updated) throw new DscError("Outra geração foi salva durante a operação. Reabra a pesquisa pelo histórico.", 409);
    await study.reload();
    return res.json(study);
  } catch (error) { return handleError(error, res); }
}

export async function importarDepoimento(req, res) {
  try {
    if (!req.file) throw new DscError("Selecione um arquivo TXT, DOCX ou PDF.");
    let texto;
    if (req.file.mimetype === "text/plain") texto = req.file.buffer.toString("utf8");
    else if (req.file.mimetype === "application/pdf") texto = (await pdfParse(req.file.buffer)).text;
    else texto = (await mammoth.extractRawText({ buffer: req.file.buffer })).value;
    if (!texto?.trim()) throw new DscError("Não há texto extraível no arquivo. Para PDF digitalizado, transcreva o depoimento.");
    if (texto.length > 20000) throw new DscError("Importe um depoimento por vez, com até 20.000 caracteres.");
    return res.json({ texto: texto.trim() });
  } catch (error) { return handleError(error, res); }
}

export async function exportarPesquisa(req, res) {
  try {
    const study = await owned(req);
    const number = req.query.versao ? Number(req.query.versao) : study.versoes.length;
    const version = study.versoes.find(v => v.numero === number);
    if (!version) throw new DscError("Versão não encontrada.", 404);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="dsc-${study.id}-v${version.numero}.pdf"`);
    const doc = new PDFDocument({ margin: 48 });
    doc.on("error", () => { if (!res.destroyed) res.destroy(); });
    doc.pipe(res);
    doc.fontSize(18).text(study.titulo).moveDown();
    doc.fontSize(11).text(`Pergunta: ${study.dados.pergunta}`).text(`Versão ${version.numero} | ${version.criadaEm} | ${version.promptVersion}`).text("DSC breve: até 10 palavras por categoria. ECH e IC preservadas para conferência.").moveDown();
    for (const d of version.discursos) {
      doc.fontSize(14).text(study.dados.categorias.find(c => c.id === d.categoriaId).nome);
      doc.fontSize(11).text(d.texto || `Pendente: ${d.pendencia}`).moveDown();
    }
    doc.addPage().fontSize(16).text("Depoimentos e análise revisada").moveDown();
    for (const r of study.dados.respondentes) {
      const a = version.analise.respondentes.find(row => row.id === r.id);
      doc.fontSize(13).text(`${r.id} — ${r.nome}`);
      doc.fontSize(10);
      for (const [key, label] of Object.entries({ idade: "Idade", sexo: "Sexo", cor: "Cor/raça", renda: "Renda", escolaridade: "Grau de instrução", cidade: "Cidade", estado: "Estado", regiao: "Região", ocupacao: "Ocupação", outros: "Outros dados" })) doc.text(`${label}: ${r[key] || "Não informado"}`);
      doc.text(`DP: ${r.depoimento}`).text(`Palavras-chave: ${a.palavrasChave.join(", ") || "Não identificadas"}`);
      for (const u of a.unidades) {
        doc.text(`ECH (${u.id}): ${u.expressao}`).text(`IC: ${u.ideiaCentral}`).text(`Categoria: ${study.dados.categorias.find(c => c.id === u.categoriaId)?.nome || "Sem categoria"}`);
        if (u.ancoragem) doc.text(`AC: ${u.ancoragem.descricao} — ${u.ancoragem.expressao}`);
      }
      doc.moveDown();
    }
    doc.end();
  } catch (error) { if (!res.headersSent) return handleError(error, res); res.end(); }
}
