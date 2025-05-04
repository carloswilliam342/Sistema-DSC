export const exibirRecursos = (req, res) => {
    res.render("recursos", {
        titulo: "Recursos do DSC",
        usuario: req.usuario // se você estiver utilizando sessão/autenticação
    });
};
