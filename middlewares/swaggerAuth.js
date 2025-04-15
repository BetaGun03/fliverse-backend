// This middleware is used to authenticate requests to the Swagger UI
const swaggerAuth = (req, res, next) => {
    const auth = req.headers.authorization

    if (!auth || !auth.startsWith('Basic ')) 
    {
        res.set('WWW-Authenticate', 'Basic realm="Swagger Docs"')
        return res.status(401).send('Authentication required.')
    }

    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':')
    const [user, pass] = credentials

    if (user === process.env.SWAGGER_USER && pass === process.env.SWAGGER_PASS) 
    {
        return next()
    }

    res.set('WWW-Authenticate', 'Basic realm="Swagger Docs"')

    return res.status(401).send('Authentication required.')
}

module.exports = swaggerAuth