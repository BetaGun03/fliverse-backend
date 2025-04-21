// This file is used to send emails using nodemailer and Zoho SMTP server
// It uses environment variables to store sensitive information like email and password
const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: {
        user: process.env.ZOHO_USER,
        pass: process.env.ZOHO_PASS
    }
})

module.exports = transporter