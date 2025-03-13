import { createLog } from './logger.js';

const errorHandler = (error, request, response, next) => {
    createLog(`${error.name}: ${error.message}`, 'errorLog.txt')
    console.error(error.stack);
    // response.status(500).send(error.message);
    // response.end();
    return;
};

export default errorHandler;