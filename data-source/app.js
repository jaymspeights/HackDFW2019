var express = require("express");
var bodyParser = require("body-parser"); //Used to parse HTTP requests
var request = require("request")
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var controlIP = "http://192.168.43.104:8000/"
var messageStorage = [];


app.get('/',function (req,res) {
    console.log("Get is called")
    console.log(req.body)
    
    var show = calculateValues(req.location, messageStorage, (newlist)=>{
        messageStorage = newlist;
    });
    sendPosts(message, (resp) => {
        res.send(resp);
      });
});

app.post('/', function(req,resp){
    console.log("Post called")
    req.body.time = new Date().getTime();
    messageStorage.push(req.body);
    let response = { text: 'Message Received'}
    resp.send(response);
});

function sendPosts(messageData, cb){
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

const port = 3000;
app.listen(port,() => console.log("Server running on port "+port))


console.log(messageStorage+"1232");
