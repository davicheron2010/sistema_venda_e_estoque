import { Datatables } from "../components/Datatables.js";

//  Reload da tabela
api.supplier.onReload(() => {
    $('#table-suppliers').DataTable().ajax.reload(null, false);
});

//  Inicializa a tabela
Datatables.SetTable('#table-suppliers', [
    { data: 'id' },
    { data: 'nome_fantasia' },
    { data: 'razao_social' },
    { data: 'cnpj_cpf' },
    { data: 'ie_rg' },
    {
        data: null,
        orderable: false,
        searchable: false,
        render: (row) => `
            <div class="d-flex gap-1">
                <button onclick="editSupplier(${row.id})" class="btn btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="deleteSupplier(${row.id})" class="btn btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i>
                </button>
                <button onclick="printSupplier(${row.id})" class="btn btn-xs btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Imprimir
                </button>
            </div>
        `
    }
]).getData(filter => api.supplier.find(filter));


//  DELETE
async function deleteSupplier(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
        const response = await api.supplier.delete(id);

        if (!response.status) {
            toast('error', 'Erro', response.msg);
            return;
        }

        toast('success', 'Excluído', response.msg);
        $('#table-suppliers').DataTable().ajax.reload();

    } catch (err) {
        toast('error', 'Falha', err.message);
    }
}

async function printSupplier(id) {
    try {
        // 1. Busca os dados completos do cliente
        const supplier = await api.supplier.findById(id);

        if (!supplier) {
            toast('error', 'Erro', 'Cliente não encontrado.');
            return;
        }
        const html = `
        <h1>Ficha do Fornecedor</h1>
        <p><strong>ID:</strong> ${supplier.id}</p>
        <p><strong>Nome:</strong> ${supplier.nome_fantasia}</p>
        <p><strong>CPF:</strong> ${supplier.cpf_cnpj}</p>
        `;
        api.report.print(html, { landscape: false });
    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}
//  EDIT
async function editSupplier(id) {
    try {
        const supplier = await api.supplier.findById(id);

        if (!supplier) {
            toast('error', 'Erro', 'Fornecedor não encontrado.');
            return;
        }

        await api.temp.set('supplier:edit', {
            action: 'e',
            ...supplier,
        });

        api.window.openModal('pages/supplier', {
            width: 600,
            height: 500,
            title: 'Editar Fornecedor',
        });

    } catch (err) {
        toast('error', 'Falha', err.message);
    }
}


//  Disponível global
window.deleteSupplier = deleteSupplier;
window.editSupplier = editSupplier;
window.printSupplier = printSupplier;