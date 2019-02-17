var express = require("express");
var bodyParser = require("body-parser"); //Used to parse HTTP requests
var request = require("request")
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var controlIP = "http://192.168.43.104:8000/"
var messageStorage = [];

function calculateInfluenceRadii(currLoc, messages, nl){
  var i=0;
  while(messages[i] != null){
      var radiusnew;
      var timeDelta = messages[i].time - new Date().getTime();
      var newlist;

  
      radiusnew = (((120-timeDelta)/240)+(messages[i].upvotes)/20)*0.001                         //after 120 seconds, post is deleted if there's no upvotes
      //if there are upvotes, 10 upvotes will make the circle as big as what it was when the message was posted.
      if(radiusnew<0 || timeDelta>604800){
          messages.slice(i,1);
          i--;
          continue;
      }
      else{
      messages[i].radius = radiusnew;
      }

      if(Math.pow(Math.pow((currLoc.latitude-messages[i].position.latitude),2)+Math.pow((currLoc.longitude-messages[i].position.longitude),2),0.5) <= radiusnew){
          newlist.push(messages[i]);
      }
      i++;
  }

  nl(newlist);
}
app.get('/',function (req,res) {
    console.log("Get is called")
    console.log(req.body)
    
    var show = calculateValues(req.location, messageStorage, (newlist)=>{
        var relList = newlist;
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
