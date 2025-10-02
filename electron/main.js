const { app, BrowserWindow, Menu } = require("electron");
const { ipcMain } = require("electron");
const { exec } = require("child_process");
const { Buffer } = require("buffer");
const iconv = require("iconv-lite");
const { readFileSync } = require("fs");
const https = require("https");

const path = require("path");
// Load .env in development
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config({ path: path.join(__dirname, ".env") });
  } catch {}
}

console.log(__dirname, path.join(__dirname, "preload.js"));

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // Ensure DevTools are available even in production for troubleshooting
      devTools: process.env.NODE_ENV === "development",
    },
  });

  // В режиме разработки загружаем через dev server, иначе из собранных файлов
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // When packaged, renderer/dist is inside app.asar at app/renderer/dist
    const rendererIndex = path.join(
      __dirname,
      "renderer",
      "dist",
      "index.html"
    );
    win.loadFile(rendererIndex);
  }

  Menu.setApplicationMenu(null);

  // Log renderer load issues to help debug white screen
  win.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      console.error("did-fail-load", {
        errorCode,
        errorDescription,
        validatedURL,
        isMainFrame,
      });
    }
  );
  win.webContents.on("render-process-gone", (event, details) => {
    console.error("render-process-gone", details);
  });
  win.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      console.log("renderer:", { level, message, line, sourceId });
    }
  );
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Функция для запуска Tailscale
const startTailscale = async () => {
  return new Promise((resolve, reject) => {
    exec("powershell Start-Service Tailscale", (error, stdout, stderr) => {
      if (error) {
        reject(`Error starting Tailscale: ${error.message}`);
        return;
      }
      resolve(stdout || stderr);
    });
  });
};

// Функция для остановки Tailscale
const stopTailscale = async () => {
  return new Promise((resolve, reject) => {
    exec("powershell Stop-Service Tailscale", (error, stdout, stderr) => {
      if (error) {
        reject(`Error stopping Tailscale: ${error.message}`);
        return;
      }
      resolve(stdout || stderr);
    });
  });
};

// Функция для получения статуса Tailscale
const getTailscaleConntectionStatus = async () => {
  return new Promise((resolve) => {
    exec(`ping -n 4 100.64.0.3`, { encoding: "buffer" }, (err, stdout) => {
      // Перекодируем cp866 → utf8
      const text = iconv.decode(stdout, "cp866");

      const result = {
        isActive: false,
        ping: "-",
        loss: "-",
      };

      if (!text) return resolve(result);

      // Парсим статистику
      const sentMatch = text.match(/Отправлено = (\d+)/i);
      const receivedMatch = text.match(/Получено = (\d+)/i);
      const lossMatch = text.match(/Потеряно = (\d+)/i);

      if (sentMatch && receivedMatch && lossMatch) {
        const sent = parseInt(sentMatch[1], 10);
        const received = parseInt(receivedMatch[1], 10);
        const lost = parseInt(lossMatch[1], 10);
        const lossPercent = Math.round((lost / sent) * 100);

        result.loss = `${lossPercent}%`;
        result.isActive = received > 0;
      }

      // Ищем "время=XXмс"
      const pingMatch = text.match(/время[=<](\d+)мс/i);
      if (pingMatch && result.isActive) {
        result.ping = `${pingMatch[1]} ms`;
      }

      resolve(result);
    });
  });
};

const getTailscaleStatus = async () => {
  return new Promise((resolve) => {
    exec(
      "powershell Get-Service Tailscale",
      { encoding: "buffer" },
      (err, stdout) => {
        // Перекодируем cp866 → utf8
        const text = iconv.decode(stdout, "cp866");

        const result = {
          isActive: false,
        };

        if (!text) return resolve(result);

        // Ищем состояние службы
        // В выводе PowerShell обычно есть колонка Status, пример:
        // Status   Name               DisplayName
        // ------   ----               -----------
        // Running  Tailscale          Tailscale
        const statusMatch = text.match(/Running/i);
        if (statusMatch) {
          result.isActive = true;
        }

        resolve(result);
      }
    );
  });
};

const sendFlagRequest = async () => {
  return new Promise((resolve, reject) => {
    try {
      const getCertsDir = () => {
        // In production, certs are unpacked to resources/app.asar.unpacked/certs
        if (app.isPackaged) {
          return path.join(process.resourcesPath, "app.asar", "certs");
        }
        // In development, certs live next to main.js
        return path.join(__dirname, "certs");
      };

      const certsDir = getCertsDir();
      const certPath = path.join(certsDir, "esp.crt");
      const keyPath = path.join(certsDir, "esp.key");
      const caPath = path.join(certsDir, "ca.crt");

      const cert = readFileSync(certPath);
      const key = readFileSync(keyPath);
      const ca = readFileSync(caPath);

      const flagUrl = process.env.FLAG_URL;
      const bearer = process.env.FLAG_BEARER;
      if (!flagUrl || !bearer) {
        throw new Error("FLAG_URL or FLAG_BEARER is not set");
      }

      const url = new URL(flagUrl);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: "GET",
        cert,
        key,
        ca,
        headers: {
          Authorization: `Bearer ${bearer}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      });

      req.on("error", (err) => reject(err));
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

// IPC хэндлер
ipcMain.handle("send-flag-request", async () => {
  return sendFlagRequest();
});

// Регистрируем функции через IPC
ipcMain.handle("start-tailscale", startTailscale);
ipcMain.handle("stop-tailscale", stopTailscale);
ipcMain.handle("get-tailscale-status", getTailscaleStatus);
ipcMain.handle(
  "get-tailscale-connection-status",
  getTailscaleConntectionStatus
);
