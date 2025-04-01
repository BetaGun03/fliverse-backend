const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../db/sequelizeConnection")

// Defines the User model of the database for the ORM
const User = sequelize.define("User", {
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
    },
})

module.exports = User