// routes/como-funciona.js
import express from "express";
import comoFuncionaController from "../controllers/comoFuncionaController.js";
import { checkAuth } from "./auth.js";

const router = express.Router();

router.get("/como-funciona", comoFuncionaController.renderizarComoFunciona);

export default router;
