// importing mongoose
const mongoose = require('mongoose')
// defining mongodb url
require('dotenv').config()
const db = process.env.MONGODB.replace("<password>", process.env.PASSWORD)
// importing game module
const game = require('./models/gamemodel')
const app = require('.')

// connection mongoDB
mongoose.connect(db).then(() => console.log("connected to mongoDB"))