const { sendTemplateEmail } = require("../../../utils/email");
const emailTemplates = require("../../../templates/email/index");

module.exports = {
  sendEmailVerificationRequest: (to, otpObj) =>
    sendTemplateEmail(to, emailTemplates.emailVerificationRequest, otpObj),
  sendEmailVerificationSuccess: (to) =>
    sendTemplateEmail(to, emailTemplates.emailVerificationSuccess),
  sendPasswordResetRequest: (to, otpObj) =>
    sendTemplateEmail(to, emailTemplates.passwordResetRequest, otpObj),
  sendPasswordResetSuccess: (to) =>
    sendTemplateEmail(to, emailTemplates.passwordResetSuccess),
};
