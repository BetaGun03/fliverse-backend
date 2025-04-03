const jwt = require('jsonwebtoken')
const { User } = require('../models/relations')

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization')
        
        // Check if the Authorization header is present
        if (!authHeader) 
        {
            return res.status(401).json({ message: 'Authorization header missing' })
        }
        
        const token = authHeader.replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ where: { id: decoded.id } })

        if (!user) 
        {
            return res.status(404).json({ message: 'User not found' })
        }

        req.user = user
        req.token = token
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') 
        {
            return res.status(401).json({ message: 'Token expired' })
        }

        if (error.name === 'JsonWebTokenError') 
        {
            return res.status(401).json({ message: 'Invalid token' })
        }

        console.error(error)
        return res.status(401).json({ message: 'Unauthorized' })
    }
}

module.exports = auth