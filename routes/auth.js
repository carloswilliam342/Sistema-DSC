import express from "express";
import { exibirLogin, exibirRegistro, registrarUsuario, logarUsuario, logout } from "../controllers/AuthController.js";

const router = express.Router();

// Authentication middleware
export const checkAuth = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    next();
};

export const verificarPermissao = (tipoPermitido) => {
    return (req, res, next) => {
        const usuario = req.session.usuario;

        if (usuario.tipoUsuario !== tipoPermitido) {
            return res.render("acesso-negado"); // Redireciona para a página de acesso negado
        }

        next();
    };
};

router.get("/login", exibirLogin);
router.get("/registro", exibirRegistro);
router.post("/registro", registrarUsuario);
router.post("/login", logarUsuario);
router.get("/logout", logout);

export default router;
