const https = require('https');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const formidable = require('formidable');
const app = express();
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2');
const { format } = require('date-fns');
const { randomUUID } = require('crypto');
const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { hashMake, hashCheck } = require('./public/scripts/hasher');

const PORTS = [ 
    process.env.PORT || 8080,
    process.env.PORT || 8443
 ];

app.set('view engine', 'ejs');
app.use(logger);
// Cross Origin Resource Sharing (will allow for functionality in multiple browsers easier)
const whitelist = [
    // 'https://www.google.com',
    'https://127.0.0.1:8443',
    'https://localhost:8443',
    'http://127.0.0.1:8080',
    'http://localhost:8080',
    'http://10.0.0.135:8080'
];
const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) { // !origin must be removed before final release
            callback(null, true);
        } 
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }, 
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

var server = null;
try {
    const keys = {
        key: fs.readFileSync('./cert/local.decrypted.key'),
        cert: fs.readFileSync('./cert/local.crt')
    };
    
    server = https.createServer(keys, app);
} 
catch (error) {
    console.log(error);
}

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
        if (typeof(request.session.flags) === "undefined") {
            request.session.flags = {};
        }
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        dbServer.query(`SELECT video_id, title, thumbnail, url FROM videos ORDER BY released LIMIT 10;`, (error, results, fields) => {
            if (error)
                throw (error);
            if (results.length > 0) {
                if (typeof(request.session.user) !== "undefined" && request.session.user) {
                    response.render('pages/index', { 
                        "user": request.session.user,
                        results
                    });
                }
                else {
                    response.render('pages/index', { 
                        "user": [{}], 
                        results 
                    });
                }
            }
        });
    });

app.route('/player(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.query.video) !== "undefined" && request.query.video) {
            if (typeof(request.session.video) === "undefined" || !request.session.video || request.session.video !== request.query.video) {
                request.session.video = JSON.parse(request.query.video);
            }
            if (typeof(request.session.comments) !== "undefined" || !request.session.comments)
            dbServer.query(`SELECT username, comment FROM accounts a JOIN comments c ON a.user_id=c.user_id WHERE c.video_id LIKE ${request.session.video.video_id};`, (error, comments, fields) => {
                if (error)
                    throw (error);
                response.render('pages/player', {
                    "user": request.session.user,
                    "vData": request.session.video,
                    comments
                });
            });
            console.log(`JSON data detected.\t${request.session.video.url}\t`);
        } 
        else if (typeof(request.session.video) !== "undefined" && request.session.video) {
            console.log("Am I making it here like I should be if I'm coming back after liking?");
            dbServer.query(`SELECT username, comment FROM accounts a JOIN comments c ON a.user_id=c.user_id WHERE c.video_id LIKE ${request.session.video.video_id};`, (error, comments, fields) => {
                if (error)
                    throw (error);
                response.render('pages/player', {
                    "user": request.session.user,
                    "vData": request.session.video,
                    comments
                });
            });
        }
        else {
            response.sendFile(path.join(__dirname, 'views', 'player.html'));
        }
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.body.liked) !== "undefined" && request.body.liked) {
            if (typeof(request.session.user) !== "undefined" && request.session.user) {
                response.session.flags.isLiked = true;
                dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.user.user_id} AND disliked_videos=${vData.video_id};`,(error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log("Removing from dislikes...");
                        dbServer.query(`DELETE FROM dislikes WHERE disliked_videos=${request.session.video.video_id} AND user_id=${request.session.user.user_id};`)
                    }
                });
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.session.video.video_id};`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log(`${request.session.video.title} already liked by ${request.session.user.username}`);
                    }
                    else {
                        console.log("Attempting to insert like...");
                        dbServer.query(`INSERT INTO likes (user_id, liked_videos) VALUES (${request.session.user.user_id}, ${vData.video_id});`);
                        dbServer.query(`UPDATE videos SET likes=likes+1 WHERE video_id=${request.session.video.video_id};`);
                    }
                });
                response.render('pages/player', {
                    "user": request.session.user,
                    "vData": request.session.video,
                    "isLiked": response.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
            response.render('pages/player', { 
                "user": request.session.user,
                "vData": request.session.video,
                "comments": JSON.parse(request.body.comments)
            });
        }
        else if (typeof(request.body.disliked) !== "undefined" && request.body.disliked) {
            if (typeof(request.session.user) !== "undefined" && request.session.user) {
                response.session.flags.isLiked = false;
                dbServer.query(`SELECT * FROM likes WHERE user_id LIKE ${request.session.user.user_id} AND liked_videos=${request.session.video.video_id};`,(error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log("Removing from likes...");
                        dbServer.query(`DELETE FROM likes WHERE liked_videos=${request.session.video.video_id} AND user_id=${request.session.user.user_id};`)
                        dbServer.query(`UPDATE videos SET likes=likes-1 WHERE video_id=${request.session.video.video_id};`);
                    }
                });
                dbServer.query(`SELECT * FROM dislikes WHERE user_id LIKE ${request.session.user.user_id} AND disliked_videos=${request.session.video.video_id};`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    if (results.length > 0) {
                        console.log(`${request.session.video.title} already disliked by ${request.session.user.username}`);
                    }
                    else {
                        console.log("Attempting to insert dislike...");
                        dbServer.query(`INSERT INTO dislikes (user_id, disliked_videos) VALUES (${request.session.user.user_id}, ${request.session.video.video_id});`);
                    }
                });
                response.render('pages/player', {
                    "user": request.session.user,
                    "vData": request.session.video,
                    "isLiked": response.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
            else {
                response.render('pages/player', { 
                    "user": request.session.user,
                    "vData": request.session.video,
                    "isLiked": request.session.flags.isLiked,
                    "comments": JSON.parse(request.body.comments)
                });
            }
        }
        else if (typeof(request.body.commented) !== "undefined" && request.body.commented) {
            if (typeof(request.session.user) !== "undefined" && request.session.user) {
                dbServer.query(`INSERT INTO comments (user_id, video_id, comment) VALUES (${request.session.user.user_id}, ${video.video_id}, '${request.body.commented}');`);
            }
            response.render('pages/player', { 
                "user": request.session.user,
                "vData": request.body.video,
                "isLiked": request.session.flags.isLiked,
                "comments": JSON.parse(request.body.comments)
            });
        }
        else { 
            console.log("Failed?");
            response.render('pages/player', { 
                "user": request.session.user,
                "vData": request.body.video,
                "comments": JSON.parse(request.body.comments)
            });
        } 
    });

app.route('/search(.html)?') 
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.query.srch) !== "undefined" && request.query.srch) {
            const searchQuery = "'%" + request.query.srch + "%'";
            console.log("Search detected.")
            dbServer.query(`SELECT * FROM videos WHERE title LIKE ${searchQuery};`, (error, results, fields) => {
                if (error) 
                    throw (error);
                console.log("Rendering player page with search results...");
                response.render('pages/search', { 
                    results, 
                    "user": request.session.user
                });
            });
        }
    });

app.route('/upload(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        response.sendFile(path.join(__dirname, 'views', 'upload.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            const form = new formidable.IncomingForm();
            form.parse(request, (err, fields, files) => {
                if (err) {
                    next(err);
                    return;
                }

                const allowedVideoTypes = [
                    "video/mp4", 
                    "video/ogg",
                    "video/webm", 
                    "video/mp3", 
                    "video/3gpp", 
                    "video/mpeg",
                    "video/quicktime"
                ];
                const allowedImageTypes = ["image/jpeg", "image/png"];
                if (!allowedVideoTypes.includes(files.fileToUpload[0].mimetype)) {
                    response.end("Invalid Video File Type");
                    return;
                }
                if (!allowedImageTypes.includes(files.thumbnail[0].mimetype)) {
                    response.end("Invalid Image File Type");
                    return;
                }
        
                var temp_paths = [
                    files.fileToUpload[0].filepath,
                    files.thumbnail[0].filepath
                ]
                console.log(files.fileToUpload[0]);
                var new_paths = [
                    'C:/Program Files/Ampps/www/video-player/public/videos/' + files.fileToUpload[0].originalFilename,
                    'C:/Program Files/Ampps/www/video-player/public/thumbnails/' + files.thumbnail[0].originalFilename
                ] // THIS IS DEPENDENT ON SERVER/HOST MACHINE

                dbServer.query(`INSERT INTO videos (user_id, title, description, released, thumbnail, url) VALUES
                    (${request.session.user.user_id}, 
                    '${fields.v_title?.[0]}', 
                    '${fields.v_description?.[0]}', 
                    '${format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss')}', 
                    '${files.fileToUpload[0].originalFilename}', 
                    '${files.thumbnail[0].originalFilename}');`
                , (error, results, fields) => {
                    if (error) 
                        throw (error);
                });

                temp_paths.forEach((path, index) => {
                    fs.copyFile(path, new_paths[index], (err) => {
                        if (err) throw err;
                        response.write('File uploaded and moved!');
                        response.end();
                    });
                });
            });
        }
    });

app.route('/login(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            response.redirect(303, 'profile.html');
        }
        else {
            response.sendFile(path.join(__dirname, 'views', 'login.html'));
        }
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            if (typeof(request.body.logout) !== "undefined" && request.body.logout) {
                request.session.destroy();
                response.render('pages/login', { 
                    "usrMatch": true, 
                    "pwdMatch": true 
                });
            }
            else if (typeof(request.body.save) !== "undefined" && request.body.save) {
                // console.log("resuest.body.username: ", request.body.username);
                if (typeof(request.body.username) !== "undefined" && request.body.username) {
                    dbServer.query(`UPDATE accounts SET username='${request.body.username}' WHERE user_id=${request.session.user.user_id};`);
                    request.session.user.username = request.body.username;
                    response.redirect(303, 'profile.html');
                }
                else if (typeof(request.body.bio) !== "undefined" && request.body.bio) {
                    dbServer.query(`UPDATE accounts SET bio='${request.body.bio}' WHERE user_id=${request.session.user.user_id};`);
                    request.session.user.bio = request.body.bio;
                }
            }
            response.redirect(303, 'profile.html');
        }
        else if (typeof(request.body.create) !== "undefined" && request.body.create) {
            response.redirect(303, 'registration.html');
        }
        else if (typeof(request.body.login) !== "undefined" && request.body.login) {
            dbServer.query(`SELECT * FROM accounts WHERE username='${request.body.usr}';`, (error, users, fields) => {
                if (error) 
                    throw (error);
                if (users.length > 0) {
                    if (hashCheck(request.body.pwd, users[0].password)) {
                        request.session.user = users[0];
                        request.session.user.DoB = format(request.session.user.DoB, 'yyyy-MM-dd');
                        response.redirect(303, 'index.html');
                    } 
                    else {
                        response.render('pages/login', { 
                            "usrMatch": true, 
                            "pwdMatch": false 
                        });
                    }
                } 
                else {
                    response.render('pages/login', { 
                        "usrMatch": false, 
                        "pwdMatch": false 
                    });
                }
            });
        }
    });

app.route('/registration(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        response.sendFile(path.join(__dirname, 'views', 'registration.html'));
    })
    .post((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        dbServer.query(`SELECT COUNT(*) AS count FROM accounts WHERE username='${request.body.username}';`, (error, results, fields) => {
            if (error) 
                throw (error);
            if (results[0].count === 0) {
                dbServer.query(`INSERT INTO accounts (email, username, password, DoB) VALUES ('${request.body.email}', '${request.body.username}', '${hashMake(request.body.password)}', '${request.body.dob}');`, (error, results, fields) => {
                    if (error)
                        throw (error);
                    response.redirect(303, 'index.html');
                });
            }
        });
    });

app.route('/liked(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        if (typeof(request.session.user) !== "undefined" && request.session.user) {
            dbServer.query(`SELECT * FROM likes l JOIN videos v ON v.video_id=l.liked_videos WHERE l.user_id=${request.session.user.user_id};`, (error, results, fields) => {
                if (error)
                    throw (error);
                if (results.length > 0) {
                    response.render('pages/liked', {  
                        "user": request.session.user,
                        results
                    });
                }
            });
        }
    });
    // .post((request, response) => {

    // });

app.route('/profile(.html)?')
    .get((request, response) => {
        console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
        console.log('Request received for profle page.');
        response.render('pages/profile', {
            "user": request.session.user
        });
    });

app.all('*', (request, response) => {
    console.log(`${request.method}\t${request.headers.origin}\t${request.url}`);
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

try {
    app.listen(PORTS[0], () => console.log(`Server running on port ${PORTS[0]}`));
    // server.listen(PORTS[1], () => {console.log(`Server is listening on https://localhost:${PORTS[1]}`)});
}
catch (error) {
    console.log(error);
}