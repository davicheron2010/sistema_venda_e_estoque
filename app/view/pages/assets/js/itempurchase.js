// itempurchase.js - Sincronizado com Comércio Athos (purchase.js)

export let purchaseItems = []; // Alterado para let caso precise limpar o array completamente

function getTableBody() {
    return document.getElementById('products-table-tbody');
}

function createEmptyRow() {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="8" class="text-center text-muted py-4"><i class="bi bi-inbox me-2"></i>Nenhum item adicionado.</td>';
    return row;
}

export function initializePurchaseItems() {
    renderPurchaseItems();
}

/**
 * Adiciona itens e garante que campos numéricos sejam tratados como tal
 * para evitar erros de cálculo no reduce.
 */
export function addPurchaseItem(item) {
    const validItem = {
        ...item,
        quantidade: parseFloat(item.quantidade) || 0,
        preco_unitario: parseFloat(item.preco_unitario) || 0,
        total_bruto: parseFloat(item.total_bruto || item.total) || 0,
        total_liquido: parseFloat(item.total_liquido) || 0
    };
    
    purchaseItems.unshift(validItem); 
    renderPurchaseItems();
}

export function removePurchaseItem(index) {
    if (index >= 0 && index < purchaseItems.length) {
        purchaseItems.splice(index, 1);
        renderPurchaseItems();
    }
}

/**
 * Limpa a lista de itens (útil após finalizar a compra ou cancelar)
 */
export function clearPurchaseItems() {
    purchaseItems = [];
    renderPurchaseItems();
}

export function renderPurchaseItems() {
    const tableBody = getTableBody();
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (purchaseItems.length === 0) {
        tableBody.appendChild(createEmptyRow());
        updateTotals(0, 0);
        return;
    }

    purchaseItems.forEach((item, index) => {
        const row = document.createElement('tr');
        
        const qtdFormatada = item.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const unitFormatado = item.preco_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const totalFormatado = item.total_bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        row.innerHTML = `
            <td>${item.id || item.id_produto || '-'}</td>
            <td>${item.nome || item.nome_produto}</td>
            <td>${item.fornecedor || '-'}</td>
            <td>${item.grupo || '-'}</td>
            <td class="text-end">${qtdFormatada}</td>
            <td class="text-end">${unitFormatado}</td>
            <td class="text-end font-weight-bold">${totalFormatado}</td>
            <td class="text-center">
                <button class="btn btn-outline-danger btn-sm" 
                        data-id="${item.id}" 
                        data-index="${index}" 
                        data-action="delete-item" 
                        title="Remover Item"
                        type="button">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    const bruto = purchaseItems.reduce((sum, item) => sum + item.total_bruto, 0);
    const liquido = purchaseItems.reduce((sum, item) => sum + item.total_liquido, 0);
    
    updateTotals(bruto, liquido);
}

export function updateTotals(bruto, liquido) {
    const totalBrutoDisplay = document.getElementById('total_bruto');
    const totalLiquidoDisplay = document.getElementById('total_liquido');
    const productCountDisplay = document.getElementById('product-count');

    // Sincroniza com o valor exibido na Modal de Pagamento
    const modalTotalDisplay = document.getElementById('modal_total_compra');

    if (totalBrutoDisplay) {
        totalBrutoDisplay.textContent = bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    
    if (totalLiquidoDisplay) {
        totalLiquidoDisplay.textContent = liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (modalTotalDisplay) {
        modalTotalDisplay.textContent = bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (productCountDisplay) {
        productCountDisplay.innerText = `Itens: ${purchaseItems.length}`;
    }
}