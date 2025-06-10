// This file contains the Content routes for the API.
require("dotenv").config()
const express = require('express')
const { Op, fn, col, where: seqWhere } = require('sequelize')
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
 *               - synopsis
 *               - type
 *               - poster
 *               - duration
 *               - genre
 *               - keywords
 *               - poster_mime
 *             properties:
 *               title:
 *                 type: string
 *               synopsis:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum:
 *                   - movie
 *                   - series
 *               poster:
 *                 type: string
 *                 format: binary
 *               poster_mime:
 *                 type: string
 *                 description: MIME type of the poster image (e.g., image/jpeg)
 *               trailer_url:
 *                 type: string
 *                 format: uri
 *                 description: Optional trailer URL
 *               release_date:
 *                 type: string
 *                 format: date
 *                 description: Optional release date
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of genres
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of keywords
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

    // Convert genre and keywords to arrays if they are not already
    const genre = Array.isArray(req.body.genre) ? req.body.genre : req.body.genre ? [req.body.genre] : []
    const keywords = Array.isArray(req.body.keywords) ? req.body.keywords : req.body.keywords ? [req.body.keywords] : []

    const content = Content.build({
        ...req.body,
        genre,
        keywords,
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
 *               synopsis:
 *                 type: string
 *               poster:
 *                 type: string
 *                 format: binary
 *               poster_mime:
 *                 type: string
 *                 description: MIME type of the poster image (e.g., image/jpeg)
 *               trailer_url:
 *                 type: string
 *                 format: uri
 *                 description: Optional trailer URL
 *               release_date:
 *                 type: string
 *                 format: date
 *                 description: Optional release date
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of genres
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of keywords
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
 *     security: []
 *     tags:
 *       - Contents
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
 *       404:
 *         description: No content found with the given id
 *       500:
 *         description: Internal server error
 */
router.get("/contents/searchById", async (req, res) => {
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
 *     summary: Retrieve contents matching a title substring with optional filters and pagination
 *     security: []
 *     tags:
 *       - Contents
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         required: true
 *         description: Substring to search in content titles
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by genre (array contains)
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         required: false
 *         description: Comma-separated list of keywords (array overlaps)
 *       - in: query
 *         name: release_date
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter by exact release date (YYYY-MM-DD)
 *       - in: query
 *         name: release_date_from
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter by release date greater than or equal to this value (YYYY-MM-DD)
 *       - in: query
 *         name: release_date_to
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter by release date less than or equal to this value (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [movie, series]
 *         required: false
 *         description: Filter by content type
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by exact duration (in minutes)
 *       - in: query
 *         name: duration_min
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by minimum duration (in minutes)
 *       - in: query
 *         name: duration_max
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by maximum duration (in minutes)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of matching contents with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of matching contents
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *       400:
 *         description: Missing or empty title
 *       404:
 *         description: No content found
 *       500:
 *         description: Internal server error
 */
router.get("/contents/searchByTitle", async (req, res) => {
    try {
        if (!req.query.title) 
        {
            return res.status(400).send("Missing title")
        }

        const title = (req.query.title || '').trim()
        if (!title) 
        {
            return res.status(400).send("Missing or empty title")
        }

        // Pagination parameters
        const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1
        const limit = parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 10
        const offset = (page - 1) * limit

        // Build dynamic filters
        const where = {
            title: { [Op.iLike]: `%${title}%` }
        }

        // Filter by genre (array contains, case-insensitive)
        if (req.query.genre) 
        {
            const genres = req.query.genre.split(',').map(g => g.trim().toLowerCase())
            where[Op.and] = where[Op.and] || []
            genres.forEach(genre => {
                where[Op.and].push(
                    seqWhere(
                        literal(`LOWER("genre"::text)`),
                        {
                            [Op.like]: `%${genre}%`
                        }
                    )
                )
            })
        }

        // Filter by keywords (array overlaps, case-insensitive)
        if (req.query.keywords) 
        {
            const kws = req.query.keywords.split(',').map(k => k.trim().toLowerCase())
            where[Op.and] = where[Op.and] || []
            kws.forEach(kw => {
                where[Op.and].push(
                    seqWhere(
                        literal(`LOWER("keywords"::text)`),
                        {
                            [Op.like]: `%${kw}%`
                        }
                    )
                )
            })
        }

        // Filter by release_date (exact or range)
        if (req.query.release_date) 
        {
            where.release_date = req.query.release_date
        } 
        else 
        {
            if (req.query.release_date_from && req.query.release_date_to) 
            {
                where.release_date = {
                    [Op.between]: [req.query.release_date_from, req.query.release_date_to]
                }
            } 
            else if (req.query.release_date_from) 
            {
                where.release_date = { [Op.gte]: req.query.release_date_from }
            } 
            else if (req.query.release_date_to) 
            {
                where.release_date = { [Op.lte]: req.query.release_date_to }
            }
        }

        // Filter by type
        if (req.query.type) 
        {
            where.type = req.query.type
        }

        // Filter by duration (exact or range)
        if (req.query.duration) 
        {
            where.duration = req.query.duration
        } 
        else 
        {
            if (req.query.duration_min && req.query.duration_max) 
            {
                where.duration = {
                    [Op.between]: [parseInt(req.query.duration_min), parseInt(req.query.duration_max)]
                }
            } 
            else if (req.query.duration_min) 
            {
                where.duration = { [Op.gte]: parseInt(req.query.duration_min) }
            } 
            else if (req.query.duration_max) 
            {
                where.duration = { [Op.lte]: parseInt(req.query.duration_max) }
            }
        }

        // Paginated and total query
        const { count, rows: contents } = await Content.findAndCountAll({
            where,
            limit,
            offset
        })

        if (contents.length === 0) 
        {
            return res.status(404).send("No content found")
        }

        res.status(200).send({
            total: count,
            page,
            limit,
            results: contents
        })
    } catch (e) {
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

/**
 * @swagger
 * /contents/posterById:
 *   get:
 *     summary: Retrieve the poster image for a content by its numeric ID
 *     security: []
 *     tags:
 *       - Contents
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
 *       404:
 *         description: 
 *           - No content found with the given id  
 *           - Poster blob not found
 *       500:
 *         description: Internal server error
 */
router.get("/contents/posterById", async (req, res) => {
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
 *     security: []
 *     tags:
 *       - Contents
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
 *       404:
 *         description:
 *           - No content found with the given title
 *           - Poster blob not found
 *       500:
 *         description: Internal server error
 */
router.get("/contents/posterByTitle", async (req, res) => {
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
 *     security: []
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

/**
 * @swagger
 * /contents/latest:
 *   get:
 *     summary: Retrieve the most recent content items
 *     security: []
 *     tags:
 *       - Contents
 *     parameters:
 *       - in: query
 *         name: n
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Number of recent items to return
 *     responses:
 *       200:
 *         description: A list of the most recent content items
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
router.get("/contents/latest", async (req, res) => {
    try {
        const n = parseInt(req.query.n, 10) || 1
        const latestContents = await Content.findAll({
            order: [['creation_date', 'DESC']],
            limit: n,
        })

        if (latestContents.length === 0) 
        {
            return res.status(404).json({ error: 'No contents found' })
        }

        res.status(200).send(latestContents)
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: 'Internal server error' })
    }
})

/**
 * @swagger
 * /contents/genres:
 *   get:
 *     summary: Retrieve all unique genres from contents
 *     security: []
 *     tags:
 *       - Contents
 *     responses:
 *       200:
 *         description: List of unique genres
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 genres:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: No genres found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No genres found
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
router.get("/contents/genres", async (req, res) => {
    try {
        const contents = await Content.findAll({
            attributes: ['genre']
        })
        
        // Flatten the genre arrays and filter out empty values
        const allGenres = contents
            .map(content => content.genre || [])
            .flat()
            .filter(Boolean)

        if (allGenres.length === 0) 
        {
            return res.status(404).json({ error: 'No genres found' })
        }

        const uniqueGenres = [...new Set(allGenres)]

        res.status(200).json({ genres: uniqueGenres })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: "Internal server error" })
    }
})

module.exports = router