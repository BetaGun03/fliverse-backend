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

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user and optionally uploads a profile picture.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: Juanseto01
 *               email:
 *                 type: string
 *                 format: email
 *                 example: example@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mySecret123
 *               name:
 *                 type: string
 *                 example: Juan
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 example: 2003-01-01
 *               profile_pic:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile picture (image file)
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       409:
 *         description: User already exists
 *       400:
 *         description: Invalid data or bad request
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         birthdate:
 *           type: string
 *           format: date
 *         profile_pic_mime:
 *           type: string
 */
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

// Endpoint to update the current user data. It uses Multer for file upload as a middleware
router.patch("/users/me", auth, upload.single("profile_pic"), async(req, res) => {
    try{
        const user = req.user

        //Get the user fields that can be updated
        // The fields that are not allowed to be updated are: id, username and register_date
        const allowedUpdates =  Object.keys(User.getAttributes()).filter(attr => !["id", "username", "register_date"].includes(attr))

        const updates = Object.keys(req.body)

        // Check if the updates are valid
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation)
        {
            return res.status(400).send("Invalid updates")
        }

        updates.forEach((field) => {
            user[field] = req.body[field]
        })

        if(req.file)
        {
            user.profile_pic = req.file.buffer
            user.profile_pic_mime = req.file.mimetype
        }

        await user.save()
        res.status(200).send(user)
    }
    catch (e) {
        console.error(e)
        res.status(500).send("Server error")
    }
})

// Endpoint to get the current user profile pic with the correct mime type. 
// It uses the auth middleware to check if the user is logged in
router.get("/users/me/profile_pic", auth, async(req, res) => {
    try{
        const user = req.user

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

module.exports = router