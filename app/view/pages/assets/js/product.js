import { SellingPriceCalculator } from "../components/SellingPriceCalculator.js";

//import { SellingPriceCalculator } from "../components/SellingPriceCalculator.js";
const Action = document.getElementById('action');
const Id = document.getElementById('id');
const inputTotalTax = document.getElementById('total_imposto');
const inputProfitMargin = document.getElementById('margem_lucro');
const inputOperatingCost = document.getElementById('custo_operacional');
const inputPurchasePrice = document.getElementById('preco_compra');

Inputmask("currency", {
    radixPoint: ',',
    inputtype: "text",
    prefix: 'R$ ',
    autoGroup: true,
    groupSeparator: '.',
    rightAlign: false,
    onBeforeMask: function (value) {
        return String(value).replace('.', ',');
    }
}).mask("#preco_venda, #preco_compra");
Inputmask("currency", {
    radixPoint: ',',
    inputtype: "text",
    prefix: '% ',
    autoGroup: true,
    groupSeparator: '.',
    rightAlign: false,
    onBeforeMask: function (value) {
        return String(value).replace('.', ',');
    }
}).mask("#total_imposto, #margem_lucro, #custo_operacional");

function determineSalePrice() {
    const purchasePrice = parseFloat(String(inputPurchasePrice.value).replace('R$', '').replace('.', '').replace(',', '.')) || 0;
    const tax = parseFloat(String(inputTotalTax.value).replace('%', '').replace(',', '.')) || 0;
    const profitMargin = parseFloat(String(inputProfitMargin.value).replace('%', '').replace(',', '.')) || 0;
    const operatingCost = parseFloat(String(inputOperatingCost.value).replace('%', '').replace(',', '.')) || 0;
    if (profitMargin <= 0 && purchasePrice <= 0) {
        document.getElementById('resultado-row').className = 'resultado-row mb-2 d-none';
        return;
    }
    const result = SellingPriceCalculator.create()
        .addTotalTax(tax)
        .addProfitMargin(profitMargin)
        .addOperatingCost(operatingCost)
        .addPurchasePrice(purchasePrice)
        .getData();
    document.getElementById('val-venda').innerHTML = `${result.valor_venda_sugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    document.getElementById('val-margem').innerHTML = `${result.valor_margem_lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    document.getElementById('val-custo').innerHTML = `${result.valor_custo_operacional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    document.getElementById('val-imposto').innerHTML = `${result.valor_total_imposto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    document.getElementById('resultado-row').className = 'resultado-row mb-2';
}

inputTotalTax.addEventListener('input', () => {
    determineSalePrice();
});

inputProfitMargin.addEventListener('input', () => {
    determineSalePrice();
});

inputOperatingCost.addEventListener('input', () => {
    determineSalePrice();
});
inputPurchasePrice.addEventListener('input', () => {
    determineSalePrice();
});

//  CARREGA DADOS DE EDIÇÃO (se existirem)
(async () => {
    const editData = await api.temp.get('product:edit');
    if (editData) {
        // Modo edição
        Action.value = editData.action || 'e';
        Id.value = editData.id || '';
        // Preenche todos os campos pelo atributo name
        for (const [key, value] of Object.entries(editData)) {
            const field = form.querySelector(`[name="${key}"]`);
            if (!field) continue;

            if (field.type === 'checkbox') {
                field.checked = value === true || value === 'true';
            } else {
                field.value = value || '';
            }
        }
    } else {
        // Modo cadastro novo
        Action.value = 'c';
        Id.value = '';
    }
})();