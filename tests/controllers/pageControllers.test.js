import { describe, it, expect, beforeEach, vi } from "vitest";
import sobreController from "../../controllers/sobreController.js";
import comoFuncionaController from "../../controllers/comoFuncionaController.js";
import BeneficiosController from "../../controllers/BeneficiosController.js";
import { exibirRecursos } from "../../controllers/recursoController.js";
import { criarReq, criarRes } from "../helpers/mockReqRes.js";

beforeEach(() => vi.clearAllMocks());

describe("controllers de página estática", () => {
  it("sobreController renderiza 'sobre'", () => {
    const req = criarReq({ session: { usuario: { id: 1 } } });
    const res = criarRes();
    sobreController.renderizarSobre(req, res);
    expect(res.render).toHaveBeenCalledWith("sobre", expect.objectContaining({ tituloPagina: "Sobre o DSC" }));
  });

  it("comoFuncionaController renderiza 'como-funciona'", () => {
    const req = criarReq({ session: {} });
    const res = criarRes();
    comoFuncionaController.renderizarComoFunciona(req, res);
    expect(res.render).toHaveBeenCalledWith("como-funciona", expect.any(Object));
  });

  it("recursoController renderiza 'recursos'", () => {
    const req = criarReq();
    const res = criarRes();
    exibirRecursos(req, res);
    expect(res.render).toHaveBeenCalledWith("recursos", expect.any(Object));
  });

  it("BeneficiosController renderiza 'acessar-beneficios' com planos e depoimentos", () => {
    const req = criarReq({ session: { usuario: { id: 1 } } });
    const res = criarRes();
    BeneficiosController.acessarBeneficios(req, res);
    expect(res.render).toHaveBeenCalledWith(
      "acessar-beneficios",
      expect.objectContaining({
        planos: expect.any(Array),
        depoimentos: expect.any(Array),
        cardsComplementares: expect.any(Array),
      })
    );
  });
});
