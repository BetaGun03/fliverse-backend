// Main file of the project
require('dotenv').config()
const express = require('express')
const cors = require('cors')
require('./db/sequelizeConnection')
const userRouter = require('./routers/user')
const contentRouter = require('./routers/content')
const commentRouter = require('./routers/comment')
const listRouter = require('./routers/list')
const contentUserRouter = require('./routers/content_user')
const ratingRouter = require('./routers/rating')

// Express setup
const app = express()
app.set("trust proxy", 1) // Trust first proxy (for Vercel)
app.use(cors())
app.use(express.json())

// Routes
app.use(userRouter)
app.use(contentRouter)
app.use(commentRouter)
app.use(listRouter)
app.use(contentUserRouter)
app.use(ratingRouter)

// Swagger docs
require("./api-docs/swagger")(app)

const PORT = process.env.PORT || 2888

app.listen(PORT, () => {
    console.log('Server is running on port', PORT)
})

module.exports = app