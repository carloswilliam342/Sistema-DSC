module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Discursos", "imagem", {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Discursos", "imagem");
  }
};
