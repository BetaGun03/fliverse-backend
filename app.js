// Main file of the project
require('dotenv').config()
const express = require('express')
const cors = require('cors')
require('./db/sequelizeConnection')
const userRouter = require('./routers/user')

// Express setup
const app = express()
app.use(cors())
app.use(express.json())

// Routes
app.use(userRouter)

// Swagger docs
require("./api-docs/swagger")(app)

app.listen(process.env.PORT, () => {
    console.log('Server is running on port', process.env.PORT)
})