let items = [];
let currentPaymentTerm = null;
let paymentModal = null;

// ─── Select2: Fornecedor ──────────────────────────────────────────────────────
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

// ─── Select2: Produto ─────────────────────────────────────────────────────────
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

$('#unit-price').prop('disabled', true);

$('#product-id').on('select2:select', function () {
    const data = $(this).select2('data')[0];
    $('#unit-price').prop('disabled', false);

    if (data && data.preco_compra) {
        $('#unit-price').val(parseFloat(data.preco_compra).toFixed(2));
    } else {
        $('#unit-price').val('');
    }
    $('#quantity').focus();
});

// ─── Gerenciamento de Itens ───────────────────────────────────────────────────
$('#item-sale-form').on('submit', function (e) {
    e.preventDefault();

    const productSelect = $('#product-id');
    const productId     = productSelect.val();
    const productData   = productSelect.select2('data')[0];
    const quantidade    = parseFloat($('#quantity').val().replace(',', '.'));
    const unitario      = parseFloat($('#unit-price').val().replace(',', '.'));

    if (!productId) { 
        Swal.fire('Atenção', 'Selecione um produto.', 'warning'); 
        return; 
    }
    if (!quantidade || quantidade <= 0) { 
        Swal.fire('Atenção', 'Informe uma quantidade válida.', 'warning'); 
        return; 
    }
    if (isNaN(unitario) || unitario < 0) { 
        Swal.fire('Atenção', 'Informe um preço unitário válido.', 'warning'); 
        return; 
    }

    const total = parseFloat((quantidade * unitario).toFixed(2));

    items.push({
        id_produto:     parseInt(productId),
        produto_nome:   productData.text,
        grupo:          productData.grupo || '—',
        quantidade:     quantidade,
        unitario_bruto: unitario,
        total:          total
    });

    renderTable();
    updateSummary();

    productSelect.val(null).trigger('change');
    $('#quantity').val('');
    $('#unit-price').val('').prop('disabled', true);
});

function renderTable() {
    const tbody = $('#sale-items-table tbody');
    const fornecedorNome = $('#fornecedor_id').select2('data')[0]?.text || '—';
    tbody.empty();

    if (items.length === 0) {
        tbody.append('<tr id="empty-row"><td colspan="7" class="text-center text-muted py-4">Nenhum item adicionado.</td></tr>');
        return;
    }

    items.forEach((item, index) => {
        tbody.append(`
            <tr>
                <td>${item.produto_nome}</td>
                <td>${fornecedorNome}</td>
                <td>${item.grupo}</td>
                <td class="text-end">${item.quantidade}</td>
                <td class="text-end">R$ ${item.unitario_bruto.toFixed(2)}</td>
                <td class="text-end">R$ ${item.total.toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="removeItem(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `);
    });
}

window.removeItem = (index) => {
    items.splice(index, 1);
    renderTable();
    updateSummary();
};

function updateSummary() {
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const desconto = parseFloat($('#sale-discount').val().replace(',', '.')) || 0;
    const total    = Math.max(0, subtotal - desconto);

    $('#sale-subtotal').text(subtotal.toFixed(2));
    $('#sale-total').text(total.toFixed(2));

    if (paymentModal && $('#paymentModal').hasClass('show')) {
        renderInstallments();
    }
}

$('#sale-discount').on('input', updateSummary);

// ─── Pagamento e Parcelas (Dentro do Modal) ───────────────────────────────────
async function loadPaymentTerms() {
    try {
        const result = await window.api.paymentTerms.find();
        const select = $('#payment-condition');
        select.empty().append('<option value="">Selecione...</option>');
        result.data.forEach(term => {
            select.append(`<option value="${term.id}">${term.titulo}</option>`);
        });
    } catch (error) { 
        console.error(error); 
    }
}

$('#payment-condition').on('change', async function () {
    const id = $(this).val();
    if (!id) { currentPaymentTerm = null; renderInstallments(); return; }
    currentPaymentTerm = await window.api.paymentTerms.findWithInstallments(id);
    renderInstallments();
    checkConfirmButton();
});

function renderInstallments() {
    const totalGeral = parseFloat($('#sale-total').text()) || 0;
    const list = $('#installment-list').empty();

    if (totalGeral === 0 || !currentPaymentTerm) {
        $('#installment-difference').text('R$ 0.00').removeClass('bg-danger bg-success').addClass('bg-secondary');
        return;
    }

    const numParcelas = currentPaymentTerm.installments.length;
    const valorParcelaBase = (totalGeral / numParcelas).toFixed(2);

    currentPaymentTerm.installments.forEach((inst) => {
        list.append(`
            <div class="col-md-6 mb-2">
                <div class="input-group input-group-sm">
                    <span class="input-group-text small">P${inst.parcela}</span>
                    <input type="number" class="form-control installment-input" step="0.01" value="${valorParcelaBase}">
                </div>
            </div>
        `);
    });

    $('.installment-input').on('input', calculateDifference);
    calculateDifference();
}

function calculateDifference() {
    const totalGeral = parseFloat($('#sale-total').text()) || 0;
    let somaParcelas = 0;
    
    $('.installment-input').each(function() {
        somaParcelas += parseFloat($(this).val()) || 0;
    });

    const diff = (totalGeral - somaParcelas).toFixed(2);
    const diffElem = $('#installment-difference');
    
    diffElem.text(`R$ ${diff}`);
    
    if (Math.abs(diff) <= 0.01) {
        diffElem.removeClass('bg-danger bg-secondary').addClass('bg-success');
    } else {
        diffElem.removeClass('bg-success bg-secondary').addClass('bg-danger');
    }
    
    checkConfirmButton();
}

// ─── Finalização e Modal ──────────────────────────────────────────────────────

$('#finalize-sale').on('click', async function () {
    if (!$('#fornecedor_id').val()) {
        Swal.fire('Atenção', 'Selecione um fornecedor antes de continuar.', 'warning');
        return;
    }
    if (items.length === 0) {
        Swal.fire('Atenção', 'A lista de itens está vazia.', 'warning');
        return;
    }

    $('#modal-total').text($('#sale-total').text());
    
    if (!paymentModal) paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    paymentModal.show();

    await loadPaymentTerms(); 
});

function checkConfirmButton() {
    const diffText = $('#installment-difference').text().replace('R$ ', '').replace(',', '.');
    const diff = Math.abs(parseFloat(diffText));
    const isReady = diff <= 0.01 && $('#payment-condition').val() !== "";
    $('#confirm-payment').prop('disabled', !isReady);
}

$(document).on('input', '.installment-input', checkConfirmButton);
$('#payment-condition').on('change', checkConfirmButton);

$('#confirm-payment').on('click', async function () {
    try {
        const total = parseFloat($('#sale-total').text()) || 0;
        const subtotal = parseFloat($('#sale-subtotal').text()) || 0;
        const desconto = parseFloat($('#sale-discount').val().replace(',', '.')) || 0;
        
        const fornecedorData = $('#fornecedor_id').select2('data')[0];
        const fornecedorNome = fornecedorData.text;
        const fornecedorRazao = fornecedorData.razao_social || '—';
        const fornecedorCnpjCpf = fornecedorData.cnpj_cpf || '—';

        const parcelas = [];
        $('.installment-input').each(function(index) {
            parcelas.push({
                parcela: index + 1,
                valor: parseFloat($(this).val()) || 0
            });
        });

        // ─── 1. SALVAR NO BANCO (Controller) ──────────────────────────────────
        const purchaseData = {
            id_fornecedor: parseInt(fornecedorData.id),
            id_condicao_pagamento: parseInt($('#payment-condition').val()) || null,
            total_bruto: subtotal,
            total_liquido: total,
            desconto: desconto,
            estado_compra: 'RECEBIDO',
            items: items.map(item => ({
                id_produto: item.id_produto,
                quantidade: item.quantidade,
                unitario_bruto: item.unitario_bruto
            }))
        };

        Swal.fire({
            title: 'Processando...',
            text: 'Salvando dados da compra',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const saveResult = await window.api.purchase.insert(purchaseData);

        if (!saveResult.status) {
            Swal.fire('Erro', saveResult.msg, 'error');
            return;
        }

        // ─── 2. GERAR O PDF ───────────────────────────────────────────────────
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        const itensHtml = items.map(item => `
            <tr>
                <td>${item.produto_nome}</td>
                <td>${item.grupo}</td>
                <td class="text-center">${item.quantidade}</td>
                <td class="text-right">${item.unitario_bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td class="text-right">${item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            </tr>
        `).join('');

        const parcelasHtml = parcelas.map(p => `
            <tr>
                <td class="text-center">${p.parcela}ª parcela</td>
                <td class="text-right">${p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
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
                    <h2>Relatório de Compra #${saveResult.id}</h2>
                    <p>Data: <strong>${dataAtual}</strong></p>
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
        
        paymentModal.hide();

        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: `Compra #${saveResult.id} salva e impressa corretamente.`,
            confirmButtonText: 'OK'
        }).then(() => {
            location.reload(); 
        });
        
    } catch (error) {
        console.error("Erro ao finalizar compra:", error);
        Swal.fire('Erro Crítico', 'Não foi possível concluir a operação.', 'error');
    }
});

$('#clear-sale').on('click', function () {
    Swal.fire({
        title: 'Limpar tudo?',
        text: "Isso removerá todos os itens da lista.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, limpar!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            items = [];
            $('#fornecedor_id').val(null).trigger('change');
            $('#sale-discount').val('0.00');
            renderTable();
            updateSummary();
        }
    });
});