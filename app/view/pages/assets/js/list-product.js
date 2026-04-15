import { Datatables } from "../components/Datatables.js"
api.product.onReload(() => {
    $('#table-products').DataTable().ajax.reload(null, false);
});
// Inicializa a tabela
Datatables.SetTable('#table-products', [
    { data: 'id' },
    { data: 'nome' },
    { data: 'codigo_barra' },
    { data: 'unidade' },
    {
        data: 'preco_compra',
        render: function (data) {
            return parseFloat(data).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    },
    {
        data: 'preco_venda',
        render: function (data) {
            return parseFloat(data).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    },
    {
        data: 'ativo',
        render: function (data) {
            return data
                ? `<span>Ativo <i class="fa-regular fa-square-check"></i></span>`
                : `<span>Inativo <i class="fa-regular fa-square-full"></i></span>`;
        }
    },
    {
        data: 'criado_em',
        render: function (data) {
            return new Date(data).toLocaleString('pt-BR');
        }
    },
    {
        data: 'atualizado_em',
        render: function (data) {
            return new Date(data).toLocaleString('pt-BR');
        }
    },
    {
        data: null,
        orderable: false,
        searchable: false,
        render: function (row) {
            return `
                <button onclick="editProduct(${row.id})" class="btn btn-xs btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deleteProduct(${row.id})" class="btn btn-xs btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            `;
        }
    }
]).getData(filter => api.product.find(filter));
async function deleteProduct(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
        const response = await api.product.delete(id);

        if (response.status) {
            toast('success', 'Excluído', response.msg);
            $('#table-products').DataTable().ajax.reload();
        } else {
            toast('error', 'Erro', response.msg);
        }
    }
}
async function editProduct(id) {
    try {
        // 1. Busca os dados completos do produto
        const product = await api.product.findById(id);
        if (!product) {
            toast('error', 'Erro', 'Produto não encontrado.');
            return;
        }
        // 2. Salva no temp store com a ação 'e' (editar)
        await api.temp.set('product:edit', {
            action: 'e',
            ...product,
        });
        // 3. Abre a modal
        api.window.openModal('pages/product', {
            width: 800,
            height: 420,
            title: 'Editar Produto',
        });
    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;