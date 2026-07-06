import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/Analise.js", () => ({
  default: { create: vi.fn(), findAll: vi.fn(), findByPk: vi.fn() },
}));

import Analise from "../../models/Analise.js";
import {
  renderizarFormulario,
  salvarAnalise,
  listarAnalises,
  visualizarAnalise,
  editarAnalise,
  salvarAlteracoesAnalise,
  deletarAnalise,
} from "../../controllers/analiseController.js";
import { criarReq, criarRes } from "../helpers/mockReqRes.js";

beforeEach(() => vi.clearAllMocks());

describe("renderizarFormulario", () => {
  it("renderiza o formulário de análise", () => {
    const req = criarReq();
    const res = criarRes();
    renderizarFormulario(req, res);
    expect(res.render).toHaveBeenCalledWith("analise", expect.any(Object));
  });
});

describe("salvarAnalise", () => {
  it("cria a análise e redireciona", async () => {
    Analise.create.mockResolvedValue({});
    const req = criarReq({ body: { titulo: "T", data_inicio: "2025-01-01", data_termino: "2025-02-01" } });
    const res = criarRes();
    await salvarAnalise(req, res);
    expect(Analise.create).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/lista-analises");
  });

  it("responde 500 em erro", async () => {
    Analise.create.mockRejectedValue(new Error("db"));
    const req = criarReq({ body: {} });
    const res = criarRes();
    await salvarAnalise(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("listarAnalises", () => {
  it("renderiza a lista", async () => {
    Analise.findAll.mockResolvedValue([{ id: 1 }]);
    const req = criarReq();
    const res = criarRes();
    await listarAnalises(req, res);
    expect(res.render).toHaveBeenCalledWith("lista-analises", expect.any(Object));
  });

  it("responde 500 em erro", async () => {
    Analise.findAll.mockRejectedValue(new Error("db"));
    const req = criarReq();
    const res = criarRes();
    await listarAnalises(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("visualizarAnalise / editarAnalise", () => {
  it("visualizar: 404 quando não encontra", async () => {
    Analise.findByPk.mockResolvedValue(null);
    const req = criarReq({ params: { id: "1" } });
    const res = criarRes();
    await visualizarAnalise(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("visualizar: renderiza quando encontra", async () => {
    Analise.findByPk.mockResolvedValue({ id: 1 });
    const req = criarReq({ params: { id: "1" } });
    const res = criarRes();
    await visualizarAnalise(req, res);
    expect(res.render).toHaveBeenCalledWith("visualizar-analise", expect.any(Object));
  });

  it("editar: renderiza formulário de edição", async () => {
    Analise.findByPk.mockResolvedValue({ id: 1 });
    const req = criarReq({ params: { id: "1" } });
    const res = criarRes();
    await editarAnalise(req, res);
    expect(res.render).toHaveBeenCalledWith("editar-analise", expect.any(Object));
  });
});

describe("salvarAlteracoesAnalise", () => {
  it("404 quando a análise não existe", async () => {
    Analise.findByPk.mockResolvedValue(null);
    const req = criarReq({ params: { id: "1" }, body: {} });
    const res = criarRes();
    await salvarAlteracoesAnalise(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("atualiza e redireciona quando existe", async () => {
    const analise = { update: vi.fn().mockResolvedValue({}) };
    Analise.findByPk.mockResolvedValue(analise);
    const req = criarReq({ params: { id: "1" }, body: { titulo: "Novo" } });
    const res = criarRes();
    await salvarAlteracoesAnalise(req, res);
    expect(analise.update).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/lista-analises");
  });
});

describe("deletarAnalise", () => {
  it("404 quando não existe", async () => {
    Analise.findByPk.mockResolvedValue(null);
    const req = criarReq({ params: { id: "1" } });
    const res = criarRes();
    await deletarAnalise(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("exclui e redireciona quando existe", async () => {
    const analise = { destroy: vi.fn().mockResolvedValue({}) };
    Analise.findByPk.mockResolvedValue(analise);
    const req = criarReq({ params: { id: "1" } });
    const res = criarRes();
    await deletarAnalise(req, res);
    expect(analise.destroy).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/lista-analises");
  });
});
