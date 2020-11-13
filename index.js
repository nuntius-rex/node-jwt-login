const express = require("express");
const bodyParser = require("body-parser");
const serveStatic = require('serve-static');
const path = require('path');
const jwt = require('jsonwebtoken');

const allowedIPs=[
  "::1",              //Ipv6 localhost
  "127.0.0.1",        //Ipv4 localhost
  //"111.111.111.111"  //Test: Comment out all others and enable to test
]

//================
//Credentials:
//================
const accessTokenSecret = 'YOURACCESSTOKENSECRET';

//Don't store user data like this in prod.
const users = [
  {
      username: 'test',
      password: 'pass',
      role: 'admin'
  },
  {
        username: 'test2',
        password: 'pass2',
        role: 'member'
    }
];


const appConfig={
  appName: "JWT Login",
  version: "1.0"
}

const app = express();


//Setup static place to serve html:
app.use(serveStatic(path.join(__dirname, 'public')))

//If app is sending JSON url encoded:
app.use(bodyParser.urlencoded({
  extended: true
}));


app.post('/login',(req, res) => {

    //If not in the allowed ip list, fail:
    if(! allowedIPs.includes(req.ip)){
      res.json({'error':'Invalid location'});
      return;
    }
    // Read username and password from request body
    const { username, password } = req.body;
    //console.log(req.body);

    // Filter user from the users array by username and password
    const user = users.find(u => { return u.username === username && u.password === password });

    if (user) {
        // Generate an access token
        const accessToken = jwt.sign({ username: user.username,  role: user.role }, accessTokenSecret);
        res.json({
            accessToken
        });

    } else {
        res.json({'error':'Invalid login'});
    }

    res.end('');
});


//Setup a route for private dashboard:
app.get('/dash',(req, res) => {

    //If not in the allowed ip list, fail:
    if(! allowedIPs.includes(req.ip)){
      res.json({'error':'Invalid location'});
      return;
    }

    console.log(req.ip);
    res.sendFile('index.html', { root: path.join(__dirname, '/dash') });

});

//Authorization for dashboard
app.post('/dash_auth',(req, res) => {

    //If not in the allowed ip list, fail:
    if(! allowedIPs.includes(req.ip)){
      res.end({'error':'Invalid location'});
      return;
    }

    //console.log(req.body);
    var token=req.body;
    //get the first element off the object, parse again to remove escapes and replace quotes:
    var token=JSON.parse(Object.keys(token)[0]).replace(/\"/g, "");
    //console.log(token);

    var decoded = jwt.verify(token, accessTokenSecret);

    jwt.verify(token, accessTokenSecret, function(err, decoded) {
       if(err){
           //console.log(err)
           res.json({'error':'Invalid access'})
       }else{
          //Add additional application information to the response:
          appConfig.username=decoded.username;
          appConfig.role=decoded.role;
          res.json(appConfig);
       }
      })

});







app.listen(3000, () => {
    console.log('Authentication service started on port 3000');
});
