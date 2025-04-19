const jwt = require('jsonwebtoken')
const { User } = require('../models/relations')

const auth = async (req, res, next) => {
    let token

    try {
        const authHeader = req.header('Authorization')
        
        // Check if the Authorization header is present
        if (!authHeader) 
        {
            return res.status(401).json({ message: 'Authorization header missing' })
        }

        // Check if the Authorization header is in the correct format
        // Format: Bearer <token>
        const parts = authHeader.trim().split(' ')
        if (parts.length !== 2 || parts[0] !== 'Bearer') 
        {
            return res.status(401).json({ message: 'Invalid authorization format' })
        }
        token = parts[1]
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ where: { id: decoded.id } })

        if (!user) 
        {
            return res.status(404).json({ message: 'User not found' })
        }

        // Check if the token is still valid, even if the token is deleted from the database
        const tokenStillValid = user.tokens && user.tokens.includes(token)
        if (!tokenStillValid) 
        {
            return res.status(401).json({ message: 'Session terminated. Please log in again.' })
        }

        req.user = user
        req.token = token
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') 
        {
            try{
                const expiredToken = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true })
                if (expiredToken && expiredToken.id) 
                {
                    const userToExpire = await User.findByPk(expiredToken.id)

                    if (userToExpire && userToExpire.tokens) 
                    {
                        userToExpire.tokens = userToExpire.tokens.filter(t => t !== token)
                        await userToExpire.save()
                        console.log(`Cleaned expired token for user ${expiredToken.id}`)
                    }
                }
            }
            catch(e){
                console.error(e)
            }

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