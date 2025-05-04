import { Router } from "express";
import {
  exibirFormularioEnvio,
  enviarDepoimento,
  exibirDepoimentos,
} from "../controllers/DepoimentoController.js";
import { checkAuth } from "./auth.js";

const router = Router();

// Rota para exibir o formulário de envio de depoimentos
router.get("/enviar", checkAuth, exibirFormularioEnvio);

// Rota para processar o envio de depoimentos
router.post("/enviar", checkAuth, enviarDepoimento);

// Rota para exibir depoimentos (apenas para pesquisadores)
router.get("/", checkAuth, exibirDepoimentos);

export default router;