import Analise from "../models/Analise.js";

// Exibe o formulário de criação de análise
export const renderizarFormulario = (req, res) => {
  res.render("analise", { titulo: "Planejar Nova Análise" });
};

// Salva a análise no banco de dados
export const salvarAnalise = async (req, res) => {
  try {
    const { titulo, data_inicio, data_termino, plataforma, email, descricao } = req.body;

    await Analise.create({
      titulo,
      data_inicio,
      data_fim: data_termino,
      plataforma,
      email,
      descricao,
    });

    res.redirect("/lista-analises"); // Redireciona para a lista de análises após salvar
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao salvar análise.");
  }
};

// Lista todas as análises salvas
export const listarAnalises = async (req, res) => {
  try {
    const analises = await Analise.findAll({raw: true});
    console.log("Análises retornadas:", analises); // Log para verificar as análises retornadas
    res.render("lista-analises", { titulo: "Análises Salvas", analises });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao listar análises.");
  }
};

export const visualizarAnalise = async (req, res) => {
    try {
      const { id } = req.params;
      const analise = await Analise.findByPk(id, {raw: true}); // Busca a análise pelo ID
      if (!analise) {
        return res.status(404).send("Análise não encontrada.");
      }
      res.render("visualizar-analise", { titulo: "Detalhes da Análise", analise });
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao visualizar análise.");
    }
  };

  export const editarAnalise = async (req, res) => {
    try {
      const { id } = req.params;
      const analise = await Analise.findByPk(id, {raw: true}); // Busca a análise pelo ID
      if (!analise) {
        return res.status(404).send("Análise não encontrada.");
      }
      res.render("editar-analise", { titulo: "Editar Análise", analise });
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao carregar formulário de edição.");
    }
  };

  export const salvarAlteracoesAnalise = async (req, res) => {
    try {
      const { id } = req.params;
      const { titulo, data_inicio, data_termino, plataforma, email, descricao } = req.body;
  
      const analise = await Analise.findByPk(id); // Busca a análise pelo ID
      if (!analise) {
        return res.status(404).send("Análise não encontrada.");
      }
  
      // Atualiza os campos da análise
      await analise.update({
        titulo,
        data_inicio,
        data_fim: data_termino,
        plataforma,
        email,
        descricao,
      });
  
      res.redirect("/lista-analises"); // Redireciona para a lista de análises após salvar
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao salvar alterações da análise.");
    }
  };

  export const deletarAnalise = async (req, res) => {
    try {
      const { id } = req.params;
      console.log("ID recebido para exclusão:", id); // Log para verificar o ID recebido
      const analise = await Analise.findByPk(id); // Busca a análise pelo ID
      if (!analise) {
        return res.status(404).send("Análise não encontrada.");
      }
      await analise.destroy(); // Exclui a análise
      res.redirect("/lista-analises"); // Redireciona para a lista de análises
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao excluir análise.");
    }
  };
