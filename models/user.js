const mongoose = require('mongoose')
const Schema = mongoose.Schema
const {ObjectId} = mongoose.Schema;



const UserSchema = new Schema({
  username:{ type: String,required: true, index: { unique: true }, minlength: 8,},
  password:{ type: String,required: true,},
  phone_number:{type:String,required:true,unique:true,},
  birthdate:{type:String,required:true},
  gender:{type:String,required:true},
  location:[{type: Map,of: String,default:{}}],
  choices_history:{type: Map,of: Number,default:{}},
  reported_blocked_history:[{type:String}],
  blocked:{type:Boolean, default:false},
  reports:{type:Number,default:0},
  fcm:{type:String,default:""}
}, { timestamps: true } );


const User = mongoose.model('user', UserSchema);

module.exports = User;
