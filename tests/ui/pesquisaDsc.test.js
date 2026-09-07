import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import Handlebars from "handlebars";
import { validateStudy, validateAnalysis, validateGeneration } from "../../utils/dscValidation.js";

let dom, window, document, fetchMock;
const $ = id => document.getElementById(id);
const respond = data => ({ ok: true, redirected: false, headers: new Map([["content-type", "application/json"]]), json: async () => data });
function set(node, value) { node.value = value; node.dispatchEvent(new window.Event("input", { bubbles: true })); }
function change(node, value) { node.value = value; node.dispatchEvent(new window.Event("change", { bubbles: true })); }
function fixture() {
  const dados = validateStudy({ titulo: "Estudo de teste", pergunta: "Como é o acesso?", categorias: [{ nome: "Custo" }, { nome: "Transporte" }], respondentes: [{ nome: "Ana", sexo: "Feminino", regiao: "Nordeste", depoimento: "Não consigo pagar. O ônibus demora." }, { nome: "Bia", sexo: "Feminino", depoimento: "Não tenho dinheiro." }] });
  const analise = validateAnalysis({ respondentes: [{ id: "r1", palavrasChave: ["custo", "ônibus"], unidades: [{ expressao: "Não consigo pagar.", ideiaCentral: "Dificuldade financeira", categoriaId: "c1" }, { expressao: "O ônibus demora.", ideiaCentral: "Demora do transporte", categoriaId: "c2" }] }, { id: "r2", palavrasChave: ["dinheiro"], unidades: [{ expressao: "Não tenho dinheiro.", ideiaCentral: "Dificuldade financeira", categoriaId: "c1" }] }] }, dados);
  return { id: 7, titulo: dados.titulo, dados, analise, sugestaoOriginal: structuredClone(analise), versoes: [], revisao: 0 };
}
function generated(p, number = 1) {
  return { ...p, revisao: number, versoes: [...p.versoes, { numero: number, criadaEm: "2026-09-05T12:00:00Z", analise: structuredClone(p.analise), discursos: validateGeneration({ discursos: [{ categoriaId: "c1", texto: "Não consigo pagar." }, { categoriaId: "c2", texto: "Espero pelo ônibus." }] }, p.dados, p.analise) }] };
}
beforeEach(() => {
  const html = Handlebars.compile(readFileSync("views/pesquisa-dsc.handlebars", "utf8"))({ basePath: "/dsc" });
  dom = new JSDOM(html, { url: "http://localhost/dsc/criar-discurso", runScripts: "outside-only" });
  window = dom.window; document = window.document; fetchMock = vi.fn(); window.fetch = fetchMock; window.confirm = vi.fn(() => true);
  window.eval(readFileSync("public/js/pesquisa-dsc.js", "utf8"));
});
afterEach(() => dom.window.close());
async function fillStudy(p = fixture()) {
  set($("titulo-estudo"), p.dados.titulo); set($("pergunta-estudo"), p.dados.pergunta);
  set(document.querySelector("#categorias-editor input"), "Custo"); $("adicionar-categoria").click(); set(document.querySelectorAll("#categorias-editor input")[1], "Transporte");
  $("avancar-etapa").click();
  set(document.querySelector("#respondentes-editor input"), "Ana"); $("adicionar-respondente").click(); set(document.querySelectorAll("#respondentes-editor .dsc-card")[1].querySelector("input"), "Bia");
  $("avancar-etapa").click(); const statements = document.querySelectorAll("#depoimentos-editor textarea"); set(statements[0], p.dados.respondentes[0].depoimento); set(statements[1], p.dados.respondentes[1].depoimento);
  fetchMock.mockResolvedValueOnce(respond(p)); $("avancar-etapa").click(); await vi.waitFor(() => expect(document.querySelector('[data-step="3"]').hidden).toBe(false));
  await vi.waitFor(() => expect($("gerar-dsc").disabled).toBe(false)); return p;
}
async function showResults() { const p = await fillStudy(); fetchMock.mockResolvedValueOnce(respond(generated(p))); $("confirmar-revisao").checked = true; $("gerar-dsc").click(); await vi.waitFor(() => expect(document.querySelector('[data-step="4"]').hidden).toBe(false)); await vi.waitFor(() => expect($("redefinir-dsc").disabled).toBe(false)); return generated(p); }

describe("Interface DSC (DOM)", () => {
  it("impede avançar com campos obrigatórios vazios", () => { $("avancar-etapa").click(); expect(document.querySelector('[data-step="0"]').hidden).toBe(false); expect(fetchMock).not.toHaveBeenCalled(); });
  it("mantém os dados ao voltar e bloqueia etapa de depoimentos incompleta", () => { set($("titulo-estudo"), "Título"); set($("pergunta-estudo"), "Pergunta?"); set(document.querySelector("#categorias-editor input"), "Custo"); $("avancar-etapa").click(); set(document.querySelector("#respondentes-editor input"), "Ana"); $("avancar-etapa").click(); $("avancar-etapa").click(); expect(document.querySelector('[data-step="2"]').hidden).toBe(false); $("voltar-etapa").click(); expect(document.querySelector("#respondentes-editor input").value).toBe("Ana"); expect(fetchMock).not.toHaveBeenCalled(); });
  it("percorre etapas, envia ao prefixo correto e exige revisão", async () => { await fillStudy(); expect(fetchMock.mock.calls[0][0]).toBe("/dsc/criar-discurso/api/pesquisas"); $("gerar-dsc").click(); expect(fetchMock).toHaveBeenCalledTimes(1); expect($("dsc-status").textContent).toContain("Confirme"); });
  it("permite corrigir categoria e invalida a confirmação anterior", async () => { await fillStudy(); $("confirmar-revisao").checked = true; change(document.querySelector("#revisao-editor select"), "c2"); expect($("confirmar-revisao").checked).toBe(false); });
  it("os filtros DP, palavras-chave, IC e demografia mostram dados distintos por pessoa", async () => {
    await showResults(); expect($("resultado-conteudo").querySelectorAll("article")).toHaveLength(2);
    change($("filtro-conteudo"), "depoimento"); expect($("resultado-conteudo").textContent).toContain("Não consigo pagar. O ônibus demora."); expect($("resultado-conteudo").textContent).not.toContain("Dificuldade financeira");
    change($("filtro-conteudo"), "palavrasChave"); expect($("resultado-conteudo").textContent).toContain("custo, ônibus"); expect($("resultado-conteudo").textContent).not.toContain("Não consigo pagar.");
    change($("filtro-conteudo"), "ideiaCentral"); expect($("resultado-conteudo").textContent).toContain("Dificuldade financeira");
    change($("filtro-conteudo"), "sexo"); expect($("resultado-conteudo").textContent).toContain("Feminino");
    change($("filtro-categoria"), "c2"); expect($("resultado-conteudo").textContent).toContain("Ana"); expect($("resultado-conteudo").textContent).not.toContain("Bia");
    change($("filtro-respondente"), "r2"); expect($("resultado-conteudo").textContent).toContain("Nenhum resultado"); expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("preserva a versão selecionada no link de PDF e permite regenerar", async () => { const p = await showResults(); expect($("exportar-pdf").getAttribute("href")).toBe("/dsc/criar-discurso/api/pesquisas/7/pdf?versao=1"); $("redefinir-dsc").click(); set($("comando-geracao"), "Mais direto."); $("confirmar-revisao").checked = true; fetchMock.mockResolvedValueOnce(respond(generated(p, 2))); $("gerar-dsc").click(); await vi.waitFor(() => expect($("filtro-versao").options).toHaveLength(2)); change($("filtro-versao"), "1"); expect($("exportar-pdf").getAttribute("href")).toContain("versao=1"); const body = JSON.parse(fetchMock.mock.calls.at(-1)[1].body); expect(body.comando).toBe("Mais direto."); expect(body.revisao).toBe(1); });
  it("renderiza conteúdo como texto e não executa HTML de depoimentos ou nomes", async () => { const p = fixture(); p.dados.respondentes[0].nome = '<img src=x onerror="alert(1)">'; await fillStudy(p); expect($("revisao-editor").querySelector("img")).toBeNull(); expect($("revisao-editor").textContent).toContain("<img"); });
  it("restaura os controles após falha e permite tentar novamente", async () => { await fillStudy(); fetchMock.mockRejectedValueOnce(new Error("Falha temporária")); $("confirmar-revisao").checked = true; $("gerar-dsc").click(); await vi.waitFor(() => expect($("dsc-status").textContent).toContain("Falha temporária")); expect($("gerar-dsc").disabled).toBe(false); expect(document.querySelector('[data-step="3"]').hidden).toBe(false); });
  it("abre histórico, reabre um estudo e restaura os resultados", async () => { const p = await showResults(); fetchMock.mockResolvedValueOnce(respond({ pesquisas: [{ id: p.id, titulo: p.titulo, createdAt: "2026-09-05", revisao: 1 }], total: 1 })); $("abrir-historico").click(); await vi.waitFor(() => expect($("historico-painel").hidden).toBe(false)); fetchMock.mockResolvedValueOnce(respond(p)); document.querySelector("#historico-lista button").click(); await vi.waitFor(() => expect($("historico-painel").hidden).toBe(true)); expect($("resultado-conteudo").textContent).toContain("Não consigo pagar."); });
});
