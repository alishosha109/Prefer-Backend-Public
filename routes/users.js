const express  = require('express');
const router = express.Router();
const User = require('../models/user');
const Post = require('../models/post')

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const checkAuth = require('../middleware/check-auth')

//get list of Users
router.get("/", (req, res, next) => {
  User.find()
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        Users: docs,
      };
      res.status(200).json(response);

    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


//get one User
router.get("/:UserId", (req, res, next) => {
  User.findById(req.params.UserId)
    .exec()
    .then(doc => {
      console.log(doc);
      if (!doc) {
        res.status(404).json({
          message: "User not found"
        });
      }else{
        res.status(200).json({
          User: doc,
          request: {
            type: "GET",
            status :200,
          }
        });
      }

    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});


//sign up
router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password,10,(err,hash)=>{
    if (err){
      return err.status(500).json({
        error:err
      });
    }else{
      const user = new User({
        username: req.body.username,
        password: hash,
        phone_number:req.body.phone_number,
        birthdate:req.body.birthdate,
        gender:req.body.gender,
        fcm:req.body.fcm
      });
      user
        .save()
        .then(result => {
          console.log(result);
          const token = jwt.sign({
            username:result.username,
            userId:result._id,
          },process.env.JWT_KEY,
          {
          expiresIn: "200d",
          })


          const refresh_token = jwt.sign({
          username:result.username,
          userId:result._id,
          },process.env.JWT_KEY,
          {
          expiresIn: "300d",
          })
          res.status(201).json({

            message: "New User added successfully",
            user:{"_id": result._id,
          "username": result.username,
          "phone_number":result.phone_number,
          "reported_blocked_history":  result.reported_blocked_history,
          "blocked": result.blocked,
          "reports": result.reports},
          token:token,
          refresh:refresh_token
          });
        })
        .catch(err => {

          try{
            if (Object.keys(err.keyPattern)[0] == "username"){
              res.status(409).json({
                error: "Username already exists"
              });
            }else if(Object.keys(err.keyPattern)[0] == "phone_number"){
              res.status(409).json({
                error: "Phone number already exists"
              });
            }
          }catch(nothing){
            res.status(500).json({
              error: err.message
            });
          }

        });
    }
  });


});

//login
router.post('/login',(req,res,next)=>{
  User.find({username:req.body.username})
  .exec()
  .then(User=>{
    if(User.length <1){
      res.status(404).json({
          error:"User doesn't exist"
      });
    }else{
      bcrypt.compare(req.body.password,User[0].password,(err,result)=>{
          if(err){
            res.status(404).json({
                error:"Incorrect password"
            });
          }
          if(result){
            const token = jwt.sign({
              username:User[0].username,
              userId:User[0]._id,
            },process.env.JWT_KEY,
          {
            expiresIn: "200d",
          })


          const refresh_token = jwt.sign({
            username:User[0].username,
            userId:User[0]._id,
          },process.env.JWT_KEY,
          {
          expiresIn: "300d",
          })

            delete User[0].password;
            res.status(200).json({
              message:"Auth Succeeded",
              user:{"_id": User[0]._id,
            "username": User[0].username,
            "reported_blocked_history":  User[0].reported_blocked_history,
            "blocked": User[0].blocked,
            "reports": User[0].reports},
              token:token,
              refresh:refresh_token
            });
          }else{
            res.status(409).json({
              error:"Authentication Failed"
            });
          }
      });
    }
  })
  .catch(err=>{
    res.status(500).json({
      error:err
    });
  });
});

//update User //// must handle if someone tried to change password
router.patch("/:UserId",checkAuth, (req, res, next) => {
  const id = req.params.UserId;
  const updateOps = {};
  for (const ops of Object.keys(req.body)) {
    console.log(ops)
    updateOps[ops] = req.body[ops];
  }
  console.log(req.body)
  console.log(updateOps)
  User.updateOne({ _id: id }, { $set: updateOps })
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'User updated',
          request: {
              type: 'GET',
              status :200,
              url: 'http://localhost:4000/api/Users/' + id
          }
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


//delete User
router.delete("/:UserId",checkAuth, (req, res, next) => {
  const id = req.params.UserId;
  User.findById(id)
  .exec()
  .then(doc =>{
      if (doc){

        User.remove({ _id: id })
          .exec()
          .then(result => {
            res.status(200).json({
                message: 'User deleted',
                request: {
                    type: 'POST',
                    status :201,
                    url: 'http://localhost:4000/api/Users',

                }
            });
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          });
      }
      else{
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }

  })

});


// submit choice
router.patch("/chs/:UserId",checkAuth, (req, res, next) => {
  const id = req.params.UserId;
  const updateOps = {};
  let tempmap= new Map();
  for (const ops of Object.keys(req.body)) {
    updateOps[ops] = req.body[ops];
  }
  User.findById(req.params.UserId).exec().then(org_user=>{
    Object.keys(req.body.choices_history).forEach(key => {
      console.log(key);
      console.log(req.body.choices_history[key]);
      if(org_user.choices_history == null){
        tempmap.set(key,req.body.choices_history[key]);
      }else{
        org_user.choices_history.set(key,req.body.choices_history[key]);

      }

    });
    console.log(org_user.choices_history)
    User.updateOne({ _id: id }, { choices_history: org_user.choices_history })
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'User updated',
          request: {
              type: 'GET',
              status :200,
              url: 'http://localhost:4000/api/Users/' + id
          }
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
  })

});



//report user (user who will be blocked)
router.post("/report/:UserId/:postID/:mainUser", checkAuth,(req, res, next) => {
  User.findById(req.params.UserId)
  .exec()
  .then(user=>{
    if(user.reports >= 49){
      User.updateOne({ _id: req.params.UserId }, { blocked:true,reports: user.reports +1  })
      .exec()
      .then(doc => {
        User.findById(req.params.mainUser)
        .exec()
        .then(mainuser=>{
          User.updateOne({ _id: req.params.mainUser }, { reported_blocked_history:mainuser.reported_blocked_history.concat([req.params.postID]) })
          .exec()
          .then(doc=>{
            res.status(201).json({
              message: 'User reported'
            });
          })
        }).catch(err=>{
          res.status(500).json({
            error:err
          })
        })


      }).catch(err => {
        res.status(500).json({
          error: err
        });
      });
    }else{
      User.updateOne({ _id: req.params.UserId }, { reports: user.reports +1 , })
      .exec()
      .then(doc => {
        User.findById(req.params.mainUser)
        .exec()
        .then(mainuser=>{
          User.updateOne({ _id: req.params.mainUser }, { reported_blocked_history:mainuser.reported_blocked_history.concat([req.params.postID]) })
          .exec()
          .then(doc=>{
            res.status(201).json({
              message: 'User reported'
            });
          })
        }).catch(err=>{
          res.status(500).json({
            error:err
          })
        })


      })
      .catch(err => {
        res.status(500).json({
          error: err
        });
      });
    }





});
});


// doesn't want to answer (user who didnt answer)
router.post("/noanswer/:UserId/:postID", (req, res, next) => {
  User.findById(req.params.UserId)
  .exec()
  .then(user=>{
    User.updateOne({ _id: req.params.UserId }, { reported_blocked_history:user.reported_blocked_history.concat([req.params.postID])})
    .exec()
    .then(doc => {
      res.status(201).json({
        message: 'User updated'
    });

    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
  });

});


// generate new token
router.get("/token/:userID", (req, res, next) => {
  User.findById(req.params.userID)
  .exec()
  .then(user=>{
    const token = jwt.sign({
      username:user.username,
      userId:user._id,
    },process.env.JWT_KEY,
  {
    expiresIn: "20d",
  })
    res.status(201).json({
      token:token
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
  });

});


router.get("/profile_numbers/:userId",(req,res,next)=>{

  var c= 0;
  var total_answers = 0;
  var choices_history = 0;
  Post.find({user:req.params.userId}).exec().then(posts=>{
    if(posts.length ==0){
      User.findById(req.params.userId).exec().then(user=>{
        if( typeof user.choices_history === undefined){
          choices_history =0;
        }else{
          choices_history = user.choices_history.size;

        }
        res.status(200).json({
          total_answers:0,
          choices_history:choices_history
        })
      }).catch(err=>{
        res.status(500).json({
          error:err
        })
      })

    }

    posts.forEach((item, i) => {

      total_answers = total_answers + item.total_answers;
      c++;
      if(c==posts.length){
        User.findById(req.params.userId).exec().then(user=>{
          if( typeof user.choices_history === undefined){
            choices_history =0;
          }else{
            choices_history = user.choices_history.size;

          }
          res.status(200).json({
            total_answers:total_answers,
            choices_history:choices_history
          })
        }).catch(err=>{
          res.status(500).json({
            error:err
          })
        })
      }
    });

  }).catch(err=>{
    res.status(500).json({
      err:error
    })
  })
});



module.exports = router
