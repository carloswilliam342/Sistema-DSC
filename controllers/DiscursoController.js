import Discurso from "../models/Discurso.js";
import upload from "../config/upload.js";
import Favorito from "../models/Favorito.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export const listarPorCategoria = async (req, res) => {
  try {
      let { categoria } = req.params;
      console.log("Categoria recebida na rota:", categoria);

      // Verificar se a categoria recebida parece um nome de arquivo de imagem
      if (categoria.match(/\.(png|jpg|jpeg|gif)$/)) {
          console.warn("Categoria inválida detectada:", categoria);
          return res.status(400).send("Categoria inválida.");
      }

      // Buscar discursos com a categoria correta
      const discursos = await Discurso.findAll({ where: { categoria } });

      console.log("Discursos encontrados:", discursos.length);

      console.log("Usuário logado:", req.session.usuario);

      res.render("discursos", {
          tituloPagina: `Discursos sobre ${categoria}`,
          discursos: discursos.map(d => d.toJSON()),
          categoria,
          usuario: req.session.usuario // Passa o usuário logado para a view
      });

  } catch (error) {
      console.error("Erro ao buscar discursos:", error);
      res.status(500).send("Erro interno no servidor");
  }
};


  
  

// Exibe o formulário de adição
export function exibirFormulario(req, res) {
  const usuario = req.session.usuario;
    res.render("novoDiscurso", {usuario: usuario});
}

// Processa os dados do formulário e adiciona ao banco
export async function criarDiscurso(req, res) {
    try {
        const usuario = req.session.usuario;

        // Verifica se o usuário é pesquisador
        if (usuario.tipoUsuario !== "PESQUISADOR") {
            req.flash("erro", "Apenas pesquisadores podem anexar discursos.");
            return res.redirect("/discursos");
        }

        upload.single('imagem')(req, res, async function (err) {
            if (err) {
                req.flash("erro", "Erro ao fazer upload da imagem: " + err);
                return res.redirect("/discursos/novo");
            }

            const { titulo, categoria, descricao } = req.body;
            const imagemPath = req.file ? `../uploads/imagens-discursos/${req.file.filename}` : null;

            if (!titulo || !categoria || !descricao) {
                return res.status(400).send("Todos os campos são obrigatórios!");
            }

            await Discurso.create({
                titulo,
                categoria,
                descricao,
                imagem: imagemPath,
                usuarioId: usuario.id
            });

            req.flash("sucess_msg", "Discurso anexado com sucesso!");
            res.redirect(`/discursos/categoria/${categoria}`);
        });
    } catch (error) {
        console.error("Erro ao adicionar discurso:", error);
        res.status(500).send("Erro interno no servidor.");
    }
}

export const buscarPorId = async (req, res) => {
  try {
      const { id } = req.params;
      const discurso = await Discurso.findByPk(id);

      if (!discurso) {
          return res.status(404).send("Discurso não encontrado.");
      }

      const usuario = req.session.usuario;

      res.render("discurso-detalhado", { discurso: discurso.toJSON(), usuario: usuario });
  } catch (error) {
      console.error("Erro ao buscar discurso:", error);
      res.status(500).send("Erro interno no servidor.");
  }
};

export const favoritarDiscurso = async (req, res) => {
  try {
    const { discursoId } = req.body;
    const usuarioId = req.session.usuario.id;

    // Verifica se o discurso já foi favoritado
    const favoritoExistente = await Favorito.findOne({ where: { usuarioId, discursoId } });
    if (favoritoExistente) {
      return res.status(400).send("Discurso já favoritado.");
    }

    await Favorito.create({ usuarioId, discursoId });
    res.status(200).send("Discurso favoritado com sucesso!");
  } catch (error) {
    console.error("Erro ao favoritar discurso:", error);
    res.status(500).send("Erro interno no servidor.");
  }
};

export const listarFavoritos = async (req, res) => {
  try {
    const usuarioId = req.session.usuario.id;

    const favoritos = await Favorito.findAll({
      where: { usuarioId },
      include: [{
        model: Discurso,
        as: 'Discurso'
      }]
    });

    res.render("favoritos", {
      favoritos: favoritos.map(f => f.toJSON()),
      usuario: req.session.usuario
    });
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    res.status(500).send("Erro interno no servidor.");
  }
};

export const exportarPDF = async (req, res) => {
  try {
    const { discursoId } = req.params;
    const discurso = await Discurso.findByPk(discursoId);

    if (!discurso) {
      return res.status(404).send("Discurso não encontrado.");
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=discurso-${discursoId}.pdf`);

    doc.text(`Título: ${discurso.titulo}`);
    doc.text(`Descrição: ${discurso.descricao}`);
    doc.text(`Categoria: ${discurso.categoria}`);
    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    res.status(500).send("Erro interno no servidor.");
  }
};

export const exportarExcel = async (req, res) => {
  try {
    const { discursoId } = req.params;
    const discurso = await Discurso.findByPk(discursoId);

    if (!discurso) {
      return res.status(404).send("Discurso não encontrado.");
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Discurso");

    sheet.addRow(["Título", "Descrição", "Categoria"]);
    sheet.addRow([discurso.titulo, discurso.descricao, discurso.categoria]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=discurso-${discursoId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Erro ao exportar Excel:", error);
    res.status(500).send("Erro interno no servidor.");
  }
};


