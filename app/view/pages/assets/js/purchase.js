document.addEventListener('DOMContentLoaded', function () {

    // ─── Referências do DOM ──────────────────────────────────────────────────────
    const itemForm         = document.getElementById('item-sale-form');
    const finalizeSaleBtn  = document.getElementById('finalize-sale');
    const clearSaleBtn     = document.getElementById('clear-sale');
    const paymentSelect    = document.getElementById('payment-condition');
    const saleDiscount     = document.getElementById('sale-discount');
    const tableBody        = document.querySelector('#sale-items-table tbody');
    const supplierSelect   = document.getElementById('fornecedor_id');

    /**
     * ─── Inicialização de Dados Externos ─────────────────────────────────────────
     * Carrega os fornecedores cadastrados no banco
     */
    async function loadInitialData() {
        try {
            const response = await window.api.supplier.find({ limit: 1000 });
            
            supplierSelect.innerHTML = '<option value="">Selecione um fornecedor...</option>';
            
            if (response && response.data) {
                response.data.forEach(s => {
                    const opt = new Option(s.nome_fantasia || s.sobrenome_razao, s.id);
                    supplierSelect.add(opt);
                });
            }
        } catch (err) {
            console.error('Erro ao carregar fornecedores:', err);
        }
    }

    /**
     * ─── Inicialização do Select2 (Busca de Produtos) ────────────────────────────
     */
   function initSelect2() {
    $('#product-id').select2({
        placeholder: '🔎 Digite o nome ou código do produto...',
        minimumInputLength: 1, // Só dispara a busca após digitar 1 caractere
        allowClear: true,
        width: '100%',
        ajax: {
            delay: 300, // Evita sobrecarregar o banco enquanto digita
            transport: async function (params, success, failure) {
                try {
                    // params.data.term é o que o Select2 captura do input
                    const searchTerm = params.data.term || "";
                    
                    // Chamada para a ponte que você mostrou no preload.js
                    const response = await window.api.product.find({ q: searchTerm });
                    
                    // O Controller retorna { data: [...] }, o Select2 quer ver isso
                    success(response);
                } catch (err) {
                    console.error("Erro na busca do Select2:", err);
                    failure(err);
                }
            },
            processResults: (response) => {
                // Aqui transformamos os dados do banco no formato que o Select2 entende
                return {
                    results: (response.data || []).map(p => ({
                        id: p.id,
                        // O que aparece na lista
                        text: `${p.codigo_barra || 'S/C'} - ${p.nome}`, 
                        // Dados extras para usar depois
                        preco: p.preco_compra || 0,
                        nome: p.nome
                    }))
                };
            }
        }
    });

    // Evento ao selecionar o produto
    $('#product-id').on('select2:select', function (e) {
        const data = e.params.data;
        // Preenche o valor unitário (ajuste o ID do input se necessário)
        const unitPriceInput = document.getElementById('preco_unitario') || document.getElementById('unit-price');
        if (unitPriceInput) {
            unitPriceInput.value = parseFloat(data.preco).toFixed(2);
        }
        // Move o foco para a quantidade
        const qtyInput = document.getElementById('quantidade') || document.getElementById('quantidade');
        if (qtyInput) qtyInput.focus();
    });
}
    /**
     * ─── Gerenciamento da Tabela de Itens ────────────────────────────────────────
     */
    function addItemToTable({ id, nome, supplier, grupo, quantidade, unitPrice }) {
        const emptyRow = document.getElementById('empty-row');
        if (emptyRow) emptyRow.remove();

        const total = (quantidade * unitPrice).toFixed(2);
        const row   = document.createElement('tr');

        row.dataset.productId = id; // Guardamos o ID no dataset para o loop de finalização
        row.innerHTML = `
            <td>${nome}</td>
            <td><small class="text-muted">${supplier}</small></td>
            <td><small class="text-muted">${grupo}</small></td>
            <td class="text-end">
                <input type="number" class="form-control form-control-sm text-end qty-input" value="${quantidade}" min="1" style="width: 80px; display: inline-block;">
            </td>
            <td class="text-end">
                <input type="number" class="form-control form-control-sm text-end price-input" value="${unitPrice}" min="0" step="0.01" style="width: 110px; display: inline-block;">
            </td>
            <td class="text-end row-total">R$ ${total}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-danger btn-remove" title="Remover"><i class="bi bi-trash"></i></button>
            </td>
        `;

        // Eventos para recalcular ao alterar Qtd ou Preço na tabela
        row.querySelector('.qty-input').addEventListener('input', () => recalcRow(row));
        row.querySelector('.price-input').addEventListener('input', () => recalcRow(row));
        row.querySelector('.btn-remove').addEventListener('click', () => {
            row.remove();
            if (tableBody.querySelectorAll('tr:not(#empty-row)').length === 0) {
                tableBody.innerHTML = '<tr id="empty-row"><td colspan="7" class="text-center text-muted py-4">Nenhum item adicionado.</td></tr>';
            }
            updateTotals();
        });

        tableBody.appendChild(row);
        updateTotals();
    }

    function recalcRow(row) {
        const qty   = parseFloat(row.querySelector('.qty-input').value) || 0;
        const price = parseFloat(row.querySelector('.price-input').value) || 0;
        row.querySelector('.row-total').textContent = `R$ ${(qty * price).toFixed(2)}`;
        updateTotals();
    }

    function updateTotals() {
        const rows = document.querySelectorAll('#sale-items-table tbody tr:not(#empty-row)');
        let subtotal = 0;

        rows.forEach(row => {
            const text = row.querySelector('.row-total').textContent.replace('R$', '').trim();
            subtotal += parseFloat(text) || 0;
        });

        const discount = parseFloat(saleDiscount.value) || 0;
        const total    = Math.max(subtotal - discount, 0);

        document.getElementById('sale-subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('sale-total').textContent    = total.toFixed(2);

        updateInstallments(total);
    }

    /**
     * ─── Condição de Pagamento e Parcelas ───────────────────────────────────────
     */
    function updateInstallments(total) {
        const condition = paymentSelect.value;
        const installmentDiv = document.getElementById('installment-list');
        if (!installmentDiv) return;
        
        installmentDiv.innerHTML = '';

        const numParcelas = condition === 'avista' ? 1 : parseInt(condition.replace('parcelado', ''), 10);
        const valorParcela = total / numParcelas;

        for (let i = 1; i <= numParcelas; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex align-items-center gap-2 mb-2';
            wrapper.innerHTML = `
                <span class="text-muted small" style="min-width: 60px;">${numParcelas === 1 ? 'À vista' : i + 'ª parc.'}</span>
                <input type="number" class="form-control form-control-sm text-end installment-input" step="0.01" value="${valorParcela.toFixed(2)}">
            `;
            wrapper.querySelector('input').addEventListener('input', () => recalcDifference(total));
            installmentDiv.appendChild(wrapper);
        }
        recalcDifference(total);
    }

    function recalcDifference(total) {
        let soma = 0;
        document.querySelectorAll('.installment-input').forEach(i => soma += parseFloat(i.value) || 0);
        const diff = soma - total;
        const diffBadge = document.getElementById('installment-difference');
        
        if (diffBadge) {
            diffBadge.textContent = `R$ ${Math.abs(diff).toFixed(2)}`;
            diffBadge.className = Math.abs(diff) < 0.01 ? 'badge bg-success' : (diff > 0 ? 'badge bg-danger' : 'badge bg-warning text-dark');
        }
    }

    /**
     * ─── Ações de Finalização ──────────────────────────────────────────────────
     */
    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selected = $('#product-id').select2('data')[0];
        const quantidade = parseFloat(document.getElementById('quantidade').value);
        const unitPrice = parseFloat(document.getElementById('unit-price').value);

        if (!selected || !selected.id) return alert('Selecione um produto.');
        if (isNaN(quantidade) || quantidade <= 0) return alert('Informe uma quantidade válida.');

        addItemToTable({ 
            id: selected.id, 
            nome: selected.nome, 
            supplier: selected.supplier, 
            grupo: selected.grupo, 
            quantidade, 
            unitPrice 
        });

        // Limpa campos de inserção
        document.getElementById('quantidade').value = '';
        document.getElementById('unit-price').value = '';
        $('#product-id').val(null).trigger('change');
    });

    finalizeSaleBtn?.addEventListener('click', async function () {
        const rows = document.querySelectorAll('#sale-items-table tbody tr:not(#empty-row)');
        
        if (rows.length === 0) return alert('Adicione ao menos um item à compra.');
        if (!supplierSelect.value) return alert('Selecione um fornecedor.');

        // Montando os itens com id_produto (conforme seu banco)
        const items = Array.from(rows).map(row => ({
            id_produto: row.dataset.productId,
            quantidade:   parseFloat(row.querySelector('.qty-input').value),
            unit_price: parseFloat(row.querySelector('.price-input').value),
        }));

        // Montando o payload principal com id_fornecedor (conforme seu banco)
        const payload = {
            id_fornecedor: supplierSelect.value,
            estado_compra: document.getElementById('estado_compra').value,
            observacao:    document.getElementById('observacao').value,
            total:         parseFloat(document.getElementById('sale-total').textContent),
            items:         items,
        };

        try {
            const statusBadge = document.getElementById('sale-status');
            statusBadge.textContent = 'Salvando...';
            
            const response = await window.api.purchase.insert(payload);
            
            if (response.status) {
                alert(response.msg);
                clearSale();
            } else {
                alert('Erro: ' + response.msg);
                statusBadge.textContent = 'Erro';
            }
        } catch (err) {
            console.error(err);
            alert('Erro crítico ao salvar a compra.');
        }
    });

    clearSaleBtn?.addEventListener('click', function () {
        if (confirm('Deseja limpar todos os itens da compra?')) clearSale();
    });

    function clearSale() {
        tableBody.innerHTML = '<tr id="empty-row"><td colspan="7" class="text-center text-muted py-4">Nenhum item adicionado.</td></tr>';
        supplierSelect.value = '';
        document.getElementById('estado_compra').value = 'EM_ANDAMENTO';
        document.getElementById('observacao').value = '';
        saleDiscount.value = "0.00";
        const statusBadge = document.getElementById('sale-status');
        if (statusBadge) statusBadge.textContent = 'Em edição';
        updateTotals();
    }

    // Eventos Globais
    paymentSelect.addEventListener('change', () => updateTotals());
    saleDiscount.addEventListener('input', updateTotals);

    // Inicialização
    loadInitialData(); 
    initSelect2();     
    updateTotals();    
});