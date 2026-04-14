const table = Datatables.SetTable('#table-companies', [
    { data: 'id', className: 'text-center' },
    { data: 'nome' },
    { data: 'cnpj', defaultContent: '-' },
    { data: 'email', defaultContent: '-' },
    { data: 'telefone', defaultContent: '-' },
    {
        data: 'ativo',
        className: 'text-center',
        orderable: false,
        searchable: false,
        render: function (data) {
            return data
                ? `<span class="badge bg-success">Ativo</span>`
                : `<span class="badge bg-secondary">Inativo</span>`;
        }
    },
    {
        data: null,
        className: 'text-center',
        orderable: false,
        searchable: false,
        render: function (row) {
            return `
                <button onclick="editCompany(${row.id})" class="btn btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deleteCompany(${row.id})" class="btn btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            `;
        }
    }
]).getData(filter => api.company.find(filter));

api.company.onReload(() => {
    table.ajax.reload(null, false);
});

async function deleteCompany(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'A empresa será marcada como excluída.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
        const response = await api.company.delete(id);
        if (response.status) {
            toast('success', 'Excluído', response.msg);
            table.ajax.reload(null, false);
        } else {
            toast('error', 'Erro', response.msg);
        }
    }
}

async function editCompany(id) {
    try {
        const company = await api.company.findById(id);
        if (!company) {
            toast('error', 'Erro', 'Empresa não encontrada.');
            return;
        }
        await api.temp.set('company:edit', { action: 'e', ...company });
        api.window.openModal('pages/company', {
            width: 800,
            height: 600,
            title: 'Editar Empresa',
        });
    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}

window.deleteCompany = deleteCompany;
window.editCompany = editCompany;