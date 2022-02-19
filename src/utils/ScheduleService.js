const moment = require('moment');

const TypesDateFormat = {
    SYSTEM: 'YYYYMMDD',
    DEFAULT_USER: 'DD.MM.YY',
    HOUR: 'HH:mm',
    INSERTION_TIME_SYSTEM: 'YYYY-MM-DD HH:mm:ss ZZ',
    INSERTION_DATE_SYSTEM: "YYYY-MM-DD",
}

function convertDateToString(date, requiredFormat) {
    return moment(date).format(requiredFormat);
}

function convertStringToDate(strDate, strDateFormat) {
    return moment(strDate, strDateFormat).toDate();
}

function replaceStrDateFormat(
    strDate,
    currentFormat,
    requiredFormat
) {
    let date = convertStringToDate(strDate, currentFormat);
    return convertDateToString(date, requiredFormat);
}

function getUtcFormatDate() {
    return moment().utcOffset(0).toDate();
}

function replaceDateToUtcFormat(date) {
    return moment(date).utcOffset(0).toDate();
}

function getUtcFormatStr(date) {
    return moment(date).utcOffset(0).format(TypesDateFormat.INSERTION_TIME_SYSTEM);
}

exports.TypesDateFormat = TypesDateFormat;
exports.convertDateToString = convertDateToString;
exports.convertStringToDate = convertStringToDate;
exports.replaceStrDateFormat = replaceStrDateFormat;
exports.getUtcFormatDate = getUtcFormatDate;
exports.replaceDateToUtcFormat = replaceDateToUtcFormat;
exports.getUtcFormatStr = getUtcFormatStr;
