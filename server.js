
var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

var app = express();

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

require('./routes/users.js')(app);

app.listen(9191, function(){
	console.log('Server Started at port 9191');
});