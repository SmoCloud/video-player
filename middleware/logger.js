const { format } = require('date-fns');
const { v7: uuid } = require('uuid');
const fs = require('fs');
const promises = require('fs/promises');
const path = require('path');

const createLog = async (msg, logFile) => {
    const dateTime = `${format(new Date(), 'yyyy-MM-dd\tHH:mm:ss')}`;
    const log = `${dateTime}\t${uuid()}\t${msg}\n`;
    try {
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await promises.mkdir(path.join(__dirname, '..', 'logs'));
        }
        await promises.appendFile(path.join(__dirname, '..', 'logs', logFile), log);
    } catch (error) {
        console.log(error)
        await promises.appendFile(path.join(__dirname, '..', 'logs', 'errorLog.txt'), error)
    }
};

const logger = (request, response, next) => {
    createLog(`${request.method}\t${request.headers.origin}\t${request.url}`, 'reqLog.txt');
    next();
};

module.exports = {createLog, logger};