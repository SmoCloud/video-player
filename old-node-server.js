const http = require('http');
const path = require('path');
const fs = require('fs');
const promises = require('fs').promises;
const logger = require('./middleware/logger');
const EventEmit = require('events');

class Emitter extends EventEmit { };
const emitter = new Emitter();
emitter.on('log', (msg, fileName) => logger(msg, fileName));
const PORT = process.env.PORT || 3306;

const serve = async (filePath, contentType, response) => {
    try {
        const raw = await promises.readFile(
            filePath, 
            !(contentType.includes('image') || contentType.includes('video')) ? 'utf8' : ''
        );
        const data = contentType === 'application/json' ? JSON.parse(raw) : raw;
        response.writeHead(
            filePath.includes('404.html') ? 404 : 200,
            { 'Content-Type': contentType }
        );
        response.end(
            contentType === 'application/json' ? JSON.stringify(data) : data
        );
    } catch (error) {
        console.log(error);
        emitter.emit('log', `${error.name}: ${error.message}`, 'errorLog.txt');
        response.statusCode = 500;
        response.end();
    }
}

const server = http.createServer((request, response) => {
    console.log(request.url, request.method);
    emitter.emit('log', `${request.url}\t${request.method}`, 'requestLog.txt');

    const ext = path.extname(request.url);
    let contentType;
    switch(ext) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.ico':
            contentType = 'image/icon';
            break;
        case '.txt':
            contentType = 'text/plain';
            break;
        case '.php':
            contentType = 'text/php';
            break;
        case '.mp4':
            contentType = 'video/mp4';
            break;
        default:
            contentType = 'text/html';
            break;
    }

    let filePath = 
        contentType === 'text/html' && request.url === '/'
            ? path.join(__dirname, 'views', 'index.html')
            : contentType === 'text/html' && request.url.slice(-1) === '/'
                ? path.join(__dirname, 'views', request.url, 'index.html')
                : contentType === 'text/html'
                    ? path.join(__dirname, 'views', request.url)
                    : path.join(__dirname, request.url);

    if(!ext && request.url.slice(-1) !== '/') filePath += '.html';

    const fileExists = fs.existsSync(filePath);

    if(fileExists) {
        serve(filePath, contentType, response);
    } else {
        switch(path.parse(filePath).base) {
            case 'www-page.html':
                response.writeHead(301, { 'Location': '/' });
                break;
            default:
                serve(path.join(__dirname, 'views/error', '404.html'), 'text/html', response);
        }
    }
});
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));