#!/usr/local/bin/node

var http = require('http');
var auth = require('http-auth');

// Authentication
var basic = auth.basic({
  realm: "User Account",
  file: __dirname + "/htpasswd"
});

// Welcome
http.createServer(basic, (req, res) => {
  res.end(`Welcome - ${req.user}!`);
})
.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});

