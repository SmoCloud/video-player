const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const mysql = require('mysql');
const { logger } = require('./middleware/logger');

const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(logger);
// Cross-Origin Resource Sharing (will allow for functionality in multiple browsers easier)
app.use(cors());
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const dbServer = mysql.createConnection({
    host: 'localhost',       // Database host (use your DB host if not localhost)
    user: 'guest',            // Your database username
    password: '',    // Your database password
    database: 'z_squared', // The name of your database
    port: 3306               // The port for the database (default is 3306 for MariaDB)
});

dbServer.connect((err) => {
    if (err) {
        console.error("Error connecting: " + err.stack);
        return;
    }
    else {
        console.log("Connected as id " + dbServer.threadId);
    }
});

app.route('^/$|/index(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        response.sendFile(path.join(__dirname, 'views', 'index.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.srch) !== "undefined" && request.body.srch) {
            const searchQuery = "'%" + request.body.srch + "%'";
            dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery}`, (error, results, fields) => {
                if (error) 
                    throw (error);
                response.render('pages/index', { results });
            });
        }
        // TODO: query videos database with input from search bar on index page
    });

app.route('/player(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'player.html'));
    })
    .post((request, response) => {
        console.log(`player.html post1: ${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.jsonData) !== "undefined" && request.body.jsonData) {
            const data = request.body.jsonData;
            const key = request.body.thumber;
            response.render('pages/player', { key, data });
            //console.log(`player.html post2: \t${data}\t${request.method}\t${request.headers.origin}\t${request.url}`);
        // TODO: query videos database with inut from search bar on player page
        }
    });

app.route('/upload(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'upload.html'));
    })
    .post((request, response) => {
        console.log(`upload.html post1: ${request.method}\t${request.headers.origin}\t${request.url}`);
        // TODO: upload video file to video database (video should also have a title)
    });

// login.php needs to be redone to work with node.js, so the php code has been removed
// the php code does still exist in the php-test branch, though, if you want to see it.
app.route('/login(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'login.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        // TODO: query database to ensure account exists and for authentication
        const username = request.body.usr;
        console.log(username);
        const password = request.body.pwd;

        dbServer.query(`SELECT * FROM accounts WHERE username='${username}'`, (error, results, fields) => {
            if (error) 
                throw (error);
            if (password === results[0].password) {
                response.sendFile(path.join(__dirname, 'views', 'index.html'));
            }
            console.log(results[0].password);
            //response.render('pages/index', { results });
        });
        // console.log(`${query}\t${typeof(query)}`);
        // response.send(`Hello ${username}`);
    });

app.route('/register(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'login.html'));
    })

app.get('/*', (request, response) => {
    response.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));