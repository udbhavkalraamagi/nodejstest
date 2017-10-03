#!/usr/local/bin/node

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const sha1 = require('sha1');

let sess, json_global_obj;
let app = express();

require('fs').readFile('hashes', 'utf8', function (err, data) {

  if (err) {
    console.log("error reading hashes !!");
  }

  json_global_obj = JSON.parse(data);
});

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(session({secret: 'secretsession'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

function getDateTime() {
  
  let date = new Date();
  let hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  let min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  let sec  = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  let day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}


app.get('/', (req,res) => {

  sess = req.session;

  if(sess.email && json_global_obj[sess.email] == sess.encrypted_pass) {
    res.redirect('/admin');
  }

  else{
    res.render('index.html');
  }
});

app.post('/login',function(req,res){
  sess = req.session;
  sess.email = req.body.email;
  sess.encrypted_pass = sha1(req.body.pass);
  res.end('done');
});

app.get('/admin',function(req,res){

  sess = req.session;

  if(sess.email && json_global_obj[sess.email] == sess.encrypted_pass){
    res.write('<h1>Hello ' + sess.email + '</h1>');
    res.end('<a href="/upload_files"> Upload Files </a> \b <a href="/logout">Logout</a>');
  }

  else {
    res.write('<h1>Please login.</h1>');
    res.end('<a href="/">Login</a>');
  }
});

app.post('/upload', function(req, res){
  let form = new formidable.IncomingForm();

  //for multiple files
  form.multiples = true;
  form.uploadDir = path.join(__dirname, '/uploads/'+sess.email);

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

app.get('/logout',function(req,res){
  
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    }

    else {
      res.redirect('/');
    }

  });

});

app.get('/upload_files',function(req,res){

  sess = req.session;

  if(sess.email && json_global_obj[sess.email] == sess.encrypted_pass) {
    res.render('file_upload.html');
  }

  else{
    res.write('     <h1>Please login.</h1>    ');
    res.end('<a href="/">Login</a>');
  }

});

app.listen(3000,function(){
  console.log("App Started on PORT 3000");
});