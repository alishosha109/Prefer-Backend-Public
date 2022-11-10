const cron = require('node-cron');
const Post = require('../models/post');



const check_period = cron.schedule('* * * * *', () => {
      Post.find({hidden:false})
        .exec()
        .then(docs => {
          docs.forEach(post => {
            if( Math.round((Date.now() - post.createdAt.getTime())/60000) > post.period){
              Post.updateOne({ _id: post._id }, { hidden: true })
              .exec().then(result=>{
                //console.log("post updated")
              })
            }
            // console.log(Math.round((Date.now() - post.createdAt.getTime())/60000));
          })
        })
        .catch(err => {
          console.log(err)
        });
    
  });


module.exports = check_period;
