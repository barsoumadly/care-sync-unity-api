const fs = require('fs');
const path = require('path');

const SSL_KEY_PATH = path.join(process.cwd(), 'cert.key');
const SSL_CERT_PATH = path.join(process.cwd(), 'cert.crt');

const sslConfig = {
  isEnabled: false,
  options: null
};

// Check if SSL certificate files exist
if (fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
  sslConfig.isEnabled = true;
  sslConfig.options = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH)
  };
}

module.exports = sslConfig;