
const fs = require('fs');           // allows for asynchronous reading of filesconst express = require('express')
const session = require('express-session'); // Add-on for express that creates a session attached to client requests
const formidable = require('formidable');   // Formidable parses html forms
const router = express.Router();
const mysql = require('mysql2');    // Module allows for connection to a sql database
const path = require('path');

// required middleware
const { format } = require('date-fns'); // Functions that deal with datetime
const { hashMake, hashCheck } = require('../../public/scripts/hasher'); // custom middleware creates a hash and checks a hash against another hash for a match (used for password validation)

// create connection to the mysql db
const dbServer = mysql.createConnection({   // Create the connection to the sql database
    host: 'localhost',       // Database host (use your DB host if not localhost)
    user: 'guest',            // Your database username
    password: '',    // Your database password
    database: 'z_squared', // The name of your database
    port: 3306               // The port for the database (default is 3306 for MariaDB)
});

// connect to the sql db
dbServer.connect((err) => { // open connection to database
    if (err) {
        console.error("Error connecting: " + err.stack);
        return;
    }
    else {
        console.log("Connected as id " + dbServer.threadId);
    }
});

// all requests to index page should be get requests
router.get('^/$|/index(.html)?', (request, response) => {     // handles all get requests made by the client for the index.html page
    console.log(request.session);
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

router.get('/search(.html)?', (request, response) => {    // handles all requests to search.html from clients
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

router.post('/upload(.html)?', (request, response) => {     // handles post requests to the upload.html page from client
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
        const form = new formidable.IncomingForm();         // create a new form with formidable to hold file details incoming from an html form
        form.parse(request, (err, fields, files) => {       // parse incoming file from html form for upload
            if (err) {      // uses a next() callback on the error stack to loop through errors and returns if any are found (I think?)
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

router.route('/login(.html)?')    
.post((request, response) => {  // handles post requests to the login.html page from client
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    if (typeof(request.body.login) !== "undefined" && request.body.login) {    // if login button was clicked (not logged in)
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
    response.sendFile(path.join(__dirname, '..', '..', 'views', 'login.html'));
})

router.post(('/registration(.html)?'), (request, response) => {  // post requests handled here
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

router.get('/liked(.html)?', (request, response) => { // handles all requests to liked.html
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
        response.render('pages/liked', {    // render liked page with their liked videos
            "user": request.session.user,
            "results": [{}]
        });
    }
    response.redirect(303, 'login.html');
});
// .post((request, response) => {   // post requests handled here (if there ever end up being any made, anyway, otherwise this will be deleted)
//      left this here in case post requests to the liked page are ever made (unlikely)
// });

router.put('profile.html', (request, response) => {
    if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
        if (typeof(request.body.logout) !== "undefined" && request.body.logout) {   // if the logout button was clicked
            request.session.destroy();  // terminate the session
            response.sendFile(path.join(__dirname, '..', '..', 'views', 'login.html')); // send the login page
        }
        else if (typeof(request.body.save) !== "undefined" && request.body.save) {  // if save changes button is clicked (only routerears if an edit button is clicked)
            if (typeof(request.body.username) !== "undefined" && request.body.username) {   //  if username has been changed
                dbServer.query(`UPDATE accounts SET username='${request.body.username}' WHERE user_id=${request.session.user.user_id};`);   // update username for logged in user in the accounts table
                request.session.user.username = request.body.username;  // update session user information with new username
            }
            else if (typeof(request.body.bio) !== "undefined" && request.body.bio) {    // if bio has been changed
                dbServer.query(`UPDATE accounts SET bio='${request.body.bio}' WHERE user_id=${request.session.user.user_id};`); // update bio for logged in user in accounts table
                request.session.user.bio = request.body.bio;    // update session user info with new bio
            }
        }
        response.redirect(303, 'profile.html'); // redirect back to profile.html with status code 303 (GET request)
    }
});