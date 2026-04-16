document.addEventListener('DOMContentLoaded', async () => {
    const safe = (fn) => fn().catch((err) => { console.error(err); return 0; });

    async function loadCounts() {
        const [totalClientes, totalEmpresas] = await Promise.all([
            safe(() => api.supplier.count()),
            safe(() => api.product.count()),
        ]);

        document.getElementById('count-fornecedore').textContent = totalfornecedor;
        document.getElementById('count-produto').textContent = totalproduto;
    }

    await loadCounts();

    api.supplier.onReload(() => loadCounts());
    api.product.onReload(() => loadCounts());
});