import Discurso from "./models/Discurso.js";
import sequelize from "./config/database.js";

const corrigirCaminhos = async () => {
    try {
        await sequelize.authenticate();
        console.log("Conexão com o banco de dados estabelecida.");

        const discursos = await Discurso.findAll();
        for (const discurso of discursos) {
            let caminhoCorrigido = discurso.imagem;

            // Caso 1: Apenas o nome da imagem está salvo
            if (discurso.imagem && !discurso.imagem.includes('/') && !discurso.imagem.includes('\\')) {
                caminhoCorrigido = `../uploads/imagens-discursos/${discurso.imagem}`;
            }

            // Caso 2: Apenas a pasta "imagens-discursos" está salva
            if (discurso.imagem && discurso.imagem.startsWith('imagens-discursos/')) {
                caminhoCorrigido = `../uploads/${discurso.imagem}`;
            }

            // Caso 3: Caminho absoluto começando com "/uploads"
            if (discurso.imagem && discurso.imagem.startsWith('/uploads')) {
                caminhoCorrigido = `../${discurso.imagem}`;
            }

            // Atualiza o campo apenas se o caminho foi corrigido
            if (caminhoCorrigido !== discurso.imagem) {
                discurso.imagem = caminhoCorrigido;
                await discurso.save();
                console.log(`Caminho corrigido para o discurso ID: ${discurso.id}`);
            }
        }

        console.log("Todos os caminhos foram corrigidos!");
    } catch (error) {
        console.error("Erro ao corrigir os caminhos:", error);
    } finally {
        await sequelize.close();
        console.log("Conexão com o banco de dados encerrada.");
    }
};

corrigirCaminhos();