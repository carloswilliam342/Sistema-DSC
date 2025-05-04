import { Router } from "express";
import { listarPorCategoria, exibirFormulario, criarDiscurso, buscarPorId, favoritarDiscurso, listarFavoritos, exportarPDF, exportarExcel } from "../controllers/DiscursoController.js";
import { checkAuth } from "./auth.js";
import { verificarPermissao } from "./auth.js";

const router = Router();

router.get("/novo",  checkAuth, verificarPermissao("PESQUISADOR"), exibirFormulario);
router.post("/novo",  verificarPermissao("PESQUISADOR"), criarDiscurso);

// Rota para listar discursos por categoria (com prefixo "categoria")
router.get("/categoria/:categoria", checkAuth, listarPorCategoria);

router.post("/favoritar", checkAuth, favoritarDiscurso);
router.get("/favoritos", checkAuth, listarFavoritos);

// Rota para buscar discurso pelo ID
router.get("/:id", checkAuth, buscarPorId);



router.get("/:discursoId/exportar-pdf", checkAuth, exportarPDF);
router.get("/:discursoId/exportar-excel", checkAuth, exportarExcel);

router.get("/", checkAuth, (req, res) => {
    res.render("discursos-home", {
        usuario: req.session.usuario // Passa o usuário logado para a view
    });
});

export default router;

