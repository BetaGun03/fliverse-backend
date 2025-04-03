// File that contains the relations between the models. You have to import this file everytime you want to use a model, never import the model file directly!.
const { Sequelize } = require('sequelize');
const sequelize = require("../db/sequelizeConnection");

const User = require("./user");
const Content = require("./content");
const List = require("./list");
const Rating = require("./rating");
const Content_User = require("./content_user");
const Comment = require("./comment");
const Content_List = require("./content_list");

// Define the relations between User and Content in Content_User. It is an intermediate table
User.belongsToMany(Content, {
    through: Content_User,
    foreignKey: 'id_user',
    otherKey: 'id_content',
    as: 'contents'
})

Content.belongsToMany(User, {
    through: Content_User,
    foreignKey: 'id_content',
    otherKey: 'id_user',
    as: 'users'
})

Content_User.belongsTo(User, {
    foreignKey: 'id_user',
    onDelete: 'CASCADE'
})

Content_User.belongsTo(Content, {
    foreignKey: 'id_content',
    onDelete: 'CASCADE'
})

// Define the relations between List and User
List.belongsTo(User, {
    foreignKey:{
        name: 'user_id',
        allowNull: false
    },
    as: 'user',
    onDelete: 'CASCADE'
})

User.hasMany(List, {
    foreignKey: 'user_id',
    as: 'lists'
})

// Define the relations between Rating, User and Content. Rating has user_id and content_id, it is not an intermediate table
Rating.belongsTo(User, {
    foreignKey:{
        name: 'user_id',
        allowNull: false
    },
    as: 'user',
    onDelete: 'CASCADE'
})

Rating.belongsTo(Content, {
    foreignKey:{
        name: 'content_id',
        allowNull: false
    },
    as: 'content',
    onDelete: 'CASCADE'
})

User.hasMany(Rating, {
    foreignKey: "user_id",
    as: 'ratings'
})

Content.hasMany(Rating, {
    foreignKey: "content_id",
    as: 'ratings'
})

// Define the relations between Comment, User and Content. Comment has user_id and content_id, it is not an intermediate table
Comment.belongsTo(User, {
    foreignKey:{
        name: 'user_id',
        allowNull: false
    },
    as: 'author',
    onDelete: 'CASCADE'
})

Comment.belongsTo(Content, {
    foreignKey:{
        name: 'content_id',
        allowNull: false
    },
    as: 'content',
    onDelete: 'CASCADE'
})

User.hasMany(Comment, {
    foreignKey: "user_id",
    as: 'comments'
})

Content.hasMany(Comment, {
    foreignKey: "content_id",
    as: 'comments'
})

// Define the relations between List and Content in Content_List. It is an intermediate table
List.belongsToMany(Content, {
    through: Content_List,
    foreignKey: 'list_id',
    otherKey: 'content_id',
    as: 'contents'
})

Content.belongsToMany(List, {
    through: Content_List,
    foreignKey: 'content_id',
    otherKey: 'list_id',
    as: 'lists'
})

Content_List.belongsTo(List, { 
    foreignKey: 'list_id', 
    onDelete: 'CASCADE' 
})

Content_List.belongsTo(Content, { 
    foreignKey: 'content_id', 
    onDelete: 'CASCADE' 
})

module.exports = {
    User,
    Content,
    List,
    Rating,
    Content_User,
    Comment,
    Content_List
}