const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Defines the Comment model of the database for the ORM
const Comment = sequelize.define("Comment", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    text:{
        type: DataTypes.TEXT,
        allowNull: false
    },
    comment_date:{
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
},
{
    tableName: "COMMENT",
    timestamps: false
})

module.exports = Comment