import Depoimento from "../models/Depoimento.js";
import { BASE_PATH } from "../config/basePath.js";

// Exibe o formulário de envio de depoimentos 
export const exibirFormularioEnvio = (req, res) => {
    if (!req.session.usuario) {
      req.flash("error_msg", "Você precisa estar logado para enviar depoimentos.");
      return res.redirect(BASE_PATH + "/login");
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
        return res.redirect(BASE_PATH + "/login");
      }
  
      await Depoimento.create({
        texto,
        autor: nome,
        tipoUsuario,
      });
  
      req.flash("success_msg", "Depoimento enviado com sucesso!");
      res.redirect(BASE_PATH + "/");
    } catch (error) {
      console.error("Erro ao enviar depoimento:", error);
      req.flash("error_msg", "Erro ao enviar depoimento.");
      res.redirect(BASE_PATH + "/depoimentos/enviar");
    }
  };

// Exibe os depoimentos (apenas para pesquisadores)
export const exibirDepoimentos = async (req, res) => {
  if (req.session.usuario.tipoUsuario !== "PESQUISADOR") {
    req.flash("error_msg", "Apenas pesquisadores podem visualizar depoimentos.");
    return res.redirect(BASE_PATH + "/");
  }

  const depoimentos = await Depoimento.findAll();
  res.render("depoimentos", { usuario: req.session.usuario, depoimentos });
};