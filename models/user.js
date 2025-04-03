const { Sequelize, DataTypes, Model } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")
const bcrypt = require('bcrypt')

// Defines the User model of the database for the ORM
class User extends Model{
    toJSON(){
        const values = { ...this.get() }
        delete values.password
        delete values.tokens
        delete values.sub
        delete values.register_date
        return values
    }
}

User.init(
    {
        id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate:{
                isEmail: true,
                notEmpty: true
            }
        },
        password:{
            type: DataTypes.STRING,
            allowNull: false,
            validate:{
                notEmpty: true,
                len: [8, 100]
            }
        },
        register_date:{
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        },
        name:{
            type: DataTypes.STRING,
            allowNull: true
        },
        birthdate:{
            type: DataTypes.DATE,
            allowNull: true,
            validate:{
                isDate: true
            }
        },
        profile_pic:{
            type: DataTypes.STRING,
            allowNull: true,
            validate:{
                isUrl: true
            }
        },
        sub:{
            type: DataTypes.TEXT,
            allowNull: true,
            unique: true
        },
        tokens:{
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true
        }
},
{
    sequelize,
    modelName: 'User',
    tableName: 'USER',
    timestamps: false,
    hooks:{
        beforeCreate: async(user) => {
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(user.password, salt)
        },
        beforeUpdate: async(user) => {
            if(user.changed('password'))
            {
                const salt = await bcrypt.genSalt(10)
                user.password = await bcrypt.hash(user.password, salt)
            }
        }
    }
})

module.exports = User