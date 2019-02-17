var express = require("express");
var bodyParser = require("body-parser"); //Used to parse HTTP requests
var request = require("request")
const app = express();

let base64Img = require('base64-img');



app.use(bodyParser.urlencoded({paramaterLimit:1000000, limit:'50mb', extended: true}));
app.use(bodyParser.json({limit:'50mb', type:'application/json', extended: true}));

var controlIP = "http://localhost:8000/"
var messageStorage = [];
let message_nonce = 0

function getRadius(post){
      var timeDelta = post.timestamp - new Date().getTime();

      return (((120000-timeDelta)/240000)+(post.votes)/20)*0.001                         //after 120 seconds, post is deleted if there's no upvotes
      //if there are upvotes, 10 upvotes will make the circle as big as what it was when the message was posted.
    //   if(radiusnew<0 || timeDelta>604800){
    //       continue;
    //   }
    //   else {
    //     post.radius = radiusnew;
    //   }

      
}

function isWithinRadius(post, radius, currLoc) {
    
    console.log("Radius: "+radius+" , Distance: "+Math.pow(Math.pow((currLoc.latitude-post.location.latitude),2)+Math.pow((currLoc.longitude-post.location.longitude),2),0.5))
    console.log(Math.pow(Math.pow((currLoc.latitude-post.location.latitude),2)+Math.pow((currLoc.longitude-post.location.longitude),2),0.5) <= radius)
    console.log(currLoc,post.location)
    return Math.pow(Math.pow((currLoc.latitude-post.location.latitude),2)+Math.pow((currLoc.longitude-post.location.longitude),2),0.5) <= radius
}

app.use('/img/',express.static(__dirname + '/img/'));

app.get('/getMessages',function (req,res) {
    console.log(req.query)
    list = []
    for (let i = 0; i < messageStorage.length; i++) {
        if (req.query.timestamp && req.query.timestamp < messageStorage[i].timestamp)
            continue
        let radius = getRadius(messageStorage[i])
        if (radius < 0) {
            messageStorage.splice(i, 1);
            i -= 1;
            continue;
        } else if (isWithinRadius(messageStorage[i], radius, {latitude:req.query.latitude, longitude:req.query.longitude})) {
            list.push(messageStorage[i])
            if (!req.query.num || list.length >= +req.query.num) {
                res.send(list)
                return
            }
        }
    }

    res.send(list)
});

app.post('/newPost', function(req,res){
    console.log("Post called")
    let data = {...req.body, timestamp: new Date().getTime(), votes: 0};
    base64Img.img("data:image/jpeg;base64,"+data.img, 'img/', `img-${data.timestamp}-${message_nonce++}`, function(err, filepath) {
        console.log(filepath)
        data.img = 'http://52.90.56.155:3000/'+filepath;
        messageStorage.push(data);
        res.send("success");
    });
    
});

const port = 3000;
app.listen(port,() => console.log("Server running on port "+port))
