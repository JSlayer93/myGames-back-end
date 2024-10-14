// importing game schema
const game = require("./../models/gamemodel")
// importing lodash
var _ = require('lodash');
// importing multer and initialising it
const multer = require("multer")
// importing s3Upload to uplaod images
const { s3UploadV2, s3DeleteV2, s3UploadMainPic, s3UploadPictures, s3DeleteManyV2, s3GetAllFiles, s3UploadVideos, s3DeleteManyVidsV2, s3DeleteManyPicsV2 } = require("../s3Services")

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
        const data = await game.find(req.query.info).collation({ locale: 'en', strength: 2 }).exec();
        const files = await s3GetAllFiles()
        data.map((game, index) => {
            let pictures = []
            let videos = []
            let filterFiles = files.filter(image => image.name == game._id)
            if (filterFiles[0]){
                data[index].mainPic = filterFiles[0].url
            }
            filterFiles.map((file, i) => {
                if(file.folder == 'pictures'){
                    pictures.push(file.url)
                }else if(file.folder == 'videos'){
                    videos.push(file.url)
                }
            })
            data[index].pictures = pictures
            data[index].videos = videos
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
        const files = await s3GetAllFiles(data._id)
        data.mainPic = files[0].url
        var pictures = []
        var videos = []
        files.map((file, index) => {
            if(file.folder == 'videos'){
                videos.push(file.url)
            }else if(file.folder == 'pictures'){
                pictures.push(file.url)
            }
        })
        data.pictures = pictures
        data.videos = videos
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

        var filteredPictures
        var filteredVideos
        
        if(req.files.pictures){
            filteredPictures = req.files.pictures.map(
                picture => _.pick(picture, ['fieldname', 'originalname', 'size'])
            );
        }

        if(req.files.videos){
            filteredVideos = req.files.videos.map(
                video => _.pick(video, ['fieldname', 'originalname', 'size'])
            );
        }else{
            filteredVideos = undefined
        }
        req.body.pictures = filteredPictures;
        req.body.videos = filteredVideos;

        const data = await game.create(req.body).then( async (game) => {
            gameImage = await s3UploadMainPic(req.files.mainPic, game._id)
            req.files.pictures ? gamePictures = await s3UploadPictures(req.files.pictures, game._id) : gamePictures = []
            req.files.videos ? gameVideos = await s3UploadVideos(req.files.videos, game._id) : gameVideos = []
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
        const data = await game.findByIdAndDelete(req.params.id).then( async (game) => {
            gameImage = await s3DeleteV2(game._id, game.mainPic)
            if(game.pictures != []){
                gamePictures = await s3DeleteManyPicsV2(game._id, game.pictures)
            }
            if(game.videos != []){
                gameVideos = await s3DeleteManyVidsV2(game._id, game.videos)
            }
        })

        res.status(200).json({
            status: "succeed",
            data: {
                data,
                gameImage,
                gamePictures,
                gameVideos
            }
        })
    } catch (error) {
        res.status(500).json({
            status: "failed",
            error: error
        })
    }
}