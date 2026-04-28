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
                        text: `${item.nome_fantasia} - ${item.cnpj_cpf}`
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

        document.getElementById('preco-unitario').innerHTML = parseFloat(response?.purchase?.preco_unitario ?? 0)
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
async function clearPurchase() {
    const result = await confirmDialog(
        'Limpar tudo?',
        'Tem certeza que deseja remover todos os itens e reiniciar a compra?'
    );

    if (!result.isConfirmed) return;

    try {
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

        toast("success", "Sucesso", "Compra reiniciada com sucesso!");

    } catch (err) {
        toast("error", "Falha", "Erro interno: " + err.message);
    }
}


let paymentModalInstance = null;

function openPaymentModal() {
    const total = calcPurchaseTotal();
    const modalEl = document.getElementById('paymentModal');
    if (!modalEl || !window.bootstrap) return;

    const modalTotal = document.getElementById('modal-total');
    if (modalTotal) modalTotal.innerText = floatParaString(total);

    paymentModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    paymentModalInstance.show();
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