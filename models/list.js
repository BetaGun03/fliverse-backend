const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Define the List model of the database for the ORM
const List = sequelize.define("List", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false
    },
    description:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    creation_date:{
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }
},
{
    tableName: "LIST"
})

module.exports = List