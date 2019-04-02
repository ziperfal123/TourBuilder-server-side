const mongoose    = require('mongoose'),
    userSchema  = new mongoose.Schema({
        userEmail: {
            type: String,
            index: 1
        },
        countryCode: String // example: Madrid, Spain
    })

module.exports = mongoose.model('user', userSchema)