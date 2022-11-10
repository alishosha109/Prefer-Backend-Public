
const express  = require('express');
const router = express.Router();
const User = require('../models/user');
const Post = require('../models/post')
const Admin = require('../config/notifications');
const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const checkAuth = require('../middleware/check-auth')

const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };
router.post('/notification', (req, res)=>{
    const  registrationToken = req.body.registrationToken
    // const message = req.body.message
    const options =  notification_options

    const message_notification = {
     notification: {
        title: req.body.title,
        body: req.body.message,
            }
     };

      Admin.messaging().sendToDevice(registrationToken, message_notification, options)
      .then( response => {

       res.status(200).send("Notification sent successfully")

      })
      .catch( error => {
          console.log(error);
      });

})






module.exports = router
