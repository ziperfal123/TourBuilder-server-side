const mongoose    = require('mongoose'),
    songSchema  = new mongoose.Schema({
        songId: {
            type: String,
            index: 1
        }
    }),
    showSchema  = new mongoose.Schema({
        showId: {
            type: Number,
            index: 1
        },
        countryCode: String, // example: Madrid, Spain
        date: String,
        songs: [songSchema]
    })

module.exports = mongoose.model('show', showSchema)