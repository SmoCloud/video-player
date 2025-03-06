const express = require('express');
const session = require('express-session');
const formidable = require('formidable');
const fs = require('fs')
const app = express();
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2');
const { format } = require('date-fns');
const { randomUUID } = require('crypto');
const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler')
const { hashMake, hashCheck } = require('./public/scripts/hasher')

const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(logger);
// Cross Origin Resource Sharing (will allow for functionality in multiple browsers easier)
const whitelist = ['https://www.google.com', 'http://127.0.0.1:8080', 'http://localhost:8080', ];
const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) { // !origin must be removed before final release
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }, 
    optionsSuccessStatus: 200
};
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

dbServer.connect((err) => { // open connection to database
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
        if (typeof(request.body.results) === "undefined" && !request.body.results) {
            dbServer.query(`SELECT * FROM videos ORDER BY released LIMIT 10;`, (error, results, fields) => {
                if (error)
                    throw (error);
                if (typeof(request.session.user) !== "undefined" && request.session.user) {
                    // console.log(results);
                    response.render('pages/index', { "user": request.session.user, results });
                }
                else {
                    response.render('pages/index', { "user": [{}], results });
                }
            });
        } else {
            results = JSON.parse(request.body.results);
            response.render('pages/index', { "user": request.session.user, results });
        }
        // response.sendFile(path.join(__dirname, 'views', 'index.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.srch) !== "undefined" && request.body.srch) {
            const searchQuery = "'%" + request.body.srch + "%'";
            dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery};`, (error, results, fields) => {
                if (error) 
                    throw (error);
                // console.log(request.session.user);
                response.render('pages/search', { "user": request.session.user, results });
            });
        }
    });

app.route('/player(.html)?')
    .get((request, response) => {
        if (typeof(request.query.title) !== "undefined" && request.query.title) {
            const title = request.query.title;
            const vURL = request.query.vurl;
            const vID = request.query.video_id;
            console.log("Get request detected.");
        } else if (typeof(request.session.user.user_id) !== "undefined" && request.session.user.user_id) {
            dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos LIKE '${title}';`, (error, results, fields) => {
                console.log("Looking for likes.");
                if (error)
                    throw (error);
                if (results.length > 0) {
                    console.log(`${title} already liked by ${request.session.user.username}`)
                    response.render('pages/player', { "user": request.session.user, "title": title, "vURL": vURL, "vid": vID, "isLiked": true })
                } else {
                    response.render('pages/player', { "user": request.session.user, "title": title, "vURL": vURL, "vid": vID, "isLiked": false })
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
            const vID = data[key].video_id;
            dbServer.query(`SELECT username, comment FROM accounts a JOIN comments c ON a.user_id=c.user_id WHERE c.video_id LIKE ${vID};`, (error, comments, fields) => {
                if (error)
                    throw (error);
                if (comments.length > 0) {
                    response.render('pages/player', { "user": request.session.user, "title": title,
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
                response.render('pages/search', { results, "user": request.session.user, comments });
            });
        } else if (typeof(request.session.user) !== "undefined" && request.session.user) {
            console.log("Like detected.");
            if (typeof(request.body.liked) !== "undefined" && request.body.liked) {
                dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.user.user_id} AND disliked_videos=${request.body.vid};`,(error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log("Removing from dislikes...");
                        dbServer.query(`DELETE FROM dislikes WHERE disliked_videos=${request.body.vid};`)
                    }
                });
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.body.vid};`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log(`${request.body.title} already liked by ${request.session.user.username}`);
                        comments = JSON.parse(request.body.comments);
                        response.render('pages/player', { "user": request.session.user, 
                            "title": request.body.title, "vURL": request.body.vurl, "vid": request.body.vid, "isLiked": true, comments })
                    } else {
                        console.log("Attempting to insert like...");
                        dbServer.query(`INSERT INTO likes (user_id, liked_videos) VALUES (${request.session.user.user_id}, ${request.body.vid});`);
                        comments = JSON.parse(request.body.comments);
                        response.render('pages/player', { "user": request.session.user, 
                            "title": request.body.title, "vURL": request.body.vurl, "vid": request.body.vid, "isLiked": false, comments });
                    }
                });
            } else if (typeof(request.body.disliked) !== "undefined" && request.body.disliked) {
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.body.vid};`,(error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log("Removing from likes...");
                        dbServer.query(`DELETE FROM likes WHERE liked_videos=${request.body.vid};`)
                    }
                });
                dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.user.user_id} AND disliked_videos=${request.body.vid};`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log(`${request.body.title} already disliked by ${request.session.user.username}`);
                        comments = JSON.parse(request.body.comments);
                        response.render('pages/player', { "user": request.session.user, "title": request.body.title,
                            "vURL": request.body.vurl, "vid": request.body.vid, "isDisliked": true, comments });
                    } else {
                        console.log("Attempting to insert dislike...");
                        dbServer.query(`INSERT INTO dislikes (user_id, disliked_videos) VALUES (${request.session.user.user_id}, ${request.body.vid});`);
                        response.render('pages/player', { "user": request.session.user, "title": request.body.title,
                            "vURL": request.body.vurl, "vid": request.body.vid, "isDisliked": false, comments });
                    }
                });
            } else if (typeof(request.body.commented) !== "undefined" && request.body.commented) {
                console.log(`Comment received, maybe?\n${request.session.user.user_id}\t${request.body.commented}\t${request.body.vid}`);
                dbServer.query(`INSERT INTO comments (user_id, video_id, comment) VALUES (${request.session.user.user_id}, ${request.body.vid}, '${request.body.commented}');`);
                comments = JSON.parse(request.body.comments);
                response.render('pages/player', { "user": request.session.user, "title": request.body.title,
                    "vURL": request.body.vurl, "vid": request.body.vid, comments });
            } else { 
                console.log("Failed?");
                comments = JSON.parse(request.body.comments);
                response.render('pages/player', { "user": request.session.user, "title": request.body.title, 
                    "vURL": request.body.vurl, "vid": request.body.vid, "isLiked": false, comments });
            } 
        } else { 
            console.log("Are you logged in?");
            comments = JSON.parse(request.body.comments);
            response.render('pages/player', { "user": request.session.user, "title": request.body.title, "vURL": request.body.vurl,
                "vid": request.body.vid, "isLiked": false, comments });
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
            var n_path = 'C:/Program Files/Ampps/www/video-player/public/videos/' + files.fileToUpload[0].originalFilename; //THIS IS DEPENDENT ON HOST MACHINE

            dbServer.query(`INSERT INTO videos (title, description) VALUES ('${fields.v_title?.[0]}', '${fields.v_description?.[0]}');`);

            fs.copyFile(t_path, n_path, function (err) {
                if (err) throw err;
                response.write('File uploaded and moved!');
                response.end();
              });
          });
    });



app.route('/login(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            response.render('pages/profile', { "user": request.session.user });
        }
        else {
            response.render('pages/login', { "usrMatch": true, "pwdMatch": true, "results": request.body.results })
        }
    })
    .post((request, response) => {
        var usrMatch = true;
        var pwdMatch = true;
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            if (typeof(request.body.logout) !== "undefined" && request.body.logout) {
                request.session.destroy();
                results = JSON.parse(request.body.logout);
                response.render('pages/login', { "usrMatch": true, "pwdMatch": true, results })
            }
            else if (typeof(request.body.save) !== "undefined" && request.body.save) {
                // console.log("resuest.body.username: ", request.body.username);
                if (typeof(request.body.username) !== "undefined" && request.body.username) {
                    dbServer.query(`UPDATE accounts SET username='${request.body.username}' WHERE user_id=${request.session.user.user_id};`);
                    request.session.user.username = request.body.username;
                    response.render('pages/profile', { "user": request.session.user });
                }
                else if (typeof(request.body.bio) !== "undefined" && request.body.bio) {
                    dbServer.query(`UPDATE accounts SET bio='${request.body.bio}' WHERE user_id=${request.session.user.user_id};`);
                    request.session.user.bio = request.body.bio;
                }
                response.render('pages/profile', { "user": request.session.user });
            }
            else {
                response.render('pages/profile', { "user": request.session.user });
            }
        } 
        else if (typeof(request.body.create) !== "undefined" && request.body.create) {
            response.sendFile(path.join(__dirname, 'views', 'registration.html'));
        }
        else if (typeof(request.body.login) !== "undefined" && request.body.login) {
            dbServer.query(`SELECT * FROM accounts WHERE username='${request.body.usr}';`, (error, users, fields) => {
                if (error) 
                    throw (error);
                if (users.length > 0) {
                    pwdMatch = request.body.pwd === hashCheck(request.body.pwd, users[0].password);
                    if (hashCheck(request.body.pwd, users[0].password)) {
                        request.session.user = users[0];
                        request.session.user.DoB = format(request.session.user.DoB, 'yyyy-MM-dd');
                        console.log(request.session.user.DoB);
                        results = JSON.parse(request.body.jsonData);
                        response.render('pages/index', { "user": request.session.user, results });
                    } 
                } else {
                    usrMatch = false;
                    pwdMatch = false;
                    results = JSON.parse(request.body.jsonData);
                    response.render('pages/login', { usrMatch, pwdMatch, results });
                }
            });
        } else {
            results = JSON.parse(request.body.jsonData);
            // console.log(results);
            response.render('pages/login', { "usrMatch": true, "pwdMatch": true, results })
        }
    });

app.route('/registration(.html)?')
    .get((request, response) => {
        response.sendFile(path.join(__dirname, 'views', 'registration.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        // console.log(`${request.body.email}\t${request.body.username}\t`);
        dbServer.query(`SELECT COUNT(*) AS count FROM accounts WHERE username='${request.body.username}';`, (error, results, fields) => {
            if (error) 
                throw (error);
            if (results[0].count === 0) {
                dbServer.query(`INSERT INTO accounts (email, username, password, DoB) VALUES ('${request.body.email}', '${request.body.username}', '${hashMake(request.body.password)}', '${request.body.dob}');`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    response.sendFile(path.join(__dirname, 'views', 'index.html'));
                });
            }
        });
    });

app.route('/liked(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (request.session.user.username !== "undefined" && request.session.user.username) {
            dbServer.query(`SELECT * FROM likes l JOIN videos v ON v.video_id=l.liked_videos;`, (error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {
                    response.render('pages/liked', { results, "user": request.session.user })
                }
            })
        }
    })
    .post((request, response) => {

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