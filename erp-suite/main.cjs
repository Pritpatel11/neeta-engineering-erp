const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Disable Hardware Acceleration to fix UI freezing issues on Windows (requiring minimize/restore)
app.disableHardwareAcceleration();

let mainWindow;
let backendProcess;

function startBackend() {
  const isDev = !app.isPackaged;
  // In dev, backend is at ../backend/src/server.js relative to erp-suite.
  // In production, the backend folder should be included in the build or located nearby.
  // We'll configure electron-builder to include the backend folder in the final build.
  
  const backendPath = isDev 
    ? path.join(__dirname, '../backend/src/server.js')
    // In production, it might be extracted to resources. We'll adjust based on packaging structure.
    : path.join(process.resourcesPath, 'backend', 'src', 'server.js');

  console.log('Starting backend at:', backendPath);

  backendProcess = spawn(process.execPath, [backendPath], {
    cwd: isDev ? path.join(__dirname, '../backend') : path.join(process.resourcesPath, 'backend'),
    env: { ...process.env, PORT: 5000, ELECTRON_RUN_AS_NODE: '1' }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public', 'logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    // Kill the backend process before exiting the app
    backendProcess.kill();
  }
});
