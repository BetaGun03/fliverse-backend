// This file contains the routes for Content_User table for the API
require("dotenv").config()
const express = require('express')
const { ValidationError, DatabaseError } = require('sequelize')
const { Content_User } = require("../models/relations")
const { Content } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()

/**
 * @swagger
 * /contents_user:
 *   post:
 *     summary: Associate a content with the authenticated user
 *     description: Adds a content entry to the user’s list (with default status `to_watch`). Requires a valid Bearer token.
 *     tags:
 *       - ContentUser
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *             properties:
 *               contentId:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       201:
 *         description: Content added to user’s list successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentUser'
 *       400:
 *         description: Bad request – missing or invalid [contentId](http://_vscodecontentref_/3)
 *       404:
 *         description: Content not found
 *       500:
 *         description: Internal server error
 */
router.post("/contents_user", auth, async (req, res) => {
    try {
        const contentId = req.body.contentId
        const user = req.user

        // Validate the request body
        if (!contentId) 
        {
            return res.status(400).send({ error: 'Content and User IDs are required' })
        }

        // Check if the content exists
        const content = await Content.findOne({ where: { id: contentId } })

        if (!content) 
        {
            return res.status(404).send({ error: 'Content not found' })
        }

        // Check if the content is already associated with the user
        const isAssociated = await user.hasContent(content)
        if (isAssociated) 
        {
            return res.status(400).send({ error: 'Content already exists in the user\'s list' })
        }

        // Add a new entry to the CONTENT_USER table
        await user.addContent(content)

        const contentUser = await Content_User.findOne({
            where: { id_user: user.id, id_content: contentId }
        })

        return res.status(201).json(contentUser)
    }
    catch (e) {
        if (e.name === 'SequelizeValidationError') 
        {
            return res.status(400).send({ error: 'Invalid data provided' })
        }
        console.log(e)
        return res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /contents_user:
 *   get:
 *     summary: Retrieve all contents for the authenticated user
 *     description: Returns the list of contents associated with the authenticated user. Requires a valid Bearer token.
 *     tags:
 *       - ContentUser
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Content'
 *       404:
 *         description: No contents found for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No contents found for the user"
 *       500:
 *         description: Internal server error
 */
router.get("/contents_user", auth, async (req, res) => {
    try {
        const user = req.user

        // Get all contents for the user
        const contents = await user.getContents()

        if (!contents || contents.length === 0) 
        {
            return res.status(404).send({ error: 'No contents found for the user' })
        }

        return res.status(200).json(contents)
    }
    catch (e) {
        console.log(e)
        return res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /contents_user/{IdContentUser}:
 *   get:
 *     summary: Retrieve a specific content association for the authenticated user
 *     description: Fetches a CONTENT_USER record by its ID for the logged-in user. Requires a valid Bearer token.
 *     tags:
 *       - ContentUser
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_content_user
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the content-user association
 *     responses:
 *       200:
 *         description: Association retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentUser'
 *       400:
 *         description: Invalid content-user ID
 *       404:
 *         description: Entry not found
 *       500:
 *         description: Internal server error
 */
router.get("/contents_user/:IdContentUser", auth, async (req, res) => {
    try{
        const user = req.user
        const id_content_user = parseInt(req.params.IdContentUser, 10)

        // Validate the request parameters
        if (isNaN(id_content_user)) 
        {
            return res.status(400).send({ error: 'Invalid Content ID' })
        }

        // Fetch the specific Content_User row, ensure it belongs to the auth’d user
        const contentUser = await Content_User.findOne({
            where: {
                id_content_user: id_content_user,
                id_user: user.id
            }
        })

        if (!contentUser) 
        {
            return res.status(404).send({ error: 'Entry not found' })
        }

        return res.status(200).json(contentUser)
    }
    catch(e){
        console.log(e)
        return res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /contents_user/{contentId}:
 *   patch:
 *     summary: Update a specific content association’s status for the authenticated user
 *     description: Updates the `status` field of a CONTENT_USER record by content ID for the logged-in user. Requires a valid Bearer token.
 *     tags:
 *       - ContentUser
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the content whose association to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - watched
 *                   - to_watch
 *                 example: watched
 *     responses:
 *       200:
 *         description: Association updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContentUser'
 *       400:
 *         description: Invalid updates or invalid content ID
 *       404:
 *         description: Association not found
 *       500:
 *         description: Internal server error
 */
router.patch("/contents_user/:contentId", auth, async (req, res) => {
    try{
        const user = req.user
        const contentId = parseInt(req.params.contentId, 10)
        
        if (isNaN(contentId)) 
        {
            return res.status(400).send({ error: 'Invalid Content ID' })
        }

        const allowedUpdates = Object.keys(Content_User.getAttributes()).filter(attr => !["id_content_user", "id_user", "id_content"].includes(attr))
        const updates = Object.keys(req.body)

        // Check if the updates are valid
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
        if (!isValidOperation) 
        {
            return res.status(400).send({ error: 'Invalid updates' })
        }

        // Find the join row
        const contentUser = await Content_User.findOne({
            where: { id_user: user.id, id_content: contentId }
        })

        if (!contentUser) 
        {
            return res.status(404).send({ error: 'Association not found' })
        }

        // Apply and save updates
        updates.forEach(field => {
            contentUser[field] = req.body[field]
        })
        
        await contentUser.save()
        res.status(200).json(contentUser)
    }
    catch(e){
        if (e instanceof ValidationError || e instanceof DatabaseError) 
        {
            return res.status(400).send({ error: 'Invalid enum value for status' })
        }
        console.log(e)
        return res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /contents_user/{contentId}:
 *   delete:
 *     summary: Remove a specific content from the authenticated user's list
 *     description: Deletes a CONTENT_USER association by content ID for the logged-in user. Requires a valid Bearer token.
 *     tags:
 *       - ContentUser
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the content to remove from the user's list
 *     responses:
 *       200:
 *         description: Content removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content removed successfully
 *       400:
 *         description: Invalid content ID or missing parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid Content ID
 *       404:
 *         description: Content not found or not associated with the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Content not associated with the user
 *       500:
 *         description: Internal server error
 */
router.delete("/contents_user/:contentId", auth, async (req, res) => {
    try {
        const contentId = req.params.contentId
        const user = req.user

        // Validate the request parameters
        if (!contentId) 
        {
            return res.status(400).send({ error: 'Content ID is required' })
        }

        // Check if the content ID is a valid integer
        const contentIdInt = parseInt(contentId, 10)

        if (isNaN(contentIdInt))
        {
            return res.status(400).send({ error: 'Invalid Content ID' })
        }

        // Check if the content exists
        const content = await Content.findOne({ where: { id: contentId } })

        if (!content) 
        {
            return res.status(404).send({ error: 'Content not found' })
        }

        // Check if the content is associated with the user
        const isAssociated = await user.hasContent(content)
        if (!isAssociated) 
        {
            return res.status(404).send({ error: 'Content not associated with the user' })
        }

        // Remove the entry from the CONTENT_USER table
        await user.removeContent(content)

        return res.status(200).json({ message: 'Content removed successfully' })
    }
    catch (e) {
        console.log(e)
        return res.status(500).send({ error: 'Internal server error' })
    }
})


module.exports = router