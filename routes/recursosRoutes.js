import express from "express";
import { exibirRecursos } from "../controllers/recursoController.js";

const router = express.Router();

router.get("/recursos", exibirRecursos);

export default router;
