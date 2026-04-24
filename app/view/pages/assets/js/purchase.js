// =============================================================================
// compra-form.js — Página de cadastro/edição de compra
// =============================================================================

// ─── Referências DOM 
const selectProduct = document.getElementById("produto");
const inputPreco = document.getElementById('preco_compra');
const inputQuantidade = document.getElementById('quantidade');
const inputTotal = document.getElementById('valor-total');
const fornecedorSelect = $('#fornecedor_id');
const produtoSelect2 = $('#produto');
const insertListItemButton = document.getElementById('insert-item');
const Action = document.getElementById('acao');
const Id = document.getElementById('id');

document.addEventListener('DOMContentLoaded', function () {

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
            const precoBruto = inputPreco.inputmask ? inputPreco.inputmask.unmaskedvalue() : inputPreco.value;
            const qtdBruta = inputQuantidade.inputmask ? inputQuantidade.inputmask.unmaskedvalue() : inputQuantidade.value;

            const preco = stringParaFloat(precoBruto);
            const qtd = stringParaFloat(qtdBruta);

            const total = preco * qtd;

            if (inputTotal) {
                inputTotal.value = floatParaString(total);
            }
        } catch (e) {
            console.error("Erro ao calcular total:", e);
        }
    }

    // ─── Ouvintes de Evento 

    if (inputPreco && inputQuantidade) {
        inputPreco.addEventListener('input', executarCalculo);
        inputQuantidade.addEventListener('input', executarCalculo);

        executarCalculo();
    }

    // ─── Configuração de Máscaras 

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
    }).mask(inputPreco);

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
    }).mask(inputQuantidade);

    // ─── Select2: Fornecedor 
    fornecedorSelect.select2({
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
                inputPreco.value = response.preco_compra;

                // CRUCIAL: Dispara o evento 'input' para o Inputmask formatar 
                // e o executarCalculo() ser chamado automaticamente
                inputPreco.dispatchEvent(new Event('input'));
            }
        } catch (err) {
            console.error("Erro ao buscar detalhes do produto:", err);
        }
    });

    // Focar no campo de busca do Select2 ao abrir
    $(document).on('select2:open', () => {
        document.querySelector('.select2-search__field').focus();
    });
});

// ─── Funções de Persistência 


async function Insertpurchase() {
    const valid = Validate.SetForm('form').Validate();
    if (!valid) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Por favor, preencha os campos corretamente.',
            time: 2000,
            progressBar: true,
        });
        return;
    }

    try {
        const form = document.getElementById('form');
        if (!form) throw new Error('Formulário não encontrado!');
        const json = formToJson(form);

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

// ─── Função insert item
async function InsertItemPurchase() {
    const valid = Validate.SetForm('form').Validate();
    if (!valid) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Por favor, preencha os campos corretamente.',
            time: 2000,
            progressBar: true,
        });
        return;
    }

    try {
        const form = document.getElementById('form');
        if (!form) throw new Error('Formulário não encontrado!');
        const json = formToJson(form);

        const response = await api.purchase.insertItem(json);

        if (!response.status) {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: response.msg || 'Ocorreu um erro ao inserir o item da venda.',
                time: 3000,
                progressBar: true,
            });
            return;
        }

        // Atualiza a tabela de itens da venda
        await listItemPurchase();

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: error.message || 'Ocorreu um erro ao inserir o item da venda.',
            time: 3000,
            progressBar: true,
        });
    }
}

// ─── Função listar itens da compra
async function listItemPurchase() {
    try {
        const form = document.getElementById('form');
        if (!form) throw new Error('Formulário não encontrado!');
        const json = formToJson(form);

        const response = await api.purchase.listItemSale(json);

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

async function UpdatePurchase(id, formId) {
    const form = document.getElementById(formId);
    if (!form) throw new Error("Formulário não encontrado!");
    const json = formToJson(form);
    return await api.purchase.update(id, json);
}

insertListItemButton.addEventListener("click", async () => {
    let timer = 3000;
    const btn = $(insertListItemButton);
    btn.prop("disabled", true);

    const form = document.getElementById('form');
    const data = formToJson(form);

    // Função auxiliar para limpar máscaras antes de enviar ao banco
    const cleanInput = (val) => String(val).replace(/[R$%\s.]/g, "").replace(".", "").replace(",", ".");
    //Converte os dados para do form para decimal, limpando as máscaras de moeda e porcentagem

    data.inputPreco = cleanInput(data.preco_compra);
    data.inputQuantidade = cleanInput(data.quantidade);
    data.inputTotal = cleanInput(data.valor_total);


    let id = (Action.value !== "c") ? Id.value : null;

    try {
        console.log("Dados enviados para o backend:", data);
        const response = (Action.value === "c")
            ? await api.purchase.insert(data)
            : await api.purchase.update(id, data);

        if (!response.status) {
            toast("error", "Erro", response.msg, timer);
            return;
        }
        //Insere o item na tabela item compra

        const responseItem = await api.purchase.insertItem(data);

        //Atualizar os campos de total da compra
        document.getElementById('total_liquido').innerHTML = parseFloat(responseItem.data.total_liquido).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        document.getElementById('total_bruto').innerHTML = parseFloat(responseItem.data.total_bruto).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

    } catch (err) {
        toast("error", "Falha", "Erro interno: " + err.message, timer);
    } finally {
        btn.prop("disabled", false);
    }
});