import Depoimento from "../models/Depoimento.js";

// Exibe o formulário de envio de depoimentos 
export const exibirFormularioEnvio = (req, res) => {
    if (!req.session.usuario) {
      req.flash("error_msg", "Você precisa estar logado para enviar depoimentos.");
      return res.redirect("/login");
    }
    res.render("enviarDepoimento", { usuario: req.session.usuario });
  };

// Processa o envio de depoimentos
export const enviarDepoimento = async (req, res) => {
    try {
      const { texto } = req.body;
      const { nome, tipoUsuario } = req.session.usuario;
  
      if (!req.session.usuario) {
        req.flash("error_msg", "Você precisa estar logado para enviar depoimentos.");
        return res.redirect("/login");
      }
  
      await Depoimento.create({
        texto,
        autor: nome,
        tipoUsuario,
      });
  
      req.flash("success_msg", "Depoimento enviado com sucesso!");
      res.redirect("/");
    } catch (error) {
      console.error("Erro ao enviar depoimento:", error);
      req.flash("error_msg", "Erro ao enviar depoimento.");
      res.redirect("/depoimentos/enviar");
    }
  };

// Exibe os depoimentos (apenas para pesquisadores)
export const exibirDepoimentos = async (req, res) => {
  if (req.session.usuario.tipoUsuario !== "PESQUISADOR") {
    req.flash("error_msg", "Apenas pesquisadores podem visualizar depoimentos.");
    return res.redirect("/");
  }

  const depoimentos = await Depoimento.findAll();
  res.render("depoimentos", { usuario: req.session.usuario, depoimentos });
};