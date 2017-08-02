'use strict';
module.exports = function(sequelize, DataTypes) {
  var user = sequelize.define('user', {
    name: DataTypes.STRING,
    occupation: DataTypes.STRING,
    email: DataTypes.STRING,
    birth_date: DataTypes.DATE,
    state: DataTypes.STRING,
    city: DataTypes.STRING,
    cellphone_number: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return user;
};