// defining router
const router = require("express").Router()
// importing uuid
const uuid = require("uuid").v4
// importing multer
const multer = require("multer")
// initialising memorystorage for multer
const storage = multer.memoryStorage()
// filtering uploaded files
const fileFilter = (req, file, cb) => {
    if(file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/webp"){
        cb(null, true)
    }else{cb(null, false)}
}
// initialising multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
})
// initialising multiple fields
const multiUpload = upload.fields(
    [
        {name: "mainPic", maxCount: 1},
        {name: "pictures", maxCount: 5}
    ]
)

// importing funcions from gameController
const gameCont = require("../controllers/gameContoller")

// defining routes
router.route('/').get(gameCont.getAllGames).post(multiUpload ,gameCont.multerError, gameCont.createGame).delete(gameCont.deleteManyGame)
router.route('/:id').get(gameCont.getGame).put(multiUpload, gameCont.multerError, gameCont.updateGame).delete(gameCont.deleteOneGame)

// exporting router
module.exports = router