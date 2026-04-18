import { Datatables } from "../components/Datatables.js"

api.product.onReload(() => {
    $('#table-products').DataTable().ajax.reload(null, false);
});

Datatables.SetTable('#table-products', [
    { data: 'id' },
    { data: 'nome' },
    { data: 'codigo_barra' },
    { data: 'grupo' },
    { data: 'unidade' },
    { data: 'estq_atual' },
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
                <button onclick="printProduct(${row.id})" class="btn btn-xs btn-info btn-sm">
                    <i class="fa-solid fa-print"></i> Imprimir
                </button>
            `;
        }
    }
]).getData(filter => api.product.productSearch(filter));

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
        const product = await api.product.findById(id);
        if (!product) {
            toast('error', 'Erro', 'Produto não encontrado.');
            return;
        }

        await api.temp.set('product:edit', {
            action: 'e',
            ...product,
        });

        api.window.openModal('pages/product', {
            width: 800,
            height: 420,
            title: 'Editar Produto',
        });
    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}

async function printProduct(id) {
    try {
        const product = await api.product.findById(id);
        if (!product) {
            toast('error', 'Erro', 'Produto não encontrado.');
            return;
        }

        const dataAtual = new Date().toLocaleDateString('pt-BR');

        const stringHtml = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
            <style>
                body { font-family: Arial, sans-serif; font-size: 11px; color: #333; }
                .container { padding: 20px; border: 1px solid #ddd; margin-top: 10px; background: #fff; }
                .header-box { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px; }
                .info-card { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
                .preco-info { border-left: 5px solid #007bff; padding-left: 15px; }
                .table thead { background: #343a40; color: white; }
                .total-final { background: #28a745; color: white; font-size: 16px; font-weight: bold; padding: 15px; margin-top: 20px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">

                <!-- CABEÇALHO -->
                <div class="header-box text-center">
                    <h2>Ficha do Produto</h2>
                    <p>Data: <strong>${dataAtual}</strong></p>
                </div>

                <!-- INFORMAÇÕES DO PRODUTO E PREÇOS -->
                <div class="row">
                    <div class="col-7">
                        <div class="info-card">
                            <h6>PRODUTO</h6>
                            <strong>${product.nome}</strong><br>
                            Código de Barra: ${product.codigo_barra}<br>
                            Unidade: ${product.unidade}<br>
                            Status: ${product.ativo ? 'Ativo' : 'Inativo'}
                        </div>
                    </div>
                    <div class="col-5">
                        <div class="info-card preco-info">
                            <h6>PREÇOS</h6>
                            <strong>Preço de Compra:</strong> ${parseFloat(product.preco_compra).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<br>
                            <strong>Preço de Venda:</strong> ${parseFloat(product.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<br>
                            Margem: ${(((product.preco_venda - product.preco_compra) / product.preco_compra) * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>

                <!-- TABELA DO PRODUTO -->
                <div class="mt-4"><strong>DETALHES: ${product.id} - ${product.nome}</strong></div>
                <table class="table table-sm table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Código de Barra</th>
                            <th>Grupo</th>
                            <th class="text-center">Unidade</th>
                            <th class="text-right">Preço Compra</th>
                            <th class="text-right">Preço Venda</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${product.id}</td>
                            <td>${product.nome}</td>
                            <td>${product.codigo_barra}</td>
                            <td class="text-center">${product.unidade}</td>
                            <td class="text-right">${parseFloat(product.preco_compra).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td class="text-right">${parseFloat(product.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td class="text-center">${product.ativo ? 'Ativo' : 'Inativo'}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- TOTAL -->
                <div class="total-final text-right">
                    MARGEM DE LUCRO: ${(((product.preco_venda - product.preco_compra) / product.preco_compra) * 100).toFixed(2)}% &nbsp;|&nbsp; PREÇO DE VENDA: ${parseFloat(product.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>

            </div>
        </body>
        </html>
        `;

        const result = await api.report.print(stringHtml);

        if (result?.sucesso) {
            toast('success', 'Sucesso', 'PDF gerado em: ' + result.caminho);
        } else {
            toast('error', 'Erro', 'Falha ao gerar PDF.');
        }

    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}

window.printProduct = printProduct;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;