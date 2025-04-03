const { Sequelize, DataTypes, Model } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Defines the Comment model of the database for the ORM
class Comment extends Model {
    toJSON() {
        const values = { ...this.get() }
        return values
    }
}

Comment.init(
    {
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
    sequelize,
    modelName: "Comment",
    tableName: "COMMENT",
    timestamps: false
})

module.exports = Comment