// File that handles user-related routes
const express = require('express')
const { User } = require("../models/relations")
const auth = require('../middleware/auth')
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
        res.status(201).send(user)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

module.exports = router