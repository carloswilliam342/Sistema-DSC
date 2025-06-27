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
                <div class="d-flex flex-column flex-md-row align-items-start mb-3 w-100">
                    <img src="${review.imagem}" alt="${review.nome}" 
                         width="48" height="48" 
                         class="rounded-circle me-3 mb-2 mb-md-0 flex-shrink-0">
                    <div class="flex-grow-1">
                        <strong>${review.nome}</strong>
                        <div class="text-warning mb-1" style="font-size:1.1rem;">
                            ${'★'.repeat(review.estrelas)}
                        </div>
                        <div class="text-muted" style="font-size: 0.97rem; word-break: break-word;">
                            ${review.feedback}
                        </div>
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
        link: "/discursos/categoria/politica",
        gratuito: true
    },
    "coleta": {
        titulo: "Coleta de Falas",
        descricao: "Aprenda a coletar falas autênticas para análise qualitativa.",
        imagem: "images/barreiras.png",
        link: "/discursos/categoria/educacao",
        gratuito: false
    },
    "analise": {
        titulo: "Análise e Categorias",
        descricao: "Entenda como categorizar e interpretar os dados coletados.",
        imagem: "images/divulgacao.png",
        link: "/discursos/categoria/educacao",
        gratuito: true
    },
    "geracao": {
        titulo: "Geração de Discursos",
        descricao: "Veja como gerar discursos representativos a partir dos dados.",
        imagem: "images/segmentacao.png",
        link: "/discursos/categoria/politica",
        gratuito: true
    }
};

function atualizarArticleSection(categoria) {
    const section = document.querySelector('.article-section');
    const discurso = discursos[categoria];

    if (discurso) {
        section.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => {
            section.innerHTML = `
                <div class="d-flex flex-column align-items-center">
                    <img src="${discurso.imagem}" alt="${discurso.titulo}" 
                         class="img-fluid mb-3 mx-auto" style="max-width: 200px;">
                    
                    ${discurso.gratuito ? '<h5 class="text-success mb-2">GRATUITO</h5>' : ''}
                    
                    <div class="text-center mb-3">
                        <h6 class="fw-bold">${discurso.titulo}</h6>
                        <p class="mb-0">${discurso.descricao}</p>
                    </div>
                    
                    <div class="w-100 d-flex justify-content-center">
                        <a href="${discurso.link}" 
                           class="btn btn-primary w-100 w-md-auto text-nowrap py-2 px-4"
                           style="min-width: 180px;">
                           Acessar agora
                        </a>
                    </div>
                </div>
            `;
            // Forçar reflow para a transição funcionar
            void section.offsetWidth;
            section.classList.remove('opacity-0');
        }, 10);
    }
}

// Inicializar com a categoria 'geracao'
document.addEventListener('DOMContentLoaded', function() {
    atualizarArticleSection('geracao');
});

// Adiciona o evento de clique aos botões de categoria
document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', function () {
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const categoria = this.getAttribute('data-category');
        atualizarArticleSection(categoria);
    });
});

// Carrega a categoria inicial (por exemplo, "geracao")
atualizarArticleSection('geracao');