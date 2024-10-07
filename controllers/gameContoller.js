// importing game schema
const game = require("./../models/gamemodel")
// importing lodash
var _ = require('lodash');
// importing multer and initialising it
const multer = require("multer")
// importing s3Upload to uplaod images
const { s3UploadV2, s3DeleteV2, s3UploadMainPic, s3UploadPictures, s3DeleteManyV2, s3GetAllFiles } = require("../s3Services")

// error handling for multer
exports.multerError = (error, req, res, next) => {
    if(error instanceof multer.MulterError){
        res.status(400).json({
            status: "failed",
            massage: error.code
        })
    }
}

// returns full array of games
exports.getAllGames = async(req, res) => {
    try {
        const data = await game.find(req.query.info)
        console.log(data)
        const images = await s3GetAllFiles()
        data.map((game, index) => {
            let filterImages = images.filter(image => image.name == game._id)
            if (filterImages[0]){
                data[index].mainPic = filterImages[0].url
            }
            data[index].pictures = filterImages.slice(1).map(obj => obj.url);
        })
        res.status(200).json({
            status: "succeed",
            data: {
                data
            }
        })
    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error
        })
    }
}

// returns one game with input id
exports.getGame = async(req, res) => {
    try {
        const data = await game.findById(req.params.id)
        const images = await s3GetAllFiles(data._id)
        data.mainPic = images[0].url
        data.pictures = images.slice(1).map(obj => obj.url);
        res.status(200).json({
            status: "succeed",
            data: {
                data
            }
        })
    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error
        })
    }
}

// create one game
exports.createGame = async(req, res, next) => {
    function stringToJson(text) {
        // Remove outer single quotes if needed
        if (text.startsWith("'") && text.endsWith("'")) {
        text = text.slice(1, -1);
        }
    
        try {
        // Parse the string into a JSON object
        const jsonObj = JSON.parse(text);
        return jsonObj;
        } catch (error) {
        console.error("Error decoding JSON:", error);
        return null;
        }
    }

    req.body.text ? req.body = stringToJson(req.body.text) : req.body = req.body

    try {
        req.body.mainPic = req.files.mainPic[0].originalname
        const filteredPictures = req.files.pictures.map(
            picture => _.pick(picture, ['fieldname', 'originalname', 'size'])
        );
        req.body.pictures = filteredPictures;
        const data = await game.create(req.body).then( async (game) => {
            gameImage = await s3UploadMainPic(req.files.mainPic, game._id)
            gamePictures = await s3UploadPictures(req.files.pictures, game._id)
        })

        res.status(201).json({
            status: "succed",
            data: {
                game: data,
                mainPic: gameImage,
                pictures: gamePictures
            }
        })
    } catch (error) { 
        res.status(500).json({
            status: "failed",
            error: error
        })
    }
}

// update one game
exports.updateGame = async(req, res) => {
    try {
        res.status(200).json({
            status: "succeed",
            data: await game.findByIdAndUpdate(req.params.id, req.body.info)
        })
    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error
        })
    }
}

// delete many games
exports.deleteManyGame = async(req, res) => {
    try {
        data = await game.find({_id: {$in: req.body.id}})
        await game.deleteMany({_id: {$in: req.body.id}})
        gameImage = await data.map(game => {
            return s3DeleteV2(game._id, game.name)
        })
        gamePictures = await data.map(game => {
            return s3DeleteManyV2(game.pictures, game.name)
        })

        res.status(200).json({
            status: "succeed",
            data: {
                data,
                gameImage,
                gamePictures
            }
        })
    } catch (error) {
            res.status(500).json({
            status: "failed",
            error: error
        })
    }
}

// delete one game with id
exports.deleteOneGame = async(req, res) => {
    try {
        const data = await game.findByIdAndDelete(req.params.id)
        gameImage = await s3DeleteV2(data._id, data.mainPic)
        gamePictures = await s3DeleteManyV2(data._id, data.pictures)

        res.status(200).json({
            status: "succeed",
            data: {
                data,
                gameImage,
                gamePictures
            }
        })
    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error
        })
    }
}