const express = require('express');
const session = require('express-session'); // Add-on for express that creates a session attached to client requests
const router = express.Router();
const path = require('path');

// This file handles requests made to the server that do not involve any database queries
// Those requests are handled by the profiles.js file inside of the /api directory

/* all handled routes below (new ones can be added by following this structure:
router.route('Filename(.html)?')
    .get((request, response) => {

        put code for get requests to 'Filename' here

    }))
    .post((request, response) => {

        put more code for post requests to 'Filename' here

    });

it is not necessary to do a router.route().get().post() if the page only ever receives get/post requests
a router.get() or router.post() will work just the same. router.route() is mostly useful if the page receives
multiple types of requests.
*/

router.get('/upload(.html)?', (request, response) => {    // handles get requests to the upload.html page from client
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.sendFile(path.join(__dirname, 'views', 'upload.html'));    // send upload.html file (no extra data needed to be sent as session holds user data, if user is logged in)
});

router.route('/login(.html)?')
.get((request, response) => { // handles get requests to login.html
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
    if (typeof(request.body.create) !== "undefined" && request.body.create) {  // if create account clicked on login page (not logged in)
        response.redirect(303, 'registration.html');    // redirect to registration.html with status code 303
    }
});

app.route('/player(.html)?')
.get((request, response) => {
    if (typeof(request.query.title) !== "undefined" && request.query.title) {
        const title = request.query.title;
        const vURL = request.query.vurl;
        const vID = request.query.video_id;
        console.log("Get request detected.");
    } else if (typeof(request.session.userID) !== "undefined" && request.session.userID) {
        dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.userID} AND liked_videos LIKE '${title}';`, (error, results, fields) => {
            console.log("Looking for likes.");
            if (error)
                throw (error);
            if (results.length > 0) {
                console.log(`${title} already liked by ${request.session.username}`)
                response.render('pages/player', { "username": request.session.username, "title": title, "vURL": vURL, "vid": vID, "isLiked": true })
            } else {
                response.render('pages/player', { "username": request.session.username, "title": title, "vURL": vURL, "vid": vID, "isLiked": false })
            }
        });
    } else {
        response.sendFile(path.join(__dirname, 'views', 'player.html'));
    }
})
.post((request, response) => {
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
    console.log(request.session.user);
    if (typeof(request.body.jsonData) !== "undefined" && request.body.jsonData) {
        const data = JSON.parse(request.body.jsonData);
        const key = request.body.thumber;
        const title = data[key].title;
        const vURL = data[key].url;
        const vID = data[key].video_id;
        dbServer.query(`SELECT username, comment FROM accounts a JOIN comments c ON a.user_id=c.user_id WHERE c.video_id LIKE ${vID};`, (error, comments, fields) => {
            if (error)
                throw (error);
            if (comments.length > 0) {
                response.render('pages/player', { "username": request.session.username, "title": title,
                    "vURL": vURL, "vid": vID, comments });
            }
        });
        console.log(`JSON data detected.\t${vID}`);
    } else if (typeof(request.body.srch) !== "undefined" && request.body.srch) {
        const searchQuery = "'%" + request.body.srch + "%'";
        console.log("Search detected.")
        dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery};`, (error, results, fields) => {
            if (error) 
                throw (error);
            console.log("Rendering player page with search results...");
            comments = JSON.parse(request.body.comments);
            response.render('pages/search', { results, "username": request.session.username, comments });
        });
    } else if (typeof(request.session.userID) !== "undefined" && request.session.userID) {
        console.log("Like detected.");
        console.log(`${typeof(request.body.liked)}`)
        if (typeof(request.body.liked) !== "undefined" && request.body.liked) {
            dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.userID} AND disliked_videos=${request.body.vid};`,(error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {
                    console.log("Removing from dislikes...");
                    dbServer.query(`DELETE FROM dislikes WHERE disliked_videos=${request.body.vid};`)
                }
            });
            dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.userID} AND liked_videos=${request.body.vid};`, (error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {
                    console.log(`${request.body.title} already liked by ${request.session.username}`);
                    comments = JSON.parse(request.body.comments);
                    response.render('pages/player', { "username": request.session.username, 
                        "title": request.body.title, "vURL": request.body.vurl, "vid": request.body.vid, "isLiked": true, comments })
                } else {
                    console.log("Attempting to insert like...");
                    dbServer.query(`INSERT INTO likes (user_id, liked_videos) VALUES (${request.session.userID}, ${request.body.vid});`);
                    response.render('pages/player', { "username": request.session.username, 
                        "title": request.body.title, "vURL": request.body.vurl, "vid": request.body.vid, "isLiked": false, comments });
                }
            });
        } else if (typeof(request.body.disliked) !== "undefined" && request.body.disliked) {
            dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.userID} AND liked_videos=${request.body.vid};`,(error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {
                    console.log("Removing from likes...");
                    dbServer.query(`DELETE FROM likes WHERE liked_videos=${request.body.vid};`)
                }
            });
            dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.userID} AND disliked_videos=${request.body.vid};`, (error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {
                    console.log(`${request.body.title} already disliked by ${request.session.username}`);
                    comments = JSON.parse(request.body.comments);
                    response.render('pages/player', { "username": request.session.username, "title": request.body.title,
                        "vURL": request.body.vurl, "vid": request.body.vid, "isDisliked": true, comments });
                } else {
                    console.log("Attempting to insert dislike...");
                    dbServer.query(`INSERT INTO dislikes (user_id, disliked_videos) VALUES (${request.session.userID}, ${request.body.vid});`);
                    response.render('pages/player', { "username": request.session.username, "title": request.body.title,
                        "vURL": request.body.vurl, "vid": request.body.vid, "isDisliked": false, comments });
                }
            });
        } else if (typeof(request.body.commented) !== "undefined" && request.body.commented) {
            console.log(`Comment received, maybe?\n${request.session.userID}\t${request.body.commented}\t${request.body.vid}`);
            dbServer.query(`INSERT INTO comments (user_id, video_id, comment) VALUES (${request.session.userID}, ${request.body.vid}, '${request.body.commented}');`);
            comments = JSON.parse(request.body.comments);
            response.render('pages/player', { "username": request.session.username, "title": request.body.title,
                "vURL": request.body.vurl, "vid": request.body.vid, comments });
        } else { 
            console.log("Failed?");
            comments = JSON.parse(request.body.comments);
            response.render('pages/player', { "username": request.session.username, "title": request.body.title, 
                "vURL": request.body.vurl, "vid": request.body.vid, "isLiked": false, comments });
        } 
    } else { 
        console.log("Are you logged in?");
        comments = JSON.parse(request.body.comments);
        response.render('pages/player', { "username": request.session.username, "title": request.body.title, "vURL": request.body.vurl,
            "vid": request.body.vid, "isLiked": false, comments });
    } 
});

router.get('/registration(.html)?', (request, response) => {  // handles get requests to registration.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.sendFile(path.join(__dirname, 'views', 'registration.html'));  // send registration.html to client
});

router.get('/profile(.html)?', (request, response) => {   // handles get requests to profile.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.render('pages/profile', {  // render profile page with user data
        "user": request.session.user
    });
});

module.exports = router;