import { Router } from 'express';
import User from '../models/User.js';
import Discurso from '../models/Discurso.js'; // Certifique-se de importar o modelo de discursos

const router = Router();

router.get('/bem-vindo', async (req, res) => {
    if (!req.session.usuario || !req.session.usuario.primeiroLogin) {
        return res.redirect('/dashboard'); // Se não for o primeiro login, redireciona para a página principal
    }

    // Atualiza o usuário para indicar que ele já passou pelo primeiro login
    await User.update(
        { primeiroLogin: false },
        { where: { id: req.session.usuario.id } }
    );

    req.session.usuario.primeiroLogin = false; // Atualiza a sessão

    // Busca discursos no banco de dados
    const discursos = await Discurso.findAll({
        limit: 5, // Limita a 5 discursos para exibição
        order: [['createdAt', 'DESC']] // Ordena pelos mais recentes
    });

    res.render('bem-vindo', { usuario: req.session.usuario, discursos });
});

export default router;
