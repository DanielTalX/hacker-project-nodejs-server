/**
* Schemas that help check if the input values are valid
**/

// https://joi.dev/api/?v=17.4.1
const Joi = require('joi');

// example of regxep: password must be at least 6 characters long and contain a lowercase letter, an uppercase letter, a numeric digit and a special character."
// /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{6,}$/

const RegisterValidationSchema = Joi.object({
    firstName: Joi.string().min(2).max(80).required().pattern(new RegExp(/^[a-zA-Z ,.'-]+/)),
    lastName: Joi.string().min(2).max(80).required().pattern(new RegExp(/^[a-zA-Z ,.'-]+/)),
    username: Joi.string().alphanum().min(8).max(80).required(),
    email: Joi.string().min(8).max(100).required().pattern(new RegExp(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i)),
    password: Joi.string().min(10).max(100).required().pattern(new RegExp(/(?=.*[a-zA-Z])(?=.*[0-9]+).*/)), // new RegExp('^[a-zA-Z0-9]{3,30}$')
    password2: Joi.string().valid(Joi.ref('password')).required()
});

function registerValidation(data) {
    const validation = RegisterValidationSchema.validate(data);
    const error = validation.error;
    if (!!error)
        return error.details[0].message;
    return null;
}

const LoginValidationSchema = Joi.object({
    // username: Joi.string().min(8).max(100).required(),
    email: Joi.string().min(8).max(100).required().pattern(new RegExp(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i)),
    password: Joi.string().min(10).max(100).required().pattern(new RegExp(/(?=.*[a-zA-Z])(?=.*[0-9]+).*/)),
});

function loginValidation(data) {
    const validation = LoginValidationSchema.validate(data);
    const error = validation.error;
    if (!!error)
        return error.details[0].message;
    return null;
}

const ResetPasswordValidationSchema = Joi.object({
    email: Joi.string().min(8).max(100).required().pattern(new RegExp(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i)),
    password: Joi.string().min(10).max(100).required().pattern(new RegExp(/(?=.*[a-zA-Z])(?=.*[0-9]+).*/)), // new RegExp('^[a-zA-Z0-9]{3,30}$')
    password2: Joi.string().valid(Joi.ref('password')).required(),
    requestCode: Joi.string().required(),
    requestId: Joi.string().required()
});

function resetPasswordValidation(data) {
    const validation = ResetPasswordValidationSchema.validate(data);
    const error = validation.error;
    if (!!error)
        return error.details[0].message;
    return null;
}

const HackerEventValidionSchema = Joi.object({
    title: Joi.string().min(2).max(30).required(),
    subtitle: Joi.string().min(2).max(100),
    description: Joi.string().min(8).max(3000).required(),
    start: Joi.date().default(new Date()).greater(new Date(1970)).required(),
    end: Joi.date().greater(Joi.ref('start')),
    breachType: Joi.string().min(2).max(50).required(),
    group: Joi.string().min(2).max(100),
    url: Joi.string().min(2).max(255),
    votes: Joi.number().min(0).integer(),
});

function hackerEventValidation(data) {
    const validation = HackerEventValidionSchema.validate(data);
    const error = validation.error;
    if (!!error)
        return error.details[0].message;
    return null;
}

const RangeDateValidionSchema = Joi.object({
    startDate: Joi.date().greater(new Date(1970)).required(),
    endDate: Joi.date().required(),
});

function rangeDateValidation(data) {
    const validation = RangeDateValidionSchema.validate(data);
    const error = validation.error;
    if (!!error)
        return error.details[0].message;
    return null;
}

const ProfileValidationSchema = Joi.object({
    firstName: Joi.string().required().min(2).max(80).pattern(new RegExp(/^[a-zA-Z ,.'-]+/)),
    lastName: Joi.string().required().min(2).max(80).pattern(new RegExp(/^[a-zA-Z ,.'-]+/)),
    username: Joi.string().required().alphanum().min(8).max(80),
});

function profileValidation(data) {
    const validation = ProfileValidationSchema.validate(data);
    const error = validation.error;
    if (!!error)
        return error.details[0].message;
    return null;
}

function mapHackerEventToObj(hackerEvent) {
    return {
        // replace _id to id
        id: hackerEvent._id,
        title: hackerEvent.title,
        subtitle: hackerEvent.subtitle,
        description: hackerEvent.description,
        start: hackerEvent.start,
        end: hackerEvent.end,
        breachType: hackerEvent.breachType,
        group: hackerEvent.group,
        url: hackerEvent.url,
        votes: hackerEvent.votes,
      }
}

function mapUserToClientUser(user) {
    return {
        // replace _id to id
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        created: user.created,
        claims: [],
      }
}

function mapToProfileUser(data) {
    const { firstName, lastName, email, username, password, newPassword } = data;
    const profile = {firstName, lastName, email, username};
    if (password) profile['password'] = password;
    if (newPassword) profile['newPassword'] = newPassword;
    return profile;
}

function mapToHackerEvent(data) {
    const { title, subtitle, description, group, start,
        end, url, breachType } = data;
    const item = {title, subtitle, description,
        start: new Date(start), url, breachType};
    if (end) item['end'] = new Date(end);
    if (group) item['group'] = group;
    return item;
}

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.resetPasswordValidation = resetPasswordValidation;
module.exports.hackerEventValidation = hackerEventValidation;
module.exports.rangeDateValidation = rangeDateValidation;
module.exports.profileValidation = profileValidation;
module.exports.mapHackerEventToObj = mapHackerEventToObj;
module.exports.mapUserToClientUser = mapUserToClientUser;
module.exports.mapToProfileUser = mapToProfileUser;
module.exports.mapToHackerEvent = mapToHackerEvent;


