const DOCTOR_REGISTRATION = {
  subject: "Welcome to Care Sync Unity - Your Account Details",
  html: (data) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Doctor Registration</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Welcome to Care Sync Unity</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello Dr. ${data.name},</p>
    <p>Your account has been created successfully in Care Sync Unity. Below are your login credentials:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${data.password}</p>
      </div>
    </div>
    <p style="color: #e74c3c; font-weight: bold;">Important Security Notice:</p>
    <p>For your security, please change your password immediately after your first login. This temporary password should not be kept for extended use.</p>
    <p>Best regards,<br>Care Sync Unity Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`,
};

module.exports = DOCTOR_REGISTRATION;