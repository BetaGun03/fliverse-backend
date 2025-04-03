const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Define the Rating model of the database for the ORM
const Rating = sequelize.define('Rating', {
    id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    rating:{
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    rating_date:{
        type: DataTypes.DATE,
        allowNull: false
    }
},
{
    tableName: "RATING"
})

module.exports = Rating