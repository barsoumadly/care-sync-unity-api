const { sendTemplateEmail } = require("../utils/email");
const emailTemplates = require("../templates/email/index");

module.exports = {
  sendEmailVerificationRequest: (to, link) =>
    sendTemplateEmail(to, emailTemplates.emailVerificationRequest, { link }),
  sendEmailVerificationSuccess: (to) =>
    sendTemplateEmail(to, emailTemplates.emailVerificationSuccess),
  sendPasswordResetRequest: (to, otp) =>
    sendTemplateEmail(
      to,
      emailTemplates.passwordResetRequest,
      { email: to, otp }
    ),
  sendPasswordResetSuccess: (to) =>
    sendTemplateEmail(to, emailTemplates.passwordResetSuccess),
};
