var express = require("express");
var bodyParser = require("body-parser"); //Used to parse HTTP requests
var request = require("request")
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var controlIP = "http://192.168.43.104:8000/"
var messageStorage;

app.get('/',function (req,res) {
    console.log("Get called")
    console.log(req.body)
});

app.post('/', function(req,resp){
    console.log("Post called")
    console.log(req.body);
    let response = { text: 'Message Received'}
    resp.send(response);
});

function sendUpdate(messageData){
    request.post({
      url: controlIp,
      json: true,
      body: messageData, function(error, response, body) {
      if (!error) {
          response.write(response.statusCode);
      } else {
          response.write(error);
      }
      response.end();
    }
    });
   }

function sendInfo()
{
    request.post()
}

const port = 3000;
app.listen(port,() => console.log("Server running on port "+port))
