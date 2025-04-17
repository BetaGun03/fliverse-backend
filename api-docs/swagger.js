// This file is part of the API documentation for the project.
// It uses Swagger to generate and serve the API documentation for the backend.
// The documentation is generated from the JSDoc comments in the code and is served at the /api-docs endpoint.
// Only add to the components section, the fields that the model has and are returned in the API response.
require('dotenv').config()
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerAuth = require('../middlewares/swaggerAuth')
const path = require('path')
const limit = require('../middlewares/express-rate-limit')

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
                url: `http://localhost:${process.env.PORT || 2888}`,
            },
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        birthdate: { type: 'string', format: 'date' },
                        profile_pic: { type: 'string', format: 'binary' },
                        profile_pic_mime: { type: 'string' }
                    }
                }
            }
        }        
    },
    apis: [path.join(__dirname, '../routers/*.js')],
}

const swaggerDocs = swaggerJSDoc(swaggerOptions)

const swaggerUiOptions = {
    explorer: true,
    customCss:'.swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css'
}

module.exports = (app) => {
    const swaggerUiDistPath = require('swagger-ui-dist').getAbsoluteFSPath();
    app.use('/api-docs', express.static(swaggerUiDistPath));
    
    app.use('/api-docs', limit, swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions))

    app.get('/swagger.json', limit, swaggerAuth, (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.send(swaggerDocs);
    })

    app.get('/', limit, swaggerAuth, (req, res) => {
        res.redirect('/api-docs')
    })
}