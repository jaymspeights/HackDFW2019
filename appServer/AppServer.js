var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request')
var app = express();
const port = 8000;

// bodyParser = {
//   json: {limit: '50mb', extended: true},
//   urlencoded: {limit: '50mb', extended: true}
// };


app.use(bodyParser.json({
  limit: '50mb',
  type: 'application/json',
  extended: true
}))
app.use(bodyParser.urlencoded({
  parameterLimit: 100000,
  limit: '50mb',
  extended: true
}))

// app.use(bodyParser.json );       // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
//   extended: false
// })); 

const dataSourceServerIp = 'http://localhost:3000';

function sendMessage(path, messageData,cb){
  let data;
  
  request.post({
    url: dataSourceServerIp+path,
    json: true,
    body: messageData.body}
    , function(error, res, body) {
    if (!error) {
      data = res.body;
      cb(data);
    } else {
        console.log(error);
    }
  }
  ); 
}



function userAuth(messageData,tag, cb){
  let data;
  console.log(messageData)
  request.post({
    url: dataSourceServerIp+'/'+tag+'/',
    json: true,
    body: messageData}
    , function(error, res, body) {
      data = res.body;
      cb(data);
  }
  );
  
}

app.post('/createUser',function(req,response){
  let message = req.body;
  userAuth(message,"createUser",(res)=>{
    if (res.error)
      response.send(400)
  else
      response.send(200);
  })
})

//LOGIN
app.post('/*', function (req, res, next) {
  var head = req.headers;
  if (!head.username || !head.password) {
    res.send(400)
    return
  } else {
    sendMessage('/auth',{body:{username:head.username, password:head.password}}, (ret) => {
      if (ret.error) {
        res.send(400)
        return
      }
      req.username = ret.username
      next()
    })
  }
});

app.post('/login', function(req,res){
  if (req.username)
    res.send(200)
  else
    res.send(400)
})

app.post('/postMessage', function(req,res){
  console.log(req.body.img.length);
  req.body.username = req.username;
  sendMessage('/newPost/',req, (resp) => {
    res.send(resp);
  });
})

app.get('/getMessages', function (req, response) {
  request.get({
    url: dataSourceServerIp+req.originalUrl
    }
    , function(error, res, body) {
    if(error) {
        console.log(error);
    }
    response.send(res);
  }
  );
})

app.get('/getMyMessages', function(req,response){
  sendMessage('/userMessages', {body:{username:req.query.username}}, (resp) => {
    response.send(resp);
  })
})

app.post('/postVote', function(req,response){
  req.body.username = req.username;
  sendMessage('/updateVote', req, (resp) => {
    response.send(resp);
  })
})

app.listen(port, () => console.log('Listening on port ' + port))