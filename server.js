

const throng = require('throng');
const WORKERS = process.env.WEB_CONCURRENCY || 1;
throng({
  workers: WORKERS,
  lifetime: Infinity
}, start);


function start() {

  var express = require('express');
  var bodyParser = require('body-parser');
  var expressValidator = require('express-validator');
  var multer  = require('multer')

  var app = express();


  //Multer Middleware
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now().toString() + file.originalname)
    }
  });

  const upload = multer({storage: storage,
    limits: { fileSize: 2000000 },
    fileFilter: function(req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
          return cb(new Error('Only image files are allowed!'));
      }
      cb(null, true);
      }
  }).single('profile');

  //Body Parser Middleware
  app.use(bodyParser.json());

  //Express Validator Middleware
  app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;

      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    }
  }));

  require('./routes/users.js')(app,upload);

  app.listen(process.env.PORT || 5000, function(){
    console.log('Server Started at port 5000');
  });
  
}
