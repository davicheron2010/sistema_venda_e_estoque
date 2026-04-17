import {Datatables} from "../components/Datatables.js"

api.supplier.onReload(() => {
    $('#table-suppliers').DataTable().ajax.reload(null, false);
});

Datatables.SetTable('#table-suppliers', [
    { data: 'id' },
    { data: 'nome_fantasia' },
    { data: 'razao_social' },
    { data: 'cnpj_cpf' },
    { data: 'ie_rg' },
    { data: 'ativo' },
    {
        data: null,
        orderable: false,
        searchable: false,
        render: function (row) {
            return `
                <button onclick="editSupplier(${row.id})" class="btn btn-xs btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deleteSupplier(${row.id})" class="btn btn-xs btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            `;
        }
    }
]).getData(filter => api.supplier.find(filter));

async function deleteSupplier(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
        const response = await api.supplier.delete(id);

        if (response.status) {
            toast('success', 'Excluído', response.msg);
            $('#table-suppliers').DataTable().ajax.reload();
        } else {
            toast('error', 'Erro', response.msg);
        }
    }
}

async function editSupplier(id) {
    try {
        // 1. Busca os dados completos do Fornecedor
        const supplier = await api.supplier.findById(id);
        if (!supplier) {
            toast('error', 'Erro', 'Fornecedor não encontrado.');
            return;
        }
        // 2. Salva no temp store com a ação 'e' (editar)
        await api.temp.set('supplier:edit', {
            action: 'e',
            ...supplier,
        });
        // 3. Abre a modal
        api.window.openModal('pages/supplier', {
            width: 600,
            height: 500,
            title: 'Editar Fornecedor',
        });
    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}
window.deleteSupplier = deleteSupplier;
window.editSupplier = editSupplier;