import { beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { engine } from "express-handlebars";
vi.mock("../../client.js", () => ({ default: vi.fn() }));
import ClientGemini from "../../client.js";
import router from "../../routes/discursoRoutes.js";
import sequelize from "../../config/database.js";
import PesquisaDSC from "../../models/PesquisaDSC.js";

const app = express();
app.engine("handlebars", engine({ defaultLayout: false })); app.set("view engine", "handlebars");
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => { req.session = req.headers["x-test-user"] ? { usuario: { id: Number(req.headers["x-test-user"]) } } : {}; next(); });
app.use("/dsc/criar-discurso", router);
const url = "/dsc/criar-discurso/api/pesquisas";
const input = () => ({ titulo: "Estudo de teste", pergunta: "Como é o atendimento?", categorias: [{ nome: "Dificuldade financeira" }, { nome: "Acolhimento" }], respondentes: [{ nome: "Ana", depoimento: "Não consigo pagar. Sou bem atendida." }] });
const extracted = () => ({ respondentes: [{ id: "r1", palavrasChave: ["custo", "atendimento"], unidades: [{ expressao: "Não consigo pagar.", ideiaCentral: "Dificuldade financeira", categoriaId: "c1", ancoragem: null }, { expressao: "Sou bem atendida.", ideiaCentral: "Bom acolhimento", categoriaId: "c2", ancoragem: null }] }] });
const generated = () => ({ discursos: [{ categoriaId: "c1", texto: "Não consigo pagar." }, { categoriaId: "c2", texto: "Sou bem atendida." }] });
const post = (path, body, user = "1") => request(app).post(path).set("x-test-user", user).send(body);
async function createStudy() { ClientGemini.mockResolvedValueOnce(JSON.stringify(extracted())); return (await post(url, input()).expect(201)).body; }
beforeEach(async () => { ClientGemini.mockReset(); await sequelize.sync({ force: true }); });
afterAll(async () => { await sequelize.close(); });

describe("Fluxo DSC com HTTP e persistência real", () => {
  it("normaliza colunas JSON devolvidas como texto pelo MySQL", () => {
    const study = PesquisaDSC.build();
    study.setDataValue("dados", '{"categorias":[],"respondentes":[]}');
    study.setDataValue("analise", '{"respondentes":[]}');
    study.setDataValue("sugestaoOriginal", '{"respondentes":[]}');
    study.setDataValue("versoes", '[]');
    expect(study.dados).toEqual({ categorias: [], respondentes: [] });
    expect(study.analise).toEqual({ respondentes: [] });
    expect(study.sugestaoOriginal).toEqual({ respondentes: [] });
    expect(study.versoes).toEqual([]);
  });
  it("exige autenticação e serve o novo formulário sob /dsc", async () => { await request(app).get(url).expect(302); const r = await request(app).get("/dsc/criar-discurso").set("x-test-user", "1").expect(200); expect(r.text).toContain("Categorias"); expect(r.text).toContain("confirmar-revisao"); });
  it("bloqueia o endpoint legado que pulava categorias e revisão", async () => { await post("/dsc/criar-discurso/transformar", { texto: "Teste" }).expect(410); expect(ClientGemini).not.toHaveBeenCalled(); });
  it("bloqueia a análise antes do preenchimento completo", async () => { await post(url, { ...input(), categorias: [] }).expect(400); expect(ClientGemini).not.toHaveBeenCalled(); expect(await PesquisaDSC.count()).toBe(0); });
  it("salva original e sugestão da IA, preservando os depoimentos", async () => { const p = await createStudy(); const saved = await PesquisaDSC.findByPk(p.id); expect(saved.dados.respondentes[0].depoimento).toBe(input().respondentes[0].depoimento); expect(saved.sugestaoOriginal).toEqual(saved.analise); expect(saved.versoes).toEqual([]); });
  it("separa histórico, acesso, geração e exportação por usuário", async () => {
    const p = await createStudy(); const list = await request(app).get(url).set("x-test-user", "2").expect(200); expect(list.body.total).toBe(0);
    await request(app).get(`${url}/${p.id}`).set("x-test-user", "2").expect(404);
    await post(`${url}/${p.id}/gerar`, { revisao: 0, revisado: true, analise: p.analise }, "2").expect(404);
    await request(app).get(`${url}/${p.id}/pdf`).set("x-test-user", "2").expect(404);
    expect(ClientGemini).toHaveBeenCalledTimes(1);
  });
  it("exige revisão explícita e impede citações adulteradas", async () => { const p = await createStudy(); await post(`${url}/${p.id}/gerar`, { revisao: 0, analise: p.analise }).expect(400); p.analise.respondentes[0].unidades[0].expressao = "Eu posso pagar."; await post(`${url}/${p.id}/gerar`, { revisao: 0, revisado: true, analise: p.analise }).expect(400); expect(ClientGemini).toHaveBeenCalledTimes(1); });
  it("grava duas versões sem sobrescrever a primeira ou a classificação original", async () => {
    let p = await createStudy(); ClientGemini.mockResolvedValueOnce(JSON.stringify(generated()));
    p = (await post(`${url}/${p.id}/gerar`, { revisao: 0, revisado: true, analise: p.analise }).expect(200)).body;
    const first = p.versoes[0]; p.analise.respondentes[0].unidades[1].categoriaId = null;
    ClientGemini.mockResolvedValueOnce(JSON.stringify(generated()));
    p = (await post(`${url}/${p.id}/gerar`, { revisao: 1, revisado: true, analise: p.analise, comando: "Seja direto." }).expect(200)).body;
    expect(p.versoes).toHaveLength(2); expect(p.versoes[0]).toEqual(first); expect(p.versoes[1].comando).toBe("Seja direto."); expect(p.versoes[1].discursos[1].texto).toBeNull(); expect(p.sugestaoOriginal.respondentes[0].unidades[1].categoriaId).toBe("c2");
    const reopened = await request(app).get(`${url}/${p.id}`).set("x-test-user", "1").expect(200); expect(reopened.body.versoes).toHaveLength(2);
  });
  it("retenta uma resposta acima de dez palavras e só salva uma geração válida", async () => {
    const p = await createStudy(), invalid = generated(); invalid.discursos[0].texto = "Eu não consigo pagar todas as despesas da minha consulta hoje.";
    ClientGemini.mockResolvedValueOnce(JSON.stringify(invalid)).mockResolvedValueOnce(JSON.stringify(generated()));
    const r = await post(`${url}/${p.id}/gerar`, { revisao: 0, revisado: true, analise: p.analise }).expect(200); expect(r.body.versoes).toHaveLength(1); expect(ClientGemini).toHaveBeenCalledTimes(3);
  });
  it("não salva geração inválida após duas tentativas", async () => { const p = await createStudy(); ClientGemini.mockResolvedValue("JSON inválido"); await post(`${url}/${p.id}/gerar`, { revisao: 0, revisado: true, analise: p.analise }).expect(502); expect((await PesquisaDSC.findByPk(p.id)).versoes).toHaveLength(0); });
  it("não cria estudo se a análise da IA omitir um respondente", async () => { ClientGemini.mockResolvedValue('{"respondentes":[]}'); await post(url, input()).expect(502); expect(await PesquisaDSC.count()).toBe(0); });
  it("recusa atualização desatualizada antes de chamar IA", async () => { const p = await createStudy(); await post(`${url}/${p.id}/gerar`, { revisao: 99, revisado: true, analise: p.analise }).expect(409); expect(ClientGemini).toHaveBeenCalledTimes(1); });
  it("protege versões contra duas gerações simultâneas", async () => {
    const p = await createStudy(); let release; const gate = new Promise(resolve => { release = resolve; }); let calls = 0;
    ClientGemini.mockImplementation(async () => { calls++; if (calls === 2) release(); await gate; return JSON.stringify(generated()); });
    const body = { revisao: 0, revisado: true, analise: p.analise };
    const result = await Promise.all([post(`${url}/${p.id}/gerar`, body), post(`${url}/${p.id}/gerar`, body)]);
    expect(result.map(r => r.status).sort()).toEqual([200, 409]); expect((await PesquisaDSC.findByPk(p.id)).versoes).toHaveLength(1);
  });
  it("exporta uma versão específica em PDF e permite downloads repetidos", async () => {
    const p = await createStudy(); ClientGemini.mockResolvedValueOnce(JSON.stringify(generated())); await post(`${url}/${p.id}/gerar`, { revisao: 0, revisado: true, analise: p.analise }).expect(200);
    for (let i = 0; i < 2; i++) { const pdf = await request(app).get(`${url}/${p.id}/pdf?versao=1`).set("x-test-user", "1").expect(200); expect(pdf.headers["content-type"]).toContain("application/pdf"); expect(pdf.body.subarray(0, 4).toString()).toBe("%PDF"); }
    await request(app).get(`${url}/${p.id}/pdf?versao=7`).set("x-test-user", "1").expect(404);
  });
  it("importa um depoimento TXT sem usar IA, e rejeita formato inválido", async () => {
    const result = await request(app).post("/dsc/criar-discurso/api/importar").set("x-test-user", "1").attach("arquivo", Buffer.from("Minha resposta original."), { filename: "resposta.txt", contentType: "text/plain" }).expect(200); expect(result.body.texto).toBe("Minha resposta original.");
    await request(app).post("/dsc/criar-discurso/api/importar").set("x-test-user", "1").attach("arquivo", Buffer.from("x"), { filename: "x.exe", contentType: "application/octet-stream" }).expect(400); expect(ClientGemini).not.toHaveBeenCalled();
  });
});
