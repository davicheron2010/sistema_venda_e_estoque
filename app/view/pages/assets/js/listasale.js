import { Datatables } from "../components/Datatables.js";

const table = Datatables.SetTable('#table-sales', [
    { data: 'id', className: 'text-center' },
    { data: 'id_cliente' },
    { data: 'total_bruto' },
    { data: 'total_liquido' },
    { data: 'desconto' },
    { data: 'acrescimo' },
    { data: 'observacao', defaultContent: '-' },
    {
        data: null,
        className: 'text-center',
        orderable: false,
        searchable: false,
        render: function (row) {
            return `
                <button onclick="editSale(${row.id})" class="btn btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deleteSale(${row.id})" class="btn btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            `;
        }
    } 
]).getData(filter => api.Sale.find(filter));

api.Sale.onReload(() => {
    table.ajax.reload(null, false);
});

async function deleteSale(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
        const response = await api.Sale.delete(id);
        if (response.status) {
            Swal.fire('Excluído!', 'A venda foi excluída.', 'success');
        } else {
            Swal.fire('Erro!', 'Não foi possível excluir a venda.', 'error');
        }
    }
}

function editSale(id) {
    api.window.open('pages/sale', { width: 800, height: 600, title: 'Editar Venda', id: id });
}

window.deleteSale = deleteSale;
window.editSale = editSale;