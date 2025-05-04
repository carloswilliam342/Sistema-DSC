import express from "express";
import {
  renderizarFormulario,
  salvarAnalise,
  listarAnalises,
  visualizarAnalise,
  editarAnalise,
  deletarAnalise,
  salvarAlteracoesAnalise,
} from "../controllers/analiseController.js";
import { checkAuth } from "./auth.js";

const router = express.Router();

router.get("/analise", checkAuth, renderizarFormulario);
router.post("/analise", checkAuth, salvarAnalise);
router.get("/lista-analises", checkAuth, listarAnalises);

// Rotas para ações
router.get("/analise/:id", checkAuth, visualizarAnalise); // Ver análise
router.get("/analise/editar/:id", checkAuth, editarAnalise); // Editar análise
router.post("/analise/:id", checkAuth, salvarAlteracoesAnalise); // Salvar alterações
router.post("/analise/deletar/:id", checkAuth, deletarAnalise); // Excluir análise

export default router;
