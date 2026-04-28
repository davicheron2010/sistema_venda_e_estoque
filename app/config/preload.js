'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
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

    purchase: {
        insert(data) { return ipcRenderer.invoke('purchase:insert', data); },
        insertItem(data) { return ipcRenderer.invoke('purchase:insertItem', data); },
        listItem(data) { return ipcRenderer.invoke('purchase:listItem', data); },
        find(where) { return ipcRenderer.invoke('purchase:find', where); },
        findById(id) { return ipcRenderer.invoke('purchase:findById', id); },
        update(id, data) { return ipcRenderer.invoke('purchase:update', id, data); },
        delete(id) { return ipcRenderer.invoke('purchase:delete', id); },
        deleteItem(id) { return ipcRenderer.invoke('purchase:deleteItem', id); },
        onReload(callback) {
            ipcRenderer.on('enterprise:reload', () => callback());
        },
    },

    customer: {
        insert(data) { return ipcRenderer.invoke('customer:insert', data); },
        find(where) { return ipcRenderer.invoke('customer:find', where); },
        findById(id) { return ipcRenderer.invoke('customer:findById', id); },
        update(id, data) { return ipcRenderer.invoke('customer:update', id, data); },
        delete(id) { return ipcRenderer.invoke('customer:delete', id); },
        count() { return ipcRenderer.invoke('customer:count'); },
        onReload(callback) { ipcRenderer.on('customer:reload', () => callback()); },
    },

    product: {
        insert(data) { return ipcRenderer.invoke('product:insert', data); },
        find(where) { return ipcRenderer.invoke('product:find', where); },
        findById(id) { return ipcRenderer.invoke('product:findById', id); },
        update(id, data) { return ipcRenderer.invoke('product:update', id, data); },
        delete(id) { return ipcRenderer.invoke('product:delete', id); },
        getAll() { return ipcRenderer.invoke('product:getAll'); },
        onReload(callback) { ipcRenderer.on('product:reload', () => callback()); },
    },

    supplier: {
        insert(data) { return ipcRenderer.invoke('supplier:insert', data); },
        find(where) { return ipcRenderer.invoke('supplier:find', where); },
        supplierSearch(term) { return ipcRenderer.invoke('supplier:supplierSearch', term); },
        findById(id) { return ipcRenderer.invoke('supplier:findById', id); },
        update(id, data) { return ipcRenderer.invoke('supplier:update', id, data); },
        delete(id) { return ipcRenderer.invoke('supplier:delete', id); },
        getAll() { return ipcRenderer.invoke('supplier:getAll'); },
        onReload(callback) { ipcRenderer.on('supplier:reload', () => callback()); },
    },

    users: {
        insert(data) { return ipcRenderer.invoke('users:insert', data); },
        find(where) { return ipcRenderer.invoke('users:find', where); },
        findById(id) { return ipcRenderer.invoke('users:findById', id); },
        update(id, data) { return ipcRenderer.invoke('users:update', id, data); },
        delete(id) { return ipcRenderer.invoke('users:delete', id); },
        onReload(callback) { ipcRenderer.on('users:reload', () => callback()); },
    },

    company: {
        insert(data) { return ipcRenderer.invoke('company:insert', data); },
        find(where) { return ipcRenderer.invoke('company:find', where); },
        findById(id) { return ipcRenderer.invoke('company:findById', id); },
        update(id, data) { return ipcRenderer.invoke('company:update', id, data); },
        delete(id) { return ipcRenderer.invoke('company:delete', id); },
        onReload(callback) { ipcRenderer.on('company:reload', () => callback()); },
    },

    sale: {
        insert(data) { return ipcRenderer.invoke('sale:insert', data); },
        insertItem(data) { return ipcRenderer.invoke('sale:insertItem', data); },
        insertInstallmentSale: (data) => ipcRenderer.invoke('sale:insertInstallmentSale', data),
        find(where) { return ipcRenderer.invoke('sale:find', where); }, // Esta é a linha que o Datatables usa
        findById(id) { return ipcRenderer.invoke('sale:findById', id); },
        update(id, data) { return ipcRenderer.invoke('sale:update', id, data); },
        delete(id) { return ipcRenderer.invoke('sale:delete', id); },
        onReload(callback) {
            ipcRenderer.on('sale:reload', () => callback());
        },
    },

    stock: {
        getByProduct(id_produto) { return ipcRenderer.invoke('stock:getByProduct', id_produto); },
        getMovements(id_produto) { return ipcRenderer.invoke('stock:getMovements', id_produto); },
        adjust(data) { return ipcRenderer.invoke('stock:adjust', data); },
    },
    paymentTerms: {
    findAll() { return ipcRenderer.invoke('paymentTerms:findAll'); },
    findInstallments(id_pagamento) { return ipcRenderer.invoke('paymentTerms:findInstallments', id_pagamento); },
},
});