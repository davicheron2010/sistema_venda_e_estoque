import { ipcMain, BrowserWindow } from 'electron';
import Template from '../mixin/Template.js';
import Product from '../controller/Product.js';
import Company from '../controller/Company.js';
import Customer from '../controller/Customer.js';
import PaymentTerms from '../controller/PaymentTerms.js';
import Installment from '../controller/Installment.js';
import Sale from '../controller/Sale.js';
import { Print } from '../mixin/Print.js';
import Supplier from '../controller/Supplier.js';
import Purchase from '../controller/Purchase.js';
import Stock from '../controller/Stock.js';

function getWin(event) {
    return BrowserWindow.fromWebContents(event.sender);
}

function broadcastReload(channel) {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send(channel);
        }
    }
}

// --- PRINT ---
ipcMain.handle('print', async (_e, stringHtml, args = {}) => {
    await Print.create().stringHTML(stringHtml).print();
});

// --- DASHBOARD ---
ipcMain.handle('dashboard:getStats', async () => {
    try {
        const productsResult = await Product.find() || {};
        const customersResult = await Customer.find() || {};
        const suppliersResult = await Supplier.find() || {};
        const companiesResult = await Company.find() || {};

        return {
            totalProducts: productsResult.recordsTotal || 0,
            totalCustomers: customersResult.recordsTotal || 0,
            totalSuppliers: suppliersResult.recordsTotal || 0,
            totalCompanies: companiesResult.recordsTotal || 0,
        };
    } catch (error) {
        console.error("Erro ao processar estatísticas:", error);
        return { totalProducts: 0, totalCustomers: 0, totalSuppliers: 0, totalCompanies: 0 };
    }
});

// --- WINDOW ---
ipcMain.handle('window:open', (_e, name, opts = {}) => {
    const win = Template.create(name, opts);
    if (opts.maximized) win.maximize();
    Template.loadView(win, name);
});

ipcMain.handle('window:openModal', (e, name, opts = {}) => {
    const parent = getWin(e);
    if (!parent) return;
    const win = Template.create(name, {
        width: 560,
        height: 420,
        resizable: true,
        minimizable: false,
        maximizable: true,
        parent: parent,
        modal: true,
        ...opts,
    });
    if (opts.maximized) win.maximize();
    Template.loadView(win, name);
});

ipcMain.handle('window:close', (e) => {
    getWin(e)?.close();
});

// --- TEMP STORE ---
let tempData = {};
ipcMain.handle('temp:set', (_e, key, data) => { tempData[key] = data; });
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
ipcMain.handle('customer:find', async (_e, where = {}) => await Customer.find(where));
ipcMain.handle('customer:findById', async (_e, id) => await Customer.findById(id));
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

// --- PRODUCT ---
ipcMain.handle('product:insert', async (_e, data) => {
    const result = await Product.insert(data);
    if (result.status) broadcastReload('product:reload');
    return result;
});
ipcMain.handle('product:find', async (_e, where = {}) => await Product.find(where));
ipcMain.handle('product:findById', async (_e, id) => await Product.findById(id));
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

// --- STOCK ---
ipcMain.handle('stock:adjust', async (_e, data) => {
    try {
        const result = await Stock.adjust(data);
        if (result.status) broadcastReload('product:reload');
        return result;
    } catch (error) {
        return { status: false, msg: error.message };
    }
});
ipcMain.handle('stock:getByProduct', async (_e, id_produto) => {
    return await Stock.getByProduct(id_produto);
});
ipcMain.handle('stock:getMovements', async (_e, id_produto) => {
    return await Stock.getMovements(id_produto);
});

// --- SALE ---
ipcMain.handle('sale:insert', async (_e, data) => {
    const result = await Sale.insert(data);
    if (result.status) broadcastReload('sale:reload');
    return result;
});
ipcMain.handle('sale:insertItem', async (_e, data) => {
    const result = await Sale.insertItem(data);
    if (result.status) broadcastReload('sale:reload');
    return result;
});
ipcMain.handle('sale:insertInstallmentSale', async (_e, data) => {
    return await Sale.insertInstallmentSale(data);
});
ipcMain.handle('sale:find', async (_e, where = {}) => await Sale.find(where));
ipcMain.handle('sale:findById', async (_e, id) => await Sale.findById(id));
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

// --- SUPPLIER ---
ipcMain.handle('supplier:insert', async (_e, data) => {
    const result = await Supplier.insert(data);
    if (result.status) broadcastReload('supplier:reload');
    return result;
});
ipcMain.handle('supplier:find', async (_e, where = {}) => await Supplier.find(where));
ipcMain.handle('supplier:findById', async (_e, id) => await Supplier.findById(id));
ipcMain.handle('supplier:supplierSearch', async (_e, term) => await Supplier.supplierSearch(term));
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
    const result = await Supplier.find({ limit: 99999, offset: 0 }) || {};
    return result.data || [];
});
ipcMain.handle('supplier:count', async () => await Supplier.count());

// --- COMPANY ---
ipcMain.handle('company:insert', async (_e, data) => {
    const result = await Company.insert(data);
    if (result.status) broadcastReload('company:reload');
    return result;
});
ipcMain.handle('company:find', async (_e, where = {}) => await Company.find(where));
ipcMain.handle('company:findById', async (_e, id) => await Company.findById(id));
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

// --- PURCHASE ---
ipcMain.handle('purchase:insert', async (_e, data) => {
    try {
        const result = await Purchase.insert(data);
        if (result.status) broadcastReload('purchase:reload');
        return result;
    } catch (error) {
        return { status: false, msg: 'Erro ao salvar compra: ' + error.message };
    }
});
ipcMain.handle('purchase:insertItem', async (_e, data) => {
    try {
        const result = await Purchase.insertItem(data);
        if (result.status) broadcastReload('purchase:reload');
        return result;
    } catch (error) {
        return { status: false, msg: 'Erro ao salvar item da compra: ' + error.message };
    }
});
ipcMain.handle('purchase:listItem', async (_e, data) => {
    try {
        return await Purchase.listItem(data);
    } catch (error) {
        return { status: false, msg: 'Erro ao listar itens da compra: ' + error.message, data: [] };
    }
});
ipcMain.handle('purchase:find', async (_e, where = {}) => await Purchase.find(where));
ipcMain.handle('purchase:findById', async (_e, id) => await Purchase.findById(id));
ipcMain.handle('purchase:update', async (_e, id, data) => {
    const result = await Purchase.update(id, data);
    if (result.status) broadcastReload('purchase:reload');
    return result;
});
ipcMain.handle('purchase:finalize', async (_e, data) => {
    try {
        const result = await Purchase.finalize(data);
        if (result.status) broadcastReload('purchase:reload');
        return result;
    } catch (error) {
        return { status: false, msg: 'Erro ao finalizar compra: ' + error.message };
    }
});
ipcMain.handle('purchase:delete', async (_e, id) => {
    const result = await Purchase.delete(id);
    if (result.status) broadcastReload('purchase:reload');
    return result;
});
ipcMain.handle('purchase:deleteItem', async (_e, id) => {
    try {
        const result = await Purchase.deleteItem(id);
        if (result.status) broadcastReload('purchase:reload');
        return result;
    } catch (error) {
        return { status: false, msg: 'Erro ao excluir item: ' + error.message };
    }
});

// --- PAYMENT TERMS ---
ipcMain.handle('paymentTerms:insert', async (_e, data) => {
    const result = await PaymentTerms.insert(data);
    return result;
});
ipcMain.handle('paymentTerms:find', async (_e, where = {}) => await PaymentTerms.find(where));
ipcMain.handle('paymentTerms:findById', async (_e, id) => await PaymentTerms.findById(id));
ipcMain.handle('paymentTerms:update', async (_e, id, data) => {
    const result = await PaymentTerms.update(id, data);
    if (result.status) broadcastReload('paymentTerms:reload');
    return result;
});
ipcMain.handle('paymentTerms:delete', async (_e, id) => {
    const result = await PaymentTerms.delete(id);
    if (result.status) broadcastReload('paymentTerms:reload');
    return result;
});
ipcMain.handle('paymentTerms:getAll', async () => {
    const result = await PaymentTerms.find({ limit: 99999, offset: 0 }) || {};
    return result.data || [];
});

// --- INSTALLMENT ---
ipcMain.handle('installment:insert', async (_e, data) => {
    const result = await Installment.insert(data);
    if (result.status) broadcastReload('installment:reload');
    return result;
});
ipcMain.handle('installment:find', async (_e, where = {}) => await Installment.find(where));
ipcMain.handle('installment:findById', async (_e, id) => await Installment.findById(id));
ipcMain.handle('installment:findByPaymentTerms', async (_e, id_pagamento) => {
    return await Installment.findByPaymentTerms(id_pagamento);
});
ipcMain.handle('installment:update', async (_e, id, data) => {
    const result = await Installment.update(id, data);
    if (result.status) broadcastReload('installment:reload');
    return result;
});
ipcMain.handle('installment:delete', async (_e, id) => {
    const result = await Installment.delete(id);
    if (result.status) broadcastReload('installment:reload');
    return result;
});
ipcMain.handle('installment:getAll', async () => {
    const result = await Installment.find({ limit: 99999, offset: 0 }) || {};
    return result.data || [];
});