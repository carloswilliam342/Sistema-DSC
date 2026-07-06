import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../models/Discurso.js", () => ({
  default: { findAll: vi.fn() },
}));

import Discurso from "../../models/Discurso.js";
import dashboardController from "../../controllers/dashboardController.js";
import artigoController from "../../controllers/artigoController.js";
import { criarReq, criarRes } from "../helpers/mockReqRes.js";

const comToJSON = (obj) => ({ ...obj, toJSON: () => obj });

beforeEach(() => vi.clearAllMocks());

describe("dashboardController.dashboard", () => {
  it("renderiza o dashboard com discursos", async () => {
    Discurso.findAll
      .mockResolvedValueOnce([comToJSON({ id: 1 }), comToJSON({ id: 2 })]) // todos
      .mockResolvedValueOnce([comToJSON({ id: 1 })]); // recentes
    const req = criarReq({ session: { usuario: { id: 1 } } });
    const res = criarRes();
    await dashboardController.dashboard(req, res);
    expect(res.render).toHaveBeenCalledWith("dashboard", expect.any(Object));
  });

  it("responde 500 em erro", async () => {
    Discurso.findAll.mockRejectedValue(new Error("db"));
    const req = criarReq({ session: { usuario: { id: 1 } } });
    const res = criarRes();
    await dashboardController.dashboard(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("artigoController.artigos", () => {
  it("renderiza a página de artigos", async () => {
    Discurso.findAll.mockResolvedValue([comToJSON({ id: 1 })]);
    const req = criarReq({ session: { usuario: { id: 1 } } });
    const res = criarRes();
    await artigoController.artigos(req, res);
    expect(res.render).toHaveBeenCalledWith("artigos", expect.any(Object));
  });
});
