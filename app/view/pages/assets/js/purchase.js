(() => {
    const inputDesconto = document.getElementById('purchase-discount');
    const finalizePurchaseButton = document.getElementById('finalize-sale');
    const clearPurchaseButton = document.getElementById('clear-sale');
    const confirmPaymentButton = document.getElementById('confirm-payment');
    const paymentTermsButtons = document.getElementById('payment-terms-buttons');
    const paymentInstallments = document.getElementById('payment-installments');
    const cardInstallmentsWrap = document.getElementById('card-installments-wrap');
    const installmentList = document.getElementById('installment-list');
    const installmentDifference = document.getElementById('installment-difference');
    const paymentSplitWrap = document.getElementById('payment-split-wrap');
    const paymentSplitList = document.getElementById('payment-split-list');
    const purchaseAction = document.getElementById('acao');
    const purchaseId = document.getElementById('id');

    let paymentModalInstance = null;
    let selectedPaymentTerms = [];
    let paymentTermsCache = [];
    let currentPurchaseData = null;

    function parseMoney(value) {
        if (value === null || value === undefined || value === '') return 0;
        return Number(String(value)
            .replace(/R\$\s?/g, '')
            .replace(/\./g, '')
            .replace(',', '.')) || 0;
    }

    function formatMoney(value) {
        return Number(value || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function formatNumberBR(value) {
        return Number(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function calcPurchaseTotal() {
        const subtotal = parseMoney(document.getElementById('total_liquido')?.innerText || '0');
        const desconto = parseMoney(inputDesconto?.value || '0');
        const total = Math.max(subtotal - desconto, 0);

        const el = document.getElementById('total_bruto');
        if (el) el.innerText = formatNumberBR(total);

        const modalTotal = document.getElementById('modal-total');
        if (modalTotal) modalTotal.innerText = formatNumberBR(total);

        return total;
    }

    function getSelectedPaymentTerms() {
        return Array.from(document.querySelectorAll('.payment-method:checked'))
            .map(el => paymentTermsCache.find(t => String(t.codigo) === String(el.value)))
            .filter(Boolean);
    }

    function renderPaymentSplit() {
        if (!paymentSplitWrap || !paymentSplitList) return;

        if (selectedPaymentTerms.length !== 2) {
            paymentSplitWrap.classList.add('d-none');
            paymentSplitList.innerHTML = '';
            return;
        }

        const total = calcPurchaseTotal();
        paymentSplitWrap.classList.remove('d-none');

        paymentSplitList.innerHTML = selectedPaymentTerms.map((term, index) => {
            const defaultValue = index === 0 ? total : 0;
            return `
                <div class="col-12">
                    <label class="form-label small fw-bold">${term.titulo}</label>
                    <div class="input-group">
                        <span class="input-group-text">R$</span>
                        <input type="text" class="form-control payment-split-value text-end" data-index="${index}" value="${formatNumberBR(defaultValue)}">
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.payment-split-value').forEach(input => {
            Inputmask('currency', {
                radixPoint: ',',
                groupSeparator: '.',
                allowMinus: false,
                prefix: 'R$ ',
                autoGroup: true,
                rightAlign: false
            }).mask(input);

            input.addEventListener('input', updatePaymentSplitValidation);
        });

        updatePaymentSplitValidation();
    }

    function updatePaymentSplitValidation() {
        const total = calcPurchaseTotal();
        const splitInputs = Array.from(document.querySelectorAll('.payment-split-value'));
        const sum = splitInputs.reduce((acc, input) => acc + parseMoney(input.value), 0);
        const diff = total - sum;

        if (installmentDifference) {
            installmentDifference.innerText = formatNumberBR(diff);
            installmentDifference.classList.toggle('bg-success', Math.abs(diff) < 0.01);
            installmentDifference.classList.toggle('bg-secondary', Math.abs(diff) >= 0.01);
        }

        if (confirmPaymentButton) {
            const hasSelected = selectedPaymentTerms.length > 0;
            const splitValid = selectedPaymentTerms.length === 2 ? Math.abs(diff) < 0.01 : true;
            const hasCard = selectedPaymentTerms.some(t => t?.codigo === 'cartao');
            const parcels = Number(paymentInstallments?.value || 0);

            confirmPaymentButton.disabled = !hasSelected || !splitValid || (hasCard && !parcels);
        }
    }

    function toggleCardInstallments() {
        const hasCard = selectedPaymentTerms.some(t => t?.codigo === 'cartao');

        if (cardInstallmentsWrap) {
            cardInstallmentsWrap.classList.toggle('d-none', !hasCard);
        }

        if (!hasCard && paymentInstallments) {
            paymentInstallments.value = '';
        }

        renderPaymentSplit();
        renderInstallmentPreview();
    }

    function renderInstallmentPreview() {
        if (!installmentList) return;

        installmentList.innerHTML = '';

        const hasCard = selectedPaymentTerms.some(t => t?.codigo === 'cartao');

        if (!hasCard) {
            if (installmentDifference && selectedPaymentTerms.length !== 2) {
                installmentDifference.innerText = formatNumberBR(0);
            }
            updatePaymentSplitValidation();
            return;
        }

        const total = calcPurchaseTotal();
        const parcelas = Number(paymentInstallments?.value || 0);

        if (!parcelas) {
            if (installmentDifference && selectedPaymentTerms.length !== 2) {
                installmentDifference.innerText = formatNumberBR(0);
            }
            updatePaymentSplitValidation();
            return;
        }

        const base = total / parcelas;
        const rounded = Number(base.toFixed(2));
        const diff = total - (rounded * parcelas);

        installmentList.innerHTML = Array.from({ length: parcelas }, (_, i) => {
            const valor = i === parcelas - 1 ? rounded + diff : rounded;
            return `
                <div class="col-12">
                    <div class="border rounded p-2 d-flex justify-content-between">
                        <span>${i + 1}ª parcela</span>
                        <strong>${formatMoney(valor)}</strong>
                    </div>
                </div>
            `;
        }).join('');

        if (installmentDifference && selectedPaymentTerms.length !== 2) {
            installmentDifference.innerText = formatNumberBR(diff);
        }

        updatePaymentSplitValidation();
    }

    function openPaymentModal() {
        const total = calcPurchaseTotal();
        const modalEl = document.getElementById('paymentModal');
        if (!modalEl || !window.bootstrap) return;

        const modalTotal = document.getElementById('modal-total');
        if (modalTotal) modalTotal.innerText = formatNumberBR(total);

        paymentModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        paymentModalInstance.show();
    }

    async function loadPaymentTerms() {
        try {
            const response = await window.api.paymentTerms.find();
            if (!response?.status) return;

            const terms = response.data || [];
            paymentTermsCache = terms;

            if (!paymentTermsButtons) return;

            paymentTermsButtons.innerHTML = terms.map((term) => {
                const id = `payment-${term.codigo}`;
                return `
                    <input type="checkbox" class="btn-check payment-method" id="${id}" value="${term.codigo}" autocomplete="off">
                    <label class="btn btn-outline-primary" for="${id}">${term.titulo}</label>
                `;
            }).join('');

            document.querySelectorAll('.payment-method').forEach(input => {
                input.addEventListener('change', function () {
                    const checked = Array.from(document.querySelectorAll('.payment-method:checked'));
                    if (checked.length > 2) {
                        this.checked = false;
                        if (window.Swal) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Atenção',
                                text: 'Selecione no máximo 2 formas de pagamento.'
                            });
                        } else {
                            alert('Selecione no máximo 2 formas de pagamento.');
                        }
                        return;
                    }

                    selectedPaymentTerms = getSelectedPaymentTerms();
                    toggleCardInstallments();
                    updatePaymentSplitValidation();
                });
            });

            selectedPaymentTerms = [];
            toggleCardInstallments();
            updatePaymentSplitValidation();
        } catch (error) {
            console.error(error);
        }
    }

    async function Insertpurchase() {
        try {
            const payload = {
                id_fornecedor: $('#fornecedor_id').val() || null,
                observacao: null,
                desconto: parseMoney(inputDesconto?.value || 0),
                acrescimo: 0,
                total_bruto: 0,
                total_liquido: 0
            };

            const response = purchaseAction?.value === 'c'
                ? await window.api.purchase.insert(payload)
                : await window.api.purchase.update(purchaseId?.value, payload);

            if (!response?.status) {
                return { status: false, msg: response?.msg || 'Erro ao salvar compra' };
            }

            const returnedId = Number(response.id ?? response.data?.id ?? response.insertId ?? 0);
            if (returnedId > 0 && purchaseId) purchaseId.value = returnedId;
            if (purchaseAction) purchaseAction.value = 'e';

            return { status: true, id: returnedId };
        } catch (error) {
            console.error('Insertpurchase error:', error);
            return { status: false, msg: error.message };
        }
    }

    async function loadCurrentPurchaseData() {
        try {
            const id = Number(purchaseId?.value || 0);
            if (!id) return;

            const response = await window.api.purchase.listItemPurchase({ id });
            if (response?.status) {
                currentPurchaseData = response.purchase || null;
            }
        } catch (error) {
            console.error('loadCurrentPurchaseData error:', error);
        }
    }

    async function generatePurchasePdf(saveResult) {
        const dataAtual = new Date().toLocaleString('pt-BR');
        const fornecedorOption = document.querySelector('#fornecedor_id option:checked');

        const fornecedorNome =
            currentPurchaseData?.fornecedor_nome ||
            fornecedorOption?.dataset?.nomeFantasia ||
            fornecedorOption?.textContent?.trim() ||
            '-';

        const fornecedorRazao =
            currentPurchaseData?.fornecedor_razao_social ||
            fornecedorOption?.dataset?.razaoSocial ||
            fornecedorNome;

        const fornecedorCnpjCpf =
            currentPurchaseData?.fornecedor_documento ||
            fornecedorOption?.dataset?.cnpjCpf ||
            fornecedorOption?.dataset?.cnpj_cpf ||
            '-';

        const itensHtml = Array.from(document.querySelectorAll('#products-table-tbody tr'))
            .filter(tr => tr.id !== 'empty-row')
            .map(tr => {
                const tds = tr.querySelectorAll('td');
                return `
                    <tr>
                        <td>${tds[0]?.innerText || '-'}</td>
                        <td>${tds[2]?.innerText || '-'}</td>
                        <td class="text-center">${tds[3]?.innerText || '0'}</td>
                        <td class="text-right">${tds[4]?.innerText || '0,00'}</td>
                        <td class="text-right">${tds[5]?.innerText || '0,00'}</td>
                    </tr>
                `;
            }).join('');

        const parcelasHtml = Array.from(document.querySelectorAll('.payment-split-value')).map((input, index) => `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td class="text-right">${formatMoney(parseMoney(input.value))}</td>
            </tr>
        `).join('');

        const currentPaymentTerm = selectedPaymentTerms[0] || { titulo: 'Não informado' };
        const total = parseMoney(document.getElementById('total_bruto')?.innerText || '0');

        const stringHtml = `
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
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header-box text-center">
                    <h2>Relatório de Compra #${saveResult.id}</h2>
                    <p>Data: <strong>${dataAtual}</strong></p>
                </div>
                <div class="section-title">FORNECEDOR</div>
                <div class="info-card">
                    <strong>${fornecedorNome}</strong><br>
                    Razão Social: ${fornecedorRazao}<br>
                    CNPJ/CPF: ${fornecedorCnpjCpf}
                </div>
                <div class="section-title">ITENS DA COMPRA</div>
                <table class="table table-sm table-bordered">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Grupo</th>
                            <th class="text-center">Qtd</th>
                            <th class="text-right">Unit.</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itensHtml}</tbody>
                </table>
                <div class="section-title">CONDIÇÃO DE PAGAMENTO: ${currentPaymentTerm.titulo}</div>
                <table class="table table-sm table-bordered">
                    <thead>
                        <tr>
                            <th class="text-center">Parcela</th>
                            <th class="text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>${parcelasHtml}</tbody>
                </table>
                <div class="total-final text-right">
                    TOTAL: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
            </div>
        </body>
        </html>
        `;

        await window.api.report.print(stringHtml);
    }

    document.addEventListener('DOMContentLoaded', async function () {
        if (inputDesconto) {
            Inputmask('currency', {
                radixPoint: ',',
                groupSeparator: '.',
                allowMinus: false,
                prefix: 'R$ ',
                autoGroup: true,
                rightAlign: false
            }).mask(inputDesconto);

            inputDesconto.addEventListener('input', () => {
                calcPurchaseTotal();
                renderPaymentSplit();
                updatePaymentSplitValidation();
            });
        }

        if (finalizePurchaseButton) {
            finalizePurchaseButton.addEventListener('click', openPaymentModal);
        }

        if (clearPurchaseButton) {
            clearPurchaseButton.addEventListener('click', () => location.reload());
        }

        if (paymentInstallments) {
            paymentInstallments.addEventListener('change', renderInstallmentPreview);
        }

        if (confirmPaymentButton) {
            confirmPaymentButton.addEventListener('click', async () => {
                const hasSelected = selectedPaymentTerms.length > 0;
                const hasCard = selectedPaymentTerms.some(t => t?.codigo === 'cartao');
                const parcels = Number(paymentInstallments?.value || 0);

                if (!hasSelected) return;

                if (selectedPaymentTerms.length === 2) {
                    const splitInputs = Array.from(document.querySelectorAll('.payment-split-value'));
                    const total = calcPurchaseTotal();
                    const sum = splitInputs.reduce((acc, input) => acc + parseMoney(input.value), 0);

                    if (Math.abs(total - sum) >= 0.01) {
                        if (window.Swal) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Divisão inválida',
                                text: 'A soma da divisão precisa ser igual ao total da compra.'
                            });
                        } else {
                            alert('A soma da divisão precisa ser igual ao total da compra.');
                        }
                        return;
                    }
                }

                if (hasCard && !parcels) {
                    if (window.Swal) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Parcelas',
                            text: 'Selecione as parcelas do cartão.'
                        });
                    } else {
                        alert('Selecione as parcelas do cartão.');
                    }
                    return;
                }

                const saveResult = await Insertpurchase();
                if (!saveResult?.status) {
                    if (window.Swal) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Erro',
                            text: saveResult?.msg || 'Erro ao salvar compra.'
                        });
                    } else {
                        alert(saveResult?.msg || 'Erro ao salvar compra.');
                    }
                    return;
                }

                await loadCurrentPurchaseData();
                await generatePurchasePdf(saveResult);

                if (window.Swal) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Compra finalizada',
                        text: 'O PDF foi gerado com sucesso.',
                        confirmButtonText: 'OK'
                    });
                } else {
                    alert('O PDF foi gerado com sucesso.');
                }

                if (paymentModalInstance) {
                    paymentModalInstance.hide();
                }

                setTimeout(() => {
                    location.reload();
                }, 800);
            });
        }

        await loadPaymentTerms();
        await loadCurrentPurchaseData();
    });

    window.calcPurchaseTotal = calcPurchaseTotal;
    window.Insertpurchase = Insertpurchase;
})();