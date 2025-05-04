class BeneficiosController {
    acessarBeneficios = async (req, res) => {
        const usuario = req.session.usuario; 

        const planos = [
            {
                categoria: "Estudantes",
                icone: "bi-mortarboard", // Ícone do Bootstrap Icons
                nome: "Usuário Básico",
                descricao: "(Estudantes e usuários casuais)",
                beneficios: [
                    "Até 10 perguntas por pesquisa.",
                    "Até 50 respostas de entrevistados por pesquisa.",
                    "Acesso ao tutorial básico sobre o uso do sistema DSC."
                ],
                botao: "Começar agora"
            },
            {
                categoria: "Pesquisadores",
                icone: "bi-search", 
                nome: "Usuário Intermediário",
                descricao: "(Professores e Pesquisadores em Projetos Acadêmicos)",
                beneficios: [
                    "Até 30 perguntas por pesquisa.",
                    "Até 200 respostas de entrevistados por pesquisa.",
                    "Exportação em formatos PDF e Excel."
                ],
                destaque: "BEST!",
                botao: "Começar agora"
            },
            {
                categoria: "Instituições acadêmicas",
                icone: "bi-bank", 
                nome: "Usuário Avançado",
                descricao: "(Pesquisadores e Instituições Acadêmicas)",
                beneficios: [
                    "Perguntas ilimitadas por pesquisa.",
                    "Respostas ilimitadas de entrevistados.",
                    "Tipos avançados e personalizados de perguntas.",
                    "Relatórios gráficos completos."
                ],
                botao: "Começar agora"
            }
        ];

        const depoimentos = [
            {
                imagem: "images/depoimento1.png",
                nome: "Ana Oliveira",
                texto: "Com o DSC, consegui organizar minha pesquisa de forma simples e eficiente. É uma ferramenta essencial para quem trabalha com análise de dados qualitativos.",
            },
            {
                imagem: "images/depoimento2.png",
                nome: "João Santos",
                texto: "O DSC me ajudou a transformar as respostas da minha pesquisa em relatórios claros e objetivos. Recomendo para todos os meus colegas de curso",
            },
            {
                imagem: "images/depoimento3.png",
                nome: "Paola Silva",
                texto: "Com a ajuda do DSC consegui desenvolver as pesquisas do meu projeto de uma maneira mais eficaz e rápida.",
            },
            {
                imagem: "images/depoimento4.png",
                nome: "Paulo Cardoso",
                texto: "O DSC facilitou minhas pesquisas de uma maneira surpreendente, agora consigo organizar meu projeto de maneira rápida e descomplicada",
            }
        ];

        const cardsComplementares = [
            {
                imagem: "images/card1.png",
                titulo: "Participe da nossa comunidade",
                descricao: "Contribua com o desenvolvimento do DSC! Envie sugestões, participe de pesquisas ou compartilhe suas experiências com o sistema.",
                botao: "Enviar sugestão"
            },
            {
                imagem: "images/card2.png",
                titulo: "Seja um colaborador do DSC",
                descricao: "Ajude a expandir as possibilidades do DSC. Professores e pesquisadores podem contribuir com novos recursos e estudos de caso.",
                botao: "Saiba como contribuir"
            }
        ];

        res.render("acessar-beneficios", { usuario, planos, depoimentos, cardsComplementares });
    };
}

export default new BeneficiosController();
