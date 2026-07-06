import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/Discurso.js", () => ({
  default: { findAll: vi.fn(), findByPk: vi.fn(), create: vi.fn() },
}));
vi.mock("../../models/Favorito.js", () => ({
  default: { findOne: vi.fn(), findAll: vi.fn(), create: vi.fn() },
}));
// upload.single(campo) retorna um middleware que apenas chama o callback
vi.mock("../../config/upload.js", () => ({
  default: { single: () => (req, res, cb) => cb(null) },
}));

import Discurso from "../../models/Discurso.js";
import Favorito from "../../models/Favorito.js";
import {
  listarPorCategoria,
  exibirFormulario,
  criarDiscurso,
  buscarPorId,
  favoritarDiscurso,
  listarFavoritos,
  exportarPDF,
  exportarExcel,
} from "../../controllers/DiscursoController.js";
import { criarReq, criarRes, criarResStream } from "../helpers/mockReqRes.js";

// Facilita simular o retorno do Sequelize (instâncias com toJSON)
const comToJSON = (obj) => ({ ...obj, toJSON: () => obj });

beforeEach(() => vi.clearAllMocks());

describe("listarPorCategoria", () => {
  it("rejeita categoria que parece nome de imagem (400)", async () => {
    const req = criarReq({ params: { categoria: "foto.png" } });
    const res = criarRes();
    await listarPorCategoria(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("renderiza os discursos da categoria", async () => {
    Discurso.findAll.mockResolvedValue([comToJSON({ id: 1, titulo: "A" })]);
    const req = criarReq({ params: { categoria: "Educação" } });
    const res = criarRes();
    await listarPorCategoria(req, res);
    expect(res.render).toHaveBeenCalledWith("discursos", expect.objectContaining({ categoria: "Educação" }));
  });

  it("responde 500 em caso de erro", async () => {
    Discurso.findAll.mockRejectedValue(new Error("db"));
    const req = criarReq({ params: { categoria: "Saúde" } });
    const res = criarRes();
    await listarPorCategoria(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("exibirFormulario", () => {
  it("renderiza novoDiscurso", () => {
    const req = criarReq({ session: { usuario: { id: 1 } } });
    const res = criarRes();
    exibirFormulario(req, res);
    expect(res.render).toHaveBeenCalledWith("novoDiscurso", { usuario: { id: 1 } });
  });
});

describe("criarDiscurso", () => {
  it("bloqueia usuário que não é pesquisador", async () => {
    const req = criarReq({ session: { usuario: { tipoUsuario: "ESTUDANTE" } } });
    const res = criarRes();
    await criarDiscurso(req, res);
    expect(res.redirect).toHaveBeenCalledWith("/discursos");
    expect(Discurso.create).not.toHaveBeenCalled();
  });

  it("cria o discurso quando pesquisador e campos válidos", async () => {
    Discurso.create.mockResolvedValue({});
    const req = criarReq({
      session: { usuario: { id: 7, tipoUsuario: "PESQUISADOR" } },
      body: { titulo: "T", categoria: "Educação", descricao: "D" },
    });
    const res = criarRes();
    await criarDiscurso(req, res);
    expect(Discurso.create).toHaveBeenCalledWith(expect.objectContaining({ titulo: "T", usuarioId: 7 }));
    expect(res.redirect).toHaveBeenCalledWith("/discursos/categoria/Educação");
  });

  it("retorna 400 quando faltam campos obrigatórios", async () => {
    const req = criarReq({
      session: { usuario: { id: 7, tipoUsuario: "PESQUISADOR" } },
      body: { titulo: "", categoria: "", descricao: "" },
    });
    const res = criarRes();
    await criarDiscurso(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("buscarPorId", () => {
  it("retorna 404 quando não encontra", async () => {
    Discurso.findByPk.mockResolvedValue(null);
    const req = criarReq({ params: { id: "99" } });
    const res = criarRes();
    await buscarPorId(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("renderiza o discurso encontrado", async () => {
    Discurso.findByPk.mockResolvedValue(comToJSON({ id: 1, titulo: "A" }));
    const req = criarReq({ params: { id: "1" } });
    const res = criarRes();
    await buscarPorId(req, res);
    expect(res.render).toHaveBeenCalledWith("discurso-detalhado", expect.any(Object));
  });
});

describe("favoritarDiscurso", () => {
  it("retorna 400 se já favoritado", async () => {
    Favorito.findOne.mockResolvedValue({ id: 1 });
    const req = criarReq({ body: { discursoId: 1 }, session: { usuario: { id: 5 } } });
    const res = criarRes();
    await favoritarDiscurso(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("favorita com sucesso (200)", async () => {
    Favorito.findOne.mockResolvedValue(null);
    Favorito.create.mockResolvedValue({});
    const req = criarReq({ body: { discursoId: 1 }, session: { usuario: { id: 5 } } });
    const res = criarRes();
    await favoritarDiscurso(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("listarFavoritos", () => {
  it("renderiza os favoritos do usuário", async () => {
    Favorito.findAll.mockResolvedValue([comToJSON({ id: 1 })]);
    const req = criarReq({ session: { usuario: { id: 5 } } });
    const res = criarRes();
    await listarFavoritos(req, res);
    expect(res.render).toHaveBeenCalledWith("favoritos", expect.any(Object));
  });

  it("responde 500 em erro", async () => {
    Favorito.findAll.mockRejectedValue(new Error("db"));
    const req = criarReq({ session: { usuario: { id: 5 } } });
    const res = criarRes();
    await listarFavoritos(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("exportarPDF", () => {
  it("retorna 404 quando o discurso não existe", async () => {
    Discurso.findByPk.mockResolvedValue(null);
    const req = criarReq({ params: { discursoId: "1" } });
    const res = criarRes();
    await exportarPDF(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("gera o PDF quando o discurso existe", async () => {
    Discurso.findByPk.mockResolvedValue({ titulo: "T", descricao: "D", categoria: "C" });
    const req = criarReq({ params: { discursoId: "1" } });
    const res = criarResStream();
    await exportarPDF(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
  });
});

describe("exportarExcel", () => {
  it("retorna 404 quando o discurso não existe", async () => {
    Discurso.findByPk.mockResolvedValue(null);
    const req = criarReq({ params: { discursoId: "1" } });
    const res = criarRes();
    await exportarExcel(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("gera o Excel quando o discurso existe", async () => {
    Discurso.findByPk.mockResolvedValue({ titulo: "T", descricao: "D", categoria: "C" });
    const req = criarReq({ params: { discursoId: "1" } });
    const res = criarResStream();
    await exportarExcel(req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });
});
