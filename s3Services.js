// importing nad defining aws s3 service (aws-sdk)
const { S3 } = require('aws-sdk');
// importing dotenv to access .env file
require('dotenv').config()
// importing game schema
const game = require("./models/gamemodel");
const { path } = require('.');
// importing uuid to define name in params
const uuid = require("uuid").v4


// getting all the images from s3 using aws-sdk v2
exports.s3GetAllFiles = async(...name) => {
    const s3 = new S3({
        region: process.env.AWS_REGION
    })
    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: `gameImages/${name}`
    }
    try {
        const data = await s3.listObjectsV2(param).promise();
        const objects = data.Contents;

        // Generate presigned URLs
        const presignedUrls = await Promise.all(
            objects.map(async (obj) => {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: obj.Key,
                Expires: 60
            };
            const url = await s3.getSignedUrlPromise('getObject', params);
            name = obj.Key.split('/')[1]
            return({
                name: obj.Key.split('/')[1],
                url: url,
                folder: obj.Key.split('/')[2]
            })
            })
        );

        return presignedUrls;
    } catch (error) {
        return error
    }
}

// uploading images on s3 with aws-sdk version 2
exports.s3UploadMainPic = async (file, id, name) => {
    const s3 = new S3({
        region: process.env.AWS_REGION
    })
    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `gameImages/${name}/mainPic/${id}`,
        Body: file.buffer,
        ContentType: file.mimetype
    }

    try {
        return await s3.putObject(param).promise()
    } catch (error) {
        await game.findByIdAndDelete(id)
        return error
    }
}

// upload multiple images on s3 with aws-sdk version 2
exports.s3UploadPictures = async(files, name) => {
    const s3 = new S3({
        region: process.env.AWS_REGION
    })

    const params = files.map(file => {
        return {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `gameImages/${name}/pictures/${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype
        }
    })
    try {
        return await Promise.all(
            params.map(param => s3.putObject(param).promise())
        )
    } catch (error) {
        console.log(error)
        return error
    }
}

// delete images on s3 with aws-sdk version 2
exports.s3DeleteV2 = async (id, name) => {
    const s3 = new S3({
        region: process.env.AWS_REGION
    })
    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `gameImages/${name}/mainPic/${id}`
    }
    try {
        return await s3.deleteObject(param).promise().then(res => console.log(res))
    } catch (error) {
        return error
    }
}

// delete multiple images on s3 with aws-sdk versoin 2
exports.s3DeleteManyV2 = async (files, name) => {
    const s3 = new S3({
        region: process.env.AWS_REGION
    })

    const params = files.map(file => {
        return {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `gameImages/${name}/pictures/${file.originalname}`,
        }
    })
    try {
        return await Promise.all(
            params.map(param => s3.deleteObject(param).promise())
        )
    } catch (error) {
        console.log(error)
        return error
    }
}