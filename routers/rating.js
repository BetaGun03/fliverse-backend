// This file constains the routes for Rating table
require("dotenv").config()
const express = require('express')
const { Rating } = require("../models/relations")
const { Content } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()

/**
 * @swagger
 * /ratings:
 *   post:
 *     summary: Create a new rating for a content item
 *     tags:
 *       - Ratings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content_id
 *               - rating
 *             properties:
 *               content_id:
 *                 type: integer
 *                 description: ID of the content to rate
 *                 example: 42
 *               rating:
 *                 type: number
 *                 format: double
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Rating value between 0 and 10
 *                 example: 8.5
 *     responses:
 *       201:
 *         description: Rating created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Invalid input or user has already rated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid input or user has already rated"
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Content not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/ratings', auth, async (req, res) => {
  try{
    // Check if the request body contains the required fields
    if(req.body.rating === undefined || req.body.content_id === undefined) 
    {
        return res.status(400).send({ error: "Rating and Content ID are required" })
    }

    const rating = parseFloat(req.body.rating)
    const user = req.user
    const content_id = parseInt(req.body.content_id)

    // Validate the rating and content_id
    if (isNaN(rating) || rating < 0 || rating > 10) 
    {
        return res.status(400).send({ error: "Invalid rating value" })
    }
    else if(isNaN(content_id)) 
    {
        return res.status(400).send({ error: "Invalid content ID" })
    }

    // Check if the content exists
    const contentExists = await Content.findByPk(content_id)

    if (!contentExists) 
    {
        return res.status(404).send({ error: "Content not found" })
    }

    const ratingObj = Rating.build({
      rating: rating,
      content_id: content_id,
      user_id: user.id
    })

    // Check if the user has already rated this content
    const existingRating = await Rating.findOne({ where: { user_id: user.id, content_id: content_id } })

    if (existingRating)
    {
        return res.status(400).send({ error: "User has already rated this content" })    
    }

    await ratingObj.save()
    res.status(201).send(ratingObj)
  }
  catch (error) {
    console.error(error)
    return res.status(500).send({ error: "Internal server error" })
  }
})

/**
 * @swagger
 * /ratings:
 *   get:
 *     summary: Retrieve all ratings for the authenticated user
 *     tags:
 *       - Ratings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of ratings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rating'
 *       404:
 *         description: No ratings found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No ratings found for this user"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/ratings', auth, async (req, res) => {
    try {
        const user = req.user
        const ratings = await Rating.findAll({ where: { user_id: user.id } })

        if (ratings.length === 0) 
        {
            return res.status(404).send({ error: "No ratings found for this user" })
        }

        res.status(200).send(ratings)
    }
    catch (error) {
        console.error(error)
        return res.status(500).send({ error: "Internal server error" })
    }
})

/**
 * @swagger
 * /ratings/{contentId}:
 *   get:
 *     summary: Retrieve the rating for a specific content item by the authenticated user
 *     tags:
 *       - Ratings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the content to retrieve the rating for
 *     responses:
 *       200:
 *         description: Rating retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Invalid content ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid content ID"
 *       404:
 *         description: Rating not found for this user and content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Rating not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/ratings/:contentId', auth, async (req, res) => {
    try{
        const user = req.user
        const contentId = parseInt(req.params.contentId)

        // Validate the contentId
        if(isNaN(contentId)) 
        {
            return res.status(400).send({ error: "Invalid content ID" })
        }

        // Check if the user has rated this content
        const existingRating = await Rating.findOne({ where: { user_id: user.id, content_id: contentId } })

        if (!existingRating)
        {
            return res.status(404).send({ error: "User has not rated this content" })
        }

        res.status(200).send(existingRating)
    }
    catch (error) {
        console.error(error)
        return res.status(500).send({ error: "Internal server error" })
    }
})

/**
 * @swagger
 * /ratings/{contentId}:
 *   patch:
 *     summary: Update a rating for a specific content item
 *     tags:
 *       - Ratings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the content whose rating to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 format: double
 *                 minimum: 0
 *                 maximum: 10
 *                 description: New rating value between 0 and 10
 *                 example: 7.2
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Invalid input or update field
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid updates"
 *       404:
 *         description: Rating not found for this user and content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User has not rated this content"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.patch('/ratings/:contentId', auth, async (req, res) => {
    try{
        const allowedUpdates =  Object.keys(Rating.getAttributes()).filter(attr => !["id", "rating_date", "content_id", "user_id"].includes(attr))
        const updates = Object.keys(req.body)
        const user = req.user
        const contentId = parseInt(req.params.contentId)
        const rating = parseFloat(req.body.rating)

        // Check if the updates are valid
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

        if (!isValidOperation)
        {
            return res.status(400).send("Invalid updates")
        }

        // Validate the contentId
        if(isNaN(contentId)) 
        {
            return res.status(400).send({ error: "Invalid content ID" })
        }

        if(isNaN(rating) || rating < 0 || rating > 10)
        {
            return res.status(400).send({ error: "Invalid rating value" })
        }

        // Check if the user has rated this content
        const existingRating = await Rating.findOne({ where: { user_id: user.id, content_id: contentId } })

        if (!existingRating)
        {
            return res.status(404).send({ error: "User has not rated this content" })
        }

        updates.forEach((field) => {
            existingRating[field] = req.body[field]
        })
        
        await existingRating.save()
        res.status(200).send(existingRating)
    }
    catch (error) {
        console.error(error)
        return res.status(500).send({ error: "Internal server error" })
    }
})

/**
 * @swagger
 * /ratings/{contentId}:
 *   delete:
 *     summary: Delete a rating for a specific content item
 *     tags:
 *       - Ratings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the content whose rating to delete
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Rating deleted successfully"
 *       400:
 *         description: Invalid content ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid content ID"
 *       404:
 *         description: Rating not found for this user and content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User has not rated this content"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.delete('/ratings/:contentId', auth, async (req, res) => {
    try{
        const user = req.user
        const contentId = parseInt(req.params.contentId)

        // Validate the contentId
        if(isNaN(contentId)) 
        {
            return res.status(400).send({ error: "Invalid content ID" })
        }

        // Check if the user has rated this content
        const existingRating = await Rating.findOne({ where: { user_id: user.id, content_id: contentId } })

        if (!existingRating)
        {
            return res.status(404).send({ error: "User has not rated this content" })
        }

        await existingRating.destroy()
        res.status(200).send({ message: "Rating deleted successfully" })
    }
    catch (error) {
        console.error(error)
        return res.status(500).send({ error: "Internal server error" })
    }
})

module.exports = router