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
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        if (typeof(request.body.liked) !== "undefined" && request.body.liked) { // if the like button was clicked
            if (typeof(request.session.user) !== "undefined" && request.session.user) { // if there's a user logged in
                response.session.flags.isLiked = true;  // this flag (will be) used to determine if a user has liked a video or not (true for liked, false for disliked, else undefined for neither)
                
                // check if user has previously disliked video by querying dislikes table with user id and video id
                dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.user.user_id} AND disliked_videos=${vData.video_id};`,(error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {   // if video is disliked, delete the entry from the table
                        console.log("Removing from dislikes...");
                        dbServer.query(`DELETE FROM dislikes WHERE disliked_videos=${request.session.video.video_id} AND user_id=${request.session.user.user_id};`)
                    }
                });

                // check if user has already liked video before
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.session.video.video_id};`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {   // do nothing if video already in likes table tied to the current user id
                        console.log(`${request.session.video.title} already liked by ${request.session.user.username}`);
                    }
                    else {  // else insert the video id and user id into the likes table and update the like count of the video
                        console.log("Attempting to insert like...");
                        dbServer.query(`INSERT INTO likes (user_id, liked_videos) VALUES (${request.session.user.user_id}, ${vData.video_id});`);
                        dbServer.query(`UPDATE videos SET likes=likes+1 WHERE video_id=${request.session.video.video_id};`);
                    }
                });
                response.render('pages/player', {   // render the video player with the video, its comments and send the flag to the client to render a 'liked' button
                    "user": request.session.user,
                    "vData": request.session.video,
                    "isLiked": response.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
            response.render('pages/player', { // render page without flag if there is no user (disallows likes unless there's a logged in user)
                "user": request.session.user,
                "vData": request.session.video,
                "comments": JSON.parse(request.body.comments)
            });
        }
        else if (typeof(request.body.disliked) !== "undefined" && request.body.disliked) {  // if disliked button is clicked
            if (typeof(request.session.user) !== "undefined" && request.session.user) { // if there is a logged in user
                response.session.flags.isLiked = false; // set isLiked session flag to false to indicate video is disliked
                
                // check if video has been liked by user (disallow both liking and disliking a video)
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.session.video.video_id};`,(error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {   // delete from likes table if dislike exists, decrement like count of video
                        console.log("Removing from likes...");
                        dbServer.query(`DELETE FROM likes WHERE liked_videos=${request.session.video.video_id} AND user_id=${request.session.user.user_id};`)
                        dbServer.query(`UPDATE videos SET likes=likes-1 WHERE video_id=${request.session.video.video_id};`);
                    }
                });

                // check if video previously disliked by user
                dbServer.query(`SELECT * FROM dislikes WHERE user_id=${request.session.user.user_id} AND disliked_videos=${request.session.video.video_id};`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {   // do nothing if video already disliked
                        console.log(`${request.session.video.title} already disliked by ${request.session.user.username}`);
                    }
                    else {  // else insert video id and user id into disliked table
                        console.log("Attempting to insert dislike...");
                        dbServer.query(`INSERT INTO dislikes (user_id, disliked_videos) VALUES (${request.session.user.user_id}, ${request.session.video.video_id});`);
                    }
                });
                response.render('pages/player', {   // render player page with username, video, its comments, and send isLiked flag
                    "user": request.session.user,
                    "vData": request.session.video,
                    "isLiked": response.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
            else {
                response.render('pages/player', {   // render player page with username, video, and its comments
                    "user": request.session.user,
                    "vData": request.session.video,
                    // "isLiked": request.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
        }
        else if (typeof(request.body.commented) !== "undefined" && request.body.commented) {    // if a comment is submitted by user
            if (typeof(request.session.user) !== "undefined" && request.session.user) {
                
                // insert user id, video id, and new comment into comments table
                dbServer.query(`INSERT INTO comments (user_id, video_id, comment) VALUES (${request.session.user.user_id}, ${video.video_id}, '${request.body.commented}');`);
            }
            response.render('pages/player', {   // rerender player page with user info, video info, isLiked flag, and comments
                "user": request.session.user,
                "vData": request.body.video,
                "isLiked": request.session.flags.isLiked,
                "comments": JSON.parse(request.body.comments)
            });
        }
        else { 
            console.log("Failed?"); // error catch, in case some unforseen issue occurs, render player page as normal, with user, video, and comments info
            response.render('pages/player', { 
                "user": request.session.user,
                "vData": request.body.video,
                "comments": JSON.parse(request.body.comments)
            });
        } 
    });

app.route('/search(.html)?')    // handles all requests to search.html from clients
    .get((request, response) => {   // get requests handled in here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        if (typeof(request.query.srch) !== "undefined" && request.query.srch) { // if a search was made for something
            const searchQuery = "'%" + request.query.srch + "%'";   // regex % interpreted to mean 'any character before/after' depending on prefix/suffix location
            // console.log("Search detected.")

            // query database for any videos in the videos table that are similar to the search query
            dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery};`, (error, results, fields) => {
                if (error) 
                    throw (error);
                // console.log("Rendering player page with search results...");
                response.render('pages/search', {   // render page with results if no error occurs (will render nothing if no results are found, this is intended behavior)
                    results, 
                    "user": request.session.user
                });
            });
        }
    });

app.route('/upload(.html)?')    // handles all requests to the upload.html page from client
    .get((request, response) => {   // get requests handled here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        response.sendFile(path.join(__dirname, 'views', 'upload.html'));    // send upload.html file (no extra data needed to be sent as session holds user data, if user is logged in)
    })
    .post((request, response) => {  // post requests handled here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
            const form = new formidable.IncomingForm(); // create a new form with formidable to hold file details incoming from an html form
            form.parse(request, (err, fields, files) => {   // parse incoming file from html form for upload
                if (err) {  // uses a next() callback on the error stack to loop through errors and returns if any are found (I think?)
                    next(err);
                    return;
                }

                const allowedVideoTypes = [ // mimetypes of allowed video formats for upload
                    "video/mp4", 
                    "video/ogg",
                    "video/webm", 
                    "video/mp3", 
                    "video/3gpp", 
                    "video/mpeg",
                    "video/quicktime"
                ];
                const allowedImageTypes = ["image/jpeg", "image/png"];  // mimetypes of allowed image formats for upload (allows for unique thumbnail)
                if (!allowedVideoTypes.includes(files.fileToUpload[0].mimetype)) {  // if mimetype of file is not in the allowed video types list, reject upload of files
                    response.end("Invalid Video File Type");
                    return;
                }
                if (!allowedImageTypes.includes(files.thumbnail[0].mimetype)) { // if mimetype of file is not in allowed image types list, reject upload of files
                    response.end("Invalid Image File Type");
                    return;
                }
        
                var temp_paths = [  // formidable saves to a temporary directory, automatically chosen when installed and determined by user's independent file strucutre and projecct location
                    files.fileToUpload[0].filepath, // temp path to video file
                    files.thumbnail[0].filepath     // temp path to image file
                ];
                
                var new_paths = [   // final file path of video (this will be determined by the server machine file architecture and directory location)
                    'C:/Program Files/Ampps/www/video-player/public/videos/' + hashMake(`${request.session.user.user_id} ` + files.fileToUpload[0].originalFilename),
                    'C:/Program Files/Ampps/www/video-player/public/thumbnails/' + hashMake(`${request.session.user.user_id} ` + files.thumbnail[0].originalFilename)
                ]; // THIS IS DEPENDENT ON SERVER/HOST MACHINE

                // insert user id, video title, video desc, video release date (yyyy-MM-dd\T\HH:MM:ss formatted), relative file path to thumbnail,
                // thumbnail mimetype (its file type), relative file path to video, video mime type into videos table of database
                dbServer.query(`INSERT INTO videos (user_id, title, description, released, thumbnail, t_mimetype, url, v_mimetype) VALUES
                    (${request.session.user.user_id},
                    '${fields.v_title?.[0]}', 
                    '${fields.v_description?.[0]}', 
                    '${format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss')}',
                    '${hashMake(`${request.session.user.user_id} ` + files.thumbnail[0].originalFilename)}', 
                    '${files.thumbnail[0].mimetype}',
                    '${hashMake(`${request.session.user.user_id} ` + files.fileToUpload[0].originalFilename)}',
                    '${files.fileToUpload[0].mimetype}');`
                , (error, results, fields) => { // catch any query errors (there are a lot of values, so there are a quite a few of unforseen possibilities here)
                    if (error) 
                        throw (error);
                });

                temp_paths.forEach((path, index) => {   // forEach() is a built-in JS iterator that operates like 'for element in list' does in Python (potentially slower than a simple for loop and indexing, node's turning out to not be so great for speed)
                    fs.copyFile(path, new_paths[index], (err) => {  // copy file from the temporary path to the new path
                        if (err)    // catch any errors that occur when attempting to copy file to new location
                            throw err;
                        response.write('File uploaded and moved!');
                    });
                });
                response.end(); // ends the server response to the client after all files are written
            });
        }
    });

app.route('/login(.html)?') // handles all requests to login.html
    .get((request, response) => {   // get requests handled here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
            response.redirect(303, 'profile.html'); // redirect to profile.html with a 303 status code, which will make a GET request to the new page being redirected to
        }
        else {
            response.sendFile(path.join(__dirname, 'views', 'login.html')); // else send the login.html page
        }
    })
    .post((request, response) => {  // post requests handled here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
            if (typeof(request.body.logout) !== "undefined" && request.body.logout) {   // if the logout button was clicked
                request.session.destroy();  // terminate the session
                response.sendFile(path.join(__dirname, 'views', 'login.html')); // send the login page
            }
            else if (typeof(request.body.save) !== "undefined" && request.body.save) {  // if save changes button is clicked (only appears if an edit button is clicked)
                if (typeof(request.body.username) !== "undefined" && request.body.username) {   //  if username has been changed
                    dbServer.query(`UPDATE accounts SET username='${request.body.username}' WHERE user_id=${request.session.user.user_id};`);   // update username for logged in user in the accounts table
                    request.session.user.username = request.body.username;  // update session user information with new username
                    response.redirect(303, 'profile.html'); // redirect back to the profile page with 303 status code (makes a GET request)
                }
                else if (typeof(request.body.bio) !== "undefined" && request.body.bio) {    // if bio has been changed
                    dbServer.query(`UPDATE accounts SET bio='${request.body.bio}' WHERE user_id=${request.session.user.user_id};`); // update bio for logged in user in accounts table
                    request.session.user.bio = request.body.bio;    // update session user info with new bio
                }
            }
            response.redirect(303, 'profile.html'); // redirect back to profile.html with status code 303 (GET request)
        }
        else if (typeof(request.body.create) !== "undefined" && request.body.create) {  // if create account clicked on login page (not logged in)
            response.redirect(303, 'registration.html');    // redirect to registration.html with status code 303
        }
        else if (typeof(request.body.login) !== "undefined" && request.body.login) {    // if login button was clicked (not logged in)

            // query database for matching username in accounts table
            dbServer.query(`SELECT * FROM accounts WHERE username='${request.body.usr}';`, (error, users, fields) => { 
                if (error) 
                    throw (error);
                if (users.length > 0) { // if username is found in database
                    if (hashCheck(request.body.pwd, users[0].password)) {   // if hashed version of entered password matches hashed password in database
                        request.session.user = users[0];    // set session user info to first row of the query (should be only row, need to add some logic to prevent creation of users with identical usernames)
                        request.session.user.DoB = format(request.session.user.DoB, 'yyyy-MM-dd');  // re-format datetime to just date (this format is used for display of date of birth on profile page)
                        response.redirect(303, 'index.html');   // redirect to index page w/ status code 303
                    } 
                    else {
                        response.render('pages/login', {    // else password was not a match, send user matched, password failed to render of login page
                            "usrMatch": true, 
                            "pwdMatch": false 
                        });
                    }
                } 
                else {
                    response.render('pages/login', {    // else username was not found, send user not matched, password failed to render of login page
                        "usrMatch": false, 
                        "pwdMatch": false 
                    });
                }
            });
        }
    });

app.route('/registration(.html)?')  // handles all requests to registration.html
    .get((request, response) => {   // get requests handled here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        response.sendFile(path.join(__dirname, 'views', 'registration.html'));  // send registration.html to client
    })
    .post((request, response) => {  // post requests handled here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details

        // check that count of usernames that match entered username for account creation is zero
        dbServer.query(`SELECT COUNT(*) AS count FROM accounts WHERE username='${request.body.username}';`, (error, results, fields) => {
            if (error) 
                throw (error);
            if (results[0].count === 0) {   // if username not in accounts table

                // insert new account information into accounts table
                dbServer.query(`INSERT INTO accounts (email, username, password, DoB) VALUES ('${request.body.email}', '${request.body.username}', '${hashMake(request.body.password)}', '${request.body.dob}');`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    response.redirect(303, 'index.html');   // redirect to index page with status code 303
                });
            }
        });
    });

app.route('/liked(.html)?') // handles all requests to liked.html
    .get((request, response) => {   // get requests handled here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in

            // get videos liked by user (thanks to relational tables, can join likes table and videos table on user id and pull liked videos based on the user id that liked them)
            dbServer.query(`SELECT * FROM likes l JOIN videos v ON v.video_id=l.liked_videos WHERE l.user_id=${request.session.user.user_id};`, (error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {   // if there are liked videos by the user
                    response.render('pages/liked', {    // render liked page with their liked videos
                        "user": request.session.user,
                        results
                    });
                }
            });
        }
    });
    // .post((request, response) => {   // post requests handled here (if there ever end up being any made, anyway, otherwise this will be deleted)

    // });

app.route('/profile(.html)?')   // handles all requests to profile.html
    .get((request, response) => {   // get requests handled in here
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
        // console.log('Request received for profle page.');
        response.render('pages/profile', {  // render profile page with user data
            "user": request.session.user
        });
    });

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