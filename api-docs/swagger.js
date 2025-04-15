// This file is part of the API documentation for the project.
const swaggerUi = require('swagger-ui-express')
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerAuth = require('../middlewares/swaggerAuth')
const path = require('path')

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Fliverse Backend API Documentation',
            version: '1.0.0',
            description: 'API documentation for Fliverse backend',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}`,
            },
        ],
    },
    apis: [path.join(__dirname, '../routers/*.js')],
}

const swaggerDocs = swaggerJSDoc(swaggerOptions)

const swaggerUiOptions = {
    explorer: true,
}

module.exports = (app) => {
    app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions))

    app.get('/swagger.json', swaggerAuth, (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.send(swaggerDocs);
    })

    app.get('/', swaggerAuth, (req, res) => {
        res.redirect('/api-docs')
    })
}