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

const dataSourceServerIp = 'localhost';

function sendMessage(messageData, cb){
  let data;
  
  request.post({
    url: dataSourceServerIp+'/newPost/',
    json: true,
    body: messageData}
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

app.post('/postMessage', function(req,res){
  let message = req.body;
  console.log(message.img.length);
  sendMessage(message, (resp) => {
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
    console.log(res.body);
    response.send(res);
  }
  );
})



app.listen(port, () => console.log('Listening on port ' + port))