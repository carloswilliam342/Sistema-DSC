


$(document).ready(function() {
    const reviews = {
        "introducao": [
            { nome: "Ana", estrelas: 5, feedback: "Ótima introdução ao DSC!", imagem: "images/user1.png" },
            { nome: "Mariana", estrelas: 4, feedback: "Muito informativo e direto.", imagem: "images/user2.png" }
        ],
        "coleta": [
            { nome: "João", estrelas: 5, feedback: "Explicação clara sobre coleta de falas.", imagem: "images/user-feedback.png" }
        ],
        "analise": [
            { nome: "Mariana", estrelas: 5, feedback: "A categorização ficou muito clara!", imagem: "images/imagem-de-depoimento.png" }
        ],
        "geracao": [
            { nome: "Lina", estrelas: 5, feedback: "Excelente curso!", imagem: "images/noticia2.png" },
            { nome: "Mario", estrelas: 5, feedback: "Conteúdo bem objetivo.", imagem: "images/depoimento4.png" }
        ]
    };

    function loadReviews(category) {
        const section = $('#review-section');
        section.empty();
        if (reviews[category]) {
            reviews[category].forEach(review => {
                section.append(`
                    <div class="d-flex align-items-center mb-3">
                        <img src="${review.imagem}" alt="${review.nome}" width="50" height="50" class="rounded-circle me-3">
                        <div>
                            <strong>${review.nome}</strong>
                            <p>${'⭐'.repeat(review.estrelas)}</p>
                            <p>${review.feedback}</p>
                        </div>
                    </div>
                `);
            });
        } else {
            section.append(`<p class="text-muted">Nenhuma avaliação disponível.</p>`);
        }
    }

    $('.category-btn').on('click', function() {
        $('.category-btn').removeClass('active');
        $(this).addClass('active');
        const category = $(this).data('category');
        loadReviews(category);
        $('#articleImage').attr('src', articleImages[category]);
    });

    // Carregar avaliações iniciais
    loadReviews('geracao');
});

const discursos = {
    "introducao": {
        titulo: "Introdução ao DSC",
        descricao: "Descubra como o DSC pode transformar suas pesquisas qualitativas.",
        imagem: "images/analise-dados.jpg",
        link: "/discursos/categoria/politica"
    },
    "coleta": {
        titulo: "Coleta de Falas",
        descricao: "Aprenda a coletar falas autênticas para análise qualitativa.",
        imagem: "images/barreiras.png",
        link: "/discursos/categoria/educacao"
    },
    "analise": {
        titulo: "Análise e Categorias",
        descricao: "Entenda como categorizar e interpretar os dados coletados.",
        imagem: "images/divulgacao.png",
        link: "/discursos/categoria/educacao"
    },
    "geracao": {
        titulo: "Geração de Discursos",
        descricao: "Veja como gerar discursos representativos a partir dos dados.",
        imagem: "images/segmentacao.png",
        link: "/discursos/categoria/politica"
    }
};

function atualizarArticleSection(categoria) {
    const section = document.querySelector('.article-section');
    const discurso = discursos[categoria];

    if (discurso) {
        section.classList.add('hidden'); // Adiciona a classe para ocultar
        setTimeout(() => {
            section.innerHTML = `
                <img id="articleImage" src="${discurso.imagem}" alt="${discurso.titulo}" class="img-fluid">
                <h5>${discurso.titulo}</h5>
                <p>${discurso.descricao}</p>
                <a href="${discurso.link}" class="btn btn-primary">Acessar agora</a>
            `;
            section.classList.remove('hidden'); // Remove a classe para mostrar
        }, 300); // Tempo da transição
    }
}

// Adiciona o evento de clique aos botões de categoria
document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', function () {
        // Remove a classe "active" de todos os botões
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        // Adiciona a classe "active" ao botão clicado
        this.classList.add('active');
        // Atualiza a seção do artigo com base na categoria
        const categoria = this.getAttribute('data-category');
        atualizarArticleSection(categoria);
    });
});

// Carrega a categoria inicial (por exemplo, "geracao")
atualizarArticleSection('geracao');