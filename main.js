const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  clipboard,
} = require("electron");
const ElectronStore = require("electron-store");

const store = new ElectronStore();
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.hide();

  // Load existing items
  const items = store.get("clipboardItems", []);
  mainWindow.webContents.send("load-items", items);
}

app.whenReady().then(() => {
  createWindow();

  // Register shortcut
  globalShortcut.register("CommandOrControl+Shift+V", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      // Position near cursor
      const { screen } = require("electron");
      const cursor = screen.getCursorScreenPoint();
      const { width, height } = mainWindow.getBounds();
      mainWindow.setPosition(cursor.x - width / 2, cursor.y + 20);
    }
  });

  // Monitor clipboard
  let lastContent = "";
  setInterval(() => {
    const content = clipboard.readText();
    if (content && content !== lastContent) {
      lastContent = content;
      const items = store.get("clipboardItems", []);
      if (!items.includes(content)) {
        items.unshift(content);
        store.set("clipboardItems", items.slice(0, 50));
        mainWindow.webContents.send("new-item", content);
      }
    }
  }, 500);
});

ipcMain.on("paste-item", (event, content) => {
  clipboard.writeText(content);
  mainWindow.hide();

  // Simulate paste command
  const { exec } = require("child_process");
  exec("xdotool key ctrl+v", (error) => {
    if (error) console.error("Paste simulation failed:", error);
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
