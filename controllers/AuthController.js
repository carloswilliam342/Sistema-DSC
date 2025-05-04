import bcrypt from "bcrypt";
import User from "../models/User.js";
import multer from "multer";
import path from "path";

export const exibirLogin = (req, res) => {
  res.render("login");
};

export const exibirRegistro = (req, res) => {
  res.render("registro");
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/profile-images') // Create this directory in your project
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Apenas imagem!');
    }
  }
});

export const registrarUsuario = async (req, res) => {
  try {
    upload.single('imagem')(req, res, async function(err) {
      if (err) {
        console.error("Erro ao fazer upload da imagem:", err);
        req.flash("error_msg", "Erro ao fazer upload da imagem. Certifique-se de que o arquivo é uma imagem válida.");
        return res.redirect("/registro");
      }

      const { nome, email, senha, tipoUsuario } = req.body; // Captura o tipo de usuário
      const imagemPath = req.file ? `/uploads/profile-images/${req.file.filename}` : null;

      // Verifica se a senha atende aos requisitos
      const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!senhaRegex.test(senha)) {
        console.log("Senha inválida:", senha);
        req.flash("error_msg", "A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um símbolo.");
        return res.redirect("/registro");
      }

      // Verifica se o usuário já existe
      console.log("Verificando e-mail:", email);
      const usuarioExistente = await User.findOne({ where: { email } });
      if (usuarioExistente) {
        console.log("Usuário já existe:", usuarioExistente);
        req.flash("error_msg", "E-mail já cadastrado!");
        return res.redirect("/registro");
      }

      // Hash da senha antes de salvar
      const hashedSenha = await bcrypt.hash(senha, 10);

      // Cria o usuário com o tipo selecionado
      await User.create({ 
        nome, 
        email, 
        senha: hashedSenha,
        tipoUsuario, // Salva o tipo de usuário
        imagemPerfil: imagemPath,
        primeiroLogin: true 
      });

      req.flash("success_msg", "Cadastro realizado com sucesso! Faça login.");
      res.redirect("/login");
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    req.flash("error_msg", "Erro ao registrar usuário.");
    res.redirect("/registro");
  }
};





  export const logarUsuario = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await User.findOne({ where: { email } });

        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
          req.flash('error_msg', 'Usuário não encontrado');
            return res.render('login');
        }

        req.session.usuario = usuario; // Armazena o usuário na sessão
        req.flash('success_msg', 'Login realizado com sucesso!');

        if (usuario.primeiroLogin) {
            return res.redirect('/bem-vindo');
        }

        return res.redirect('/dashboard'); // Se não for o primeiro login, vai para a dashboard normal
    } catch (erro) {
        console.error('Erro ao fazer login:', erro);
        req.flash('error_msg', 'Erro interno ao fazer login');
        return res.render('login');
    }
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
