// This file contains the Content routes for the API.
require("dotenv").config()
const express = require('express')
const { Op } = require('sequelize')
const { Content } = require("../models/relations")
const { literal } = require('sequelize')
const auth = require('../middlewares/auth')
const router = new express.Router()
const upload = require('../middlewares/upload')
const { getContainerClient } = require('../config/azureStorage')

/**
 * @swagger
 * /contents:
 *   post:
 *     summary: Create a new content with an uploaded poster image
 *     tags:
 *       - Contents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - poster
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum:
 *                   - movie
 *                   - series
 *               poster:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       409:
 *         description: Content title already in use
 *       500:
 *         description: Internal server error
 */
router.post("/contents", auth, upload.single("poster"), async (req, res) => {
    let url
    const content = Content.build({
        ...req.body,
        poster: req.file.buffer,
        poster_mime: req.file.mimetype,
    })

    try{
        const containerClient = await getContainerClient()
        const blobName = `${content.title}-${Date.now()}-${req.file.originalname}`
        const blockBlobClient = containerClient.getBlockBlobClient(blobName)
        await blockBlobClient.uploadData(req.file.buffer)
        url = blockBlobClient.url

        content.poster = url
            
        await content.save()
        res.status(201).send(content)
    }
    catch (e) {
        if(e.name)
        {
            if(e.name === "SequelizeUniqueConstraintError")
            {
                return res.status(409).send("Content title already in use")
            }
            else if(e.name === "SequelizeValidationError")
            {
                return res.status(400).send("Invalid data")
            }
        }
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

/**
 * @swagger
 * /contents/{id}:
 *   patch:
 *     summary: Update an existing content and optionally replace its poster image
 *     tags:
 *       - Contents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the content to update
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               poster:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Missing or invalid id or invalid update fields
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       404:
 *         description: No content found with the given id
 *       409:
 *         description: Content title already in use
 *       500:
 *         description: Internal server error
 */
router.patch("/contents/:id", auth, upload.single("poster"), async (req, res) => {
    try{
        let url
        const allowedUpdates =  Object.keys(Content.getAttributes()).filter(attr => !["type", "creation_date"].includes(attr))
        const updates = Object.keys(req.body)

        // Check if the id is valid
        if(!req.params.id)
        {
            return res.status(400).send("Missing id")
        }

        const id = parseInt(req.params.id, 10)
        if(isNaN(id)) 
        {
            return res.status(400).send("Invalid id")
        }

        const content = await Content.findByPk(id)

        if (!content) 
        {
            return res.status(404).send("No content found")
        }

        // Check if the updates are valid
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation)
        {
            return res.status(400).send("Invalid updates")
        }

        updates.forEach((field) => {
            content[field] = req.body[field]
        })

        if(req.file)
        {
            content.poster = req.file.buffer
            content.poster_mime = req.file.mimetype

            const containerClient = await getContainerClient()
            const blobName = `${content.title}-${Date.now()}-${req.file.originalname}`
            const blockBlobClient = containerClient.getBlockBlobClient(blobName)
            await blockBlobClient.uploadData(req.file.buffer)
            url = blockBlobClient.url

            content.poster = url
        }

        await content.save()
        res.status(200).send(content)
    }
    catch (e) {
        if(e.name)
        {
            if(e.name === "SequelizeUniqueConstraintError")
            {
                return res.status(409).send("Content title already in use")
            }
            else if(e.name === "SequelizeValidationError")
            {
                return res.status(400).send("Invalid data")
            }
        }
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

/**
 * @swagger
 * /contents/searchById:
 *   get:
 *     summary: Retrieve a content by its numeric ID
 *     tags:
 *       - Contents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the content to retrieve
 *     responses:
 *       200:
 *         description: Content found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Missing or invalid id
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       404:
 *         description: No content found with the given id
 *       500:
 *         description: Internal server error
 */
router.get("/contents/searchById", auth, async (req, res) => {
    try{
        if(!req.query.id)
        {
            return res.status(400).send("Missing id")
        }

        const id = parseInt(req.query.id)
        if (isNaN(id)) 
        {
           return res.status(400).send("Invalid id")
        }

        const content = await Content.findByPk(id)

        if (!content) 
        {
            return res.status(404).send("No content found")
        }

        res.status(200).send(content)
    }
    catch (e) {
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

/**
 * @swagger
 * /contents/searchByTitle:
 *   get:
 *     summary: Retrieve contents matching a title substring
 *     tags:
 *       - Contents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         required: true
 *         description: Substring to search in content titles
 *     responses:
 *       200:
 *         description: List of matching contents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Content'
 *       400:
 *         description: Missing or empty title
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       404:
 *         description: No content found
 *       500:
 *         description: Internal server error
 */
router.get("/contents/searchByTitle", auth, async (req, res) => {
    try{
        if(!req.query.title)
        {
            return res.status(400).send("Missing title")
        }

        const title = (req.query.title || '').trim()
        if (!title) 
        {
           return res.status(400).send("Missing or empty title")
        }

        const contents = await Content.findAll({
            where: {
                title: {
                    [Op.like]: `%${title}%`
                }
            }
        })

        if (contents.length === 0) 
        {
            return res.status(404).send("No content found")
        }

        res.status(200).send(contents)
    }
    catch (e) {
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

/**
 * @swagger
 * /contents/posterById:
 *   get:
 *     summary: Retrieve the poster image for a content by its numeric ID
 *     tags:
 *       - Contents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         description: Numeric ID of the content whose poster to retrieve
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Poster image stream
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing or invalid id
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       404:
 *         description: 
 *           - No content found with the given id  
 *           - Poster blob not found
 *       500:
 *         description: Internal server error
 */
router.get("/contents/posterById", auth, async (req, res) => {
    try{
        if(!req.query.id)
        {
            return res.status(400).send("Missing id")
        }

        const id = parseInt(req.query.id)
        if (isNaN(id)) 
        {
           return res.status(400).send("Invalid id")
        }

        const content = await Content.findByPk(id)

        if (!content) 
        {
            return res.status(404).send("No content found")
        }

        const urlObj = new URL(content.poster)
        const encodedName = urlObj.pathname.split("/").pop()
        const blobName = decodeURIComponent(encodedName)

        const containerClient = await getContainerClient()
        const blockBlobClient = containerClient.getBlockBlobClient(blobName)

        if (!await blockBlobClient.exists()) 
        {
            return res.status(404).send("Poster blob not found")
        }

        const downloadResponse = await blockBlobClient.download()
        res.set('Content-Type', content.poster_mime)
        downloadResponse.readableStreamBody.pipe(res)
    }
    catch (e) {
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

/**
 * @swagger
 * /contents/posterByTitle:
 *   get:
 *     summary: Retrieve the poster image for a content by its title substring
 *     tags:
 *       - Contents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         description: Substring to search in content titles
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Poster image stream
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description:
 *           - Missing title
 *           - Empty title
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       404:
 *         description:
 *           - No content found with the given title
 *           - Poster blob not found
 *       500:
 *         description: Internal server error
 */
router.get("/contents/posterByTitle", auth, async (req, res) => {
    try{
        if(!req.query.title)
        {
            return res.status(400).send("Missing title")
        }

        const title = (req.query.title || '').trim()
        if (!title) 
        {
           return res.status(400).send("Missing or empty title")
        }

        const content = await Content.findOne({
            where: {
                title: {
                    [Op.like]: `%${title}%`
                }
            }
        })

        if (!content) 
        {
            return res.status(404).send("No content found")
        }

        const urlObj = new URL(content.poster)
        const encodedName = urlObj.pathname.split("/").pop()
        const blobName = decodeURIComponent(encodedName)

        const containerClient = await getContainerClient()
        const blockBlobClient = containerClient.getBlockBlobClient(blobName)

        if (!await blockBlobClient.exists()) 
        {
            return res.status(404).send("Poster blob not found")
        }

        const downloadResponse = await blockBlobClient.download()
        res.set("Content-Type", content.poster_mime)
        downloadResponse.readableStreamBody.pipe(res)
    }
    catch (e) {
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

/**
 * @swagger
 * /contents/random:
 *   get:
 *     summary: Retrieve one or more random content items
 *     tags:
 *       - Contents
 *     parameters:
 *       - in: query
 *         name: n
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Number of random items to return
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre (array contains)
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Comma‐separated list of keywords (array overlaps)
 *     responses:
 *       200:
 *         description: A list of random content items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Content'
 *       404:
 *         description: No contents found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No contents found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/contents/random", async (req, res) => {
    try {
        const n = parseInt(req.query.n, 10) || 1
        const where = {}
    
        // Filter by genre (array contains)
        if (req.query.genre) 
        {
          where.genre = { [Op.contains]: [req.query.genre] }
        }
    
        // Filter by keywords (array overlaps)
        if (req.query.keywords) 
        {
          const kws = req.query.keywords.split(',').map(k => k.trim())
          where.keywords = { [Op.overlap]: kws }
        }
    
        const randomContents = await Content.findAll({
          where,
          order: literal('RANDOM()'),
          limit: n,
        })
    
        if (randomContents.length === 0) 
        {
          return res.status(404).json({ error: 'No contents found' })
        }
    
        res.status(200).send(randomContents)
      } catch (err) {
        console.error(err)
        res.status(500).send({ error: 'Internal server error' })
      }
})

module.exports = router