const https = require('https');     // allows for connection using https instead of http
const fs = require('fs');           // allows for asynchronous reading of files
const express = require('express'); // Express framework for creating a web server
const session = require('express-session'); // Add-on for express that creates a session attached to client requests
const formidable = require('formidable');   // Formidable parses html forms
const app = express();              // Declare express instance
const path = require('path');       // path module deals with directory handling, has built-in variables for the root directory
const cors = require('cors');       // Cross-Origin Resource Sharing allows for different browsers to make requests for the web server
const mysql = require('mysql2');    // Module allows for connection to a sql database
const { format } = require('date-fns'); // Functions that deal with datetime
const { randomUUID } = require('crypto');   // Import ability to generate a random id for the session
const { logger } = require('./middleware/logger');  // custom middleware creates a requestLog to log requests to the server
const errorHandler = require('./middleware/errorHandler');  // custom middleware creates a errorLog to log server errors
const { hashMake, hashCheck } = require('./public/scripts/hasher'); // custom middleware creates a hash and checks a hash against another hash for a match (used for password validation)

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
app.use(express.static(path.join(__dirname, '/public')));   // Tells express to start its search in the public folder for any files requested by the client
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
        httpOnly    : true,
        secure      : false,
        maxAge      : null,
    },
}));

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

const dbServer = mysql.createConnection({   // Create the connection to the sql database
    host: 'localhost',       // Database host (use your DB host if not localhost)
    user: 'guest',            // Your database username
    password: '',    // Your database password
    database: 'z_squared', // The name of your database
    port: 3306               // The port for the database (default is 3306 for MariaDB)
});

dbServer.connect((err) => { // open connection to database
    if (err) {
        console.error("Error connecting: " + err.stack);
        return;
    }
    else {
        console.log("Connected as id " + dbServer.threadId);
    }
});

app.route('^/$|/index(.html)?')     // handles all requessts made by the client for the index.html page
    .get((request, response) => {   // get requests to index handled in here
        if (typeof(request.session.flags) === "undefined") {    // create session flags as an empty object if it's not created
            request.session.flags = {};
        }
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        
        // perform a query to the videos database to get recommended videos rendered on the home page
        dbServer.query(`SELECT video_id, v.user_id, username, title, thumbnail, t_mimetype, url, v_mimetype FROM videos v LEFT JOIN accounts a ON v.user_id=a.user_id ORDER BY released LIMIT 10;`, (error, results, fields) => {
            if (error)
                throw (error);
            if (results.length > 0) {   // if there are any videos in the database
                if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
                    response.render('pages/index', {    // render the page with the videos and the username of the logged in user
                        "user": request.session.user,
                        results
                    });
                }
                else {  
                    response.render('pages/index', {    // else render page with videos and an empty username
                        "user": [{}], 
                        results 
                    });
                }
            }
        });
    }); // no post requests currently being made to index page

app.route('/player(.html)?')    // handles all requests to player.html
    .get((request, response) => {   // get requests handles here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        if (typeof(request.query.video) !== "undefined" && request.query.video) {   // if there's a video selected to play
            if (typeof(request.session.video) === "undefined" || !request.session.video || request.session.video !== request.query.video) { // if the video in the session doesn't match the video that was selected
                request.session.video = JSON.parse(request.query.video);    // set session.video to the query.video that was selected by the user
            }
            if (typeof(request.session.comments) !== "undefined" || !request.session.comments) {    // if there are no comments

            } 

            // query for comments tied to the requested video
            dbServer.query(`SELECT username, comment FROM accounts a JOIN comments c ON a.user_id=c.user_id WHERE c.video_id LIKE ${request.session.video.video_id};`, (error, comments, fields) => {
                if (error)
                    throw (error);
                response.render('pages/player', {   // if there is no error, render the video with its comments
                    "user": request.session.user,
                    "vData": request.session.video,
                    comments
                });
            });
            // console.log(`JSON data detected.\t${request.session.video.url}\t`);
        } 
        else if (typeof(request.session.video) !== "undefined" && request.session.video) {  // if the session video is set but the query is not (handles reloading the page after liking/disliking/commenting on the video)
            // console.log("Am I making it here like I should be if I'm coming back after liking?");
            
            // requery for comments tied to the video saved in the session
            dbServer.query(`SELECT username, comment FROM accounts a JOIN comments c ON a.user_id=c.user_id WHERE c.video_id LIKE ${request.session.video.video_id};`, (error, comments, fields) => {
                if (error)
                    throw (error);
                response.render('pages/player', {   // rerender page with video and its comments
                    "user": request.session.user,
                    "vData": request.session.video,
                    comments
                });
            });
        }
        else {
            response.sendFile(path.join(__dirname, 'views', 'player.html'));    // else send the player.html file itself
        }
    })
    .post((request, response) => {  // post requests made to player.html handled here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.liked) !== "undefined" && request.body.liked) {
            if (typeof(request.session.user) !== "undefined" && request.session.user) {
                response.session.flags.isLiked = true;
                dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.user.user_id} AND disliked_videos=${vData.video_id};`,(error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log("Removing from dislikes...");
                        dbServer.query(`DELETE FROM dislikes WHERE disliked_videos=${request.session.video.video_id} AND user_id=${request.session.user.user_id};`)
                    }
                });
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.session.video.video_id};`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log(`${request.session.video.title} already liked by ${request.session.user.username}`);
                    }
                    else {
                        console.log("Attempting to insert like...");
                        dbServer.query(`INSERT INTO likes (user_id, liked_videos) VALUES (${request.session.user.user_id}, ${vData.video_id});`);
                        dbServer.query(`UPDATE videos SET likes=likes+1 WHERE video_id=${request.session.video.video_id};`);
                    }
                });
                response.render('pages/player', {
                    "user": request.session.user,
                    "vData": request.session.video,
                    "isLiked": response.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
            response.render('pages/player', { 
                "user": request.session.user,
                "vData": request.session.video,
                "comments": JSON.parse(request.body.comments)
            });
        }
        else if (typeof(request.body.disliked) !== "undefined" && request.body.disliked) {
            if (typeof(request.session.user) !== "undefined" && request.session.user) {
                response.session.flags.isLiked = false;
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.session.video.video_id};`,(error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log("Removing from likes...");
                        dbServer.query(`DELETE FROM likes WHERE liked_videos=${request.session.video.video_id} AND user_id=${request.session.user.user_id};`)
                        dbServer.query(`UPDATE videos SET likes=likes-1 WHERE video_id=${request.session.video.video_id};`);
                    }
                });
                dbServer.query(`SELECT * FROM dislikes WHERE user_id=${request.session.user.user_id} AND disliked_videos=${request.session.video.video_id};`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log(`${request.session.video.title} already disliked by ${request.session.user.username}`);
                    }
                    else {
                        console.log("Attempting to insert dislike...");
                        dbServer.query(`INSERT INTO dislikes (user_id, disliked_videos) VALUES (${request.session.user.user_id}, ${request.session.video.video_id});`);
                    }
                });
                response.render('pages/player', {
                    "user": request.session.user,
                    "vData": request.session.video,
                    "isLiked": response.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
            else {
                response.render('pages/player', { 
                    "user": request.session.user,
                    "vData": request.session.video,
                    // "isLiked": request.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
        }
        else if (typeof(request.body.commented) !== "undefined" && request.body.commented) {
            if (typeof(request.session.user) !== "undefined" && request.session.user) {
                dbServer.query(`INSERT INTO comments (user_id, video_id, comment) VALUES (${request.session.user.user_id}, ${video.video_id}, '${request.body.commented}');`);
            }
            response.render('pages/player', { 
                "user": request.session.user,
                "vData": request.body.video,
                "isLiked": request.session.flags.isLiked,
                "comments": JSON.parse(request.body.comments)
            });
        }
        else { 
            console.log("Failed?");
            response.render('pages/player', { 
                "user": request.session.user,
                "vData": request.body.video,
                "comments": JSON.parse(request.body.comments)
            });
        } 
    });

app.route('/search(.html)?') 
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.query.srch) !== "undefined" && request.query.srch) {
            const searchQuery = "'%" + request.query.srch + "%'";
            console.log("Search detected.")
            dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery};`, (error, results, fields) => {
                if (error) 
                    throw (error);
                console.log("Rendering player page with search results...");
                response.render('pages/search', { 
                    results, 
                    "user": request.session.user
                });
            });
        }
    });

app.route('/upload(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        response.sendFile(path.join(__dirname, 'views', 'upload.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            const form = new formidable.IncomingForm();
            form.parse(request, (err, fields, files) => {
                if (err) {
                    next(err);
                    return;
                }

                const allowedVideoTypes = [
                    "video/mp4", 
                    "video/ogg",
                    "video/webm", 
                    "video/mp3", 
                    "video/3gpp", 
                    "video/mpeg",
                    "video/quicktime"
                ];
                const allowedImageTypes = ["image/jpeg", "image/png"];
                if (!allowedVideoTypes.includes(files.fileToUpload[0].mimetype)) {
                    response.end("Invalid Video File Type");
                    return;
                }
                if (!allowedImageTypes.includes(files.thumbnail[0].mimetype)) {
                    response.end("Invalid Image File Type");
                    return;
                }
        
                var temp_paths = [
                    files.fileToUpload[0].filepath,
                    files.thumbnail[0].filepath
                ];
                
                var new_paths = [
                    'C:/Program Files/Ampps/www/video-player/public/videos/' + hashMake(`${request.session.user.user_id} ` + files.fileToUpload[0].originalFilename),
                    'C:/Program Files/Ampps/www/video-player/public/thumbnails/' + hashMake(`${request.session.user.user_id} ` + files.thumbnail[0].originalFilename)
                ]; // THIS IS DEPENDENT ON SERVER/HOST MACHINE

                dbServer.query(`INSERT INTO videos (user_id, title, description, released, thumbnail, t_mimetype, url, v_mimetype) VALUES
                    (${request.session.user.user_id}, 
                    '${fields.v_title?.[0]}', 
                    '${fields.v_description?.[0]}', 
                    '${format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss')}',
                    '${hashMake(`${request.session.user.user_id} ` + files.thumbnail[0].originalFilename)}', 
                    '${files.thumbnail[0].mimetype}',
                    '${hashMake(`${request.session.user.user_id} ` + files.fileToUpload[0].originalFilename)}',
                    '${files.fileToUpload[0].mimetype}');`
                , (error, results, fields) => {
                    if (error) 
                        throw (error);
                });

                temp_paths.forEach((path, index) => {
                    fs.copyFile(path, new_paths[index], (err) => {
                        if (err) throw err;
                        response.write('File uploaded and moved!');
                        response.end();
                    });
                });
            });
        }
    });

app.route('/login(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            response.redirect(303, 'profile.html');
        }
        else {
            response.sendFile(path.join(__dirname, 'views', 'login.html'));
        }
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            if (typeof(request.body.logout) !== "undefined" && request.body.logout) {
                request.session.destroy();
                response.render('pages/login', { 
                    "usrMatch": true, 
                    "pwdMatch": true 
                });
            }
            else if (typeof(request.body.save) !== "undefined" && request.body.save) {
                // console.log("resuest.body.username: ", request.body.username);
                if (typeof(request.body.username) !== "undefined" && request.body.username) {
                    dbServer.query(`UPDATE accounts SET username='${request.body.username}' WHERE user_id=${request.session.user.user_id};`);
                    request.session.user.username = request.body.username;
                    response.redirect(303, 'profile.html');
                }
                else if (typeof(request.body.bio) !== "undefined" && request.body.bio) {
                    dbServer.query(`UPDATE accounts SET bio='${request.body.bio}' WHERE user_id=${request.session.user.user_id};`);
                    request.session.user.bio = request.body.bio;
                }
            }
            response.redirect(303, 'profile.html');
        }
        else if (typeof(request.body.create) !== "undefined" && request.body.create) {
            response.redirect(303, 'registration.html');
        }
        else if (typeof(request.body.login) !== "undefined" && request.body.login) {
            dbServer.query(`SELECT * FROM accounts WHERE username='${request.body.usr}';`, (error, users, fields) => {
                if (error) 
                    throw (error);
                if (users.length > 0) {
                    if (hashCheck(request.body.pwd, users[0].password)) {
                        request.session.user = users[0];
                        request.session.user.DoB = format(request.session.user.DoB, 'yyyy-MM-dd');
                        response.redirect(303, 'index.html');
                    } 
                    else {
                        response.render('pages/login', { 
                            "usrMatch": true, 
                            "pwdMatch": false 
                        });
                    }
                } 
                else {
                    response.render('pages/login', { 
                        "usrMatch": false, 
                        "pwdMatch": false 
                    });
                }
            });
        }
    });

app.route('/registration(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        response.sendFile(path.join(__dirname, 'views', 'registration.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        dbServer.query(`SELECT COUNT(*) AS count FROM accounts WHERE username='${request.body.username}';`, (error, results, fields) => {
            if (error) 
                throw (error);
            if (results[0].count === 0) {
                dbServer.query(`INSERT INTO accounts (email, username, password, DoB) VALUES ('${request.body.email}', '${request.body.username}', '${hashMake(request.body.password)}', '${request.body.dob}');`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    response.redirect(303, 'index.html');
                });
            }
        });
    });

app.route('/liked(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            dbServer.query(`SELECT * FROM likes l JOIN videos v ON v.video_id=l.liked_videos WHERE l.user_id=${request.session.user.user_id};`, (error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {
                    response.render('pages/liked', {  
                        "user": request.session.user,
                        results
                    });
                }
            });
        }
    });
    // .post((request, response) => {

    // });

app.route('/profile(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        console.log('Request received for profle page.');
        response.render('pages/profile', {
            "user": request.session.user
        });
    });

app.all('*', (request, response) => {
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
    response.status(404);
    if (request.accepts('html')) {
        response.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (request.accepts('json')) {
        response.json({ error: "404 Not Found" });
    } else {
        response.type('txt').send("404 Not Found");
    }
});

app.use(errorHandler);

try {
    app.listen(PORTS[0], () => console.log(`Server running on port ${PORTS[0]}`));
    // server.listen(PORTS[1], () => {console.log(`Server is listening on https://localhost:${PORTS[1]}`)});
}
catch (error) {
    console.log(error);
}