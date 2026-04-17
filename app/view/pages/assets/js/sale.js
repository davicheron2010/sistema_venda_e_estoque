// Função para carregar os clientes no SELECT (corrigido)
async function loadCustomers() {
    try {
        console.log("Iniciando busca de clientes...");
        const result = await window.api.Customer.find({ limit: 1000 });
        
        console.log("Resultado do banco:", result); // Verifique se aparece no F12

        const selectCliente = document.getElementById('id_cliente');
        
        if (!selectCliente) {
            console.error("ERRO: O elemento #id_cliente não foi encontrado no HTML.");
            return;
        }

        // Limpa e adiciona a opção padrão
        selectCliente.innerHTML = '<option value="">Selecione um cliente...</option>';

        if (result && result.data && result.data.length > 0) {
            result.data.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                // Verifique se no seu banco a coluna é 'nome' ou 'name'
                option.textContent = `${customer.id} - ${customer.nome}`;
                selectCliente.appendChild(option);
            });
            console.log(`${result.data.length} clientes adicionados ao select.`);
        } else {
            console.warn("Nenhum cliente retornado do banco de dados.");
        }
    } catch (error) {
        console.error('Erro crítico ao carregar clientes:', error);
    }
}
// Função para carregar produtos no DATALIST do Modal
async function loadProducts() {
    try {
        const result = await window.api.Product.find({ limit: 100 });
        const datalist = document.getElementById('product-list');
        if (!datalist) return;
        
        datalist.innerHTML = '';
        result.data.forEach(product => {
            const option = document.createElement('option');
            option.value = `${product.codigo_barra} - ${product.nome}`;
            option.dataset.id = product.id;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 1. DISPARA O CARREGAMENTO
    loadCustomers();
    loadProducts();

    // --- Modal de Itens ---
    const btnOpenForm = document.getElementById('btn-open-form');
    const itemModalElement = document.getElementById('itemModal');
    const itemModal = itemModalElement ? new bootstrap.Modal(itemModalElement) : null;

    if (btnOpenForm && itemModal) {
        btnOpenForm.addEventListener('click', () => itemModal.show());
    }

    // --- Lógica de Seleção de Produto ---
    const productSearch = document.getElementById('product-search');
    const productIdInput = document.getElementById('product-id');

    if (productSearch) {
        productSearch.addEventListener('input', function() {
            const value = this.value;
            const options = document.querySelectorAll('#product-list option');
            let selectedId = '';
            options.forEach(option => {
                if (option.value === value) {
                    selectedId = option.dataset.id;
                }
            });
            productIdInput.value = selectedId;
        });
    }

    // --- Adicionar Item à Tabela ---
    const itemForm = document.getElementById('item-sale-form');
    if (itemForm) {
        itemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const productId = productIdInput.value;
            const quantity = document.getElementById('quantity').value;
            const unitPrice = document.getElementById('unit-price').value;

            if (!productId) {
                alert('Selecione um produto válido da lista.');
                return;
            }

            addItemToTable(productId, quantity, unitPrice);
            if (itemModal) itemModal.hide();
            itemForm.reset();
            productIdInput.value = ''; // Limpa o ID oculto
        });
    }
});

function addItemToTable(productId, quantity, unitPrice) {
    window.api.Product.findById(productId).then(product => {
        const tableBody = document.querySelector('#sale-items-table tbody');
        const emptyRow = document.getElementById('empty-row');
        if (emptyRow) emptyRow.style.display = 'none';

        const row = tableBody.insertRow();
        const total = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2);

        row.innerHTML = `
            <td>${product.nome}</td>
            <td>-</td>
            <td>-</td>
            <td class="text-end">${quantity}</td>
            <td class="text-end">R$ ${unitPrice}</td>
            <td class="text-end">R$ ${total}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-danger" onclick="removeItem(this)">Remover</button>
            </td>
        `;
        updateTotals();
    });
}

function removeItem(button) {
    button.closest('tr').remove();
    updateTotals();
}

function updateTotals() {
    const rows = document.querySelectorAll('#sale-items-table tbody tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        if (row.style.display === 'none') return;
        const totalCell = row.cells[5];
        if (totalCell) {
            const totalText = totalCell.textContent.replace('R$ ', '');
            subtotal += parseFloat(totalText) || 0;
        }
    });

    // IDs do seu HTML fornecido
    const totalBruto = document.getElementById('total_bruto');
    const totalLiquido = document.getElementById('total_liquido');
    
    if (totalBruto) totalBruto.textContent = subtotal.toFixed(2);
    if (totalLiquido) totalLiquido.textContent = subtotal.toFixed(2);
}

$('#id_cliente').select2({
    theme: 'bootstrap-5',
    placeholder: "Selecione um cliente",
    language: "pt-BR",
    ajax: {
        transport: async function (params, success, failure) {
            try {
                const searchTerm = params.data.q || '';

                const result = await window.api.customer.find({ q: searchTerm });

                // Adapta para o formato esperado pelo Select2
                success({
                    results: result.data.map(item => ({
                        id: item.id,
                        text: item.nome
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
