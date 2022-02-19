const { createLogger, format, transports } = require("winston");
const ServerSettings = require('../settings/ServerSettings');
require("winston-daily-rotate-file");

const customFormat = format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.align(),
    format.printf((i) => `${i.level}: ${[i.timestamp]}: ${i.message}`),
);

const logger = createLogger({
    format: customFormat,
    transports: [
        new transports.DailyRotateFile({
            filename: `logs/server-${ServerSettings.env}-%DATE%.log`,
            datePattern: "YYYY-MM",
            zippedArchive: true,
            maxSize: "20m",
        }),
        new transports.Console()
    ],
});

module.exports = logger;