// This file contains the rate limiting middleware for the Express application. 
// Used to limit the number of requests to the API docs to prevent abuse and ensure fair usage.
// The middleware is applied to the Swagger UI route and the JSON route for the API documentation.
const rateLimit = require('express-rate-limit')

const limit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

module.exports = limit