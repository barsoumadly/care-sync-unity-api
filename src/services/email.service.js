const { sendTemplateEmail } = require("../utils/email");
const emailTemplates = require("../templates/email/index");

module.exports = {
  sendEmailVerificationRequest: (to, link) =>
    sendTemplateEmail(to, emailTemplates.emailVerificationRequest, { link }),
  sendEmailVerificationSuccess: (to) =>
    sendTemplateEmail(to, emailTemplates.emailVerificationSuccess),
  sendPasswordResetRequest: (to, otpObj) =>
    sendTemplateEmail(to, emailTemplates.passwordResetRequest, {
      email: to,
      otpObj,
    }),
  sendPasswordResetSuccess: (to) =>
    sendTemplateEmail(to, emailTemplates.passwordResetSuccess),
};
