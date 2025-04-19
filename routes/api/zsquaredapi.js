import { copyFile } from 'fs';           // allows for asynchronous reading of files
import { Router } from 'express';
import session from 'express-session'; // Add-on for express that creates a session attached to client requests
import { IncomingForm } from 'formidable';   // Formidable parses html forms
const router = Router();
import { createConnection } from 'mysql2';    // Module allows for connection to a sql database
import { join } from 'path';
import { dirname } from "node:path";    // gives the root directory of the project
const __dirname = dirname(process.argv[1]);

// required middleware
import { format } from 'date-fns'; // Functions that deal with datetime
import hashCheck, { hashMake } from '../../public/scripts/hasher.js'; // custom middleware creates a hash and checks a hash against another hash for a match (used for password validation)

// create connection to the mysql db
const dbServer = createConnection({   // Create the connection to the sql database
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

router.get('/', (request, response) => {     // handles api get requests made by the client for video data
    if (typeof(request.session.flags) === "undefined") {    // create session flags as an empty object if it's not created
        request.session.flags = {};
    }
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    
    // perform a query to the videos database to get recommended videos rendered on the home page
    dbServer.query(`SELECT video_id, title, thumbnail, url FROM videos v LEFT JOIN accounts a ON v.user_id=a.user_id ORDER BY released LIMIT 10;`, (error, results, fields) => {
        if (error)
            throw (error);
        response.json({    // render the page with the videos and the username of the logged in user
            "user": request.session.user,
            results
        });
    });
});

router.get('/search/:search', (request, response) => {    // handles all api search requests from clients
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    if (typeof(request.params.search) !== "undefined" && request.params.search) { // if a search was made for something
        console.log(request.params.search);
        const searchQuery = "'%" + request.params.search + "%'";   // regex % interpreted to mean 'any character before/after' depending on prefix/suffix location
        // console.log("Search detected.")

        // query database for any videos in the videos table that are similar to the search query
        dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery};`, (error, results, fields) => {
            if (error) 
                throw (error);
            // console.log("Rendering player page with search results...");
            response.json({    // render the page with the videos and the username of the logged in user
                "user": request.session.user,
                results
            }); 
        });
    }
});

router.get('/player/:video', (request, response) => {   // get requests handles here
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    // query for comments tied to the requested video
    dbServer.query(`SELECT video_id, username, title, description, released, views, likes, url, v_mimetype FROM videos v LEFT JOIN accounts a ON v.user_id=a.user_id WHERE video_id=${request.params.video};`, (error, results, fields) => {
        if (error)
            throw (error);
        request.session.video = results[0];
    });
    dbServer.query(`SELECT username, comment FROM accounts a JOIN videos v ON a.user_id=v.user_id JOIN comments c ON a.user_id=c.user_id WHERE v.video_id LIKE ${request.params.video};`, (error, comments, fields) => {
        if (error)
            throw (error);
        response.json({   // if there is no error, render the video with its comments
            "user": request.session.user,
            "vData": request.session.video,
            comments
        });
    });
});

router.post('/player', (request, response) => {  // post requests made to player.html handled here
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    console.log(request.body);
    if (typeof(request.body.liked) !== "undefined") {
        if (typeof(request.session.user) !== "undefined" && request.session.user) { // if there's a user logged in
            if (request.body.liked) { // if the like button was clicked
                request.session.flags.isLiked = true;  // this flag (will be) used to determine if a user has liked a video or not (true for liked, false for disliked, else undefined for neither)

                // check if user has previously disliked video by querying dislikes table with user id and video id
                dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.user.user_id} AND disliked_videos=${request.session.video.video_id};`,(error, results, fields) => {
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
                        dbServer.query(`INSERT INTO likes (user_id, liked_videos) VALUES (${request.session.user.user_id}, ${request.session.video.video_id});`);
                        dbServer.query(`UPDATE videos SET likes=likes+1 WHERE video_id=${request.session.video.video_id};`);
                    }
                    request.session.video.likes += 1;
                });
            }
        }
        else if (request.body.disliked) {  // if disliked button is clicked
            request.session.flags.isLiked = false; // set isLiked session flag to false to indicate video is disliked
            
            // check if video has been liked by user (disallow both liking and disliking a video)
            dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.session.video.video_id};`,(error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {   // delete from likes table if dislike exists, decrement like count of video
                    console.log("Removing from likes...");
                    dbServer.query(`DELETE FROM likes WHERE liked_videos=${request.session.video.video_id} AND user_id=${request.session.user.user_id};`)
                    dbServer.query(`UPDATE videos SET likes=likes-1 WHERE video_id=${request.session.video.video_id};`);
                }
                request.session.video.likes -= 1;
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
        }
        else if (typeof(request.body.commented) !== "undefined" && request.body.commented) {    // if a comment is submitted by user
            // insert user id, video id, and new comment into comments table only if a user is logged in
            dbServer.query(`INSERT INTO comments (user_id, video_id, comment) VALUES (${request.session.user.user_id}, ${video.video_id}, '${request.body.commented}');`);
        }
    }
    else {
        console.log("Failed?"); // error catch, in case some unforseen issue occurs, render player page as normal, with user, video, and comments info
    }
    dbServer.query(`SELECT username, comment FROM accounts a JOIN videos v ON a.user_id=v.user_id JOIN comments c ON a.user_id=c.user_id WHERE v.video_id LIKE ${request.session.video.video_id};`, (error, comments, fields) => {
        if (error)
            throw (error);
        response.json({   // render the video player with the video, its comments and send the flag to the client to render a 'liked' or 'disliked' button
            "isLiked": request.session.flags.isLiked,
            "likeCount": request.session.video.likes,
            comments
        });
    });
    return;
});

router.post('/upload', (request, response) => {     // handles post requests to the upload.html page from client
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    console.log(request.session.user);
    if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
        const form = new IncomingForm();         // create a new form with formidable to hold file details incoming from an html form
        form.parse(request, (err, fields, files) => {       // parse incoming file from html form for upload
            if (err) {      // uses a next() callback on the error stack to loop through errors and returns if any are found (I think?)
                next(err);
                return;
            }
            console.log(request);
            const allowedVideoTypes = [ // mimetypes of allowed video formats for upload
                "video/mp4", 
                "video/ogg",
                "video/webm", 
                "video/mp3", 
                "video/3gpp", 
                "video/mpeg",
                "video/quicktime",
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
                copyFile(path, new_paths[index], (err) => {  // copy file from the temporary path to the new path
                    if (err)    // catch any errors that occur when attempting to copy file to new location
                        throw err;
                    response.write('File uploaded and moved!');
                });
            });
            response.json({ "uploaded": true }); // ends the server response to the client after all files are written
        });
    }
    else {
        console.log("No user logged in - Upload prevented.");
        response.json({ "uploaded": false });
    }
});

router.post('/login', (request, response) => {  // handles get requests to the login.html page from client
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    // query database for matching username in accounts table
    // console.log(request.body.name);
    dbServer.query(`SELECT * FROM accounts WHERE username='${request.body.name}';`, (error, users, fields) => { 
        if (error) 
            throw (error);
        if (users.length > 0) { // if username is found in database
            if (hashCheck(request.body.pass, users[0].password)) {   // if hashed version of entered password matches hashed password in database
                request.session.user = users[0];    // set session user info to first row of the query (should be only row, need to add some logic to prevent creation of users with identical usernames)
                request.session.user.DoB = format(request.session.user.DoB, 'yyyy-MM-dd');  // re-format datetime to just date (this format is used for display of date of birth on profile page)
                response.json({
                    "user": users[0],
                    "usrMatch": true,
                    "pwdMatch": true
                });   // redirect to index page w/ status code 303
                return;
            } 
            else {
                response.json({    // else password was not a match, send user matched, password failed to render of login page
                    "usrMatch": true, 
                    "pwdMatch": false 
                });
                return;
            }
        } 
        else {
            response.json({    // else username was not found, send user not matched, password failed to render of login page
                "usrMatch": false, 
                "pwdMatch": false 
            });
            return;
        }
    });
});

router.post(('/register'), (request, response) => {  // post requests handled here
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
                response.json({ "created-account": true });
                return;
            });
        }
    });
    response.json({ "created-account": false });
    return;
});

router.get('/liked/:all', (request, response) => { // handles all requests to liked.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
        // get videos liked by user (thanks to relational tables, can join likes table and videos table on user id and pull liked videos based on the user id that liked them)
        dbServer.query(`SELECT * FROM likes l JOIN videos v ON v.video_id=l.liked_videos WHERE l.user_id=${request.session.user.user_id};`, (error, results, fields) => {
            if (error)
                throw (error);
            if (results.length > 0) {   // if there are liked videos by the user
                response.json({    // render liked page with their liked videos
                    "user": request.session.user,
                    results
                });
            }
            else {
                response.json({    // render liked page with their liked videos
                    "user": request.session.user,
                    results
                });
            }
        });
        return;   
    }
    else {
        response.json({ "loggedIn": false });
        return;
    }
});

router.put('/profile',  (request, response) => {
    // console.log('Is put request being made?');
    if (typeof(request.body.loggedIn) !== "undefined" && request.body.loggedIn) { // if a user is logged in
        if (typeof(request.body.logout) !== "undefined" && request.body.logout) {   // if the logout button was clicked
            console.log("Destroying session...");
            request.session.destroy();  // terminate the session
            response.json({ "logged-in": false }); // send the login flag set false
            return;
        }
        else if (typeof(request.body.save) !== "undefined" && request.body.save) {  // if save changes button is clicked (only routerears if an edit button is clicked)
            console.log(`${request.session.user}\t${request.body.oldPassword}\t${request.body.save}\n`);
            if (typeof(request.body.username) !== "undefined" && request.body.username) {   //  if username has been changed
                dbServer.query(`UPDATE accounts SET username='${request.body.username}' WHERE user_id=${request.session.user.user_id};`);   // update username for logged in user in the accounts table
                request.session.user.username = request.body.username;  // update session user information with new username
            }
            else if (typeof(request.body.bio) !== "undefined" && request.body.bio) {    // if bio has been changed
                dbServer.query(`UPDATE accounts SET bio='${request.body.bio}' WHERE user_id=${request.session.user.user_id};`); // update bio for logged in user in accounts table
                request.session.user.bio = request.body.bio;    // update session user info with new bio
            }
            else if (typeof(request.body.oldPassword) !== "undefined" && request.body.oldPassword) {
                console.log(`PUT request made to change password to: ${hashMake(request.body.newPassword)}.`);
                if (!hashCheck(request.body.oldPassword, request.session.user.password)) {
                    console.log("Error: Incorrect old password.");
                    response.json({ "badPass": true });
                    return;
                }
                else {
                    // dbServer.query(`UPDATE accounts SET password='${hashMake(request.body.newPassword)}' WHERE user_id=${request.session.user.user_id};`);
                    request.session.user.password = hashMake(request.body.newPassword);
                    console.log("Password updated successfully!");
                }
            }
        }
        response.json({ 
            "logged-in": true, 
            user: JSON.stringify(request.session.user)
        }); // send login flag set true
        return;
    }
    else {
        response.json({ "logged-in": false });
        return;
    }
});

export { router };