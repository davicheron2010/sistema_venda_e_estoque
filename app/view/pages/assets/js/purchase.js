// =============================================================================
// compra-form.js — Página de cadastro/edição de compra
// =============================================================================

// ─── Referências DOM 
const selectProduct     = document.getElementById("produto");
const inputPreco        = document.getElementById('preco_compra');
const inputQuantidade   = document.getElementById('quantidade');
const inputTotal        = document.getElementById('valor-total');
const fornecedorSelect  = $('#fornecedor_id');
const produtoSelect2    = $('#produto');

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
            const precoBruto   = inputPreco.inputmask ? inputPreco.inputmask.unmaskedvalue() : inputPreco.value;
            const qtdBruta     = inputQuantidade.inputmask ? inputQuantidade.inputmask.unmaskedvalue() : inputQuantidade.value;

            const preco = stringParaFloat(precoBruto);
            const qtd   = stringParaFloat(qtdBruta);

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

async function InsertPurchase(formId) {
    const form = document.getElementById(formId);
    if (!form) throw new Error("Formulário não encontrado!");
    const json = formToJson(form);
    return await api.purchase.insert(json);
}

async function UpdatePurchase(id, formId) {
    const form = document.getElementById(formId);
    if (!form) throw new Error("Formulário não encontrado!");
    const json = formToJson(form);
    return await api.purchase.update(id, json);
}

ok