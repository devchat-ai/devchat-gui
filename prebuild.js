require('dotenv').config();

const fs = require('fs');
const path = require('path');

const logoPath = process.env.REACT_APP_LOGO_FILE;
if (!logoPath) {
  console.warn('REACT_APP_LOGO_FILE is not defined in your environment variables');
  process.exit(0);
}
if (!fs.existsSync(logoPath)) {
    console.warn('Logo file does not exist.');
    process.exit(0)
}

const destPath = path.join(__dirname, 'src/views/components/MessageAvatar/avatar_devchat.svg');

try {
    fs.copyFileSync(logoPath, destPath)
    fs.chmodSync(destPath, 0o644)
} catch(e) {
    console.warn(`Failed to copy logo ${e}`)
}