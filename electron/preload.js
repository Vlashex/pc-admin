const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  startTailscale: () => ipcRenderer.invoke("start-tailscale"),
  stopTailscale: () => ipcRenderer.invoke("stop-tailscale"),
  getTailscaleStatus: () => ipcRenderer.invoke("get-tailscale-status"),
  getTailscaleConntectionStatus: () =>
    ipcRenderer.invoke("get-tailscale-connection-status"),
  sendFlagRequest: () => ipcRenderer.invoke("send-flag-request"),
});
