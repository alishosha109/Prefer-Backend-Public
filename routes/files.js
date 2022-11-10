


const express = require ('express');
const router = express.Router();
const mongoose = require("mongoose");
const User = require('../models/user');
const Post = require('../models/post');
const  util = require('util');
const checkAuth = require('../middleware/check-auth')
const multer = require('multer');
const { json } = require('body-parser');
const upload = require("../middleware/upload");
const dbConfig = require("../config/db");
const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;
const url = dbConfig.url;
const baseUrl = "http://localhost:4000/api/files/";
const mongoClient = new MongoClient(url);
const { GridFsStorage } = require("multer-gridfs-storage");
const { S3Client,PutObjectCommand,GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dotenv = require("dotenv");
const multerS3 = require('multer-s3')

dotenv.config()

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials:{
    accessKeyId : accessKey,
  secretAccessKey : secretAccessKey
  },
  region:bucketRegion,

});

// var storage = new GridFsStorage({
//   url: dbConfig.url,
//   options: { useNewUrlParser: true, useUnifiedTopology: true },
//   file: (req, file) => {
//     // const match = ["image/png", "image/jpeg"];

//     // if (match.indexOf(file.mimetype) === -1) {
//     //   const filename = `${Date.now()}-${file.originalname}`;
//     //   return filename;
//     // }

//     return {
//       bucketName: dbConfig.imgBucket,
//       filename: `${Date.now()}-${file.originalname}`
//     };
//   }
// });

// var storage  = multer.memoryStorage();

// var uploadFiles = multer({ storage: storage }).array("files", 4);
// var uploadFilesMiddleware = util.promisify(uploadFiles);



// router.post("/",uploadFiles,async(req,res,next)=>{
//   console.log("req.files",req.files);
//   req.files.forEach((item)=>{

//   });
//   var params = {
//     Bucket:bucketName,
//     Key:req.files[0].originalname,
//     Body:req.files[0].buffer,
//     ContentType:req.files[0].mimetype,
//   }
//   const command = new PutObjectCommand(params);
//   await s3.send(command);
// });

const uploadFiles = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname)
    }
  })
}).array('files', 4)
var uploadFilesMiddleware = util.promisify(uploadFiles);

router.post('/', async function(req, res, next) {
  imagenames= [];
  try{
    await  uploadFilesMiddleware(req,res);
    console.log(req.files);

   
    req.files.forEach(item=>{
      imagenames.push(item.key);
    });
    return res.status(200).send({
                images_urls: imagenames,
              });
  }catch (error){
    return res.status(500).send({
              message: error,
            });
  }
  
})

// router.post("/", async (req, res, next) => {
//     try {
//         await uploadFilesMiddleware(req, res);
//         console.log(req.files);
//         if (req.files.length <= 0) {
//           return res
//             .status(400)
//             .send({ message: "You must select at least 1 file." });
//         }
//         imageurls=[];
//         req.files.forEach(element=>{
//           imageurls.push( element.filename);
//         })
//         return res.status(200).send({
//           images_urls: imageurls,
//         });
//       ;
//     } catch (error) {
//       console.log(error);
//       if (error.code === "LIMIT_UNEXPECTED_FILE") {
//         return res.status(400).send({
//           message: "Too many files to upload.",
//         });
//       }
//       return res.status(500).send({
//         message: `Error when trying upload many files: ${error}`,
//       });
//       // return res.send({
//       //   message: "Error when trying upload image: ${error}",
//       // });
//     }
//   });

// router.post("/", async (req, res, next) => {
//   try {
//     await uploadFilesMiddleware(req, res);
//     console.log(req.files);

//     if (req.files.length <= 0) {
//       return res
//         .status(400)
//         .send({ message: "You must select at least 1 file." });
//     }

//     return res.status(200).send({
//       message: "Files have been uploaded.",
//     });

//     // console.log(req.file);

//     // if (req.file == undefined) {
//     //   return res.send({
//     //     message: "You must select a file.",
//     //   });
//     // }

//     // return res.send({
//     //   message: "File has been uploaded.",
//     // });
//   } catch (error) {
//     console.log(error);

//     if (error.code === "LIMIT_UNEXPECTED_FILE") {
//       return res.status(400).send({
//         message: "Too many files to upload.",
//       });
//     }
//     return res.status(500).send({
//       message: `Error when trying upload many files: ${error}`,
//     });

//     // return res.send({
//     //   message: "Error when trying upload image: ${error}",
//     // });
//   }
//   });
  
  
  
  
  router.get("/",async(req,res,next)=>{
    try {
      await mongoClient.connect();
  
      const database = mongoClient.db(dbConfig.database);
      const images = database.collection(dbConfig.imgBucket + ".files");
  
      const cursor = images.find({});
  
      if ((await cursor.count()) === 0) {
        return res.status(500).send({
          message: "No files found!",
        });
      }
  
      let fileInfos = [];
      await cursor.forEach((doc) => {
        fileInfos.push({
          name: doc.filename,
          url: baseUrl + doc.filename,
        });
      });
  
      return res.status(200).send(fileInfos);
    } catch (error) {
      return res.status(500).send({
        message: error.message,
      });
    }
  });
  
  // router.get("/:file", async (req, res, next) => {
  //   try {
  //     await mongoClient.connect();
  //     const database = mongoClient.db(dbConfig.database);
  //     const bucket = new GridFSBucket(database, {
  //       bucketName: dbConfig.imgBucket,
  //     });
  //     let downloadStream = bucket.openDownloadStreamByName(req.params.file);
  //     downloadStream.on("data", function (data) {
  //       return res.status(200).write(data);
  //     });
  //     downloadStream.on("error", function (err) {
  //       return res.status(404).send({ message: err });
  //     });
  //     downloadStream.on("end", () => {
  //       return res.end();
  //     });
  //   } catch (error) {
  //     return res.status(500).send({
  //       message: error.message,
  //     });
  //   }
  // });


  module.exports = router;
