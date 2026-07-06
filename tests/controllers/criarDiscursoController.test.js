import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do filesystem (o controller lê/escreve arquivos)
vi.mock("fs", () => {
  const mock = {
    existsSync: vi.fn(() => false),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => "conteúdo do arquivo"),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
  };
  return { default: mock, ...mock };
});

// Mock do cliente Gemini
vi.mock("../../client.js", () => ({
  default: vi.fn().mockResolvedValue("DISCURSO TRANSFORMADO"),
}));

import fs from "fs";
import ClientGemini from "../../client.js";
import {
  processarDiscurso,
  baixarDiscurso,
  baixarRelatorio,
} from "../../controllers/criarDiscursoController.js";
import { criarReq, criarRes } from "../helpers/mockReqRes.js";

beforeEach(() => {
  vi.clearAllMocks();
  fs.existsSync.mockReturnValue(false);
  fs.readFileSync.mockReturnValue("conteúdo do arquivo");
  ClientGemini.mockResolvedValue("DISCURSO TRANSFORMADO");
});

describe("processarDiscurso", () => {
  it("retorna 400 quando não há texto nem arquivo", async () => {
    const req = criarReq({ body: {}, file: null });
    const res = criarRes();
    await processarDiscurso(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("retorna 400 para tipo de arquivo não suportado", async () => {
    const req = criarReq({ body: {}, file: { mimetype: "image/png", filename: "x.png" } });
    const res = criarRes();
    await processarDiscurso(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("processa texto simples e retorna o discurso transformado", async () => {
    const req = criarReq({ body: { texto: "resposta do entrevistado" }, file: null });
    const res = criarRes();
    await processarDiscurso(req, res);
    expect(ClientGemini).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ discursoTransformado: "DISCURSO TRANSFORMADO" })
    );
  });

  it("extrai texto de arquivo .txt e processa", async () => {
    fs.readFileSync.mockReturnValue("texto vindo do arquivo txt");
    const req = criarReq({ body: {}, file: { mimetype: "text/plain", filename: "f.txt" } });
    const res = criarRes();
    await processarDiscurso(req, res);
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it("gera relatório geral (antes e depois)", async () => {
    const req = criarReq({ body: { texto: "resposta", relatorio: "true", tipoRelatorio: "geral" }, file: null });
    const res = criarRes();
    await processarDiscurso(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ arquivoRelatorio: expect.stringContaining("relatorio-geral") })
    );
  });

  it("gera relatório estruturado (chama a IA duas vezes)", async () => {
    const req = criarReq({
      body: { texto: "Nome: Ana\nResposta: boa", relatorio: "true", tipoRelatorio: "estruturado" },
      file: null,
    });
    const res = criarRes();
    await processarDiscurso(req, res);
    expect(ClientGemini).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ arquivoRelatorio: expect.stringContaining("relatorio-estruturado") })
    );
  });
});

describe("baixarDiscurso", () => {
  it("retorna 404 quando o arquivo não existe", () => {
    fs.existsSync.mockReturnValue(false);
    const req = criarReq({ params: { filename: "inexistente.txt" } });
    const res = criarRes();
    baixarDiscurso(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("baixarRelatorio", () => {
  it("retorna 404 quando o arquivo não existe", async () => {
    fs.existsSync.mockReturnValue(false);
    const req = criarReq({ params: { filename: "inexistente.txt" } });
    const res = criarRes();
    await baixarRelatorio(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
