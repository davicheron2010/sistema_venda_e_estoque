// =============================================================================
// compra-lista.js — Página de listagem de compras
// =============================================================================

// ─── Listar todas as compras na tabela ───────────────────────────────────────
async function listPurchases() {
    try {
        const response = await window.electronAPI.invoke('compra:list', {});
        if (!response.status) {
            toast('error', 'Erro', response.msg, 3000);
            return;
        }

        let trs = '';
        response.data.forEach(compra => {
            const totalLiquido = parseFloat(compra.total_liquido)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            trs += `
                <tr>
                    <td>${compra.id}</td>
                    <td>${compra.fornecedor}</td>
                    <td>${totalLiquido}</td>
                    <td>${compra.data}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editPurchase(${compra.id})">
                            Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deletePurchase(${compra.id})">
                            Excluir
                        </button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('purchases-table-tbody').innerHTML = trs;

    } catch (error) {
        toast('error', 'Erro', error.message, 3000);
    }
}

// ─── Navegar para nova compra (acao = c) ──────────────────────────────────────
function newPurchase() {
    window.location.href = 'compra-form.html?acao=c';
}

// ─── Navegar para editar compra (acao = e) ────────────────────────────────────
function editPurchase(id) {
    window.location.href = `compra-form.html?acao=e&id=${id}`;
}

// ─── Excluir compra direto da lista ───────────────────────────────────────────
async function deletePurchase(id) {
    const confirm = await Swal.fire({
        icon: 'warning',
        title: 'Confirmar exclusão',
        text: `Deseja excluir a compra #${id}?`,
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) return;

    const response = await window.electronAPI.invoke('compra:delete', { id });
    if (!response.status) {
        toast('error', 'Erro', response.msg, 3000);
        return;
    }

    toast('success', 'Sucesso', `Compra #${id} excluída.`, 3000);
    await listPurchases(); // recarrega a tabela
}

// Expõe funções usadas inline no HTML
window.editPurchase   = editPurchase;
window.deletePurchase = deletePurchase;

// ─── Inicialização ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await listPurchases();

    document.getElementById('btnNova')
        .addEventListener('click', newPurchase);
});