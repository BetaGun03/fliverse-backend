const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Defines the Content_List model of the database for the ORM
const Content_List = sequelize.define("Content_List", {
    id_content_list:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }
},
{
    tableName: "CONTENT_LIST",
    timestamps: false
})

module.exports = Content_List
