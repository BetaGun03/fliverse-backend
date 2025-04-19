// This file contains the User routes for the API.
const express = require('express')
const { User } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()
const upload = require('../middlewares/upload')

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

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticates a user by username and password. Returns the username and a JWT token.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: Juanseto01
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mySecret123
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: Juanseto01
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
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

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout a user
 *     description: Logs out the current user by removing the current JWT token.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Server error
 */
router.post("/users/logout", auth, async (req, res) => {
    try{
        const user = req.user
        user.tokens = user.tokens.filter((token) => token !== req.token)
        await user.save()
        res.status(200).send("Logged out successfully")
    }
    catch (e) {
        console.error(e)
        res.status(500).send("Server error")
    }
})

/**
 * @swagger
 * /users/logoutAll:
 *   post:
 *     summary: Logout user from all devices
 *     description: Logs out the current user from all sessions by removing all JWT tokens.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *       500:
 *         description: Server error
 */
router.post("/users/logoutAll", auth, async (req, res) => {
    try{
        const user = req.user
        user.tokens = []
        await user.save()
        res.status(200).send("Logged out from all devices")
    }
    catch (e) {
        console.error(e)
        res.status(500).send("Server error")
    }
})

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user public data
 *     description: Returns the authenticated user's public profile information.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public profile of the current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   example: Juanseto01
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: example@example.com
 *                 name:
 *                   type: string
 *                   nullable: true
 *                   example: Juan
 *                 birthdate:
 *                   type: string
 *                   format: date
 *                   nullable: true
 *                   example: 2003-01-01
 *                 profile_pic_mime:
 *                   type: string
 *                   nullable: true
 *                   example: image/png
 *                 profile_pic:
 *                   type: string
 *                   format: byte
 *                   nullable: true
 *       500:
 *         description: Server error
 */
router.get("/users/me", auth ,async(req, res) => {
    try{
        const user = req.user
        res.status(200).send(user.getPublicProfileInfo())
    }
    catch (e) {
        console.error(e)
        res.status(500).send("Server error")
    }
})

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update current user data
 *     description: Updates the authenticated user's profile fields and optionally their profile picture.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ejemplo@nuevo.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: nuevaClave123
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
 *     responses:
 *       200:
 *         description: Updated user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   example: Juanseto01
 *       400:
 *         description: Invalid updates
 *       500:
 *         description: Server error
 */
router.patch("/users/me", auth, upload.single("profile_pic"), async(req, res) => {
    try{
        const user = req.user

        // Get the user fields that can be updated
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

/**
 * @swagger
 * /users/me/profile_pic:
 *   get:
 *     summary: Get current user's profile picture
 *     description: Retrieves the authenticated user's profile picture in binary format with the correct MIME type header.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile picture retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Profile pic not found
 *       500:
 *         description: Server error
 */
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