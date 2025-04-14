// File that handles user-related routes
const express = require('express')
const { User } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()
const upload = require('../middlewares/upload')

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

// Endpoint to register a new user. It uses Multer for file upload as a middleware
router.post("/users/register", upload.single("profile_pic") ,async (req, res) => {
    const user = User.build({
        ...req.body,
        profile_pic: req.file ? req.file.buffer : null,
        profile_pic_mime: req.file ? req.file.mimetype : null
    })

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

// Endpoint to logout a user

// Endpoint to logout a user from all devices

// Endpoint to get the current user data

// Endpoint to get the current user profile pic with the correct mime type. 
// It uses the auth middleware to check if the user is logged in
router.get("/users/me/profile_pic", auth, async(req, res) => {
    try{
        const user = await User.findByPk(req.user.id)

        if(!user) 
        {
            return res.status(404).send("User not found")
        }

        if (!user.profile_pic || !user.profile_pic_mime) 
        {
            return res.status(404).send("Profile pic not found")
        }

        res.set("Content-Type", user.profile_pic_mime)
        res.status(200).send(user.profile_pic)
    }
    catch (e) {
        console.error(e)
        res.status(500).send("Server error")
    }
})

// Endpoint to update the current user data. It uses Multer for file upload as a middleware


module.exports = router