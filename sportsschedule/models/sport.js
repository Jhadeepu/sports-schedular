/* eslint-disable no-unused-vars */
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Sport extends Model {
    static associate(models) {
      // define association here
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
