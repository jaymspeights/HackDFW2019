var express = require("express");
var bodyParser = require("body-parser"); //Used to parse HTTP requests
var request = require("request")
const app = express();

let base64Img = require('base64-img');
var users = {};

app.use(bodyParser.urlencoded({paramaterLimit:1000000, limit:'50mb', extended: true}));
app.use(bodyParser.json({limit:'50mb', type:'application/json', extended: true}));


app.post('/auth', function (req, res) {
    if (users[req.body.username] && users[req.body.username].password == req.body.password) {
        res.send({username: req.body.username})
    } else {
        res.send({error: "Invalid Credentials."})
    }
});

app.post('/createUser', function(req,res){
    console.log(req.body)
    if(users[req.body.username])
    {
        let error = {};
        error.code = "400";
        error.message = "Bad Request. User already exists"
        res.send({error:error});
    }
    else{
        users[req.body.username]= {};
        users[req.body.username].username = req.body.username;
        users[req.body.username].password = req.body.password;
        users[req.body.username].posts = []
        users[req.body.username].voted = []
        console.log("Created User")
        res.send(200);
    }
})


app.post('/user', function(req,res){
    if(users[req.body.username])
    {
        if(users[req.body.username].password===req.body.password)
        {
            res.send({});
            console.log("success")
        }
    }
    else{
        console.log("There was an error")
        let error = {};
        error.code = "400";
        error.message = "Bad Request. User does not exist";
        res.send(error);
        return;
    }
})

var controlIP = "http://localhost:8000/"
var messageStorage = [];
let message_nonce = 0;

function getRadius(post){
      var timeDelta = new Date().getTime() - post.timestamp;

      return (((600000-timeDelta)/1200000)+(post.votes)/20)*0.001     
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
    let id = `${data.timestamp}-${message_nonce++}`
    base64Img.img("data:image/jpeg;base64,"+data.img, 'img/', `img-${id}`, function(err, filepath) {
        console.log(filepath)
        data.img = 'localhost:3000/'+filepath;
        //http://52.90.56.155
        data.id = id;
        messageStorage.push(data);
        res.send("success");
    });
    
});



const port = 3000;
app.listen(port,() => console.log("Server running on port "+port))
