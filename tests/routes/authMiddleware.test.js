import { describe, it, expect, vi } from "vitest";
import { checkAuth, verificarPermissao } from "../../routes/auth.js";
import { criarReq, criarRes } from "../helpers/mockReqRes.js";

describe("checkAuth", () => {
  it("redireciona para /login quando não há usuário na sessão", () => {
    const req = criarReq({ session: {} });
    const res = criarRes();
    const next = vi.fn();
    checkAuth(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith("/login");
    expect(next).not.toHaveBeenCalled();
  });

  it("chama next() quando há usuário na sessão", () => {
    const req = criarReq({ session: { usuario: { id: 1 } } });
    const res = criarRes();
    const next = vi.fn();
    checkAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("verificarPermissao", () => {
  it("renderiza acesso-negado quando o tipo não confere", () => {
    const middleware = verificarPermissao("PESQUISADOR");
    const req = criarReq({ session: { usuario: { tipoUsuario: "ESTUDANTE" } } });
    const res = criarRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(res.render).toHaveBeenCalledWith("acesso-negado");
    expect(next).not.toHaveBeenCalled();
  });

  it("chama next() quando o tipo confere", () => {
    const middleware = verificarPermissao("PESQUISADOR");
    const req = criarReq({ session: { usuario: { tipoUsuario: "PESQUISADOR" } } });
    const res = criarRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
