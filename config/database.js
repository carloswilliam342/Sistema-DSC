import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const NOME_BANCO = process.env.DB_NAME || 'dsc_ifma'
const USUARIO = process.env.DB_USER || 'root'
const SENHA = process.env.DB_PASSWORD || ''
const HOST = process.env.DB_HOST || 'localhost'

const sequelize = new Sequelize(NOME_BANCO, USUARIO, SENHA,
    {
        host: HOST,
        dialect: 'mysql'
    }
)

sequelize.authenticate().then(function(){
    console.log('Conexão realizada com sucesso!')
}).catch(function(erro){
    console.log('Erro: '+erro)
})

export default sequelize;
