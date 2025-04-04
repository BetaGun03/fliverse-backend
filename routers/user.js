// File that handles user-related routes
const express = require('express')
const { User } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()

//TODO: Add documentation for all routes with swagger

// Api endpoint to get all users. TESTING ONLY
router.get('/users', async (req, res) => {
    try{
        const users = await User.findAll()
        res.status(200).send(users)
    }
    catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

// Endpoint to register a new user
router.post("/users/register", async (req, res) => {
    const user = User.build(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user: user, token: token })
    } catch (e) {
        if(e.name)
        {
            if(e.name === "SequelizeUniqueConstraintError")
            {
                return res.status(409).send("User already exists")
            }
            else if(e.name === "SequelizeValidationError")
            {
                return res.status(400).send("Invalid data")
            }
        }

        console.error(e)
        res.status(400).send()
    }
})

// Endpoint to login a user
router.post("/users/login", async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    try{
        const user = await User.findOne({ where: { username } })

        if (!user) 
        {
            return res.status(404).send("User not found")
        }

        const isMatch = await user.comparePassword(password)

        if(!isMatch) 
        {
            return res.status(401).send("Invalid credentials")
        }

        const token = await user.generateAuthToken()
        res.status(200).send({ user: user, token: token })
    }
    catch (e) {
        console.error(e)
        res.status(400).send()
    }
})

module.exports = router