import { ipcMain, BrowserWindow } from 'electron';
import Template from '../mixin/Template.js';
import Product from '../controller/Product.js';
import Company from '../controller/Company.js';
import Customer from '../controller/Customer.js';
import Sale from '../controller/Sale.js';
import Supplier from '../controller/Supplier.js';
import Purchase from '../controller/Purchase.js';

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
    await Print.create().stringHTML(stringHtml).print();
});

// --- DASHBOARD / ESTATÍSTICAS ---
ipcMain.handle('dashboard:getStats', async () => {
    try {
        const productsResult   = await Product.find()  || {};
        const customersResult  = await Customer.find() || {};
        const suppliersResult  = await Supplier.find() || {};
        const companiesResult  = await Company.find()  || {};

        return {
            totalProducts:   productsResult.recordsTotal  || 0,
            totalCustomers:  customersResult.recordsTotal || 0,
            totalSuppliers:  suppliersResult.recordsTotal || 0,
            totalCompanies:  companiesResult.recordsTotal || 0,
        };
    } catch (error) {
        console.error("Erro ao processar estatísticas no Main Process:", error);
        return { totalProducts: 0, totalCustomers: 0, totalSuppliers: 0, totalCompanies: 0 };
    }
});

// --- WINDOW ---
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

// --- TEMP STORE ---
let tempData = {};

ipcMain.handle('temp:set', (_e, key, data) => {
    tempData[key] = data;
});

ipcMain.handle('temp:get', (_e, key) => {
    const data = tempData[key] || null;
    delete tempData[key];
    return data;
});

// --- CUSTOMER ---
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

// --- PRODUTOS ---
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

ipcMain.handle('product:getAll', async () => {
    const result = await Product.find({ limit: 99999, offset: 0 }) || {};
    return result.data || [];
});

// --- FORNECEDORES ---
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

ipcMain.handle('supplier:getAll', async () => {
    const result = await Supplier.find() || {};
    return result.data || [];
});

// --- EMPRESAS ---
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

// --- VENDAS ---
ipcMain.handle('sale:insert', async (_e, data) => {
    const result = await Sale.insert(data);
    if (result.status) broadcastReload('sale:reload');
    return result;
});

ipcMain.handle('sale:find', async (_e, where = {}) => {
    return await Sale.find(where);
});

ipcMain.handle('sale:findById', async (_e, id) => {
    return await Sale.findById(id);
});

ipcMain.handle('sale:update', async (_e, id, data) => {
    const result = await Sale.update(id, data);
    if (result.status) broadcastReload('sale:reload');
    return result;
});

ipcMain.handle('sale:delete', async (_e, id) => {
    const result = await Sale.delete(id);
    if (result.status) broadcastReload('sale:reload');
    return result;
});

// --- COMPRAS ---
ipcMain.handle('purchase:insert', async (_e, data) => {
    console.log('Dados da Compra Recebidos:', data);
    return { status: true, msg: 'Compra registrada com sucesso!' };
});