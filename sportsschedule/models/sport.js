/* eslint-disable no-unused-vars */
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Sport extends Model {
    static associate(models) {
     Sport.hasMany(models.sessions, { foreignKey: 'sportId', as: 'sessions' });
    }
  }
  
  Sport.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Sport',
    }
  );

  return Sport;
};
