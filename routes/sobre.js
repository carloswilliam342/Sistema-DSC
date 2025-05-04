// routes/sobre.js
import express from "express";
import sobreController from "../controllers/sobreController.js";
import { checkAuth } from "./auth.js";

const router = express.Router();

router.get("/sobre", sobreController.renderizarSobre);

export default router;
