import express from 'express';
import artigoController from '../controllers/artigoController.js';
import { checkAuth } from "./auth.js";

const router = express.Router();

router.get("/artigos", checkAuth, artigoController.artigos);

export default router;