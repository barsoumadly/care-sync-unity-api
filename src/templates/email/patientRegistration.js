const patientRegistrationTemplate = (data) => `
Dear ${data.name},

Welcome to Care Sync! An appointment has been booked for you, and we've created an account to help you manage your healthcare journey.

Your account credentials:
Email: ${data.email}
Password: ${data.password}

Please log in to your account and change your password for security purposes.

Best regards,
Care Sync Team
`;

module.exports = patientRegistrationTemplate;
