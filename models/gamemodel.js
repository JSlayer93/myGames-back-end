// importing mongoose
const mongoose = require('mongoose')

// creating game schema
const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "a game must have a name"],
        unique: true
    },
    genre: {
        type: String,
        required: [true, "a game must have a genre"]
    },
    description:{
        type: String,
        required: false
    },
    rating: {
        type: Number,
        required: [true, "rating is requered"]
    },
    mainPic: {
        type: String,
        required: false
    },
    pictures: {
        type: Object,
        required: false
    },
    favCharacter: {
        type: String,
        required: false
    },
    favVillain: {
        type: String,
        required: false
    },
    duration: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        required: false,
        default: Date.now
    },
    playCount: {
        type: Number,
        required: false,
        default: 1
    }
})

// creating(module named games with gameSchema) and exporting module
module.exports = mongoose.model('games', gameSchema)