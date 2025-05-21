// This file contains the User routes for the API.
require("dotenv").config()
const fs = require('fs')
const path = require('path')
const express = require('express')
const { User } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()
const upload = require('../middlewares/upload')
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const generatePassword = require('generate-password')
const emailSender = require('../config/mailer')
const { getContainerClient } = require('../config/azureStorage')

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     security: []
 *     description: Registers a new user and optionally uploads a profile picture to Azure Blob Storage.
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
    let url
    const user = User.build({
        ...req.body,
        profile_pic: req.file ? req.file.buffer : null,
        profile_pic_mime: req.file ? req.file.mimetype : null
    })

    try {
        // If the user has a profile picture, upload it to Azure Blob Storage
        if(req.file)
        {
            const containerClient = await getContainerClient()
            const blobName = `${user.username}-${Date.now()}-${req.file.originalname}`
            const blockBlobClient = containerClient.getBlockBlobClient(blobName)
            await blockBlobClient.uploadData(req.file.buffer)
            url = blockBlobClient.url

            user.profile_pic = url
        }   

        await user.save()

        // Load the HTML template for the email
        const registerTemplatePath = path.join(__dirname, '../html-templates/registerEmail.html')
        let htmlContent = fs.readFileSync(registerTemplatePath, 'utf8')
        htmlContent = htmlContent.replace('{{username}}', user.username)

        // Configure the email options
        const mailOptions = {
            from: process.env.ZOHO_USER,
            to: user.email,
            subject: 'Fliverse register notification',
            html: htmlContent
        }

        emailSender.sendMail(mailOptions, (err, info) => {
            if (err)
            {
                console.error(err)
            } 
        })

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
 *     summary: Log in a user
 *     security: []
 *     description: Authenticates a user by username and password. Returns the user info and a JWT authentication token.
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
 *                   $ref: '#/components/schemas/User'
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
        const user = await User.findOne({ where: { username }, attributes: { exclude: ['profile_pic', "profile_pic_mime"] } })

        if (!user) 
        {
            return res.status(404).send("User not found")
        }

        const isMatch = await user.comparePassword(password)

        if(!isMatch) 
        {
            return res.status(401).send("Invalid credentials")
        }

        // Load the HTML template for the email
        const loginTemplatePath = path.join(__dirname, '../html-templates/loginEmail.html')
        let htmlContent = fs.readFileSync(loginTemplatePath, 'utf8')
        htmlContent = htmlContent.replace('{{username}}', user.username)

        // Configure the email options
        const mailOptions = {
            from: process.env.ZOHO_USER,
            to: user.email,
            subject: 'Fliverse login notification',
            html: htmlContent
        }

        /*
        emailSender.sendMail(mailOptions, (err, info) => {
            if (err)
            {
                console.error(err)
            } 
        })*/

        await emailSender.sendMail(mailOptions)
        
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
 * /users/loginGoogle:
 *   post:
 *     summary: Log in or register a user via Google OAuth
 *     security: []
 *     description: Authenticates or registers a user using a Google ID token. Returns the user info and a JWT token.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token obtained after client-side authentication
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
 *     responses:
 *       200:
 *         description: User successfully authenticated or registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 bdtoken:
 *                   type: string
 *                   description: JWT token issued by the backend
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Google token not provided
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Google token is required"
 *       401:
 *         description: Invalid Google token
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid Google token"
 *       409:
 *         description: User already exists
 */
router.post("/users/loginGoogle", async (req, res) => {
    const { token } = req.body

    if(!token) 
    {
        return res.status(400).send("Google token is required")
    }

    try{
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload() //Contains the user information from Google
        let user = await User.findOne({ where: { email: payload.email }, attributes: { exclude: ['profile_pic', "profile_pic_mime"] } })

        // If the user does not exist, create a new one
        if (!user) 
        {
            const response = await fetch(payload.picture)

            if(!response.ok)
            {
                throw new Error("Error fetching profile picture")
            }

            // It generates a random password for the user
            // This password is not used, but it is required by the User model
            // If the user wants to change the password, they can do it later
            const password = generatePassword.generate({
                length: 15,
                numbers: true,
                symbols: true,
                uppercase: true,
                lowercase: true
            })

            user = User.build({
                sub: payload.sub,
                email: payload.email,
                username: payload.email.split("@")[0],
                password: password,
                profile_pic: payload.picture,
                profile_pic_mime: response.headers.get("content-type")
            })

            await user.save()

            // Load the HTML template for the email
            const registerTemplatePath = path.join(__dirname, '../html-templates/registerEmail.html')
            let htmlContent = fs.readFileSync(registerTemplatePath, 'utf8')
            htmlContent = htmlContent.replace('{{username}}', user.username)

            // Configure the email options
            const mailOptions = {
                from: process.env.ZOHO_USER,
                to: user.email,
                subject: 'Fliverse register notification',
                html: htmlContent
            }

            emailSender.sendMail(mailOptions, (err, info) => {
                if (err)
                {
                    console.error(err)
                } 
            })
        }
        else
        {
            // Load the HTML template for the email
            const loginTemplatePath = path.join(__dirname, '../html-templates/loginEmail.html')
            let htmlContent = fs.readFileSync(loginTemplatePath, 'utf8')
            htmlContent = htmlContent.replace('{{username}}', user.username)

            // Configure the email options
            const mailOptions = {
                from: process.env.ZOHO_USER,
                to: user.email,
                subject: 'Fliverse login notification',
                html: htmlContent
            }

            emailSender.sendMail(mailOptions, (err, info) => {
                if (err)
                {
                    console.error(err)
                } 
            })
        }
        
        const bdtoken = await user.generateAuthToken()
        res.status(200).send({ user: user, bdtoken: bdtoken })
    }
    catch (e) {
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
        res.status(401).send("Invalid Google token")
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

        // Load the HTML template for the email
        const logoutAllDevicesTemplatePath = path.join(__dirname, '../html-templates/logoutFromAllDevices.html')
        let htmlContent = fs.readFileSync(logoutAllDevicesTemplatePath, 'utf8')
        htmlContent = htmlContent.replace('{{username}}', user.username)

        // Configure the email options
        const mailOptions = {
            from: process.env.ZOHO_USER,
            to: user.email,
            subject: 'Fliverse logout from all devices notification',
            html: htmlContent
        }

        emailSender.sendMail(mailOptions, (err, info) => {
            if (err)
            {
                console.error(err)
            } 
        })
        
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
 *     summary: Get current user's public profile
 *     description: Returns the authenticated user's public profile information.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's public profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 *     description: Updates the authenticated user's profile and optionally their profile picture.
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
 *                 example: newemail@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newPassword123
 *               name:
 *                 type: string
 *                 example: John
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *               profile_pic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid updates
 *       500:
 *         description: Server error
 */
router.patch("/users/me", auth, upload.single("profile_pic"), async(req, res) => {
    try{
        const user = req.user
        let url

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
            const containerClient = await getContainerClient()
            const blobName = `${user.username}-${Date.now()}-${req.file.originalname}`
            const blockBlobClient = containerClient.getBlockBlobClient(blobName)
            await blockBlobClient.uploadData(req.file.buffer)
            url = blockBlobClient.url

            user.profile_pic = url
            user.profile_pic_mime = req.file.mimetype
        }

        // Load the HTML template for the email
        const updateUserInformationTemplatePath = path.join(__dirname, '../html-templates/userUpdatedInfo.html')
        let htmlContent = fs.readFileSync(updateUserInformationTemplatePath, 'utf8')
        htmlContent = htmlContent.replace('{{username}}', user.username)

        // Configure the email options
        const mailOptions = {
            from: process.env.ZOHO_USER,
            to: user.email,
            subject: 'Fliverse user information updated notification',
            html: htmlContent
        }

        emailSender.sendMail(mailOptions, (err, info) => {
            if (err)
            {
                console.error(err)
            } 
        })

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
 *         description: Profile picture not found
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

        const containerClient = await getContainerClient()
        const blobName = user.profile_pic.split("/").pop()
        const blockBlobClient = containerClient.getBlockBlobClient(blobName)
        const downloadResponse = await blockBlobClient.download()

        res.set("Content-Type", user.profile_pic_mime)
        downloadResponse.readableStreamBody.pipe(res)
    }
    catch (e) {
        console.error(e)
        res.status(500).send("Server error")
    }
})

module.exports = router