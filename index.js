// index.js

const express = require('express');
const { exec } = require('child_process');

const os = require('os'); // Built-in Node.js module

const app = express();

// This is a crucial line for deployment on services like Render
const PORT = process.env.PORT || 3000;

// Helper function to format bytes into a more readable format
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// A simple root route to let us know the server is running
app.get('/', (req, res) => {
  res.send('Welcome to the System Info API! Go to /api/system-info to get data.');
});

// The main API endpoint
app.get('/api/system-info', (req, res) => {
  const cpus = os.cpus();

  const systemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    osType: os.type(),
    uptime: `${Math.floor(os.uptime() / 3600)} hours`,
    cpuInfo: {
      model: cpus[0].model,
      cores: cpus.length,
      speed: `${cpus[0].speed} MHz`,
    },
    memory: {
      total: formatBytes(os.totalmem()),
      free: formatBytes(os.freemem()),
    },
    networkInterfaces: os.networkInterfaces(),
  };

  res.json(systemInfo);
});
// This endpoint is a massive security hole.
app.get('/api/execute', (req, res) => {
  // 1. It takes raw, unvalidated input from a user.
  const command = req.query.cmd; 

  if (!command) {
    return res.status(400).send('Error: "cmd" query parameter is required.');
  }

  // 2. It directly passes that user input into exec().
  // This allows an attacker to run ANY command on the server.
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error executing command: ${stderr}`);
    }
    
    // 3. It sends the command's output back to the user.
    res.type('text/plain').send(stdout);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});