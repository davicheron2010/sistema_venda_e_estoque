// =============================================================================
// compra-form.js — Página de cadastro/edição de compra
// =============================================================================

// ─── Referências DOM 
const fornecedorSelect2 = $('#id_fornecedor');
const produtoSelect2 = $('#id_produto');
const Id = document.getElementById('id');
const Action = document.getElementById('acao');
const form = document.getElementById('form');
const selectProduct = document.getElementById("produto");
const inputQuantity = document.getElementById('quantidade');
const insertItemButton = document.getElementById('insert-item');
const inputUnitPrice = document.getElementById('preco-unitario');
const inputTotalProduct = document.getElementById('valor-total-produto');


// ─── Funções de Cálculo 

function stringParaFloat(valor) {
    if (!valor) return 0;
    // Remove R$, espaços e ajusta pontos/vírgulas para o padrão matemático
    let limpo = valor.toString()
        .replace('R$', '')
        .replace('R$ ', '')
        .replace('.', '')
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
        // Tenta pegar o valor "desmascarado" do Inputmask primeiro, se não conseguir, limpa a string
        const unitPrice = inputUnitPrice.inputmask ? inputUnitPrice.inputmask.unmaskedvalue() : inputUnitPrice.value;
        const Quantity = inputQuantity.inputmask ? inputQuantity.inputmask.unmaskedvalue() : inputQuantity.value;

        const price = stringParaFloat(unitPrice);
        const amount = stringParaFloat(Quantity);

        const total = price * amount;

        if (inputTotalProduct) {
            inputTotalProduct.value = floatParaString(total);
        }
    } catch (e) {
        console.error("Erro ao calcular total:", e);
    }
}

// ─── Ouvintes de Evento 

if (inputUnitPrice && inputQuantity) {
    inputUnitPrice.addEventListener('input', executarCalculo);
    inputQuantity.addEventListener('input', executarCalculo);

    executarCalculo();
}

// ─── Configuração de Máscaras
// Configurações do Inputmask para os campos de preço e quantidade
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
// Configurações do Inputmask para o campo de quantidade
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

// ─── Select2: Fornecedor 
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
// ─── Select2: Produto 
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
// ─── Evento ao selecionar Produto
produtoSelect2.on('select2:select', async function (e) {
    const productId = e.params.data.id;
    try {
        const response = await api.product.findById(productId);

        if (response && response.preco_compra) {
            // Preenche o valor vindo do banco
            inputUnitPrice.value = response.preco_compra;

            // CRUCIAL: Dispara o evento 'input' para o Inputmask formatar 
            // e o executarCalculo() ser chamado automaticamente
            inputUnitPrice.dispatchEvent(new Event('input'));
        }
    } catch (err) {
        console.error("Erro ao buscar detalhes do produto:", err);
    }
});
// Focar no campo de busca do Select2 ao abrir
$(document).on('select2:open', () => {
    document.querySelector('.select2-search__field').focus();
});

// ─── Funções de inserir compra e item da compra
async function Insertpurchase() {
    insertItemButton.disabled = true;
    const originalText = insertItemButton.textContent;
    insertItemButton.textContent = "Inserindo...";

    try {
        const form = document.getElementById('form');
        if (!form) throw new Error('Formulário não encontrado!');
        const json = formToJson(form);
        console.log(json)
        return;

        // Chama insert ou update dependendo da ação atual
        const response = Action.value === 'c'
            ? await api.purchase.insert(json)
            : await api.purchase.update({ id: Id.value, ...json });

        if (!response.status) {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: response.msg || 'Ocorreu um erro ao inserir a venda.',
                time: 3000,
                progressBar: true,
            });
            return;
        }

        // Altera a ação do formulário para 'e' (editar) após a venda ser inserida com sucesso
        Action.value = 'e';
        // Seta o ID da última venda inserida no banco de dados
        Id.value = response.id;

        // Lista todos os itens vendidos, quantidade e total da venda
        await listItemPurchase();

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: error.message || 'Ocorreu um erro ao inserir a venda.',
            time: 3000,
            progressBar: true,
        });
    }
}

async function listItemPurchase() {
    try {
        const form = document.getElementById('form');
        if (!form) throw new Error('Formulário não encontrado!');
        const json = formToJson(form);

        const response = await api.purchase.findById(json);

        if (!response.status) {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: response.msg || 'Não foi possivel listar os dados da venda',
                time: 2000,
                progressBar: true,
            });
            return;
        }

        let total_liquido = parseFloat(response?.sale?.total_liquido);
        let total_bruto = parseFloat(response?.sale?.total_bruto);

        document.getElementById('total-amount').innerText = total_liquido
            .toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

        document.getElementById('amount').innerText = total_bruto
            .toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

        let trs = '';
        response.data.forEach(item => {
            let total_liquido = parseFloat(item?.total_liquido)
                .toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
            trs += `
                <tr id="tritem${item.id}">
                    <td>${item.id}</td>
                    <td>${item.nome}</td>
                    <td>${total_liquido}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteItem(${item.id})">
                            Excluir cód: ${item.id} (Del)
                        </button>
                    </td>
                </tr>
            `;
        });

        // Atualiza os itens da venda na tabela
        document.getElementById('products-table-tbody').innerHTML = trs;
        // Atualiza o total de itens da venda
        document.getElementById('product-count').innerText = `Itens ${response.data.length}`;

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: error.message || 'Ocorreu um erro ao listar os itens da venda.',
            time: 3000,
            progressBar: true,
        });
    }
}

// ─── Função insert item


insertItemButton.addEventListener("click", async () => {
    await Insertpurchase();
});