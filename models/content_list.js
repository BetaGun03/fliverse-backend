const { Sequelize, DataTypes, Model } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Defines the Content_List model of the database for the ORM
class Content_List extends Model {
    toJSON() {
        const values = { ...this.get() }
        return values
    }
}

Content_List.init(
    {
        id_content_list:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
},
{
    sequelize,
    modelName: "Content_List",
    tableName: "CONTENT_LIST",
    timestamps: false
})

module.exports = Content_List
