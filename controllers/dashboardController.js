import Discurso from "../models/Discurso.js";

class dashboardController {
    dashboard = async (req, res) => {
        try {
            // Buscar todos os discursos
            const discursos = await Discurso.findAll({ raw: true });

            // Buscar os discursos recentes
            const discursosRecentes = await Discurso.findAll({
                order: [['dataCriacao', 'DESC']],
                limit: 6
            });

            console.log("Discursos retornados:", discursos);
            console.log("Discursos recentes:", discursosRecentes);

            // Pegando os 3 primeiros como "Recomendados"
            const recomendados = discursos.slice(0, 3);

            // Pegando os próximos 3 para "Escolha sua pesquisa"
            const pesquisas = discursos.slice(3, 6);

            // Pegando mais 4 para "Mais sobre o DSC"
            const maisSobreDSC = discursos.slice(7, 9);

            // Pegando mais 4 para "Pesquisadores estão acessando"
            const pesquisadoresAcessando = discursos.slice(10, 13);

            // Pegando o usuário da sessão
            const usuario = req.session.usuario;

            res.render("dashboard", {
                recomendados,
                pesquisas,
                maisSobreDSC,
                pesquisadoresAcessando,
                discursosRecentes: discursosRecentes.map(d => d.toJSON()),
                usuario
            });
        } catch (error) {
            console.error("Erro ao carregar o dashboard:", error);
            res.status(500).send("Erro interno no servidor.");
        }
    };
}

export default new dashboardController();
