import { ipcMain, BrowserWindow } from 'electron';
import Template from '../mixin/Template.js';
import Customer from '../controller/Customer.js';
import Product from '../controller/Product.js';
import Supplier from '../controller/Supplier.js';
import Purchase from '../controller/Purchase.js';
import PaymentTerms from '../controller/PaymentTerms.js';
import { Print } from '../mixin/Print.js';
function getWin(event) {
    return BrowserWindow.fromWebContents(event.sender);
}


//Imprimir PDF
ipcMain.handle('print', async (_e, stringHtml, args = {}) => {
    await Print.create().stringHTML(stringHtml).print();
});
// Avisa todas as janelas para recarregar
function broadcastReload(channel) {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(channel);
    }
}
// --- DASHBOARD / ESTATÍSTICAS ---
ipcMain.handle('dashboard:getStats', async () => {
    try {

        const productsResult = await Product.find() || {};
        const customersResult = await Customer.find() || {};
        const usersResult = await Users.find() || {};
        const suppliersResult = await Supplier.find() || {};
        const enterprisesResult = await Enterprise.find() || {};

        console.log('Estatísticas do Banco:', {
            produtos: productsResult.recordsTotal,
            clientes: customersResult.recordsTotal,
            usuarios: usersResult.recordsTotal,
            empresas: enterprisesResult.recordsTotal,
            fornecedores: suppliersResult.recordsTotal
        });

        return {
            totalProducts: productsResult.recordsTotal || 0,
            totalCustomers: customersResult.recordsTotal || 0,
            totalUsers: usersResult.recordsTotal || 0,
            totalSuppliers: suppliersResult.recordsTotal || 0,
            totalEnterprises: enterprisesResult.recordsTotal || 0
        };
    } catch (error) {
        console.error("Erro ao processar estatísticas no Main Process:", error);
        return { totalProducts: 0, totalCustomers: 0, totalSuppliers: 0, totalEnterprises: 0, totalUsers: 0 };
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

// Dentro do seu route.js
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
// No setor de PRODUTOS
ipcMain.handle('product:getAll', async () => {
    const result = await Product.find() || {};
    // Retornamos apenas a lista de registros para o frontend
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
ipcMain.handle('supplier:supplierSearch', async (_e, term) => {
    return await Supplier.supplierSearch(term);
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
// No setor de FORNECEDORES
ipcMain.handle('supplier:getAll', async () => {
    const result = await Supplier.find() || {};
    // Retornamos apenas a lista de registros para o frontend
    return result.data || [];
});

// --- USUARIOS ---
ipcMain.handle('users:insert', async (_e, data) => {
    const result = await Users.insert(data);
    if (result.status) broadcastReload('users:reload');
    return result;
});

ipcMain.handle('users:find', async (_e, where = {}) => {
    return await Users.find(where);
});

ipcMain.handle('users:findById', async (_e, id) => {
    return await Users.findById(id);
});

ipcMain.handle('users:update', async (_e, id, data) => {
    const result = await Users.update(id, data);
    if (result.status) broadcastReload('users:reload');
    return result;
});

ipcMain.handle('users:delete', async (_e, id) => {
    const result = await Users.delete(id);
    if (result.status) broadcastReload('users:reload');
    return result;
});
// --- EMPRESAS ---
ipcMain.handle('enterprise:insert', async (_e, data) => {
    const result = await Enterprise.insert(data);
    if (result.status) broadcastReload('enterprise:reload');
    return result;
});

ipcMain.handle('enterprise:find', async (_e, where = {}) => {
    return await Enterprise.find(where);
});

ipcMain.handle('enterprise:findById', async (_e, id) => {
    return await Enterprise.findById(id);
});

ipcMain.handle('enterprise:update', async (_e, id, data) => {
    const result = await Enterprise.update(id, data);
    if (result.status) broadcastReload('enterprise:reload');
    return result;
});

ipcMain.handle('enterprise:delete', async (_e, id) => {
    const result = await Enterprise.delete(id);
    if (result.status) broadcastReload('enterprise:reload');
    return result;
});
// Purchase

ipcMain.handle('purchase:insert', async (_e, data) => {
    const result = await Purchase.insert(data);
    if (result.status) broadcastReload('purchase:reload');
    return result;
});

ipcMain.handle('purchase:insertItem', async (_e, data) => {
    const result = await Purchase.insertItem(data);
    if (result.status) broadcastReload('purchase:reload');
    return result;
});

ipcMain.handle('purchase:find', async (_e, where = {}) => {
    return await Purchase.find(where);
});

ipcMain.handle('purchase:findById', async (_e, id) => {
    return await Purchase.findById(id);
});

ipcMain.handle('purchase:listItemPurchase', async (_e, data) => {
    return await Purchase.listItemPurchase(data);
});

ipcMain.handle('purchase:update', async (_e, id, data) => {
    const result = await Purchase.update(id, data);
    if (result.status) broadcastReload('purchase:reload');
    return result;
});
ipcMain.handle('purchase:deleteItem', async (_e, data) => {
    try {
        return await Purchase.deleteItem(data);
    } catch (error) {
        console.error('Erro ao excluir item da compra:', error);
        return { status: false, msg: error.message };
    }
});
ipcMain.handle('purchase:delete', async (_e, id) => {
    const result = await Purchase.delete(id);
    if (result.status) broadcastReload('purchase:reload');
    return result;
});
// --- CONDIÇÕES DE PAGAMENTO ---
ipcMain.handle('paymentTerms:insert', async (_e, data) => {
    const result = await PaymentTerms.insert(data);
    if (result.status) broadcastReload('paymentTerms:reload');
    return result;
});

ipcMain.handle('paymentTerms:find', async (_e, where = {}) => {
    return await PaymentTerms.find(where);
});

ipcMain.handle('paymentTerms:findById', async (_e, id) => {
    return await PaymentTerms.findById(id);
});

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
ipcMain.handle('paymentTerms:findWithInstallments', async (_e, id) => {
        return await PaymentTerms.findWithInstallments(id);
});
