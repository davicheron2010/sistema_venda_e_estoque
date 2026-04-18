import { addSaleItem, initializeSaleItems } from './ItemSale.js';

function initializeCustomerSelect() {
    const select = $('#id_cliente');
    if (!select.length) return;

    select.select2({
        theme: 'bootstrap-5',
        placeholder: 'Selecione um cliente',
        allowClear: true,
        language: 'pt-BR',
        ajax: {
            transport: async function (params, success, failure) {
                try {
                    const searchTerm = params.data.q || '';
                    const result = await window.api.customer.find({ term: searchTerm, limit: 50, offset: 0 });

                    success({
                        results: result.data.map(item => ({
                            id: item.id,
                            text: item.nome + ' ' + item.codigo_barra 
                        }))
                    });
                } catch (error) {
                    console.error(error);
                    failure(error);
                }
            },
            delay: 250
        },
        minimumInputLength: 0
    });
}

function initializeProductSelect() {
    const select = $('#id_produto');
    if (!select.length) return;

    select.select2({
        theme: 'bootstrap-5',
        placeholder: 'Buscar produto...',
        allowClear: true,
        language: 'pt-BR',
        ajax: {
            transport: async function (params, success, failure) {
                try {
                    const searchTerm = params.data.q || '';
                    const result = await window.api.product.find({ term: searchTerm, limit: 50, offset: 0 });

                    success({
                        results: result.data.map(item => ({
                            id: item.id,
                            text: 'Cód: ' + item.id + ' - ' + item.nome + 'Cód. Barras: ' + item.codigo_barra
                        }))
                    });
                } catch (error) {
                    console.error(error);
                    failure(error);
                }
            },
            delay: 250
        },
        minimumInputLength: 0
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // 1. DISPARA O CARREGAMENTO
    initializeCustomerSelect();
    initializeProductSelect();
    initializeSaleItems();

    // --- Modal de Itens ---
    const btnOpenForm = document.getElementById('btn-open-form');
    const itemModalElement = document.getElementById('itemModal');
    const itemModal = itemModalElement ? new bootstrap.Modal(itemModalElement) : null;

    if (btnOpenForm && itemModal) {
        btnOpenForm.addEventListener('click', () => itemModal.show());
    }

    // --- Adicionar Item À Tabela ---
    const itemForm = document.getElementById('item-sale-form');
    if (itemForm) {
        itemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const productSelect = document.getElementById('id_produto');
            const productId = productSelect ? productSelect.value : '';
            const quantity = document.getElementById('quantidade').value;
            const unitPrice = document.getElementById('unitario_liquido').value;

            if (!productId) {
                alert('Selecione um produto válido da lista.');
                return;
            }

            addItemToTable(productId, quantity, unitPrice);
            if (itemModal) itemModal.hide();
            itemForm.reset();
        });
    }
});

function addItemToTable(productId, quantity, unitPrice) {
    const customerSelect = document.getElementById('id_cliente');
    const clienteNome = customerSelect?.selectedOptions?.[0]?.text || '';
    const clienteId = customerSelect?.value || '';

    window.api.product.findById(productId).then(product => {
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(unitPrice) || 0;
        const total = parseFloat((qty * price).toFixed(2));

        const item = {
            id_produto: product.id,
            nome_produto: product.nome,
            id_cliente: clienteId,
            nome_cliente: clienteNome,
            nome_grupo: product.grupo || '-',
            quantidade: qty,
            preco_unitario: price,
            total: total
        };

        addSaleItem(item);
    });
}
