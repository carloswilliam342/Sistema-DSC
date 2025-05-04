import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import { checkAuth } from "./auth.js";

const router = express.Router();

// Rota para o dashboard
router.get("/dashboard", checkAuth, dashboardController.dashboard);

export default router;
