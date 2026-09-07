'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PesquisasDSC', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      usuarioId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      titulo: { type: Sequelize.STRING(200), allowNull: false },
      dados: { type: Sequelize.JSON, allowNull: false },
      analise: { type: Sequelize.JSON, allowNull: false },
      sugestaoOriginal: { type: Sequelize.JSON, allowNull: false },
      versoes: { type: Sequelize.JSON, allowNull: false },
      revisao: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('PesquisasDSC', ['usuarioId', 'createdAt']);
  },
  async down(queryInterface) { await queryInterface.dropTable('PesquisasDSC'); },
};
