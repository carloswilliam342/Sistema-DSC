'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'tipoUsuario', {
      type: Sequelize.ENUM('ESTUDANTE', 'PESQUISADOR'),
      defaultValue: 'ESTUDANTE',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'tipoUsuario');
  }
};