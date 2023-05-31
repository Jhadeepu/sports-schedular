/* eslint-disable no-unused-vars */
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    static associate(models) {
      // define association here
    }

    static async getSports(userId) {
      try {
        const sports = await Sport.findAll({ where: { createdBy: userId } });
        return sports;
      } catch (error) {
        throw new Error('Failed to fetch sports');
      }
    }
  }

  Sport.init(
    {
      name: DataTypes.STRING,
      createdBy: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'Sport',
    }
  );

  return Sport;
};
