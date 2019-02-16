var express = require("express");
var bodyParser = require("body-parser"); //Used to parse HTTP requests
const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//app.get();

app.post('/', function(req,resp){
    console.log(""+req.body.position);
});

const port = 3000;
app.listen(port,() => console.log("Server running on port "+port))


