const mongoose        = require('mongoose'),
    songSchema      = new mongoose.Schema({
        songId: {
            type: String,
            index: 1
        },
        counter: Number
    }),
    VotesSchema   = new mongoose.Schema({
        countryCode: { // example: Madrid, Spain
            type: String,
            index: 1
        },
        songs: [songSchema],
        capital: String,     // example: Madrid
        votesCounter: Number
    })

module.exports = mongoose.model('votes', VotesSchema)