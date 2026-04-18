export const saleItems = [];

function getTableBody() {
    return document.querySelector('#sale-items-table tbody');
}

function createEmptyRow() {
    const row = document.createElement('tr');
    row.id = 'empty-row';
    row.innerHTML = '<td colspan="7" class="text-center text-muted py-4">Nenhum item adicionado.</td>';
    return row;
}

export function initializeSaleItems() {
    renderSaleItems();
}

export function addSaleItem(item) {
    saleItems.unshift(item); // insere o item novo no topo da lista
    renderSaleItems();
}

export function removeSaleItem(index) {
    if (!Number.isNaN(index) && index >= 0 && index < saleItems.length) {
        saleItems.splice(index, 1);
        renderSaleItems();
    }
}

export function clearSaleItems() {
    saleItems.length = 0;
    renderSaleItems();
}

export function getSaleItems() {
    return saleItems.slice();
}

export function renderSaleItems() {
    const tableBody = getTableBody();
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (saleItems.length === 0) {
        tableBody.appendChild(createEmptyRow());
        updateTotals();
        return;
    }

    saleItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;

        row.innerHTML = `
            <td>${item.nome_produto}</td>
            <td>${item.nome_cliente || '-'}</td>
            <td>${item.nome_grupo || '-'}</td>
            <td class="text-end">${item.quantidade}</td>
            <td class="text-end">R$ ${item.preco_unitario.toFixed(2)}</td>
            <td class="text-end">R$ ${item.total.toFixed(2)}</td>
            <td class="text-center"></td>
        `;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'btn btn-sm btn-danger';
        removeButton.textContent = 'Remover';
        removeButton.addEventListener('click', () => removeSaleItem(index));

        row.querySelector('td:last-child').appendChild(removeButton);
        tableBody.appendChild(row);
    });

    updateTotals();
}

export function updateTotals() {
    const subtotal = saleItems.reduce((sum, item) => sum + (item.total || 0), 0);

    const totalBruto = document.getElementById('total_bruto');
    const totalLiquido = document.getElementById('total_liquido');

    if (totalBruto) totalBruto.textContent = subtotal.toFixed(2);
    if (totalLiquido) totalLiquido.textContent = subtotal.toFixed(2);
}