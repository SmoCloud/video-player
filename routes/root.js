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
    response.sendFile(path.join(__dirname, '..', 'views', 'upload.html'));    // send upload.html file (no extra data needed to be sent as session holds user data, if user is logged in)
});

router.route('/login(.html)?')
.get((request, response) => { // handles get requests to login.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
        response.redirect(303, 'profile.html'); // redirect to profile.html with a 303 status code, which will make a GET request to the new page being redirected to
    }
    else {
        response.sendFile(path.join(__dirname, '..', 'views', 'login.html')); // else send the login.html page
    }
})
.post((request, response) => {  // post requests handled here
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    if (typeof(request.body.create) !== "undefined" && request.body.create) {  // if create account clicked on login page (not logged in)
        response.redirect(303, 'registration.html');    // redirect to registration.html with status code 303
    }
});

router.get('/registration(.html)?', (request, response) => {  // handles get requests to registration.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.sendFile(path.join(__dirname, '..', 'views', 'registration.html'));  // send registration.html to client
});

router.get('/profile(.html)?', (request, response) => {   // handles get requests to profile.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.render('pages/profile', {  // render profile page with user data
        "user": request.session.user
    });
});

module.exports = router;