'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Adicionado para suportar chamadas diretas ipcRenderer.invoke se necessário
    ipcRenderer: {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    },

    report: {
        print(stringHtml, args = {}) { return ipcRenderer.invoke('print', stringHtml, args); }
    },

    window: {
        open(name, opts) { return ipcRenderer.invoke('window:open', name, opts); },
        openModal(name, opts) { return ipcRenderer.invoke('window:openModal', name, opts); },
        close() { return ipcRenderer.invoke('window:close'); }
    },

    dashboard: {
        getStats() { return ipcRenderer.invoke('dashboard:getStats'); }
    },

    temp: {
        set(key, data) { return ipcRenderer.invoke('temp:set', key, data); },
        get(key) { return ipcRenderer.invoke('temp:get', key); },
    },

    // --- NOVO MÓDULO DE COMPRAS ---
    purchase: {
        insert: (data) => ipcRenderer.invoke('purchase:insert', data),
        update: (id, data) => ipcRenderer.invoke('purchase:update', id, data),
        find: (where) => ipcRenderer.invoke('purchase:find', where), 
        findPurchase: (where) => ipcRenderer.invoke('purchase:findPurchase', where), 
        findById: (id) => ipcRenderer.invoke('purchase:findById', id), 
        delete: (id) => ipcRenderer.invoke('purchase:delete', id),
        onReload: (callback) => {
            ipcRenderer.on('purchase:reload', () => callback());
        },
    },

    customer: {
        insert(data) { return ipcRenderer.invoke('customer:insert', data); },
        find(where) { return ipcRenderer.invoke('customer:find', where); },
        findById(id) { return ipcRenderer.invoke('customer:findById', id); },
        update(id, data) { return ipcRenderer.invoke('customer:update', id, data); },
        delete(id) { return ipcRenderer.invoke('customer:delete', id); },
        onReload(callback) {
            ipcRenderer.on('customer:reload', () => callback());
        },
    },

    product: {
        insert(data) { return ipcRenderer.invoke('product:insert', data); },
        find(where) { return ipcRenderer.invoke('product:find', where); },
        findById(id) { return ipcRenderer.invoke('product:findById', id); },
        update(id, data) { return ipcRenderer.invoke('product:update', id, data); },
        delete(id) { return ipcRenderer.invoke('product:delete', id); },
        getAll() { return ipcRenderer.invoke('product:getAll'); }, // Adicionado getAll para facilitar
        onReload(callback) {
            ipcRenderer.on('product:reload', () => callback());
        },
    },

    supplier: {
        insert(data) { return ipcRenderer.invoke('supplier:insert', data); },
        find(where) { return ipcRenderer.invoke('supplier:find', where); },
        findById(id) { return ipcRenderer.invoke('supplier:findById', id); },
        update(id, data) { return ipcRenderer.invoke('supplier:update', id, data); },
        delete(id) { return ipcRenderer.invoke('supplier:delete', id); },
        getAll() { return ipcRenderer.invoke('supplier:getAll'); }, // Adicionado getAll para facilitar
        onReload(callback) {
            ipcRenderer.on('supplier:reload', () => callback());
        },
    },

    users: {
        insert(data) { return ipcRenderer.invoke('users:insert', data); },
        find(where) { return ipcRenderer.invoke('users:find', where); },
        findById(id) { return ipcRenderer.invoke('users:findById', id); },
        update(id, data) { return ipcRenderer.invoke('users:update', id, data); },
        delete(id) { return ipcRenderer.invoke('users:delete', id); },
        onReload(callback) {
            ipcRenderer.on('users:reload', () => callback());
        },
    },

    enterprise: {
        insert(data) { return ipcRenderer.invoke('enterprise:insert', data); },
        find(where) { return ipcRenderer.invoke('enterprise:find', where); },
        findById(id) { return ipcRenderer.invoke('enterprise:findById', id); },
        update(id, data) { return ipcRenderer.invoke('enterprise:update', id, data); },
        delete(id) { return ipcRenderer.invoke('enterprise:delete', id); },
        onReload(callback) {
            ipcRenderer.on('enterprise:reload', () => callback());
        },
    },
    paymentTerms: {
        insert(data) { return ipcRenderer.invoke('paymentTerms:insert', data); },
        find(where) { return ipcRenderer.invoke('paymentTerms:find', where); },
        findById(id) { return ipcRenderer.invoke('paymentTerms:findById', id); },
        update(id, data) { return ipcRenderer.invoke('paymentTerms:update', id, data); },
        delete(id) { return ipcRenderer.invoke('paymentTerms:delete', id); },
        onReload(callback) { ipcRenderer.on('paymentTerms:reload', () => callback()); },
        findWithInstallments(id) { return ipcRenderer.invoke('paymentTerms:findWithInstallments', id); },
    },
});