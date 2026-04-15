'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    window: {
        open(name, opts) { return ipcRenderer.invoke('window:open', name, opts); },
        openModal(name, opts) { return ipcRenderer.invoke('window:openModal', name, opts); },
        close() { return ipcRenderer.invoke('window:close'); }
    },
    temp: {
        set(key, data) { return ipcRenderer.invoke('temp:set', key, data); },
        get(key) { return ipcRenderer.invoke('temp:get', key); },
    },
    customer: {
        insert(data) { return ipcRenderer.invoke('customer:insert', data); },
        find(where) { return ipcRenderer.invoke('customer:find', where); },
        findById(id) { return ipcRenderer.invoke('customer:findById', id); },
        update(id, data) { return ipcRenderer.invoke('customer:update', id, data); },
        delete(id) { return ipcRenderer.invoke('customer:delete', id); },
        count() { return ipcRenderer.invoke('customer:count'); },
        onReload(callback) {
            ipcRenderer.removeAllListeners('customer:reload');
            ipcRenderer.on('customer:reload', () => callback());
        },
    },
    company: {
        insert(data) { return ipcRenderer.invoke('company:insert', data); },
        find(where) { return ipcRenderer.invoke('company:find', where); },
        findById(id) { return ipcRenderer.invoke('company:findById', id); },
        update(id, data) { return ipcRenderer.invoke('company:update', id, data); },
        delete(id) { return ipcRenderer.invoke('company:delete', id); },
        count() { return ipcRenderer.invoke('company:count'); },
        onReload(callback) {
            ipcRenderer.removeAllListeners('company:reload');
            ipcRenderer.on('company:reload', () => callback());
        },
    },
});