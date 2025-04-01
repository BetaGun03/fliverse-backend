require('dotenv').config()
const express = require('express')
const cors = require('cors')
require('./db/sequelizeConnection')

const app = express()
app.use(cors())
app.use(express.json())

app.listen(process.env.PORT, () => {
    console.log('Server is running on port', process.env.PORT)
})