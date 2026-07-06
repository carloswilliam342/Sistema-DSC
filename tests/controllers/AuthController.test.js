import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks das dependências externas (banco e bcrypt)
vi.mock("../../models/User.js", () => ({
  default: { findOne: vi.fn(), create: vi.fn() },
}));
vi.mock("bcrypt", () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
}));
// multer mockado: single() vira um middleware que só chama o callback
vi.mock("multer", () => {
  const multerFn = () => ({ single: () => (req, res, cb) => cb(null) });
  multerFn.diskStorage = () => ({});
  return { default: multerFn };
});

import User from "../../models/User.js";
import bcrypt from "bcrypt";
import { logarUsuario, logout, registrarUsuario } from "../../controllers/AuthController.js";

// Helpers para simular req/res do Express
function criarReq(body = {}) {
  return { body, session: {}, flash: vi.fn() };
}
function criarRes() {
  return { render: vi.fn(), redirect: vi.fn() };
}

describe("logarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza login quando o usuário não existe", async () => {
    User.findOne.mockResolvedValue(null);
    const req = criarReq({ email: "x@x.com", senha: "123" });
    const res = criarRes();

    await logarUsuario(req, res);

    expect(res.render).toHaveBeenCalledWith("login");
    expect(req.flash).toHaveBeenCalledWith("error_msg", expect.any(String));
  });

  it("renderiza login quando a senha está incorreta", async () => {
    User.findOne.mockResolvedValue({ id: 1, senha: "hash" });
    bcrypt.compare.mockResolvedValue(false);
    const req = criarReq({ email: "a@a.com", senha: "errada" });
    const res = criarRes();

    await logarUsuario(req, res);

    expect(res.render).toHaveBeenCalledWith("login");
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("redireciona para /bem-vindo no primeiro login", async () => {
    User.findOne.mockResolvedValue({ id: 1, senha: "hash", primeiroLogin: true });
    bcrypt.compare.mockResolvedValue(true);
    const req = criarReq({ email: "a@a.com", senha: "Senha@123" });
    const res = criarRes();

    await logarUsuario(req, res);

    expect(req.session.usuario).toBeDefined();
    expect(res.redirect).toHaveBeenCalledWith("/bem-vindo");
  });

  it("redireciona para /dashboard quando não é o primeiro login", async () => {
    User.findOne.mockResolvedValue({ id: 1, senha: "hash", primeiroLogin: false });
    bcrypt.compare.mockResolvedValue(true);
    const req = criarReq({ email: "a@a.com", senha: "Senha@123" });
    const res = criarRes();

    await logarUsuario(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/dashboard");
  });
});

describe("registrarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita senha fraca e redireciona para /registro", async () => {
    const req = criarReq({ nome: "Ana", email: "a@a.com", senha: "123", tipoUsuario: "ESTUDANTE" });
    const res = criarRes();

    await registrarUsuario(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/registro");
    expect(User.create).not.toHaveBeenCalled();
  });

  it("rejeita e-mail já cadastrado", async () => {
    User.findOne.mockResolvedValue({ id: 1 });
    const req = criarReq({ nome: "Ana", email: "a@a.com", senha: "Senha@123", tipoUsuario: "ESTUDANTE" });
    const res = criarRes();

    await registrarUsuario(req, res);

    // O upload roda um callback assíncrono não-aguardado; espera concluir.
    await vi.waitFor(() => expect(res.redirect).toHaveBeenCalledWith("/registro"));
    expect(User.create).not.toHaveBeenCalled();
  });

  it("cria o usuário e redireciona para /login no caso feliz", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hash_da_senha");
    User.create.mockResolvedValue({ id: 1 });
    const req = criarReq({ nome: "Ana", email: "a@a.com", senha: "Senha@123", tipoUsuario: "PESQUISADOR" });
    const res = criarRes();

    await registrarUsuario(req, res);

    await vi.waitFor(() =>
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "a@a.com", senha: "hash_da_senha" })
      )
    );
    expect(bcrypt.hash).toHaveBeenCalledWith("Senha@123", 10);
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });
});

describe("logout", () => {
  it("destrói a sessão e redireciona para /login", () => {
    const req = { session: { destroy: (cb) => cb() } };
    const res = criarRes();

    logout(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/login");
  });
});
