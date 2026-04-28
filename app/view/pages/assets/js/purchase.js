const fornecedorSelect2 = $('#id_fornecedor');
const produtoSelect2 = $('#id_produto');
const Id = document.getElementById('id');
const Action = document.getElementById('acao');
const form = document.getElementById('form');
const inputQuantity = document.getElementById('quantidade');
const insertItemButton = document.getElementById('insert-item');
const inputUnitPrice = document.getElementById('preco-unitario');
const inputTotalProduct = document.getElementById('valor-total-produto');
const productsTbody = document.getElementById('products-table-tbody');


function stringParaFloat(valor) {
    if (!valor) return 0;
    let limpo = valor.toString()
        .replace('R$', '')
        .trim()
        .replace(/\./g, '')
        .replace(',', '.');
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
        const unitPrice = inputUnitPrice.inputmask ? inputUnitPrice.inputmask.unmaskedvalue() : inputUnitPrice.value;
        const quantity = inputQuantity.inputmask ? inputQuantity.inputmask.unmaskedvalue() : inputQuantity.value;
        const price = stringParaFloat(unitPrice);
        const amount = stringParaFloat(quantity);
        const total = price * amount;
        if (inputTotalProduct) {
            inputTotalProduct.value = floatParaString(total);
        }
    } catch (e) {
        console.error("Erro ao calcular total:", e);
    }
}

function cleanInput(val) {
    return String(val)
        .replace(/[R$%\s]/g, "")
        .replace(/\./g, "")
        .replace(/,/, ".");
}

function calcPurchaseTotal() {
    const totalEl = document.getElementById('total_bruto');
    return stringParaFloat(totalEl ? totalEl.innerText : '0');
}

if (inputUnitPrice && inputQuantity) {
    inputUnitPrice.addEventListener('input', executarCalculo);
    inputQuantity.addEventListener('input', executarCalculo);
    executarCalculo();
}

Inputmask("currency", {
    radixPoint: ",",
    groupSeparator: ".",
    allowMinus: false,
    prefix: "R$ ",
    autoGroup: true,
    rightAlign: false,
    onBeforeMask: function (value) {
        return String(value).replace(".", ",");
    },
}).mask(inputUnitPrice);

Inputmask("currency", {
    radixPoint: ",",
    groupSeparator: ".",
    allowMinus: false,
    prefix: "",
    autoGroup: true,
    rightAlign: false,
    onBeforeMask: function (value) {
        return String(value).replace(".", ",");
    },
}).mask(inputQuantity);


fornecedorSelect2.select2({
    theme: 'bootstrap-5',
    placeholder: "Selecione um fornecedor",
    language: "pt-BR",
    ajax: {
        transport: async function (params, success, failure) {
            try {
                const searchTerm = params.data.q || '';
                const result = await window.api.supplier.supplierSearch({ q: searchTerm });
                success({
                    results: result.data.map(item => ({
                        id: item.id,
                        text: `${item.nome_fantasia}${item.cnpj_cpf ? ' - ' + item.cnpj_cpf : ''}`
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

produtoSelect2.select2({
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
                        text: `Cód: ${item.id} - ${item.nome} | Barra: ${item.codigo_barra}`
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

produtoSelect2.on('select2:select', async function (e) {
    const productId = e.params.data.id;
    try {
        const response = await api.product.findById(productId);
        if (response && response.preco_compra) {
            inputUnitPrice.value = response.preco_compra;
            inputUnitPrice.dispatchEvent(new Event('input'));
        }
    } catch (err) {
        console.error("Erro ao buscar detalhes do produto:", err);
    }
});

$(document).on('select2:open', () => {
    document.querySelector('.select2-search__field').focus();
});


async function InsertItemPurchase() {
    insertItemButton.disabled = true;
    const originalText = insertItemButton.textContent;
    insertItemButton.textContent = "Inserindo...";

    try {
        const data = formToJson(form);

        data.inputPreco = cleanInput(data['preco-unitario']);
        data.quantidade = cleanInput(data.quantidade);
        data.inputTotal = (parseFloat(data.inputPreco) * parseFloat(data.quantidade)).toFixed(2);

        if (Action.value === 'c') {
            const response = await api.purchase.insert(data);
            if (!response.status) {
                toast("error", "Erro", response.msg, null);
                return;
            }
            Action.value = 'e';
            Id.value = response.id;
        }

        data.id = Id.value;

        const responseItem = await api.purchase.insertItem(data);
        if (!responseItem.status) {
            toast("error", "Erro", responseItem.msg, null);
            return;
        }

        document.getElementById('total_liquido').innerHTML = parseFloat(responseItem.data.total_liquido)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        document.getElementById('total_bruto').innerHTML = parseFloat(responseItem.data.total_bruto)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        await listItemPurchase();

        produtoSelect2.val(null).trigger('change');
        inputUnitPrice.value = 'R$ 0,00';
        inputQuantity.value = '1,00';
        inputTotalProduct.value = '0,00';

    } catch (err) {
        toast("error", "Falha", "Erro interno: " + err.message, null);
    } finally {
        insertItemButton.textContent = originalText;
        insertItemButton.disabled = false;
    }
}


async function listItemPurchase() {
    try {
        const data = formToJson(form);
        const response = await api.purchase.listItem(data);

        if (!response.status) {
            toast("error", "Erro", response.msg || 'Não foi possível listar os itens da compra', null);
            return;
        }

        document.getElementById('total_liquido').innerHTML = parseFloat(response?.purchase?.total_liquido ?? 0)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        document.getElementById('total_bruto').innerHTML = parseFloat(response?.purchase?.total_bruto ?? 0)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let trs = '';
        response.data.forEach(item => {
            trs += `
                <tr id="tritem${item.id}">
                    <td>${item.id}</td>
                    <td>${item.nome}</td>
                    <td class="text-end">${parseFloat(item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td class="text-end">${parseFloat(item.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td class="text-end">${parseFloat(item.total_liquido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteItem(${item.id});">
                            <i class="bi bi-trash"></i> Excluir
                        </button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('products-table-tbody').innerHTML = trs || `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox me-2"></i>Nenhum item adicionado.
                </td>
            </tr>
        `;

        document.getElementById('product-count').innerText = `Itens: ${response.data.length}`;

    } catch (error) {
        toast("error", "Erro", error.message || 'Ocorreu um erro ao listar os itens.', null);
    }
}


async function deleteItem(id) {
    const result = await confirmDialog(
        'Excluir item?',
        'Tem certeza que deseja remover este item da compra?'
    );

    if (!result.isConfirmed) return;

    try {
        const response = await api.purchase.deleteItem(id);

        if (!response.status) {
            toast("error", "Erro", response.msg);
            return;
        }

        document.getElementById(`tritem${id}`)?.remove();
        await listItemPurchase();
        toast("success", "Sucesso", "Item excluído com sucesso!");

    } catch (err) {
        toast("error", "Falha", "Erro interno: " + err.message);
    }
}


function resetLocalState() {
    Action.value = 'c';
    Id.value = '';

    fornecedorSelect2.val(null).trigger('change');
    produtoSelect2.val(null).trigger('change');

    const observacao = document.getElementById('observacao');
    if (observacao) observacao.value = '';

    inputUnitPrice.value = 'R$ 0,00';
    inputQuantity.value = '1,00';
    if (inputTotalProduct) inputTotalProduct.value = '0,00';

    document.getElementById('total_liquido').innerHTML = 'R$ 0,00';
    document.getElementById('total_bruto').innerHTML = 'R$ 0,00';

    document.getElementById('product-count').innerText = 'Itens: 0';
    document.getElementById('products-table-tbody').innerHTML = `
        <tr>
            <td colspan="8" class="text-center text-muted py-4">
                <i class="bi bi-inbox me-2"></i>Nenhum item adicionado.
            </td>
        </tr>
    `;

    const discount = document.getElementById('purchase-discount');
    if (discount) discount.value = '0,00';
}

async function clearPurchase() {
    const result = await confirmDialog(
        'Limpar tudo?',
        'Tem certeza que deseja remover todos os itens e reiniciar a compra?'
    );

    if (!result.isConfirmed) return;

    try {
        if (Action.value === 'e' && Id.value) {
            const response = await api.purchase.delete(Id.value);
            if (!response.status) {
                toast("error", "Erro", response.msg || 'Não foi possível limpar a compra.');
                return;
            }
        }

        resetLocalState();
        toast("success", "Sucesso", "Compra reiniciada com sucesso!");

    } catch (err) {
        toast("error", "Falha", "Erro interno: " + err.message);
    }
}

// ─── Estado do modal de pagamento ────────────────────────────────────────────
let paymentModalInstance = null;
let formasSelecionadas = [];
const SEM_PARCELAS = ['pix', 'dinheiro', 'cheque'];

function aceitaParcelas(titulo) {
    return !SEM_PARCELAS.some(p => titulo.toLowerCase().trim().includes(p));
}

async function openPaymentModal() {
    const total = calcPurchaseTotal();

    if (total <= 0) {
        toast("warning", "Atenção", "Adicione ao menos um item antes de finalizar.");
        return;
    }

    const modalEl = document.getElementById('paymentModal');
    if (!modalEl || !window.bootstrap) return;

    formasSelecionadas = [];
    document.getElementById('modal-total').innerText = floatParaString(total);
    document.getElementById('card-installments-wrap').classList.add('d-none');
    document.getElementById('installment-list').innerHTML = '';
    document.getElementById('installment-difference').textContent = '0,00';
    document.getElementById('payment-split-wrap').classList.add('d-none');
    document.getElementById('payment-split-list').innerHTML = '';
    document.getElementById('confirm-payment').disabled = true;

    await loadPaymentTerms(total);

    paymentModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    paymentModalInstance.show();
}

async function loadPaymentTerms(total) {
    const container = document.getElementById('payment-terms-buttons');
    container.innerHTML = '<span class="text-muted small">Carregando...</span>';

    try {
        const response = await api.paymentTerms.findAll();

        if (!response.status || !response.data.length) {
            container.innerHTML = '<span class="text-muted small">Nenhuma forma de pagamento cadastrada.</span>';
            return;
        }

        container.innerHTML = '';
        response.data.forEach(term => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-outline-primary';
            btn.textContent = term.titulo;
            btn.dataset.id = term.id;
            btn.addEventListener('click', () => onSelectPaymentTerm(term, total, btn));
            container.appendChild(btn);
        });

    } catch (err) {
        container.innerHTML = '<span class="text-danger small">Erro ao carregar formas de pagamento.</span>';
        console.error(err);
    }
}

async function onSelectPaymentTerm(term, total, btnClicked) {
    const jaAdicionado = formasSelecionadas.find(f => f.term.id === term.id);

    if (jaAdicionado) {
        formasSelecionadas = formasSelecionadas.filter(f => f.term.id !== term.id);
        btnClicked.classList.remove('btn-primary');
        btnClicked.classList.add('btn-outline-primary');
        renderSplit(total);
        atualizarConfirmButton(total);
        return;
    }

    if (formasSelecionadas.length >= 2) {
        toast("warning", "Atenção", "Você pode selecionar no máximo 2 formas de pagamento.");
        return;
    }

    btnClicked.classList.remove('btn-outline-primary');
    btnClicked.classList.add('btn-primary');

    let installments = [];
    if (aceitaParcelas(term.titulo)) {
        try {
            const response = await api.paymentTerms.findInstallments(term.id);
            if (response.status && response.data.length) {
                installments = response.data;
            }
        } catch (err) {
            console.error(err);
        }
    }

    formasSelecionadas.push({ term, installments, parcelas: 1, valor: 0 });

    renderSplit(total);
    atualizarConfirmButton(total);
}

function renderSplit(total) {
    const splitWrap = document.getElementById('payment-split-wrap');
    const splitList = document.getElementById('payment-split-list');
    const installmentsWrap = document.getElementById('card-installments-wrap');
    const installmentList = document.getElementById('installment-list');

    installmentsWrap.classList.add('d-none');
    installmentList.innerHTML = '';
    document.getElementById('installment-difference').textContent = '0,00';

    if (formasSelecionadas.length === 0) {
        splitWrap.classList.add('d-none');
        splitList.innerHTML = '';
        return;
    }

    splitWrap.classList.remove('d-none');

    if (formasSelecionadas.length === 1) {
        formasSelecionadas[0].valor = total;
    } else {
        const metade = parseFloat((total / 2).toFixed(2));
        const outraMetade = parseFloat((total - metade).toFixed(2));

        if (formasSelecionadas[1].valor === 0) {
            formasSelecionadas[0].valor = metade;
            formasSelecionadas[1].valor = outraMetade;
        } else {
            formasSelecionadas[0].valor = Math.min(formasSelecionadas[0].valor, total);
            formasSelecionadas[1].valor = parseFloat((total - formasSelecionadas[0].valor).toFixed(2));
        }
    }

    splitList.innerHTML = '';

    formasSelecionadas.forEach((forma, index) => {
        const col = document.createElement('div');
        col.className = 'col-12';
        col.innerHTML = buildFormaHTML(forma, index, total);
        splitList.appendChild(col);

        const inputValor = col.querySelector(`#split-valor-${index}`);
        Inputmask("currency", {
            radixPoint: ",",
            groupSeparator: ".",
            allowMinus: false,
            prefix: "R$ ",
            autoGroup: true,
            rightAlign: false,
        }).mask(inputValor);

        inputValor.value = `R$ ${floatParaString(forma.valor)}`;

        inputValor.addEventListener('input', () => {
            const novoValor = stringParaFloat(inputValor.value);
            formasSelecionadas[index].valor = novoValor;

            if (formasSelecionadas.length === 2) {
                const outro = index === 0 ? 1 : 0;
                const restante = parseFloat((total - novoValor).toFixed(2));
                formasSelecionadas[outro].valor = restante < 0 ? 0 : restante;

                const inputOutro = document.getElementById(`split-valor-${outro}`);
                if (inputOutro) {
                    inputOutro.value = `R$ ${floatParaString(formasSelecionadas[outro].valor)}`;
                }
            }

            atualizarConfirmButton(total);
            renderInstallmentForForma(index);
        });

        const selectParcelas = col.querySelector(`#split-parcelas-${index}`);
        if (selectParcelas) {
            selectParcelas.innerHTML = '<option value="">Selecione...</option>';
            forma.installments.forEach(inst => {
                const opt = document.createElement('option');
                opt.value = inst.parcela;
                opt.textContent = `${inst.parcela}x`;
                selectParcelas.appendChild(opt);
            });

            selectParcelas.addEventListener('change', () => {
                const parcelas = parseInt(selectParcelas.value) || 1;
                formasSelecionadas[index].parcelas = parcelas;
                renderInstallmentForForma(index);
                atualizarConfirmButton(total);
            });
        }
    });
}

function buildFormaHTML(forma, index, total) {
    const temParcelas = aceitaParcelas(forma.term.titulo) && forma.installments.length > 0;

    return `
        <div class="card border mb-2">
            <div class="card-body py-2 px-3">
                <div class="row g-2 align-items-center">
                    <div class="col-auto">
                        <span class="badge bg-primary">${forma.term.titulo}</span>
                    </div>
                    <div class="col">
                        <input type="text"
                            id="split-valor-${index}"
                            class="form-control form-control-sm text-end"
                            placeholder="R$ 0,00">
                    </div>
                    ${temParcelas ? `
                    <div class="col-auto">
                        <select id="split-parcelas-${index}" class="form-select form-select-sm" style="min-width:90px">
                            <option value="">Parcelas...</option>
                        </select>
                    </div>` : ''}
                </div>
                ${temParcelas ? `
                <div id="split-installment-list-${index}" class="row g-2 mt-1"></div>` : ''}
            </div>
        </div>
    `;
}

function renderInstallmentForForma(index) {
    const forma = formasSelecionadas[index];
    if (!aceitaParcelas(forma.term.titulo)) return;

    const container = document.getElementById(`split-installment-list-${index}`);
    if (!container) return;

    const parcelas = forma.parcelas || 1;
    const valor = forma.valor || 0;

    if (!parcelas || parcelas < 1) {
        container.innerHTML = '';
        return;
    }

    const valorBase = Math.floor((valor / parcelas) * 100) / 100;
    const soma = valorBase * parcelas;
    const diferenca = parseFloat((valor - soma).toFixed(2));

    let html = '';
    for (let i = 1; i <= parcelas; i++) {
        const valorParcela = i === parcelas ? valorBase + diferenca : valorBase;
        html += `
            <div class="col-12 col-md-6">
                <div class="input-group input-group-sm">
                    <span class="input-group-text">${i}x</span>
                    <input type="text" class="form-control text-end" value="R$ ${floatParaString(valorParcela)}" readonly>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function atualizarConfirmButton(total) {
    const confirmBtn = document.getElementById('confirm-payment');

    if (formasSelecionadas.length === 0) {
        confirmBtn.disabled = true;
        return;
    }

    const somaValores = formasSelecionadas.reduce((acc, f) => acc + (f.valor || 0), 0);
    const diferenca = Math.abs(parseFloat((somaValores - total).toFixed(2)));

    const todasComParcelas = formasSelecionadas.every(f => {
        if (!aceitaParcelas(f.term.titulo)) return true;
        return f.parcelas >= 1;
    });

    confirmBtn.disabled = !(diferenca <= 0.01 && todasComParcelas);
}

// ─── Gera o HTML do relatório de compra ──────────────────────────────────────
function gerarHtmlRelatorio({ id_purchase, fornecedor, items, formas, total }) {
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const itensHtml = items.map(item => `
        <tr>
            <td>${item.nome}</td>
            <td class="text-center">${parseFloat(item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td class="text-right">${parseFloat(item.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="text-right">${parseFloat(item.total_liquido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>
    `).join('');

    const formasHtml = formas.map(forma => {
        const temParcelas = aceitaParcelas(forma.term.titulo) && forma.parcelas > 1;
        const valorBase = Math.floor((forma.valor / forma.parcelas) * 100) / 100;
        const soma = valorBase * forma.parcelas;
        const diferenca = parseFloat((forma.valor - soma).toFixed(2));

        let parcelasHtml = '';
        if (temParcelas) {
            for (let i = 1; i <= forma.parcelas; i++) {
                const valorParcela = i === forma.parcelas ? valorBase + diferenca : valorBase;
                const instData = forma.installments.find(inst => inst.parcela === i);
                const intervalo = instData?.intervalo ?? (i * 30);
                const venc = new Date();
                venc.setDate(venc.getDate() + intervalo);
                parcelasHtml += `
                    <tr>
                        <td class="text-center">${i}ª parcela</td>
                        <td class="text-right">${valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td class="text-center">${venc.toLocaleDateString('pt-BR')}</td>
                    </tr>
                `;
            }
        }

        return `
            <div class="section-title">
                PAGAMENTO: ${forma.term.titulo} —
                ${forma.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            ${temParcelas ? `
            <table class="table table-sm table-bordered">
                <thead>
                    <tr>
                        <th class="text-center">Parcela</th>
                        <th class="text-right">Valor</th>
                        <th class="text-center">Vencimento</th>
                    </tr>
                </thead>
                <tbody>${parcelasHtml}</tbody>
            </table>` : `<p class="text-muted small mb-3">Pagamento à vista.</p>`}
        `;
    }).join('');

    return `
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
            .text-right { text-align: right !important; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header-box text-center">
                <h2>Relatório de Compra #${id_purchase}</h2>
                <p>Data: <strong>${dataAtual}</strong></p>
            </div>

            <div class="section-title">FORNECEDOR</div>
            <div class="info-card">
                <strong>${fornecedor?.nome_fantasia ?? '—'}</strong><br>
                Razão Social: ${fornecedor?.razao_social ?? '—'}<br>
                CNPJ/CPF: ${fornecedor?.cnpj_cpf ?? '—'}
            </div>

            <div class="section-title">ITENS DA COMPRA</div>
            <table class="table table-sm table-bordered">
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th class="text-center">Qtd</th>
                        <th class="text-right">Unit.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>${itensHtml}</tbody>
            </table>

            ${formasHtml}

            <div class="total-final text-right">
                TOTAL: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
        </div>
    </body>
    </html>
    `;
}

// ─── Confirma e salva, depois abre o PDF ─────────────────────────────────────
async function confirmPayment() {
    const total = calcPurchaseTotal();
    const id_purchase = Id.value;

    if (!id_purchase) {
        toast("error", "Erro", "ID da compra não encontrado.");
        return;
    }

    const confirmBtn = document.getElementById('confirm-payment');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Salvando...';

    try {
        const formas = formasSelecionadas.map(f => ({
            id_payment_terms: f.term.id,
            parcelas: f.parcelas || 1,
            valor: f.valor,
            installments: f.installments
        }));

        // 1. Salva no banco
        const response = await api.purchase.finalize({ id_purchase, formas });

        if (!response.status) {
            toast("error", "Erro", response.msg);
            return;
        }

        // 2. Busca dados para o relatório em paralelo
        const [purchaseData, itemsData] = await Promise.all([
            api.purchase.findById(id_purchase),
            api.purchase.listItem({ id: id_purchase })
        ]);

        // 3. Busca dados do fornecedor
        let fornecedor = null;
        if (purchaseData?.id_fornecedor) {
            fornecedor = await api.supplier.findById(purchaseData.id_fornecedor);
        }

        const items = itemsData?.data ?? [];

        // 4. Gera o HTML e abre o visualizador de PDF
        const html = gerarHtmlRelatorio({
            id_purchase,
            fornecedor,
            items,
            formas: formasSelecionadas,
            total
        });

        await api.report.print(html);

        // 5. Fecha modal e reseta a tela
        paymentModalInstance.hide();
        resetLocalState();
        toast("success", "Sucesso", "Compra finalizada com sucesso!");

    } catch (err) {
        toast("error", "Falha", "Erro interno: " + err.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirmar e Salvar';
    }
}

window.deleteItem = deleteItem;
window.openPaymentModal = openPaymentModal;
window.clearPurchase = clearPurchase;

insertItemButton.addEventListener("click", async () => {
    await InsertItemPurchase();
});

document.getElementById('clear-purchase').addEventListener('click', () => {
    clearPurchase();
});

document.getElementById('finalize-sale').addEventListener('click', () => {
    openPaymentModal();
});

document.getElementById('confirm-payment').addEventListener('click', () => {
    confirmPayment();
});