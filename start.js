const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'backend', 'server.js');

const backend = spawn('node', [serverPath, '--open'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'backend')
});

backend.on('error', (err) => {
  console.error('Failed to start backend server:', err);
});

backend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.log(`Backend server stopped with exit code ${code}`);
  }
});

