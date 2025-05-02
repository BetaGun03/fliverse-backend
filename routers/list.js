require("dotenv").config()
const express = require('express')
const { List } = require("../models/relations")
const { Content } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()

/**
 * @swagger
 * /lists:
 *   post:
 *     summary: Create a new list
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Favorite Articles"
 *               description:
 *                 type: string
 *                 example: "A collection of articles I like"
 *               contentId:
 *                 type: integer
 *                 example: 123
 *             required:
 *               - name
 *               - contentId
 *     responses:
 *       201:
 *         description: List created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/List'
 *       401:
 *         description: Unauthorized – authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/lists', auth, async (req, res) => {
    try{
        const list = List.build({
            name: req.body.name,
            description: req.body.description
        })

        const content = await Content.findByPk(req.body.contentId)

        await list.save()
        await list.addContent(content)
        res.status(201).send(list)
    }
    catch (error) {
        console.error(error)
        return res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /lists:
 *   get:
 *     summary: Retrieve all lists for the authenticated user
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/List'
 *       401:
 *         description: Unauthorized – authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/lists', auth, async (req, res) => {
    try {
        const lists = await List.findAll({
            where: { user_id: req.user.id },
            include: [
                {
                    model: Content,
                    as: 'contents',
                    through: { attributes: [] }
                }
            ]
        })

        res.status(200).send(lists)
    } catch (error) {
        console.error(error)
        return res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /lists/{id}:
 *   get:
 *     summary: Retrieve a single list by ID for the authenticated user
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the list to retrieve
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/List'
 *       400:
 *         description: Invalid or missing list ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "List ID is required"
 *       401:
 *         description: Unauthorized – authentication required
 *       404:
 *         description: List not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "List not found"
 *       500:
 *         description: Internal server error
 */
router.get('/lists/:id', auth, async (req, res) => {
    try {
        if (!req.params.id) 
        {
            return res.status(400).send({ error: 'List ID is required' })
        }

        const listId = parseInt(req.params.id, 10)

        if (isNaN(listId)) 
        {
            return res.status(400).send({ error: 'Invalid list ID' })
        }

        const list = await List.findOne({
            where: { id: listId, user_id: req.user.id },
            include: [
                {
                    model: Content,
                    as: 'contents',
                    through: { attributes: [] }
                }
            ]
        })

        if (!list) 
        {
            return res.status(404).send({ error: 'List not found' })
        }

        res.status(200).send(list)
    } catch (error) {
        console.error(error)
        return res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /lists/{id}:
 *   patch:
 *     summary: Update an existing list for the authenticated user
 *     tags:
 *       - Lists
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the list to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Updated List Name"
 *               description:
 *                 type: string
 *                 example: "A new description for the list"
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: List updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/List'
 *       400:
 *         description: Invalid list ID or update fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid updates"
 *       401:
 *         description: Unauthorized – authentication required
 *       404:
 *         description: List not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "List not found"
 *       500:
 *         description: Internal server error
 */
router.patch('/lists/:id', auth, async (req, res) => {
    try{
        if (!req.params.id) 
        {
            return res.status(400).send({ error: 'List ID is required' })
        }

        const listId = parseInt(req.params.id, 10)

        if( isNaN(listId)) 
        {
            return res.status(400).send({ error: 'Invalid list ID' })
        }

        const list = await List.findOne({ 
            where: { id: listId, user_id: req.user.id },
            include: [
                {
                    model: Content,
                    as: 'contents',
                    through: { attributes: [] }
                }
            ]
        })

        if (!list)
        {
            return res.status(404).send({ error: 'List not found' })
        }

        // Get the list fields that can be updated
        // The fields that are not allowed to be updated are: id and creation_date
        const allowedUpdates =  Object.keys(List.getAttributes()).filter(attr => !["id", "creation_date"].includes(attr))

        const updates = Object.keys(req.body)

        // Check if the updates are valid
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation)
        {
            return res.status(400).send("Invalid updates")
        }

        updates.forEach((field) => {
            list[field] = req.body[field]
        })

        await list.save()
        res.status(200).send(list)
    }
    catch (error) {
        console.error(error)
        return res.status(500).send({ error: 'Internal server error' })
    }
})

module.exports = router