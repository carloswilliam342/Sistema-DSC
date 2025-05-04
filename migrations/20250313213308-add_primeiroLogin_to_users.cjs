// export async function up(queryInterface, Sequelize) {
//   return queryInterface.addColumn('Users', 'primeiroLogin', {
//       type: Sequelize.BOOLEAN,
//       allowNull: false,
//       defaultValue: true
//   });
// }

// export async function down(queryInterface, Sequelize) {
//   return queryInterface.removeColumn('Users', 'primeiroLogin');
// }
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'primeiroLogin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'primeiroLogin');
  }
};

