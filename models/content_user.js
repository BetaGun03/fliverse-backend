const { Sequelize, DataTypes, Model } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Defines the Content_User model of the database for the ORM
class Content_User extends Model{
    toJSON(){
        const values = { ...this.get() }
        delete values.id_user
        return values
    }
}

Content_User.init(
    {
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
    sequelize,
    modelName: "Content_User",
    tableName: "CONTENT_USER",
    timestamps: false
})

module.exports = Content_User