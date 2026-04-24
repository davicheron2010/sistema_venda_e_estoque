const table = Datatables.SetTable('#table-products', [
    { data: 'id' },
    { data: 'nome' },
    { data: 'codigo_barra', defaultContent: '-' },
    { data: 'grupo', defaultContent: '-' },
    { data: 'unidade', defaultContent: '-' },

    {
        data: 'preco_compra',
        render: d => parseFloat(d || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    },

    {
        data: 'preco_venda',
        render: d => parseFloat(d || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        })
    },

    {
        data: 'ativo',
        render: d => d
            ? `<span>Ativo <i class="fa-regular fa-square-check"></i></span>`
            : `<span>Inativo <i class="fa-regular fa-square-full"></i></span>`
    },

    {
        data: null,
        orderable: false,
        searchable: false,
        render: (row) => `
            <div class="d-flex gap-1">

                <button onclick="openStockModal(${row.id}, '${row.nome.replace(/'/g, "\\'")}')"
                    class="btn btn-info btn-sm">
                    <i class="fa-solid fa-boxes-stacked"></i>
                </button>

                <button onclick="editProduct(${row.id})"
                    class="btn btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>

                <button onclick="deleteProduct(${row.id})"
                    class="btn btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>
        `
    }
]).getData(filter => api.product.find(filter));

/* =========================
   MODAL STOCK
========================= */

const stockModal = new bootstrap.Modal(document.getElementById('modalStockAdjust'));

window.openStockModal = function (id, nome) {
    document.getElementById('form-stock-adjust').reset();
    document.getElementById('stock_product_id').value = id;
    document.getElementById('stock_product_name').value = nome;
    stockModal.show();
};

/* UX simples */
document.getElementById('stock_tipo').addEventListener('change', (e) => {
    const input = document.getElementById('stock_quantidade');

    input.placeholder =
        e.target.value === 'AJUSTE'
            ? 'Novo estoque final'
            : 'Quantidade';
});

/* SALVAR ESTOQUE */
document.getElementById('btn-save-stock').addEventListener('click', async () => {

    const id_produto = parseInt(document.getElementById('stock_product_id').value);
    const tipo = document.getElementById('stock_tipo').value;
    const quantidade = parseFloat(document.getElementById('stock_quantidade').value);
    const observacao = document.getElementById('stock_observacao').value;

    if (!quantidade || quantidade < 0) {
        return toast('error', 'Erro', 'Informe uma quantidade válida');
    }

    $("#btn-save-stock").prop("disabled", true);

    try {
        const response = await api.stock.adjust({
            id_produto,
            tipo,
            quantidade,
            observacao
        });

        if (response.status) {
            toast('success', 'Sucesso', response.msg);
            stockModal.hide();
            table.ajax.reload(null, false);
        } else {
            toast('error', 'Erro', response.msg);
        }

    } catch (err) {
        toast('error', 'Erro', err.message);
    } finally {
        $("#btn-save-stock").prop("disabled", false);
    }
});