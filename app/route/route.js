import { ipcMain, BrowserWindow } from 'electron';
import Template from '../mixin/Template.js';
import Product from '../controller/Product.js';
import Supplier from '../controller/Supplier.js';
import { Print } from '../mixin/Print.js';
function getWin(event) {
    return BrowserWindow.fromWebContents(event.sender);
}
// Avisa todas as janelas para recarregar
function broadcastReload(channel) {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(channel);
    }
}
//Imprimir PDF
ipcMain.handle('print', async (_e, stringHtml, args = {}) => {
    await Print.create()
        .stringCss(`<style>body { font-family: Arial; } h1 { color: #1a1a2e; }</style>`)
        .stringHTML(stringHtml)
        .setOptions(args)
        .print();
});

//  WINDOW
ipcMain.handle('window:open', (_e, name, opts = {}) => {
    const win = Template.create(name, opts);
    Template.loadView(win, name);
});

ipcMain.handle('window:openModal', (e, name, opts = {}) => {
    const parent = getWin(e);
    if (!parent) return;
    const win = Template.create(name, {
        width: 560,
        height: 420,
        resizable: false,
        minimizable: false,
        maximizable: false,
        parent: parent,
        modal: true,
        ...opts,
    });
    Template.loadView(win, name);
});

ipcMain.handle('window:close', (e) => {
    getWin(e)?.close();
});

//  TEMP STORE — dados temporários entre janelas
let tempData = {};

ipcMain.handle('temp:set', (_e, key, data) => {
    tempData[key] = data;
});

ipcMain.handle('temp:get', (_e, key) => {
    const data = tempData[key] || null;
    delete tempData[key];
    return data;
});
//Product
ipcMain.handle('product:insert', async (_e, data) => {
    const result = await Product.insert(data);
    if (result.status) broadcastReload('product:reload');
    return result;
});

ipcMain.handle('product:find', async (_e, where = {}) => {
    return await Product.find(where);
});

ipcMain.handle('product:findById', async (_e, id) => {
    return await Product.findById(id);
});

ipcMain.handle('product:update', async (_e, id, data) => {
    const result = await Product.update(id, data);
    if (result.status) broadcastReload('product:reload');
    return result;
});

ipcMain.handle('product:delete', async (_e, id) => {
    const result = await Product.delete(id);
    if (result.status) broadcastReload('product:reload');
    return result;
});

//  SUPPLIER
ipcMain.handle('supplier:insert', async (_e, data) => {
    const result = await Supplier.insert(data);
    if (result.status) broadcastReload('supplier:reload');
    return result;
});

ipcMain.handle('supplier:find', async (_e, where = {}) => {
    return await Supplier.find(where);
});

ipcMain.handle('supplier:findById', async (_e, id) => {
    return await Supplier.findById(id);
});

ipcMain.handle('supplier:update', async (_e, id, data) => {
    const result = await Supplier.update(id, data);
    if (result.status) broadcastReload('supplier:reload');
    return result;
});

ipcMain.handle('supplier:delete', async (_e, id) => {
    const result = await Supplier.delete(id);
    if (result.status) broadcastReload('supplier:reload');
    return result;
});