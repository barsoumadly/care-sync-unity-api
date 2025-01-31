const PASSWORD_RESET_REQUEST = {
  subject: "Password Reset OTP",
  html: (otpObj) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
    <p>Your password reset OTP is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
        ${otpObj.otp}
      </div>
    </div>
    <p>This OTP will expire in ${otpObj.expiryTime} minutes for security reasons.</p>
    <p>Best regards,<br>Care Sync Unity</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`,
};

module.exports = PASSWORD_RESET_REQUEST;
