const https = require('https');     // allows for connection using https instead of http
const express = require('express'); // Express framework for creating a web server
const session = require('express-session'); // Add-on for express that creates a session attached to client requests
const app = express();              // Declare express instance
const path = require('path');       // path module deals with directory handling, has built-in variables for the root directory
const cors = require('cors');       // Cross-Origin Resource Sharing allows for different browsers to make requests for the web server
const { randomUUID } = require('crypto');   // Import ability to generate a random id for the session
const { logger } = require('./middleware/logger');  // custom middleware creates a requestLog to log requests to the server
const errorHandler = require('./middleware/errorHandler');  // custom middleware creates a errorLog to log server errors

const PORTS = [     // Ports that the server listens for requests on
    process.env.PORT || 8080,   // HTTP requests port
    process.env.PORT || 8443    // HTTPS requests port
 ];

app.set('view engine', 'ejs');  // Allows express to render .ejs files with data sent to the client by the server
app.use(logger);                // Tells express to use the custom logger middleware, automates the writing of requests to the requestLog
// Cross Origin Resource Sharing (will allow for functionality in multiple browsers)
const whitelist = [             // Contains list of valid addresses that are allowed to make a request to this server throught CORS
    // 'https://www.google.com',
    'https://127.0.0.1:8443',
    'https://localhost:8443',
    'http://127.0.0.1:8080',
    'http://localhost:8080',
];
const corsOptions = {           // Determines if the origin address making the requesst is in the whietlist
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) { // !origin used for testing to allow requests from an undefined origin, typcially localhost
            callback(null, true);
        } 
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }, 
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));     // Tells express to use the CORS module with the corsOptions set above
app.use(express.json());        // Tells express to use json
app.use(express.urlencoded({ extended: true }));    // Tells express that the url will be encoded
app.use(session({   // session settings found in the expressjs.com docs
    genid               : function(req) {
        return randomUUID();    // get a random unique id for the session
    },
    secret              : 'The Power of Z-Squared.',    // secret passphrase
    resave              : false, 
    saveUninitialized   : false,
    cookie: { 
        path        : '/',
        httpOnly    : false,
        secure      : false,
        maxAge      : null,
    },
}));

app.use('/', express.static(path.join(__dirname, '/public')));   // Tells express to start its search in the public folder for any files requested by the client
app.use('/', require('./routes/root'));

var server = null;  // tries to read for a key and certificate for https, if not found, error is logged and execution continues using http connection
try {
    const keys = {
        key: fs.readFileSync('./cert/local.decrypted.key'),
        cert: fs.readFileSync('./cert/local.crt')
    };
    
    server = https.createServer(keys, app);
} 
catch (error) {
    console.log(error);
}

app.all('*', (request, response) => {   // if requests to anything not in the directory is made
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.status(404);   // respond with 404 status code
    if (request.accepts('html')) {  // if request is for an html file
        response.sendFile(path.join(__dirname, 'views', '404.html'));   // send our (patented, copyrighted, licensed, etc. all the big corporate words) generic 404.html
    } else if (request.accepts('json')) {   // if request is for json data
        response.json({ error: "404 Not Found" });  // respond with josn object indicating a 404 error
    } else {
        response.type('txt').send("404 Not Found"); // respond with a txt file (if all else fails, be damned) indicating a 404
    }
});

app.use(errorHandler);  // use error handler at end of routes to catch and log any errors in logs/errorLog.txt (ignored by git, each one of us will have our own)

try {   // attempt to listen on ports 8080 (HTTP) and 8443 (HTTPS) (comment out HTTPS if you're having issues with the key/cert pairing during testing, but we will need this to work before we go live)
    app.listen(PORTS[0], () => console.log(`Server running on port ${PORTS[0]}`));
    // server.listen(PORTS[1], () => {console.log(`Server is listening on https://localhost:${PORTS[1]}`)});
}
catch (error) { // log any server listening errors (e.g. the ports the server is suppose to be listening on are already being used by sonething else)
    console.log(error);
}