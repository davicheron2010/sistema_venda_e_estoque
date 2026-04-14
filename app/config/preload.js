"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  window: {
    open(name, opts) {
      return ipcRenderer.invoke("window:open", name, opts);
    },
    openModal(name, opts) {
      return ipcRenderer.invoke("window:openModal", name, opts);
    },
    close() {
      return ipcRenderer.invoke("window:close");
    },
  },
  // Armazena dados temporários entre janelas
  temp: {
    set(key, data) {
      return ipcRenderer.invoke("temp:set", key, data);
    },
    get(key) {
      return ipcRenderer.invoke("temp:get", key);
    },
  },
  product: {
    insert(data) {
      return ipcRenderer.invoke("product:insert", data);
    },
    find(where) {
      return ipcRenderer.invoke("product:find", where);
    },
    findById(id) {
      return ipcRenderer.invoke("product:findById", id);
    },
    update(id, data) {
      return ipcRenderer.invoke("product:update", id, data);
    },
    delete(id) {
      return ipcRenderer.invoke("product:delete", id);
    },
    onReload(callback) {
      ipcRenderer.on("product:reload", () => callback());
    },
  },
});
