document.addEventListener('DOMContentLoaded', function() {
    // Botão para abrir o modal de adicionar item
    const btnOpenForm = document.getElementById('btn-open-form');
    const itemModal = new bootstrap.Modal(document.getElementById('itemModal'));

    btnOpenForm.addEventListener('click', function() {
        itemModal.show();
        loadProducts();
    });

    // Função para carregar produtos no datalist
    async function loadProducts() {
        try {
            const result = await window.api.Product.find({ limit: 100 }); // Carregar mais produtos
            const datalist = document.getElementById('product-list');
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

    // Quando o usuário seleciona um produto
    document.getElementById('product-search').addEventListener('input', function() {
        const value = this.value;
        const options = document.querySelectorAll('#product-list option');
        let selectedId = null;
        options.forEach(option => {
            if (option.value === value) {
                selectedId = option.dataset.id;
            }
        });
        document.getElementById('product-id').value = selectedId || '';
    });

    // Formulário de adicionar item
    const itemForm = document.getElementById('item-sale-form');
    itemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Lógica para adicionar item à venda
        const productId = document.getElementById('product-id').value;
        const quantity = document.getElementById('quantity').value;
        const unitPrice = document.getElementById('unit-price').value;

        if (!productId) {
            alert('Selecione um produto válido.');
            return;
        }

        // Adicionar à tabela de itens
        addItemToTable(productId, quantity, unitPrice);

        // Fechar modal
        itemModal.hide();
        itemForm.reset();
    });
});

function addItemToTable(productId, quantity, unitPrice) {
    // Buscar nome do produto
    window.api.Product.findById(productId).then(product => {
        const tableBody = document.querySelector('#sale-items-table tbody');
        const row = tableBody.insertRow();
        const total = (quantity * unitPrice).toFixed(2);

        row.innerHTML = `
            <td>${product.nome}</td>
            <td>Fornecedor</td>
            <td>Grupo</td>
            <td class="text-end">${quantity}</td>
            <td class="text-end">R$ ${unitPrice}</td>
            <td class="text-end">R$ ${total}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-danger" onclick="removeItem(this)">Remover</button>
            </td>
        `;

        // Atualizar totais
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
        const totalCell = row.cells[5].textContent.replace('R$ ', '');
        subtotal += parseFloat(totalCell);
    });
    document.getElementById('sale-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('sale-total').textContent = subtotal.toFixed(2);
}