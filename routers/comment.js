// This file constains the routes for Comment table
require("dotenv").config()
const express = require('express')
const { Comment } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request – text is required
 *       401:
 *         description: Unauthorized – authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/comments', auth, async (req, res) => {
    try{
        const text = req.body.text

        const comment = Content.build({
            text: text
        })

        await comment.save()
        res.status(201).send(comment)
    }
    catch (error) {
        console.error(error)
        res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Retrieve a comment by its ID
 *     tags:
 *       - Comments
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the comment to retrieve
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized – authentication required
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.get('/comments/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10)

        if (!id)
        {
            return res.status(400).send({ error: 'Comment ID is required' })
        }
        else if (isNaN(id))
        {
            return res.status(400).send({ error: 'Comment ID must be a number' })
        }

        const comment = await Comment.findByPk(id)

        if (!comment) 
        {
            return res.status(404).send({ error: 'Comment not found' })
        }

        res.status(200).send(comment)
    } catch (error) {
        console.error(error)
        res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /comments/content/{contentId}:
 *   get:
 *     summary: Retrieve comments by content ID
 *     tags:
 *       - Comments
 *     security: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the content to retrieve comments for
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request – content ID is required and must be a number
 *       404:
 *         description: No comments found for that content
 *       500:
 *         description: Internal server error
 */
router.get("/comments/content/:contentId", async (req, res) => {
    try {
        const contentId = parseInt(req.params.contentId, 10)

        if (!contentId) 
        {
            return res.status(400).send({ error: 'Content ID is required' })
        }
        else if(isNaN(contentId)) 
        {
            return res.status(400).send({ error: 'Content ID must be a number' })
        }

        const comments = await Comment.findAll({
            where: { content_id: contentId },
            order: [['comment_date', 'DESC']]
        })

        if (comments.length === 0) 
        {
            return res.status(404).send({ error: 'No comments for that content' })
        }

        res.status(200).send(comments)
    } catch (error) {
        console.error(error)
        res.status(500).send({ error: 'Internal server error' })
    }
})

module.exports = router