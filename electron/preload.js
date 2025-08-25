const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  runBashCommand: (command) => ipcRenderer.invoke("run-bash-command", command),
});
