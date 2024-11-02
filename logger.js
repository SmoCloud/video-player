const { format } = require('date-fns');
const { v7: uuid } = require('uuid');
const fs = require('fs');
const promises = require('fs/promises');
const path = require('path');

const logger = async (msg, logFile) => {
    const dateTime = `${format(new Date(), 'yyyyMMdd\tHH:mm:ss')}`;
    const log = `${dateTime}\t${uuid()}\t${msg}\n`;
    try {
        if (!fs.existsSync(path.join(__dirname, 'logs'))) {
            await promises.mkdir(path.join(__dirname, 'logs'));
        }
        await promises.appendFile(path.join(__dirname, 'logs', logFile), log);
    } catch (error) {
        console.log(error);
    }
}

module.exports = logger;