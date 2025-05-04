// controllers/sobreController.js

class sobreController {
    renderizarSobre(req, res) {
      const usuario = req.session?.usuario; // Para manter o usuário logado na navbar
      res.render("sobre", {
        tituloPagina: "Sobre o DSC",
        usuario
      });
    }
  }
  
  export default new sobreController();
  