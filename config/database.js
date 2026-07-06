import 'dotenv/config'
import { Sequelize } from 'sequelize'

const NOME_BANCO = process.env.DB_NAME || 'dsc_ifma'
const USUARIO = process.env.DB_USER || 'root'
const SENHA = process.env.DB_PASSWORD || ''
const HOST = process.env.DB_HOST || 'localhost'

let sequelize;

if (process.env.NODE_ENV === 'test') {
    // Em testes usamos um banco SQLite em memória: roda SQL de verdade
    // (pega erros de schema/consulta), mas é rápido e descartável.
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
} else {
    sequelize = new Sequelize(NOME_BANCO, USUARIO, SENHA,
        {
            host: HOST,
            dialect: 'mysql'
        }
    );

    sequelize.authenticate().then(function(){
        console.log('Conexão realizada com sucesso!')
    }).catch(function(erro){
        console.log('Erro: '+erro)
    });
}

export default sequelize;
