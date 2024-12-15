const nodemailer = require("nodemailer");
const { emailConfig } = require("../config/envVariables");
const ApiError = require("./ApiError");
const { StatusCodes } = require("http-status-codes");

async function sendEmail(to, subject, text, html) {
  let transporter = nodemailer.createTransport({
    host: emailConfig.SMTP_HOST,
    port: parseInt(emailConfig.SMTP_PORT),
    secure: JSON.parse(emailConfig.SMTP_SECURE),
    auth: {
      user: emailConfig.SMTP_USERNAME,
      pass: emailConfig.SMTP_PASSWORD,
    },
  });

  let mailOptions = {
    from: emailConfig.SMTP_USER,
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email: " + error.message);
    throw new ApiError(
      "Failed to send email",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

const sendTemplateEmail = async (to, template, data = {}) => {
  const { subject, html } = template;
  const emailHtml = typeof html === "function" ? html(data) : html;
  await sendEmail(to, subject, "", emailHtml);
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
};
