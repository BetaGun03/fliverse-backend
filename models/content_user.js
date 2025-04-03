const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Defines the Content_User model of the database for the ORM
const Content_User = sequelize.define("Content_User", {
    id_content_user:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    status:{
        type: DataTypes.ENUM('watched', 'to_watch'),
        allowNull: false,
        defaultValue: 'to_watch',
    }
},
{
    tableName: "CONTENT_USER",
    timestamps: false
})

module.exports = Content_User