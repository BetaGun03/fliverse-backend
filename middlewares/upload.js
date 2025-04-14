// This file contains the Multer configuration for handling file uploads in the application. It uses memory storage to store files in memory as Buffer objects, and 
// it includes a filter to only accept image files. It includes a limit on the file size.
const multer = require('multer')

// Multer configuration for file uploads. It uses memory storage, which means that the files will be stored in memory as Buffer objects
const storage = multer.memoryStorage()

// Multer filter to only accept images
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

    if(allowedTypes.includes(file.mimetype)) 
    {
        // Accept the file
        cb(null, true) 
    }
    else
    {
        // Reject the file
        cb(new Error('File format not allowed'), false) 
    }
}

// Multer limit to the file size
const upload = multer({
    storage,
    imageFilter,
    limits:{
        fileSize: 5 * 1024 * 1024
    }
})

module.exports = upload