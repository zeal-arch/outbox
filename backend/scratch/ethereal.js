const nodemailer = require("nodemailer");

async function run() {
  const account = await nodemailer.createTestAccount();
  console.log("ETHEREAL_USER=" + account.user);
  console.log("ETHEREAL_PASSWORD=" + account.pass);
}

run();
