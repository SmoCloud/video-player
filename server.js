const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const mysql = require('mysql');
const { logger } = require('./middleware/logger');

const PORT = process.env.PORT || 8080;

app.use(logger);

// Cross-Origin Resource Sharing (will allow for functionality in multiple browsers easier)
app.use(cors());

app.use(express.static(path.join(__dirname, '/public')));

app.use(express.urlencoded({ extended: true }));

const dbServer = mysql.createConnection({
    host: 'localhost',       // Database host (use your DB host if not localhost)
    user: 'guest',            // Your database username
    password: '',    // Your database password
    database: 'accounts', // The name of your database
    port: 3306               // The port for the database (default is 3306 for MariaDB)
  });

app.route('^/$|/index(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'index.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        // TODO: query videos database with input from search bar on index page
    });

app.route('/player(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'player.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.orign}\t${request.url}`);
        // TODO: query videos database with inut from search bar on player page
    })

app.route('/upload(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'upload.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        // TODO: upload video file to video database (video should also have a title)
    })

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

        const query = dbServer.query('SELECT * FROM accounts WHERE username=(?)', [username]);
        console.log(`${query}\t${typeof(query)}`);
        response.send(`Hello ${username}`);
    });

app.get('/*', (request, response) => {
    response.status(404).sendFile(path.join(__dirname, 'views/error', '404.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));