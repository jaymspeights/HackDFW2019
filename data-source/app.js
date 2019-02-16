var http = require("http")
var express = require("express")
const app = express()
const port = 3000
app.listen(port,() => console.log("Server running on port "+port))
console.log("Server running")

