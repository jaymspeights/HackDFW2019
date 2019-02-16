var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request')
var app = express();
const port = 8000;

app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: false
})); 

const dataSourceServerIp = 'http://192.168.43.156:3000/';

function sendMessage(messageData, cb){
  let data;
  
  request.post({
    url: dataSourceServerIp,
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
  console.log(message);
  sendMessage(message, (resp) => {
    res.send(resp);
  });
})

app.get('/getMessage', function (req, res) {
  res.send('Part at 2000 Greenville Ave')
})

app.listen(port, () => console.log('Listening on port ' + port))