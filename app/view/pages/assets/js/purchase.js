// purchase.js - Comércio Athos

import {
    addPurchaseItem,
    purchaseItems,
    removePurchaseItem
} from './itempurchase.js';

// ─── Referências DOM 
const fornecedorSelect2 = $('#id_fornecedor');
const produtoSelect2 = $('#id_produto');
const inputId = document.getElementById('id'); 
const inputQuantity = document.getElementById('quantidade');
const insertItemButton = document.getElementById('insert-item');
const inputUnitPrice = document.getElementById('preco-unitario');
const inputTotalProduct = document.getElementById('valor-total-produto');
const productsTbody = document.getElementById('products-table-tbody');

// ─── Referências DOM: Modal de Pagamento
const paymentModalElem = document.getElementById('paymentModal');
const paymentModal = new bootstrap.Modal(paymentModalElem);
const modalTotal = document.getElementById('modal-total');
const paymentTermsButtons = document.getElementById('payment-terms-buttons');
const cardInstallmentsWrap = document.getElementById('card-installments-wrap');
const paymentInstallments = document.getElementById('payment-installments');
const installmentList = document.getElementById('installment-list');
const confirmPaymentBtn = document.getElementById('confirm-payment');
const finalizePurchaseBtn = document.getElementById('finalize-purchase');

// ─── Estado do Modal de Pagamento
let paymentState = {
    total: 0,
    id_payment_terms: null,
    titulo: null
};

// ─── Funções de Utilidade
function stringParaFloat(valor) {
    if (!valor) return 0;
    let limpo = valor.toString()
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.]/g, '');

    return parseFloat(limpo) || 0;
}

function floatParaString(valor) {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function executarCalculo() {
    try {
        const price = stringParaFloat(inputUnitPrice.value);
        const amount = stringParaFloat(inputQuantity.value);
        const total = price * amount;
        if (inputTotalProduct) {
            inputTotalProduct.value = floatParaString(total);
        }
    } catch (e) {
        console.error("Erro ao calcular total:", e);
    }
}

// ─── Máscaras e Eventos de Input
[inputUnitPrice, inputQuantity].forEach(el => {
    if (el) el.addEventListener('input', executarCalculo);
});

const currencyMask = {
    radixPoint: ",",
    groupSeparator: ".",
    allowMinus: false,
    autoGroup: true,
    rightAlign: false,
    onBeforeMask: (value) => String(value).replace(".", ",")
};

Inputmask("currency", { ...currencyMask, prefix: "R$ " }).mask(inputUnitPrice);
Inputmask("currency", { ...currencyMask, prefix: "" }).mask(inputQuantity);

// ─── Configuração Select2
const selectConfig = (placeholder, searchFn, mapFn) => ({
    theme: 'bootstrap-5',
    placeholder,
    language: "pt-BR",
    ajax: {
        transport: async (params, success, failure) => {
            try {
                const res = await searchFn({ q: params.data.q || '' });
                success({ results: res.data.map(mapFn) });
            } catch (e) { failure(); }
        },
        delay: 250
    }
});

fornecedorSelect2.select2(selectConfig("Selecione um fornecedor", window.api.supplier.supplierSearch, i => ({
    id: i.id,
    text: `${i.nome_fantasia} - ${i.cnpj_cpf}`
})));

produtoSelect2.select2(selectConfig("Selecione um produto", window.api.product.find, i => ({
    id: i.id,
    text: i.nome,
    preco: i.preco_compra,
    fornecedor: i.nome_fornecedor,
    grupo: i.nome_grupo
})));

produtoSelect2.on('select2:select', (e) => {
    const data = e.params.data;
    inputUnitPrice.value = data.preco || '0,00';
    inputQuantity.value = '1,00';
    executarCalculo();
});

// ─── Manipulação de Itens
insertItemButton.addEventListener('click', async () => {
    const prodId = produtoSelect2.val();
    const prodData = produtoSelect2.select2('data')[0];

    if (!prodId) return toast("warning", "Atenção", "Selecione um produto.");

    const item = {
        id_produto: prodId,
        nome: prodData.text,
        fornecedor: prodData.fornecedor || '-',
        grupo: prodData.grupo || '-',
        quantidade: stringParaFloat(inputQuantity.value),
        preco_unitario: stringParaFloat(inputUnitPrice.value),
        total_bruto: stringParaFloat(inputTotalProduct.value),
        total_liquido: stringParaFloat(inputTotalProduct.value)
    };

    addPurchaseItem(item);

    produtoSelect2.val(null).trigger('change');
    inputQuantity.value = "1,00";
    inputUnitPrice.value = "0,00";
    executarCalculo();
    produtoSelect2.select2('open');
});

// ─── Lógica Financeira (Modal)
async function renderPaymentMethodButtons() {
    try {
        const response = await api.paymentTerms.find();
        const methods = response.data ?? [];
        paymentTermsButtons.innerHTML = methods.map(m => `
            <button type="button" class="btn btn-outline-primary flex-fill payment-method-btn" data-id="${m.id}" data-titulo="${m.titulo}">
                <i class="bi bi-wallet2 me-1"></i> ${m.titulo}
            </button>`).join('');
    } catch (err) {
        console.error('Erro ao carregar formas de pagamento:', err);
    }
}

function selectPaymentMethod(id, titulo) {
    paymentState.id_payment_terms = id;
    paymentState.titulo = titulo;

    paymentTermsButtons.querySelectorAll('.payment-method-btn').forEach(btn => {
        const active = btn.dataset.id === String(id);
        btn.classList.toggle('active', active);
        btn.classList.toggle('btn-primary', active);
        btn.classList.toggle('btn-outline-primary', !active);
    });

    const ehCartao = titulo.toLowerCase().match(/cartão|credito|parcelado/);

    if (ehCartao) {
        cardInstallmentsWrap.classList.remove('d-none');
        installmentList.parentElement.classList.remove('d-none');
        atualizarSimulacaoManual();
    } else {
        cardInstallmentsWrap.classList.add('d-none');
        installmentList.parentElement.classList.add('d-none');
        paymentInstallments.value = "1";
        installmentList.innerHTML = '';
    }
    confirmPaymentBtn.disabled = false;
}

function atualizarSimulacaoManual() {
    const total = paymentState.total;
    const qtdParcelas = parseInt(paymentInstallments.value) || 1;
    const valorParcelaBase = Math.floor((total / qtdParcelas) * 100) / 100;
    const dref = parseFloat((total - (valorParcelaBase * qtdParcelas)).toFixed(2));

    let html = '';
    for (let i = 1; i <= qtdParcelas; i++) {
        const valorFinal = (i === qtdParcelas) ? (valorParcelaBase + dref) : valorParcelaBase;
        html += `
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2 bg-light">
                    <span>Parcela ${i}</span>
                    <strong>R$ ${floatParaString(valorFinal)}</strong>
                </div>
            </div>`;
    }
    installmentList.innerHTML = html;
}

// ─── Eventos de Finalização
finalizePurchaseBtn.addEventListener('click', () => {
    if (purchaseItems.length === 0) return toast("warning", "Atenção", "Adicione itens à compra.");

    // Sincroniza ID com input da modal
    const inputModalId = document.getElementById('id_compra_modal');
    if (inputModalId) {
        inputModalId.value = inputId.value;
    }

    paymentState.total = purchaseItems.reduce((acc, item) => acc + item.total_liquido, 0);
    modalTotal.textContent = floatParaString(paymentState.total);

    // Reset de estado ao abrir
    paymentState.id_payment_terms = null;
    confirmPaymentBtn.disabled = true;

    renderPaymentMethodButtons();
    paymentModal.show();
});

paymentTermsButtons.addEventListener('click', e => {
    const btn = e.target.closest('.payment-method-btn');
    if (btn) selectPaymentMethod(btn.dataset.id, btn.dataset.titulo);
});

paymentInstallments.addEventListener('change', atualizarSimulacaoManual);

confirmPaymentBtn.addEventListener('click', async () => {
    const idFornecedor = fornecedorSelect2.val();
    const idCompra = document.getElementById('id_compra_modal')?.value || inputId.value;

    if (!idCompra) return toast("error", "Erro", "ID da compra não localizado.");
    if (!idFornecedor) return toast("warning", "Atenção", "Selecione o fornecedor.");
    if (!paymentState.id_payment_terms) return toast("warning", "Atenção", "Selecione a forma de pagamento.");

    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.textContent = 'Processando...';

    try {
        const payload = {
            id: idCompra, 
            id_fornecedor: idFornecedor,
            id_payment_terms: paymentState.id_payment_terms,
            total: paymentState.total,
            qtd_parcelas: paymentInstallments.value,
            id_sale: null,
            itens: purchaseItems
        };

        const response = await api.purchase.finalize(payload);
        
        if (response.status) {
            toast("success", "Sucesso", response.msg || "Compra finalizada!");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            throw new Error(response.msg || "Erro ao processar no servidor.");
        }
        
    } catch (err) {
        toast("error", "Erro no Servidor", err.message);
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = 'Confirmar e Salvar';
    }
});

// ─── Delegação de Eventos na Tabela
productsTbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="delete-item"]');
    if (btn) {
        const index = parseInt(btn.dataset.index);
        removePurchaseItem(index);
    }
});