const { Sequelize, DataTypes, Model } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Defines the User model of the database for the ORM
class User extends Model{
    toJSON()
    {
        const values = { ...this.get() }
        delete values.id
        delete values.password
        delete values.tokens
        delete values.sub
        delete values.register_date
        return values
    }

    // Instance method to compare the password with the hashed password in the database. Retuns true if they match
    async comparePassword(password)
    {
        const user = this
        const isMatch = await bcrypt.compare(password, user.password)
        return isMatch
    }

    // Instance method to generate a JWT token for the user using the secret key. Returns the token
    async generateAuthToken()
    {
        const user = this
        const token = jwt.sign({ id: this.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        user.tokens = [...user.tokens, token]

        try{
            await user.save()
        }
        catch (e) {
            console.error(`Error saving token: ${e}`)
        }

        return token
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
            type: DataTypes.BLOB,
            allowNull: true
        },
        sub:{
            type: DataTypes.TEXT,
            allowNull: true,
            unique: true
        },
        tokens:{
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true,
            defaultValue: []
        },
        profile_pic_mime:{
            type: DataTypes.STRING,
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