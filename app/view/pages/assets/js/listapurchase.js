api.purchase.onReload(() => {
    $('#table-purchases').DataTable().ajax.reload(null, false);
});

Datatables.SetTable('#table-purchases', [
    { data: 'id' },
    { data: 'total_bruto' },
    { data: 'total_liquido' },
    { data: 'desconto' },
    { data: 'acrescimo' },
    { data: 'observacao' },
    {
        data: null,
        orderable: false,
        searchable: false,
        render: function (row) {
            return `
                <button onclick="editPurchase(${row.id})" class="btn btn-xs btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deletePurchase(${row.id})" class="btn btn-xs btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            `;
        }
    }
]).getData(filter => api.purchase.find(filter));

async function deletePurchase(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
        const response = await api.purchase.delete(id);

        if (response.status) {
            toast('success', 'Excluído', response.msg);
            $('#table-purchases').DataTable().ajax.reload();
        } else {
            toast('error', 'Erro', response.msg);
        }
    }
}

async function editPurchase(id) {
    try {
        const purchase = await api.purchase.findById(id);
        if (!purchase) {
            toast('error', 'Erro', 'Produto não encontrado.');
            return;
        }

        await api.temp.set('purchase:edit', {
            action: 'e',
            ...purchase,
        });

        api.window.openModal('pages/purchase', {
            width: 1000,
            height: 800,
            title: 'Editar Produto',
            maximized: true
        });
    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}
window.deletePurchase = deletePurchase;
window.editPurchase = editPurchase;