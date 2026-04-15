import { ipcMain, BrowserWindow } from 'electron';
import Template from '../mixin/Template.js';
import Customer from '../controller/Customer.js';
import Company from '../controller/Company.js';

function getWin(event) {
    return BrowserWindow.fromWebContents(event.sender);
}

function broadcastReload(channel) {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(channel);
    }
}

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

let tempData = {};

ipcMain.handle('temp:set', (_e, key, data) => {
    tempData[key] = data;
});

ipcMain.handle('temp:get', (_e, key) => {
    const data = tempData[key] || null;
    delete tempData[key];
    return data;
});

ipcMain.handle('customer:insert', async (_e, data) => {
    const result = await Customer.insert(data);
    if (result.status) broadcastReload('customer:reload');
    return result;
});

ipcMain.handle('customer:find', async (_e, where = {}) => {
    return await Customer.find(where);
});

ipcMain.handle('customer:findById', async (_e, id) => {
    return await Customer.findById(id);
});

ipcMain.handle('customer:update', async (_e, id, data) => {
    const result = await Customer.update(id, data);
    if (result.status) broadcastReload('customer:reload');
    return result;
});

ipcMain.handle('customer:delete', async (_e, id) => {
    const result = await Customer.delete(id);
    if (result.status) broadcastReload('customer:reload');
    return result;
});

ipcMain.handle('customer:count', async () => {
    return await Customer.count();
});
ipcMain.handle('company:insert', async (_e, data) => {
    const result = await Company.insert(data);
    if (result.status) broadcastReload('company:reload');
    return result;
});

ipcMain.handle('company:find', async (_e, where = {}) => {
    return await Company.find(where);
});

ipcMain.handle('company:findById', async (_e, id) => {
    return await Company.findById(id);
});

ipcMain.handle('company:update', async (_e, id, data) => {
    const result = await Company.update(id, data);
    if (result.status) broadcastReload('company:reload');
    return result;
});

ipcMain.handle('company:delete', async (_e, id) => {
    const result = await Company.delete(id);
    if (result.status) broadcastReload('company:reload');
    return result;
});

ipcMain.handle('company:count', async () => {
    return await Company.count();
});
