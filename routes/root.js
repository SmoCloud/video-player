import { Router } from 'express';
import session from 'express-session'; // Add-on for express that creates a session attached to client requests
const router = Router();
import { join } from 'path';
import { dirname } from "node:path";    // gives the root directory of the project
const __dirname = dirname(process.argv[1]);

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

router.get('^/$|/index(.html)?', (request, response) => {
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
    response.sendFile(join(__dirname, 'views', 'index.html'));
});

router.get('/search(.html)?', (request, response) => {    // handles all api search requests from clients
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    // console.log(request.params.search);
    response.sendFile(join(__dirname, 'views', 'search.html'));
});

router.route('/player(.html)?')    // handles all requests to player.html
.get((request, response) => {   // get requests handles here
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.sendFile(join(__dirname, 'views', 'player.html'));    // send the player.html file itself
})

router.get('/upload(.html)?', (request, response) => {    // handles get requests to the upload.html page from client
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.sendFile(join(__dirname, 'views', 'upload.html'));    // send upload.html file (no extra data needed to be sent as session holds user data, if user is logged in)
});

router.get('/login(.html)?', (request, response) => { // handles get requests to login.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
        response.redirect(303, 'profile.html'); // redirect to profile.html with a 303 status code, which will make a GET request to the new page being redirected to
    }
    else {
        response.sendFile(join(__dirname, 'views', 'login.html')); // else send the login.html page
    }
});

router.get('/registration(.html)?', (request, response) => {  // handles get requests to registration.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.sendFile(join(__dirname, 'views', 'registration.html'));  // send registration.html to client
});

router.route('/profile(.html)?')
.get((request, response) => {   // handles get requests to profile.html
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);    // log request details
    response.render('pages/profile', {  // render profile page with user data
        "user": request.session.user
    });
})
.post((request, response) => {
    if (typeof(request.session.user) !== "undefined" && request.session.user) { // if a user is logged in
        if (typeof(request.body.logout) !== "undefined" && request.body.logout) {   // if the logout button was clicked
            request.session.destroy();  // terminate the session
            response.sendFile(join(__dirname, 'views', 'login.html')); // send the login page
        }
    }
    return;
});

export { router };