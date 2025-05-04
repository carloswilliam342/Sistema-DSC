// controllers/comoFuncionaController.js

class comoFuncionaController {
    renderizarComoFunciona(req, res) {
      const usuario = req.session?.usuario;
      res.render("como-funciona", {
        tituloPagina: "Como funciona o DSC",
        usuario: usuario
      });
    }
  }
  
  export default new comoFuncionaController();
  