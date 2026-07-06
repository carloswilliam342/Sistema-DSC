import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/Depoimento.js", () => ({
  default: { create: vi.fn(), findAll: vi.fn() },
}));

import Depoimento from "../../models/Depoimento.js";
import {
  exibirFormularioEnvio,
  enviarDepoimento,
  exibirDepoimentos,
} from "../../controllers/DepoimentoController.js";
import { criarReq, criarRes } from "../helpers/mockReqRes.js";

beforeEach(() => vi.clearAllMocks());

describe("exibirFormularioEnvio", () => {
  it("redireciona para login se não estiver logado", () => {
    const req = criarReq({ session: {} });
    const res = criarRes();
    exibirFormularioEnvio(req, res);
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });

  it("renderiza o formulário se estiver logado", () => {
    const req = criarReq({ session: { usuario: { nome: "Ana" } } });
    const res = criarRes();
    exibirFormularioEnvio(req, res);
    expect(res.render).toHaveBeenCalledWith("enviarDepoimento", expect.any(Object));
  });
});

describe("enviarDepoimento", () => {
  it("salva o depoimento e redireciona para a home", async () => {
    Depoimento.create.mockResolvedValue({});
    const req = criarReq({
      body: { texto: "Ótimo!" },
      session: { usuario: { nome: "Ana", tipoUsuario: "ESTUDANTE" } },
    });
    const res = criarRes();
    await enviarDepoimento(req, res);
    expect(Depoimento.create).toHaveBeenCalledWith(expect.objectContaining({ autor: "Ana" }));
    expect(res.redirect).toHaveBeenCalledWith("/");
  });

  it("redireciona ao formulário em caso de erro", async () => {
    Depoimento.create.mockRejectedValue(new Error("db"));
    const req = criarReq({
      body: { texto: "Ótimo!" },
      session: { usuario: { nome: "Ana", tipoUsuario: "ESTUDANTE" } },
    });
    const res = criarRes();
    await enviarDepoimento(req, res);
    expect(res.redirect).toHaveBeenCalledWith("/depoimentos/enviar");
  });
});

describe("exibirDepoimentos", () => {
  it("bloqueia quem não é pesquisador", async () => {
    const req = criarReq({ session: { usuario: { tipoUsuario: "ESTUDANTE" } } });
    const res = criarRes();
    await exibirDepoimentos(req, res);
    expect(res.redirect).toHaveBeenCalledWith("/");
  });

  it("lista os depoimentos para pesquisador", async () => {
    Depoimento.findAll.mockResolvedValue([{ id: 1 }]);
    const req = criarReq({ session: { usuario: { tipoUsuario: "PESQUISADOR" } } });
    const res = criarRes();
    await exibirDepoimentos(req, res);
    expect(res.render).toHaveBeenCalledWith("depoimentos", expect.any(Object));
  });
});
