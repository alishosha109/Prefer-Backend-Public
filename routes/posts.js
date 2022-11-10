

const express = require ('express');
const router = express.Router();
const mongoose = require("mongoose");
const User = require('../models/user');
const Post = require('../models/post');
const checkAuth = require('../middleware/check-auth')
const multer = require('multer');
const { json } = require('body-parser');



router.get("/",(req,res,next) =>{
  var item_per_page = req.query.itemperpage;
  var current_page_no = req.query.page;
  Post.find({hidden:false}).populate('user')
  .skip((item_per_page * current_page_no)-item_per_page)
  .limit(item_per_page)
  .exec().then(docs=>{
    res.status(200).json({
      count:docs.length,
      posts:docs
    })
  }).catch(err=>{
    res.status(500).json({
      error:err
    })
  })
});


//get all Posts
router.get("/:userID/:hidden/:itemperpage/:page", checkAuth,(req, res, next) => {
  var item_per_page = req.params.itemperpage;
  var current_page_no = req.params.page;
  console.log(item_per_page);
  console.log(current_page_no);
  User.findById(req.params.userID)
      .exec()
      .then(result=>{
        Post.find({hidden:req.params.hidden})
        .populate('user')

        .exec()
        .then(docs => {
          console.log("hena el doc length");
          console.log(docs.length);
          var filtered = docs.filter(function(value,index,arr){

            if(typeof(result.choices_history) != 'undefined'){

              if (!result.reported_blocked_history.includes(value.id) && !result.choices_history.has(value.id)
               && JSON.stringify(result._id) != JSON.stringify(value.user._id) ){
                return value;
              }
            }else{
              if (!result.reported_blocked_history.includes(value.id) && JSON.stringify(result._id) != JSON.stringify(value.user._id) ){
                return value;
              }
            }

      });
      console.log(typeof filtered);
      var start =(item_per_page * current_page_no)-item_per_page;
      var end = item_per_page * current_page_no;
      filtered = filtered.slice(start,end);
      console.log("hena el filtered length");
      console.log(filtered.length);
      res.status(200).json({
        count: filtered.length,
        posts: filtered.map(doc => {
          return {
            _id: doc._id,
            user:doc.user,
            description: doc.description,
            total_answers: doc.total_answers,
            photos: doc.photos,
            no_of_correct: doc.no_of_correct,
            period:doc.period
          };
        })
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
      }).catch(err => {
        res.status(500).json({
          error: err
        });
      });

});




//get one Post
router.get("/:postId",checkAuth, (req, res, next) => {
  Post.findById(req.params.postId)
    .populate('user',{'_id':1,'username':2,'phone_number':3,'blocked':4,'reports':5})
    .exec()
    .then(post => {
      if (!post) {
        res.status(404).json({
          message: "No Valid ID for this entry"
        });
      }else{
        res.status(200).json({
          post: post,

        });
      }

    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

//test upload multi files
// router.post("/uploadimages",upload.array('photos'),(req, res, next) => {
//   var result = [];
//   req.files.forEach(element=>{
//     result.push(element.path);
//   })
//   res.status(201).json({
//     message:result,
//   });
// });








// add a new Post to the db
router.post("/", checkAuth,(req, res, next) => {
      const post = new Post({
        user: req.body.user,
        description: req.body.description,
        total_answers: req.body.total_answers,
        photos: req.body.photos,
        hidden:req.body.hidden,
        period:req.body.period,

      });
      post.save()
      //console.log(rev.answers);
    .then(result => {
      //console.log(req.body.exam);
      res.status(201).json({
        message: "post stored",
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
  }); //then



// update Post in the db
router.patch("/:postId",checkAuth, (req, res, next) => {
  const id = req.params.postId;
  const updateOps = {};
  for (const ops of Object.keys(req.body)) {
    updateOps[ops] = req.body[ops];
  }
  Post.updateOne({ _id: id }, { $set: updateOps })
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'Post updated',
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

// delete a Post from db
router.delete("/:postId",checkAuth, (req, res, next) => {
  const id = req.params.postId;
  Post.remove({ _id: id })
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'Post deleted',
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


// get percentages of a post
router.get("/get_percentages/:postId",checkAuth, (req, res, next) => {
  var total = 0;
  var result = {}
  Post.findById(req.params.postId)
    .populate('user')
    .exec()
    .then(post => {

      if (!post) {
        res.status(404).json({
          message: "No Valid ID for this entry"
        });
      }else{


        for (let i = 0; i < post.photos.length; i++) {
          if(post.total_answers ==0){

            //console.log(parseInt(post.photos[i][1]));
            post.photos[i][1] = "0";

          }else{
            post.photos[i][1] = Math.round((parseInt(post.photos[i][1])/post.total_answers)*100)
          }
        }
        res.status(200).json({
          percentages: post.photos,
        });
      }

    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});


// get all posts for user id with its percentages
router.get("/history/:userID",checkAuth, (req, res, next) => {
  var item_per_page = req.query.itemperpage;
  var current_page_no = req.query.page;
  console.log(item_per_page);
  console.log(current_page_no);
  var id = mongoose.Types.ObjectId(req.params.userID);
  console.log(req.params.userID);
    Post.find({user:id})
    .sort({"createdAt":-1})
    .populate('user')
    .skip((item_per_page * current_page_no)-item_per_page)
    .limit(item_per_page)
    .exec()
    .then(posts => {

    for (let i = 0; i < posts.length; i++) {
      for (let j = 0; j < posts[i].photos.length; j++) {
        if(posts[i].total_answers ==0){

          //console.log(parseInt(post.photos[i][1]));
          posts[i].photos[j][1] = "0";

        }else{
          posts[i].photos[j][1] = Math.round((parseInt(posts[i].photos[j][1])/posts[i].total_answers)*100)
        }
      }
    }

      res.status(200).json({
        count:posts.length,
        posts:posts,
      });

    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});


//increment choice
router.post("/:postId/:choice",checkAuth, (req, res, next) => {
  const id = req.params.postId;
  const updateOps = {};
  for (const ops of Object.keys(req.body)) {
    updateOps[ops] = req.body[ops];
  }
  Post.findById(req.params.postId)
  .exec()
  .then(result=>{
    result.photos[req.params.choice][1]++;
    result.total_answers = result.total_answers +1;
      Post.updateOne({ _id: id }, {total_answers:result.total_answers, photos: result.photos })
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'Post updated',
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
  }).catch(err=>{
    res.status(404).json({
      error:"Not Found"
    });
  });
});


// get history choices_history
router.get("/choices_history/:userId", (req,res,next)=>{
  var to_send = [];
  var item_per_page = req.query.itemperpage;
  var current_page_no = req.query.page;
  var start =(item_per_page * current_page_no)-item_per_page;
  var end = item_per_page * current_page_no;
  var c= 0;
    User.findById(req.params.userId).exec().then(user=>{
      console.log(user.choices_history);
     if(user.choices_history.size===0){
       return res.status(200).json({
         count:0,
         posts:[]
       });
     }else{
       ch_history = user.choices_history;
     }
      ch_history.forEach((value, key) => {
   Post.findById(key).populate('user').exec().then(post=>{
       for (let j = 0; j < post.photos.length; j++) {
         if(post.total_answers ==0){

           //console.log(parseInt(post.photos[i][1]));
           post.photos[j][1] = "0";

         }else{
           post.photos[j][1] = Math.round((parseInt(post.photos[j][1])/post.total_answers)*100)
         }
       }

     var dict = {
       "post":post,
       "choice":value
     }
     to_send.unshift(dict);
     c++;

     if(c == ch_history.size) {
                 res.status(200).json({
                   count:to_send.slice(start,end).length,
                  posts:to_send.slice(start,end)
                });
            }
   })
 });



   }).catch(err=>{
     res.status(500).json({
       error:err
     });
   });

console.log(to_send);
});




// get posts for guest

module.exports = router;
