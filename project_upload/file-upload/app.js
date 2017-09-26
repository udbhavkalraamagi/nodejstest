
var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

//adding views directory
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', function(req, res){

  var form = new formidable.IncomingForm();

  //for multiple files
  form.multiples = true;
  form.uploadDir = path.join(__dirname, '/uploads');

  //if don't used, it will create a temporary file
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  form.on('error', function(error) {
    console.log('An error has occured: \n' + error);
  });

  // all files uploaded
  form.on('end', function() {
    res.end('success');
  });

  form.parse(req);
  
});

var server = app.listen(3000, function(){
  console.log('Server listening on localhost:3000');
});
