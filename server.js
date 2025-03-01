const express = require('express');
const session = require('express-session');
const formidable = require('formidable');
const fs = require('fs')
const app = express();
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2');
const { randomUUID } = require('crypto');
const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler')
const { hashMake, hashCheck } = require('./public/scripts/hasher')

const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(logger);
// Cross Origin Resource Sharing (will allow for functionality in multiple browsers easier)
const whitelist = ['https://www.google.com', 'http://127.0.0.1:8080', 'http://localhost:8080'];
const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) { // !origin must be removed before final release
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }, 
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({   // session settings found in the expressjs.com docs
    genid               : function(req) {
        return randomUUID();
    },
    secret              : 'The Power of Z-Squared.',
    resave              : false,
    saveUninitialized   : false,
    cookie: { 
        path        : '/',
        httpOnly    : true,
        secure      : false,
        maxAge      : null,
    },
}));

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
        if (typeof(request.session.username) !== "undefined") {
            response.render('pages/index', {"username": request.session.username})
        }
        else {
            response.sendFile(path.join(__dirname, 'views', 'index.html'));
        }
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.srch) !== "undefined" && request.body.srch) {
            const searchQuery = "'%" + request.body.srch + "%'";
            dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery}`, (error, results, fields) => {
                if (error) 
                    throw (error);
                // console.log(request.session.username);
                response.render('pages/search', { "username": request.session.username, results });
            });
        }
    });

app.route('/player(.html)?')
    .get((request, response) => {
        if (typeof(request.query.title) !== "undefined" && request.query.title) {
            const title = request.query.title;
            const vURL = request.query.vurl;
            dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.userID} AND liked_videos LIKE '${title}'`, (error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {
                    console.log(`${title} already liked by ${request.session.username}`)
                    response.render('pages/player', { "username": request.session.username, title, vURL, "isLiked": true })
                } else {
                    response.render('pages/player', { "username": request.session.username, title, vURL, "isLiked": false })
                }
            });
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
            response.render('pages/player', { "username": request.session.username, title, vURL });
        // TODO: query videos database with input from search bar on player page
        } else if (typeof(request.body.srch) !== "undefined" && request.body.srch) {
            const searchQuery = "'%" + request.body.srch + "%'";
            dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery}`, (error, results, fields) => {
                if (error) 
                    throw (error);
                response.render('pages/index', { results });
            });
        } else if (typeof(request.body.liked) !== "undefined" && request.body.liked) {
            if (typeof(request.session.userID) !== "undefined" && request.session.userID) {
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.userID} AND liked_videos='${title}'`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log(`${title} already liked by ${request.session.username}`)
                        response.render('pages/player', { "username": request.session.username, title, vURL, "isLiked": true })
                    } else {
                        console.log("Attempting to insert like...");
                        dbServer.query(`INSERT INTO likes (user_id, liked_videos) VALUES (${request.session.userID}, '${title}');`)
                    }
                });
            } else {   
                response.render('pages/player', { "username": request.session.username, title, vURL, "isLiked": false })
            } 
        }
    });

app.route('/upload(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'upload.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        const form = new formidable.IncomingForm();
        form.parse(request, (err, fields, files) => {
            if (err) {
              next(err);
              return;
            }

            const allowedTypes = ["video/mp4"];
            if (!allowedTypes.includes(files.fileToUpload[0].mimetype)) {
                response.end("Invalid File Type");
                return;
            }
    
            var t_path = files.fileToUpload[0].filepath;
            var n_path = 'C:\\Users\\yourWindowsName\\Desktop\\' + files.fileToUpload[0].originalFilename; //THIS IS DEPENDENT ON HOST MACHINE

            dbServer.query(`INSERT INTO videos (title, description) VALUES ('${fields.v_title?.[0]}', '${fields.v_description?.[0]}')`);

            fs.copyFile(t_path, n_path, function (err) {
                if (err) throw err;
                response.write('File uploaded and moved!');
                response.end();
              });
          });
    });

app.route('/login(.html)?')
    .get((request, response) => {
        if (typeof(request.session.username) !== "undefined") {
            response.render('pages/profile', { "username": request.session.username });
        }
        else {
            response.sendFile(path.join(__dirname, 'views', 'login.html'));
        }
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.create) !== "undefined") {
            response.sendFile(path.join(__dirname, 'views', 'registration.html'));
        }
        else if (typeof(request.body.login) !== "undefined") {
            const username = request.body.usr;
            const password = request.body.pwd;
            const usrMatch = false;
            const pwdMatch = false;
            dbServer.query(`SELECT * FROM accounts WHERE username='${username}'`, (error, results, fields) => {
                if (error) 
                    throw (error);
                if (results.length > 0) {
                    const pwdMatch = password === hashCheck(password, results[0].password);
                    if (hashCheck(password, results[0].password)) {
                        request.session.username = username;
                        request.session.userID = results[0].user_id;
                        response.render('pages/index', { "username": request.session.username });
                    }
                } else {
                    const usrMatch = false;
                    response.render('pages/login', { usrMatch, pwdMatch })
                }
            }
        )}
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

app.all('*', (request, response) => {
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));