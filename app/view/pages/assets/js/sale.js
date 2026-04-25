import { addSaleItem, initializeSaleItems, updateTotals, clearSaleItems, getSaleItems } from './ItemSale.js';

// ─── Referências DOM 
const inputQuantidade = document.getElementById('quantidade');
const inputUnitarioLiquido = document.getElementById('unitario_liquido');
const inputValorTotal = document.getElementById('valor-total');
const produtoSelect2 = $('#id_produto');
let currentSaleId = null;
let currentSaleClientId = null;

function initializeCustomerSelect() {
    const select = $('#id_cliente');
    if (!select.length) return;

    select.select2({
        theme: 'bootstrap-5',
        placeholder: 'Selecione um cliente',
        allowClear: true,
        language: 'pt-BR',
        ajax: {
            transport: async function (params, success, failure) {
                try {
                    const searchTerm = params.data.q || '';
                    const result = await window.api.customer.find({ term: searchTerm, limit: 50, offset: 0 });

                    success({
                        results: result.data.map(item => ({
                            id: item.id,
                            text: `${item.nome}${item.cpf ? ' - CPF: ' + item.cpf : ''}`
                        }))
                    });
                } catch (error) {
                    console.error(error);
                    failure(error);
                }
            },
            delay: 250
        },
        minimumInputLength: 0
    });
}

function initializeProductSelect() {
    const select = $('#id_produto');
    if (!select.length) return;

    select.select2({
        theme: 'bootstrap-5',
        placeholder: 'Buscar produto...',
        allowClear: true,
        language: 'pt-BR',
        ajax: {
            transport: async function (params, success, failure) {
                try {
                    const searchTerm = params.data.q || '';
                    const result = await window.api.product.find({ term: searchTerm, limit: 50, offset: 0 });

                    success({
                        results: result.data.map(item => ({
                            id: item.id,
                            text: `${item.nome}${item.codigo_barra ? ' - Cód. Barras: ' + item.codigo_barra : ''}`
                        }))
                    });
                } catch (error) {
                    console.error(error);
                    failure(error);
                }
            },
            delay: 250
        },
        minimumInputLength: 0
    });
}

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

function updateSaleStatus() {
    const badge = document.getElementById('sale-status');
    if (!badge) return;
    badge.textContent = currentSaleId ? `Em edição (Venda #${currentSaleId})` : 'Em edição';
}

async function createSaleForClient(clienteId) {
    const result = await window.api.sale.insert({
        id_cliente: clienteId,
        total_bruto: 0,
        total_liquido: 0,
        desconto: 0,
        acrescimo: 0,
        observacao: document.getElementById('observacao')?.value || ''
    });

    if (!result.status) {
        return { status: false, msg: result.error || 'Não foi possível criar a venda.' };
    }

    currentSaleId = result.id;
    currentSaleClientId = clienteId;
    updateSaleStatus();
    return { status: true, id: currentSaleId };
}

async function ensureSaleExists(clienteId) {
    if (!clienteId) {
        return { status: false, msg: 'Selecione um cliente antes de adicionar itens.' };
    }

    if (currentSaleId) {
        if (currentSaleClientId && currentSaleClientId !== clienteId) {
            return { status: false, msg: 'O cliente da venda já foi definido. Limpe a venda para mudar de cliente.' };
        }
        return { status: true, id: currentSaleId };
    }

    return await createSaleForClient(clienteId);
}

function executarCalculo() {
    try {
        // Tenta pegar o valor "desmascarado" do Inputmask primeiro, se não conseguir, limpa a string
        const precoBruto = inputUnitarioLiquido.inputmask ? inputUnitarioLiquido.inputmask.unmaskedvalue() : inputUnitarioLiquido.value;
        const qtdBruta = inputQuantidade.inputmask ? inputQuantidade.inputmask.unmaskedvalue() : inputQuantidade.value;

        const preco = stringParaFloat(precoBruto);
        const qtd = stringParaFloat(qtdBruta);

        const total = preco * qtd;

        // Atualiza o campo valor-total
        if (inputValorTotal) {
            inputValorTotal.value = floatParaString(total);
        }

        console.log('Cálculo: Preço =', preco, 'Qtd =', qtd, 'Total =', total);
    } catch (e) {
        console.error("Erro ao calcular total:", e);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 1. DISPARA O CARREGAMENTO
    initializeCustomerSelect();
    initializeProductSelect();
    initializeSaleItems();
    updateSaleStatus();

    // ─── Ouvintes de Evento para Cálculo
    if (inputUnitarioLiquido && inputQuantidade) {
        inputUnitarioLiquido.addEventListener('input', executarCalculo);
        inputQuantidade.addEventListener('input', executarCalculo);

        executarCalculo();
    }

    // ─── Listeners para Desconto e Acréscimo ---
    const descontoInput = document.getElementById('desconto');
    const acrescimoInput = document.getElementById('acrescimo');
    
    if (descontoInput) {
        descontoInput.addEventListener('input', () => updateTotals());
    }
    
    if (acrescimoInput) {
        acrescimoInput.addEventListener('input', () => updateTotals());
    }

    // ─── Configuração de Máscaras 
    if (typeof Inputmask !== 'undefined') {
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
        }).mask(inputUnitarioLiquido);

        Inputmask("decimal", {
            radixPoint: ",",
            groupSeparator: ".",
            allowMinus: false,
            autoGroup: true,
            rightAlign: false,
            digits: 4,
            onBeforeMask: function (value) {
                return String(value).replace(".", ",");
            },
        }).mask(inputQuantidade);

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
        }).mask(inputValorTotal);
    }

    // ─── Evento ao selecionar Produto
    produtoSelect2.on('select2:select', async function (e) {
        const productId = e.params.data.id;
        try {
            const response = await window.api.product.findById(productId);

            if (response && response.preco_venda) {
                // Preenche o valor vindo do banco
                inputUnitarioLiquido.value = response.preco_venda;

                if (inputQuantidade) {
                    inputQuantidade.value = '1,00';
                }

                // CRUCIAL: Dispara o evento 'input' para o Inputmask formatar
                // e o executarCalculo() ser chamado automaticamente
                inputUnitarioLiquido.dispatchEvent(new Event('input'));
                if (inputQuantidade) {
                    inputQuantidade.dispatchEvent(new Event('input'));
                    inputQuantidade.focus();
                }
            }
        } catch (err) {
            console.error("Erro ao buscar detalhes do produto:", err);
        }
    });

    // --- Modal de Itens ---
    const btnOpenForm = document.getElementById('btn-open-form');
    const itemModalElement = document.getElementById('itemModal');
    const itemModal = itemModalElement ? new bootstrap.Modal(itemModalElement) : null;

    if (btnOpenForm && itemModal) {
        btnOpenForm.addEventListener('click', () => itemModal.show());
    }

    // --- Adicionar Item À Tabela ---
    const itemForm = document.getElementById('item-sale-form');
    if (itemForm) {
        itemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const clienteSelect = document.getElementById('id_cliente');
            const clienteId = clienteSelect?.value || '';
            const productSelect = document.getElementById('id_produto');
            const productId = productSelect ? productSelect.value : '';
            const quantity = document.getElementById('quantidade').value;
            const unitPrice = document.getElementById('unitario_liquido').value;

            if (!clienteId) {
                alert('Selecione um cliente antes de adicionar itens.');
                return;
            }

            const saleResult = await ensureSaleExists(clienteId);
            if (!saleResult.status) {
                alert(saleResult.msg);
                return;
            }

            if (!productId) {
                alert('Venda criada com sucesso. Agora selecione um produto para inserir.');
                return;
            }

            const inserted = await addItemToTable(productId, quantity, unitPrice);
            if (!inserted) {
                return;
            }

            // Resetar o formulário para adicionar próximo item
            itemForm.reset();
            if (produtoSelect2?.length) {
                produtoSelect2.val(null).trigger('change');
            }
            if (inputQuantidade) {
                inputQuantidade.value = '1,00';
                inputQuantidade.dispatchEvent(new Event('input'));
            }
            if (inputUnitarioLiquido) {
                inputUnitarioLiquido.value = '';
            }
            if (inputValorTotal) {
                inputValorTotal.value = '';
            }
            executarCalculo();
        });
    }

    // --- Botão Limpar Tudo ---
    const btnClearSale = document.getElementById('clear-sale');
    if (btnClearSale) {
        btnClearSale.addEventListener('click', () => {
            clearSaleItems();
            currentSaleId = null;
            updateSaleStatus();
            document.getElementById('id_cliente').value = '';
            document.getElementById('observacao').value = '';
            document.getElementById('desconto').value = '0.00';
            document.getElementById('acrescimo').value = '0.00';
            updateTotals();
        });
    }

    // --- Botão Finalizar Venda ---
    const btnFinalizeSale = document.getElementById('finalize-sale');
    if (btnFinalizeSale) {
        btnFinalizeSale.addEventListener('click', () => {
            finalizeSale();
        });
    }
});

async function addItemToTable(productId, quantity, unitPrice) {
    const customerSelect = document.getElementById('id_cliente');
    const clienteNome = customerSelect?.selectedOptions?.[0]?.text || '';
    const clienteId = customerSelect?.value || '';

    const product = await window.api.product.findById(productId);
    if (!product) {
        alert('Produto não encontrado. Tente novamente.');
        return false;
    }

    const qty = stringParaFloat(quantity) || 0;
    const price = stringParaFloat(unitPrice) || 0;
    const total = parseFloat((qty * price).toFixed(2));

    if (!currentSaleId) {
        alert('Erro interno: venda não foi criada. Selecione o cliente e tente novamente.');
        return false;
    }

    const itemData = {
        id: currentSaleId,
        id_produto: product.id,
        quantidade: qty,
        total_bruto: total,
        unitario_bruto: price,
        total_liquido: total,
        unitario_liquido: price,
        desconto: 0,
        acrescimo: 0,
        nome: product.nome
    };

    const itemResult = await window.api.sale.insertItem(itemData);
    if (!itemResult.status) {
        alert(itemResult.msg || 'Não foi possível inserir o item na venda.');
        return false;
    }

    const item = {
        id_produto: product.id,
        nome_produto: product.nome,
        id_cliente: clienteId,
        nome_cliente: clienteNome,
        nome_grupo: product.grupo || '-',
        quantidade: qty,
        preco_unitario: price,
        total: total
    };

    addSaleItem(item);
    return true;
}

function finalizeSale() {
    const items = getSaleItems();
    
    if (items.length === 0) {
        alert('Adicione pelo menos um item à venda.');
        return;
    }

    const clienteSelect = document.getElementById('id_cliente');
    const clienteId = clienteSelect?.value;
    
    if (!clienteId) {
        alert('Selecione um cliente antes de finalizar a venda.');
        return;
    }

    const observacao = document.getElementById('observacao').value;
    const descontoPercent = parseFloat(document.getElementById('desconto').value || 0) || 0;
    const acrescimoPercent = parseFloat(document.getElementById('acrescimo').value || 0) || 0;

    const totalBruto = items.reduce((sum, item) => sum + item.total, 0);
    const valorDesconto = (totalBruto * descontoPercent) / 100;
    const valorAcrescimo = (totalBruto * acrescimoPercent) / 100;
    const totalLiquido = totalBruto - valorDesconto + valorAcrescimo;

    // Primeiro, cria a venda no banco
    const saleData = {
        total_bruto: totalBruto,
        total_liquido: totalLiquido,
        desconto: valorDesconto,
        acrescimo: valorAcrescimo,
        observacao: observacao
    };

    if (!currentSaleId) {
        alert('Não há venda criada. Adicione um item primeiro.');
        return;
    }

    window.api.sale.update(currentSaleId, saleData).then(result => {
        if (result.status) {
            alert('Venda finalizada com sucesso!');
            clearSaleItems();
            currentSaleId = null;
            updateSaleStatus();
            document.getElementById('id_cliente').value = '';
            document.getElementById('observacao').value = '';
            document.getElementById('desconto').value = '0.00';
            document.getElementById('acrescimo').value = '0.00';
            updateTotals();

            const finalizeSaleModalElement = document.getElementById('finalizeSaleModal');
            if (finalizeSaleModalElement) {
                const modal = bootstrap.Modal.getInstance(finalizeSaleModalElement);
                if (modal) modal.hide();
            }
        } else {
            alert('Erro ao finalizar venda: ' + (result.error || 'Erro desconhecido'));
        }
    }).catch(error => {
        console.error('Erro ao finalizar venda:', error);
        alert('Erro ao finalizar venda. Verifique o console para mais detalhes.');
    });
}