import { ipcRenderer } from "electron";

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

}
);
