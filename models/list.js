const { Sequelize, DataTypes, Model } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Define the List model of the database for the ORM
class List extends Model{
    toJSON(){
        const values = { ...this.get() }
        delete values.creation_date
        return values
    }
}

List.init(
    {
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
    sequelize,
    modelName: "List",
    tableName: "LIST",
    timestamps: false
})

module.exports = List