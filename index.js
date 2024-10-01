// importing express and creating app
const express = require('express')
const app = express()
// importing cors(to create header for front-end)
var cors = require('cors')

// initialising body parser
const bodyParser = require('body-parser');
app.use(bodyParser.json({limit: "50mb"})); // for JSON bodies
app.use(bodyParser.urlencoded({limit: "50mb", extended: true })); // for form encoded bodies
app.use(cors({
    origin: "http://localhost:3000"
}))


// definig port
require('dotenv').config()
const port = process.env.PORT

// definig router
const router = require('./routes/gameRouter')

app.get("/gru", (req, res) => {
})
app.use('/games', router)

// starting application
app.listen(port, (err) => {
    console.log(`app listening on port ${port}`)
})

module.exports = app