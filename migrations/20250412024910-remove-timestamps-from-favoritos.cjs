'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Favoritos', 'createdAt');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Favoritos', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });
  }
};
