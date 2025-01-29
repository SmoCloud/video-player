const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const mysql = require('mysql');
const { logger } = require('./middleware/logger');
const {hashMake, hashCheck} = require('./public/scripts/hasher')

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
    });

app.route('/player(.html)?')
    .get((request, response) => {
        if (typeof(request.query.title) !== "undefined" && request.query.title) {
            const title = request.query.title;
            const vURL = request.query.vurl;
            response.render('pages/player', { title, vURL });
        } else {
            response.sendFile(path.join(__dirname, 'views', 'player.html'));
        }
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.jsonData) !== "undefined" && request.body.jsonData) {
            const data = JSON.parse(request.body.jsonData);
            const key = request.body.thumber;
            const title = data[key].title;
            const vURL = data[key].url;
            response.render('pages/player', { title, vURL });
        // TODO: query videos database with input from search bar on player page
        } else if (typeof(request.body.srch) !== "undefined" && request.body.srch) {
            const searchQuery = "'%" + request.body.srch + "%'";
            dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery}`, (error, results, fields) => {
                if (error) 
                    throw (error);
                response.render('pages/index', { results });
            });
        }
    });

app.route('/upload(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'upload.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
    });

app.route('/login(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'login.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.create) !== "undefined") {
            response.sendFile(path.join(__dirname, 'views', 'registration.html'));
        }
        else if (typeof(request.body.login) !== "undefined") {
            const username = request.body.usr;
            const password = request.body.pwd;
            dbServer.query(`SELECT * FROM accounts WHERE username='${username}'`, (error, results, fields) => {
                const pwdMatch = password === hashCheck(password, results[0].password)
                if (error) 
                    throw (error);
                if (hashCheck(password, results[0].password)) {
                    response.sendFile(path.join(__dirname, 'views', 'index.html'));
                } else {
                    response.render('pages/login', { pwdMatch })
                }
            });
        }
    });

app.route('/registration(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'registration.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        console.log(`${request.body.email}\t${request.body.username}\t`);
        dbServer.query(`SELECT COUNT(*) AS count FROM accounts WHERE username='${request.body.username}'`, (error, results, fields) => {
            if (error) 
                throw (error);
            if (results[0].count === 0) {
                dbServer.query(`INSERT INTO accounts (email, username, password) VALUES ('${request.body.email}', '${request.body.username}', '${hashMake(request.body.password)}')`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    response.sendFile(path.join(__dirname, 'views', 'index.html'));
                });
            }
            console.log(results[0].count);
            // if (password === results[0].password) {
            //     response.sendFile(path.join(__dirname, 'views', 'index.html'));
            // }
        });
    });

app.get('/*', (request, response) => {
    response.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));