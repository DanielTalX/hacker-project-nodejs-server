// https://www.npmjs.com/package/nodemailer
// https://nodemailer.com/about/
const nodemailer = require("nodemailer");

let secrets;
if (process.env.NODE_ENV == "production") {
    secrets = process.env;
} else {
    secrets = require("../settings/ServerSettingsDev");
}

/**
 * // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
 */

// create reusable transporter object using the default SMTP transport
const emailService = nodemailer.createTransport({
    host: secrets.EMAIL_HOST,
    port: secrets.EMAIL_PORT,
    secure: true,
    auth: {
        user: secrets.EMAIL_USERNAME,
        pass: secrets.EMAIL_PW,
    },
});

module.exports = emailService;
