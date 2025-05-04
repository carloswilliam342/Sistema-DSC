import Discurso from "../models/Discurso.js";

class artigoController {
    artigos = async (req, res) => {
        const discursos = await Discurso.findAll({ raw: true });

        console.log("Discursos retornados:", discursos);

        // Pegando os 4 primeiros como "Artigos Relevantes"
        const artigosRelevantes = discursos.slice(0, 4);

        // Pegando os próximos 3 para "Ferramentas e Cursos"
        const ferramentasCursos = discursos.slice(4, 7);

        // Pegando o usuário da sessão
        const usuario = req.session.usuario;

        res.render("artigos", {
            artigosRelevantes,
            ferramentasCursos,
            usuario
        });
    };
}

export default new artigoController();