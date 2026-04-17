//Lista de itens em memória
let items = [];

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
                        id: item.id,
                        text: item.nome_fantasia
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
                        id: item.id,
                        text: 'Cód: ' + item.id + ' - ' + item.nome + ' | Cód. barra: ' + item.codigo_barra
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
    $('#unit-price').prop('disabled', false).focus();
});

$('#product-id').on('select2:clear select2:unselect', function () {
    $('#unit-price').prop('disabled', true).val('');
});

//Adicionar item à lista
$('#item-sale-form').on('submit', function (e) {
    e.preventDefault();

    const productSelect = $('#product-id');
    const productId     = productSelect.val();
    const productText   = productSelect.select2('data')[0]?.text || '';
    const quantidade    = parseFloat($('#quantity').val());
    const unitario      = parseFloat($('#unit-price').val());

    // Validações
    if (!productId) {
        alert('Selecione um produto.');
        return;
    }
    if (!quantidade || quantidade <= 0) {
        alert('Informe uma quantidade válida.');
        return;
    }
    if (isNaN(unitario) || unitario < 0) {
        alert('Informe um preço unitário válido.');
        return;
    }

    const total = parseFloat((quantidade * unitario).toFixed(2));

    // Adiciona ao array
    items.push({
        id_produto:     parseInt(productId),
        produto_nome:   productText,
        quantidade,
        unitario_bruto: unitario,
        total
    });

    renderTable();
    updateSummary();

    // Limpa o formulário
    productSelect.val(null).trigger('change');
    $('#quantity').val('');
    $('#unit-price').val('').prop('disabled', true);
});

//Renderiza a tabela de itens
function renderTable() {
    const tbody = $('#sale-items-table tbody');
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
                <td>—</td>
                <td>—</td>
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

// Remover item da lista 
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


// Limpar tudo
$('#clear-sale').on('click', function () {
    if (!confirm('Deseja limpar todos os itens?')) return;
    items = [];
    $('#fornecedor_id').val(null).trigger('change');
    $('#sale-discount').val('0.00');
    renderTable();
    updateSummary();
});

//Parcelas

function renderInstallments() {
    const condition = $('#payment-condition').val();
    const total     = parseFloat($('#sale-total').text()) || 0;

    const numParcelas = condition === 'avista' ? 1
        : condition === 'parcelado2' ? 2
        : condition === 'parcelado3' ? 3
        : 4;

    const valorParcela = total > 0 ? parseFloat((total / numParcelas).toFixed(2)) : 0;

    const list = $('#installment-list');
    list.empty();

    if (total === 0) {
        list.append(`<p class="text-muted small">Adicione itens para ver as parcelas.</p>`);
        $('#installment-difference').text('R$ 0.00').removeClass('bg-danger bg-success').addClass('bg-secondary');
        return;
    }

    for (let i = 1; i <= numParcelas; i++) {
        list.append(`
            <div class="d-flex align-items-center gap-2 mb-2">
                <span class="text-muted small" style="min-width:60px;">Parcela ${i}</span>
                <div class="input-group input-group-sm">
                    <span class="input-group-text">R$</span>
                    <input 
                        type="number" 
                        class="form-control installment-input" 
                        step="0.01" 
                        min="0" 
                        value="${valorParcela.toFixed(2)}"
                        data-parcela="${i}"
                    >
                </div>
            </div>
        `);
    }

    updateDifference();
}

function updateDifference() {
    const total          = parseFloat($('#sale-total').text()) || 0;
    const somaParceladas = $('.installment-input').toArray()
        .reduce((acc, el) => acc + (parseFloat(el.value) || 0), 0);

    const diff = parseFloat((somaParceladas - total).toFixed(2));

    const badge = $('#installment-difference');
    badge.text('R$ ' + Math.abs(diff).toFixed(2));

    if (diff === 0) {
        badge.removeClass('bg-danger bg-success').addClass('bg-secondary');
    } else if (diff > 0) {
        badge.removeClass('bg-danger bg-secondary').addClass('bg-success'); // sobra
    } else {
        badge.removeClass('bg-success bg-secondary').addClass('bg-danger'); // falta
    }
}

// Quando mudar a condição de pagamento
$('#payment-condition').on('change', renderInstallments);

// Quando editar manualmente uma parcela
$('#installment-list').on('input', '.installment-input', updateDifference);