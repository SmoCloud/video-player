import { format } from 'date-fns';
import { v7 as uuid } from 'uuid';
import { existsSync } from 'fs';
import { mkdir, appendFile } from 'fs/promises';
import { join } from 'path';
import { dirname } from "node:path";    // gives the root directory of the project
const __dirname = dirname(process.argv[1]);

const createLog = async (msg, logFile) => {
    const dateTime = `${format(new Date(), 'yyyy-MM-dd\tHH:mm:ss')}`;
    const log = `${dateTime}\t${uuid()}\t${msg}\n`;
    try {
        if (!existsSync(join(__dirname, 'logs'))) {
            await mkdir(join(__dirname, 'logs'));
        }
        await appendFile(join(__dirname, 'logs', logFile), log);
    } catch (error) {
        console.log(error)
        if (!existsSync(join(__dirname, 'logs'))) {
            await mkdir(join(__dirname, 'logs'));
        }
        await appendFile(join(__dirname, 'logs', 'errorLog.txt'), `${dateTime}\t${uuid()}\t${error}\n`)
    }
};

const logger = (request, response, next) => {
    createLog(`${request.method}\t${request.headers.origin}\t${request.url}`, 'reqLog.txt');
    next();
};

export {createLog, logger};