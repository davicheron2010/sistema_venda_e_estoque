document.addEventListener('DOMContentLoaded', async () => {
    const safe = (fn) => fn().catch((err) => { console.error(err); return 0; });

    async function loadCounts() {
        const [totalClientes, totalEmpresas] = await Promise.all([
            safe(() => api.customer.count()),
            safe(() => api.company.count()),
        ]);

        document.getElementById('count-clientes').textContent = totalClientes;
        document.getElementById('count-empresas').textContent = totalEmpresas;
    }

    await loadCounts();

    api.customer.onReload(() => loadCounts());
    api.company.onReload(() => loadCounts());
});