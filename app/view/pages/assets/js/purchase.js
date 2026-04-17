//Lista de itens em memória
let items = [];
let currentPaymentTerm = null;

//Select2: Fornecedor
$('#fornecedor_id').select2({
    theme: 'bootstrap-5',
    placeholder: "Selecione um fornecedor",
    language: "pt-BR",
    ajax: {
        transport: async function (params, success, failure) {
            try {
                const searchTerm = params.data.q || '';
                const result = await window.api.supplier.find({ term: searchTerm });
                success({
                    results: result.data.map(item => ({
                        id:           item.id,
                        text:         item.nome_fantasia,
                        razao_social: item.razao_social || '—',
                        cnpj_cpf:     item.cnpj_cpf || '—'
                    }))
                });
            } catch (error) {
                console.error(error);
                failure();
            }
        },
        delay: 250
    }
});

//Select2: Produto
$('#product-id').select2({
    theme: 'bootstrap-5',
    placeholder: "Selecione um produto",
    language: "pt-BR",
    ajax: {
        transport: async function (params, success, failure) {
            try {
                const searchTerm = params.data.q || '';
                const result = await window.api.product.find({ q: searchTerm });
                success({
                    results: result.data.map(item => ({
                        id:           item.id,
                        text:         item.nome,
                        preco_compra: item.preco_compra,
                        grupo:        item.grupo || '—'
                    }))
                });
            } catch (error) {
                console.error(error);
                failure();
            }
        },
        delay: 250
    }
});

//Placeholder do campo de busca do Select2
$('.form-select').on('select2:open', function () {
    let inputElement = document.querySelector('.select2-search__field');
    if (inputElement) {
        inputElement.placeholder = 'Digite para pesquisar...';
        inputElement.focus();
    }
});

//Bloqueia preço unitário enquanto nenhum produto estiver selecionado
$('#unit-price').prop('disabled', true);

$('#product-id').on('select2:select', function () {
    const data = $(this).select2('data')[0];
    $('#unit-price').prop('disabled', false);

    if (data && data.preco_compra) {
        $('#unit-price').val(parseFloat(data.preco_compra).toFixed(2));
    } else {
        $('#unit-price').val('');
    }

    $('#unit-price').focus();
});

$('#product-id').on('select2:clear select2:unselect', function () {
    $('#unit-price').prop('disabled', true).val('');
});

//Adicionar item à lista
$('#item-sale-form').on('submit', function (e) {
    e.preventDefault();

    const productSelect = $('#product-id');
    const productId     = productSelect.val();
    const productData   = productSelect.select2('data')[0];
    const produto_nome  = productData?.text || '';
    const grupo         = productData?.grupo || '—';
    const quantidade    = parseFloat($('#quantity').val());
    const unitario      = parseFloat($('#unit-price').val());

    if (!productId)                      { alert('Selecione um produto.'); return; }
    if (!quantidade || quantidade <= 0)  { alert('Informe uma quantidade válida.'); return; }
    if (isNaN(unitario) || unitario < 0) { alert('Informe um preço unitário válido.'); return; }

    const total = parseFloat((quantidade * unitario).toFixed(2));

    items.push({
        id_produto:     parseInt(productId),
        produto_nome,
        grupo,
        quantidade,
        unitario_bruto: unitario,
        total
    });

    renderTable();
    updateSummary();

    productSelect.val(null).trigger('change');
    $('#quantity').val('');
    $('#unit-price').val('').prop('disabled', true);
});

//Renderiza a tabela de itens
function renderTable() {
    const tbody      = $('#sale-items-table tbody');
    const fornecedor = $('#fornecedor_id').select2('data')[0]?.text || '—';
    tbody.empty();

    if (items.length === 0) {
        tbody.append(`
            <tr id="empty-row">
                <td colspan="7" class="text-center text-muted py-4">Nenhum item adicionado.</td>
            </tr>
        `);
        return;
    }

    items.forEach((item, index) => {
        tbody.append(`
            <tr>
                <td>${item.produto_nome}</td>
                <td>${fornecedor}</td>
                <td>${item.grupo}</td>
                <td class="text-end">${item.quantidade}</td>
                <td class="text-end">R$ ${item.unitario_bruto.toFixed(2)}</td>
                <td class="text-end">R$ ${item.total.toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger btn-remove" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

//Remover item da lista
$('#sale-items-table').on('click', '.btn-remove', function () {
    const index = $(this).data('index');
    items.splice(index, 1);
    renderTable();
    updateSummary();
});

//Atualiza resumo (subtotal, desconto, total)
function updateSummary() {
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const desconto = parseFloat($('#sale-discount').val()) || 0;
    const total    = Math.max(0, subtotal - desconto);

    $('#sale-subtotal').text(subtotal.toFixed(2));
    $('#sale-total').text(total.toFixed(2));

    renderInstallments();
}

$('#sale-discount').on('input', updateSummary);

//Limpar tudo
$('#clear-sale').on('click', function () {
    if (!confirm('Deseja limpar todos os itens?')) return;
    items = [];
    currentPaymentTerm = null;
    $('#fornecedor_id').val(null).trigger('change');
    $('#sale-discount').val('0.00');
    $('#sale-status').text('Em edição');
    renderTable();
    updateSummary();
});

// ─── Condições de pagamento ───────────────────────────────────────────────────

async function loadPaymentTerms() {
    try {
        const result = await window.api.paymentTerms.find();
        const select = $('#payment-condition');
        select.empty().append('<option value="">Selecione...</option>');

        if (!result.data || result.data.length === 0) {
            select.append('<option value="" disabled>Nenhuma condição cadastrada</option>');
            return;
        }

        result.data.forEach(term => {
            select.append(`<option value="${term.id}">${term.titulo}</option>`);
        });

    } catch (error) {
        console.error('Erro ao carregar condições de pagamento:', error);
    }
}

$('#payment-condition').on('change', async function () {
    const id = $(this).val();
    if (!id) {
        currentPaymentTerm = null;
        renderInstallments();
        return;
    }

    try {
        const result = await window.api.paymentTerms.findWithInstallments(id);
        currentPaymentTerm = result;
        renderInstallments();
    } catch (error) {
        console.error('Erro ao buscar parcelas:', error);
    }
});

// ─── Parcelas ─────────────────────────────────────────────────────────────────

function renderInstallments() {
    const total = parseFloat($('#sale-total').text()) || 0;
    const list  = $('#installment-list');
    list.empty();

    if (total === 0) {
        list.append(`<p class="text-muted small">Adicione itens para ver as parcelas.</p>`);
        $('#installment-difference').text('R$ 0.00').removeClass('bg-danger bg-success').addClass('bg-secondary');
        return;
    }

    if (!currentPaymentTerm || !currentPaymentTerm.installments || currentPaymentTerm.installments.length === 0) {
        list.append(`<p class="text-muted small">Selecione uma condição de pagamento.</p>`);
        $('#installment-difference').text('R$ 0.00').removeClass('bg-danger bg-success').addClass('bg-secondary');
        return;
    }

    const numParcelas  = currentPaymentTerm.installments.length;
    const valorParcela = parseFloat((total / numParcelas).toFixed(2));

    currentPaymentTerm.installments
        .sort((a, b) => a.parcela - b.parcela)
        .forEach((inst) => {
            const vencimento = new Date();
            vencimento.setDate(vencimento.getDate() + (inst.intervalor || 0));
            const vencimentoStr = vencimento.toLocaleDateString('pt-BR');

            list.append(`
                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="text-muted small" style="min-width:70px;">Parcela ${inst.parcela}</span>
                    <span class="text-muted small" style="min-width:80px;">${vencimentoStr}</span>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">R$</span>
                        <input 
                            type="number" 
                            class="form-control installment-input" 
                            step="0.01" 
                            min="0" 
                            value="${valorParcela.toFixed(2)}"
                            data-parcela="${inst.parcela}"
                        >
                    </div>
                </div>
            `);
        });

    updateDifference();
}

function updateDifference() {
    const total          = parseFloat($('#sale-total').text()) || 0;
    const somaParceladas = $('.installment-input').toArray()
        .reduce((acc, el) => acc + (parseFloat(el.value) || 0), 0);

    const diff  = parseFloat((somaParceladas - total).toFixed(2));
    const badge = $('#installment-difference');

    badge.text('R$ ' + Math.abs(diff).toFixed(2));

    if (diff === 0) {
        badge.removeClass('bg-danger bg-success').addClass('bg-secondary');
    } else if (diff > 0) {
        badge.removeClass('bg-danger bg-secondary').addClass('bg-success');
    } else {
        badge.removeClass('bg-success bg-secondary').addClass('bg-danger');
    }
}

$('#installment-list').on('input', '.installment-input', updateDifference);

// ─── Finalizar Compra ─────────────────────────────────────────────────────────

$('#finalize-sale').on('click', async function () {

    const fornecedorData    = $('#fornecedor_id').select2('data')[0];
    const fornecedorId      = $('#fornecedor_id').val();
    const fornecedorNome    = fornecedorData?.text || '—';
    const fornecedorRazao   = fornecedorData?.razao_social || '—';
    const fornecedorCnpjCpf = fornecedorData?.cnpj_cpf || '—';
    const estadoCompra      = 'CONCLUIDO'; // ✅ sempre finaliza como concluído

    if (!fornecedorId)       { alert('Selecione um fornecedor.'); return; }
    if (items.length === 0)  { alert('Adicione pelo menos um item.'); return; }
    if (!currentPaymentTerm) { alert('Selecione uma condição de pagamento.'); return; }

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const desconto = parseFloat($('#sale-discount').val()) || 0;
    const total    = Math.max(0, subtotal - desconto);

    const parcelas = $('.installment-input').toArray().map((el, i) => ({
        parcela: i + 1,
        valor:   parseFloat(el.value) || 0
    }));

    try {
        // 1. Salva no banco
        const payload = {
            id_fornecedor: parseInt(fornecedorId),
            estado_compra: estadoCompra,
            total_bruto:   subtotal,
            total_liquido: total,
            desconto:      desconto,
            items:         items.map(item => ({
                id_produto:     item.id_produto,
                quantidade:     item.quantidade,
                unitario_bruto: item.unitario_bruto,
            }))
        };

        const result = await window.api.purchase.insert(payload);

        if (!result.status) {
            alert('Erro ao salvar compra: ' + result.msg);
            return;
        }

        // 2. Gera o PDF
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        const itensHtml = items.map(item => `
            <tr>
                <td>${item.produto_nome}</td>
                <td>${item.grupo}</td>
                <td class="text-center">${item.quantidade}</td>
                <td class="text-right">${parseFloat(item.unitario_bruto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td class="text-right">${parseFloat(item.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            </tr>
        `).join('');

        const parcelasHtml = parcelas.map(p => `
            <tr>
                <td class="text-center">${p.parcela}ª parcela</td>
                <td class="text-right">${parseFloat(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            </tr>
        `).join('');

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
                .table thead { background: #343a40; color: white; }
                .total-final { background: #28a745; color: white; font-size: 14px; font-weight: bold; padding: 15px; margin-top: 20px; border-radius: 4px; }
                .section-title { border-left: 4px solid #007bff; padding-left: 10px; margin: 20px 0 10px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">

                <div class="header-box text-center">
                    <h2>Relatório de Compra</h2>
                    <p>Data: <strong>${dataAtual}</strong> &nbsp;|&nbsp; Status: <strong>Concluído</strong></p>
                </div>

                <div class="section-title">FORNECEDOR</div>
                <div class="info-card">
                    <strong>${fornecedorNome}</strong><br>
                    Razão Social: ${fornecedorRazao}<br>
                    CNPJ/CPF: ${fornecedorCnpjCpf}
                </div>

                <div class="section-title">ITENS DA COMPRA</div>
                <table class="table table-sm table-bordered">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Grupo</th>
                            <th class="text-center">Qtd</th>
                            <th class="text-right">Unit.</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itensHtml}</tbody>
                </table>

                <div class="section-title">RESUMO</div>
                <div class="info-card">
                    <div class="row">
                        <div class="col-6">Subtotal:</div>
                        <div class="col-6 text-right">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <div class="col-6">Desconto:</div>
                        <div class="col-6 text-right">- ${desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                </div>

                <div class="section-title">CONDIÇÃO DE PAGAMENTO: ${currentPaymentTerm.titulo}</div>
                <table class="table table-sm table-bordered">
                    <thead>
                        <tr>
                            <th class="text-center">Parcela</th>
                            <th class="text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>${parcelasHtml}</tbody>
                </table>

                <div class="total-final text-right">
                    TOTAL: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>

            </div>
        </body>
        </html>
        `;

        await window.api.report.print(stringHtml);

        // 3. Limpa após finalizar
        items = [];
        currentPaymentTerm = null;
        $('#fornecedor_id').val(null).trigger('change');
        $('#sale-discount').val('0.00');
        $('#sale-status').text('Concluído');
        renderTable();
        updateSummary();

    } catch (err) {
        console.error(err);
        alert('Erro ao finalizar compra: ' + err.message);
    }
});

// Inicializa
loadPaymentTerms();