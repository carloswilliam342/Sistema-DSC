import express from "express";
import BeneficiosController from "../controllers/BeneficiosController.js";
import { checkAuth } from "./auth.js"; // Middleware para verificar autenticação

const router = express.Router();

// Rota para acessar os benefícios do DSC
router.get("/acessar-beneficios", checkAuth, BeneficiosController.acessarBeneficios);

export default router;