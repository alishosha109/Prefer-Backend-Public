const mongoose = require('mongoose')
const Schema = mongoose.Schema


const PostSchema = new Schema({
  user:{type:Schema.Types.ObjectId,ref:"user",required:true},
  description :{type: String,required:true},
  total_answers:{type:Number,required:true},
  photos:[[{type:String,required:true}]],
  hidden:{type:Boolean,required:true,default:false},
  period:{type:Number,required:true,},
  // anonymous:{type:Boolean,required:true,default:true}
}, { timestamps: true } );


const Post = mongoose.model('post', PostSchema);

module.exports = Post;
