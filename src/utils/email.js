const nodemailer = require("nodemailer");
const { emailConfig } = require("../config/envVariables");
const ApiError = require("./ApiError");
const { StatusCodes } = require("http-status-codes");

// Create a singleton transporter instance
let transporter = null;

// Initialize email transporter with connection pooling
async function createTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: emailConfig.SMTP_HOST,
    port: parseInt(emailConfig.SMTP_PORT),
    secure: JSON.parse(emailConfig.SMTP_SECURE),
    auth: {
      user: emailConfig.SMTP_USERNAME,
      pass: emailConfig.SMTP_PASSWORD,
    },
    pool: true, // Enable connection pooling
    maxConnections: 5, // Maximum number of simultaneous connections
    maxMessages: 100, // Maximum number of messages per connection
    rateDelta: 1000, // Define the time window for rate limiting (1 second)
    rateLimit: 5, // Maximum number of messages per rateDelta
  });

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log("Email server connection established successfully");
  } catch (error) {
    console.error("Failed to establish email server connection:", error);
    transporter = null;
    throw new ApiError(
      "Failed to establish email server connection",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  return transporter;
}

async function sendEmail(to, subject, text, html) {
  // Ensure transporter is initialized
  const emailTransporter = await createTransporter();

  let mailOptions = {
    from: emailConfig.SMTP_USER,
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    let info = await emailTransporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email: " + error.message);
    // If connection error, clear transporter to force reconnection on next attempt
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      transporter = null;
    }
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

// Export the transporter initialization function for potential reuse
module.exports = {
  sendEmail,
  sendTemplateEmail,
  createTransporter,
};
