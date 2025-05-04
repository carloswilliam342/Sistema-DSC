import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imagemPerfil: {
        type: DataTypes.STRING,
        allowNull: true
    },
    primeiroLogin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    tipoUsuario: {
        type: DataTypes.ENUM("ESTUDANTE", "PESQUISADOR"),
        defaultValue: "ESTUDANTE"
    }
}, {
    timestamps: false
});

export default User;
