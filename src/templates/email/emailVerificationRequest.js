const EMAIL_VERIFICATION_REQUEST = {
  subject: "Verify Your Email Address",
  html: (data) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email Address</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Email Verification</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>Thank you for signing up! To complete your registration, please verify your email address.</p>
    <p>To verify your email, use the OTP code below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="background-color: #4CAF50; color: white; padding: 12px 20px; border-radius: 5px; font-weight: bold; font-size: 1.5em;">${data.otp}</span>
    </div>
    <p>This OTP will expire in 10 minutes for security reasons.</p>
    <p>If you didn't sign up for an account, please ignore this email.</p>
    <p>Best regards,<br>Your App Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;
  },
};

module.exports = EMAIL_VERIFICATION_REQUEST;
