/* eslint-disable no-unused-vars */
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * 
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      sessions.belongsTo(models.Sport, {
        foreignKey: "sportId",
      });
    }
  }
  Session.init({
    date: DataTypes.DATE,
    address: DataTypes.STRING,
    player: DataTypes.STRING,
    total: DataTypes.STRING,
    organizer: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};
