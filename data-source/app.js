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
        users[req.body.username].messages = []
        users[req.body.username].voted = []
        console.log("Created User")
        res.send(200);
    }
})

app.post('/userMessages', function(req,res){
    let list = [];
    for(i =0;i<users[req.body.username].messages.length;i++){
        for(let j=0;j<messageStorage.length;j++){
            if(messageStorage[j].id == users[req.body.username].messages[i]){
                rad = getRadius(messageStorage[j]);
                messageStorage[j].radius = convertRadius(rad,0,0,0);
                list.push(messageStorage[j]);
            }
        }
    }
    res.send(list);
})

app.post('/updateVote', function(req,res){
    let list = [];

    users[req.body.username].voted.postID = req.body.postID
    if(!users[req.body.username].voted.voted)
    {
        users[req.body.username].voted.voted=0;
    }
    var previouslyVoted = users[req.body.username].voted.voted
    console.log("previous to previous: "+previouslyVoted)
    users[req.body.username].voted.voted = req.body.voted

    for(let j=0;j<messageStorage.length;j++){
        // messageStorage[j].votes = +messageStorage[j].votes + 1;
        // console.log(messageStorage[j].votes);
        if(messageStorage[j].id == req.body.postID){
            console.log("prev: "+previouslyVoted+" new: "+req.body.voted)
            if(previouslyVoted==req.body.voted)
            {
                //messageStorage[j].votes += +req.body.voted
            }
            else if(previouslyVoted==1&&req.body.voted==0)
            {
                messageStorage[j].votes = +messageStorage[j].votes - 1;
            }
            else if(previouslyVoted==1&&req.body.voted==-1)
            {
                messageStorage[j].votes = +messageStorage[j].votes - 2;
            }
            else if(previouslyVoted==0&&req.body.voted==1)
            {
                messageStorage[j].votes = +messageStorage[j].votes + 1;
            }
            else if(previouslyVoted==0&&req.body.voted==-1)
            {
                messageStorage[j].votes = +messageStorage[j].votes - 1;
            }
            else if(previouslyVoted==-1&&req.body.voted==0)
            {
                messageStorage[j].votes = +messageStorage[j].votes + 1;
            }
            else if(previouslyVoted==-1&&req.body.voted==1)
            {
                mmessageStorage[j].votes = +messageStorage[j].votes + 2;
            }

        }

    }
    res.send("done");
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

function convertRadius(lat1, lon1, lat2, lon2){  // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}

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
            messageStorage[i].radius = convertRadius(radius,0,0,0);
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
        data.img = 'http://52.90.56.155:3000/'+filepath; //change to localhost if testing locally
        //http://52.90.56.155
        data.id = id;
        messageStorage.push(data);
        console.log(data.username)
        users[data.username].messages.push(id)
        res.send("success");
    });
    
});



const port = 3000;
app.listen(port,() => console.log("Server running on port "+port))
