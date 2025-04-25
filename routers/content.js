// This file contains the Content routes for the API.
require("dotenv").config()
const express = require('express')
const { Op } = require('sequelize')
const { Content } = require("../models/relations")
const auth = require('../middlewares/auth')
const router = new express.Router()
const upload = require('../middlewares/upload')

router.post("/contents", auth, upload.single("poster"), async (req, res) => {
    const content = Content.build({
        ...req.body,
        poster: req.file.buffer,
        poster_mime: req.file.mimetype,
    })

    try{
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

router.patch("/contents/:id", auth, upload.single("poster"), async (req, res) => {
    try{
        const allowedUpdates =  Object.keys(Content.getAttributes()).filter(attr => !["type", "creation_date"].includes(attr))
        const updates = Object.keys(req.body)

        // Check if the id is valid
        if(!req.params.id)
        {
            return res.status(400).send("Missing id")
        }

        const id = parseInt(req.params.id)
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

        res.set('Content-Type', content.poster_mime)
        res.status(200).send(content.poster)
    }
    catch (e) {
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

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

        res.set('Content-Type', content.poster_mime)
        res.status(200).send(content.poster)
    }
    catch (e) {
        console.error(e)
        res.status(500).send({ e: "Internal server error" })
    }
})

module.exports = router