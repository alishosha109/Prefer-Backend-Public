const express = require('express');
const http = require('http');
const period_check = require('./cron_jobs/period_cron_job.js')
const UserRoutes = require('./routes/users')
const PostRoutes = require('./routes/posts')
const FileRoutes = require('./routes/files')
const NotificationRoutes = require('./routes/notifications')

const port = process.env.port || 4000;
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan')
const app = express();

// connect to mongoose

// mongoose.connect('mongodb://localhost/help_me');
mongoose.connect('mongodb+srv://username:password@prefer.ublkcpk.mongodb.net/?retryWrites=true&w=majority');

mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(morgan('dev'));
app.use(express.static('uploads'))
app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin',"*");
  res.header('Access-Control-Allow-Headers',"*");
  if(req.method === 'OPTIONS'){
    res.header('Access-Control-Allow-Headers','PUT,POST,PATCH,DELETE,GET');
    return res.status(200).json({});
  }
  next();
});

//initialize routes
app.use('/api/users',UserRoutes);
app.use('/api/posts',PostRoutes);
app.use('/api/files',FileRoutes);
app.use('/api/firebase',NotificationRoutes);

app.use((req,res,next)=>{
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
  });
  
  
  app.use((error,req,res,next)=>{
    res.status(error.status||500);
    res.json({
      error:{
        message:error.message
      }
    });
  });
  

app.get('/', (req, res) => {
    res.send("Updated");
});

const server = http.createServer(app);
server.listen(port);