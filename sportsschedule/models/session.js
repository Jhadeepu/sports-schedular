// Session.js

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../path/to/db');
const Sport = require('./Sport');
const User = require('./User');

const Session = sequelize.define('Session', {
  // Define the model attributes
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sessionDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  sessionVenue: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sessionParticipants: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  playersNeeded: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  sportId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Sport,
      key: 'id',
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
});

// Establish associations
Session.belongsTo(User, { foreignKey: 'createdBy' });
Session.belongsTo(Sport, { foreignKey: 'sportId' });

module.exports = Session;
