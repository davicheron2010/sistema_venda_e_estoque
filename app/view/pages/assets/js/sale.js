// =============================================================================
// venda-renderer.js — Renderer Process (Electron)
// Todas as chamadas HTTP foram substituídas por window.electronAPI (IPC)
// =============================================================================

// ─── Referências DOM ──────────────────────────────────────────────────────────
const Action             = document.getElementById('acao');
const Id                 = document.getElementById('id');
const insertItemButton   = document.getElementById('insertItemButton');
const modalPayment       = document.getElementById('pagamentoVenda');
const valorPago          = document.getElementById('valorPago');
const condicaoPagamento  = document.getElementById('condicaoPagamento');
const Installment        = document.getElementById('parcelas');
const diaVencimento      = document.getElementById('diaVencimento');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converte valor em formato BRL (ex: "R$ 1.234,56") para float.
 */
const parseBRLToFloat = (value) => {
    if (typeof value !== 'string') return NaN;
    const normalized = value
        .replace(/[R$\s]/g, '')   // Remove "R$" e espaços
        .replace(/\./g, '')        // Remove separadores de milhar
        .replace(',', '.');        // Vírgula decimal → ponto
    const result = parseFloat(normalized);
    return isNaN(result) ? NaN : result;
};

/**
 * Coleta todos os campos do formulário e retorna um objeto chave→valor.
 * Substitui o Requests.SetForm('form').Post() que lia o form via PHP.
 */
const collectFormData = () => {
    const form = document.getElementById('form');
    const data = {};
    new FormData(form).forEach((value, key) => {
        data[key] = value;
    });
    return data;
};

/**
 * Exibe alerta de erro padronizado via SweetAlert2.
 */
const alertError = (text, title = 'Erro') => {
    Swal.fire({ icon: 'error', title, text, timer: 3000, timerProgressBar: true });
};

// ─── Funções principais ───────────────────────────────────────────────────────

/**
 * Insere ou atualiza a venda via IPC.
 * Canal IPC: 'venda:insert' ou 'venda:update'
 */
async function InsertSale() {
    // Validação básica dos campos obrigatórios do form
    const form = document.getElementById('form');
    if (!form.checkValidity()) {
        form.reportValidity();
        alertError('Por favor, preencha os campos corretamente.');
        return false;
    }

    try {
        const formData = collectFormData();
        const channel  = Action.value === 'c' ? 'venda:insert' : 'venda:update';

        // Envia dados ao main process via IPC e aguarda resposta
        const response = await window.electronAPI.invoke(channel, formData);

        if (!response.status) {
            alertError(response.msg || 'Ocorreu um erro ao inserir a venda.');
            return false;
        }

        // Após inserção bem-sucedida, muda ação para edição
        Action.value = 'e';
        Id.value     = response.id;

        // Atualiza o título da janela para refletir o ID da venda (substitui pushState)
        document.title = `Venda #${response.id}`;

        // Atualiza a tabela de itens
        await listItemSale();
        return true;

    } catch (error) {
        alertError(error.message || 'Ocorreu um erro ao inserir a venda.');
        return false;
    }
}

/**
 * Adiciona um item à venda via IPC.
 * Canal IPC: 'venda:insertitem'
 */
async function InsertItemSale() {
    const form = document.getElementById('form');
    if (!form.checkValidity()) {
        form.reportValidity();
        alertError('Por favor, preencha os campos corretamente.');
        return;
    }

    try {
        const formData = collectFormData();
        const response = await window.electronAPI.invoke('venda:insertitem', formData);

        if (!response.status) {
            alertError(response.msg || 'Ocorreu um erro ao inserir o item.');
            return;
        }

        await listItemSale();

    } catch (error) {
        alertError(error.message || 'Ocorreu um erro ao inserir o item.');
    }
}

/**
 * Remove um item da venda via IPC.
 * Canal IPC: 'venda:deleteitem'
 * @param {number|string} id - ID do item a ser removido
 */
async function deleteItem(id) {
    document.getElementById('id_item').value = id;

    try {
        const formData = collectFormData();
        const response = await window.electronAPI.invoke('venda:deleteitem', formData);

        if (!response.status) {
            alertError(response.msg || 'Não foi possível excluir o item.');
            return;
        }

        // Remove a linha da tabela sem recarregar
        document.getElementById(`tritem${id}`)?.remove();

        const totalLiquido = parseFloat(response?.sale?.total_liquido);
        const totalBruto   = parseFloat(response?.sale?.total_bruto);

        document.getElementById('total-amount').innerText =
            totalLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        document.getElementById('amount').innerText =
            totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        document.getElementById('product-count').innerHTML = `Itens ${response.itens}`;

    } catch (error) {
        alertError(error.message || 'Ocorreu um erro ao excluir o item.');
    }
}

/**
 * Lista todos os itens da venda atual e atualiza a tabela.
 * Canal IPC: 'venda:listitemsale'
 */
async function listItemSale() {
    try {
        const formData = collectFormData();
        const response = await window.electronAPI.invoke('venda:listitemsale', formData);

        if (!response.status) {
            alertError(response.msg || 'Não foi possível listar os dados da venda.');
            return;
        }

        const totalLiquido = parseFloat(response?.sale?.total_liquido);
        const totalBruto   = parseFloat(response?.sale?.total_bruto);

        document.getElementById('total-amount').innerText =
            totalLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        document.getElementById('amount').innerText =
            totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Monta as linhas da tabela dinamicamente
        let trs = '';
        response.data.forEach(item => {
            const itemTotal = parseFloat(item?.total_liquido)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            trs += `
                <tr id="tritem${item.id}">
                    <td>${item.id}</td>
                    <td>${item.nome}</td>
                    <td>${itemTotal}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteItem(${item.id})">
                            Excluir cód: ${item.id} (Del)
                        </button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('products-table-tbody').innerHTML = trs;
        document.getElementById('product-count').innerText = `Itens ${response.data.length}`;

    } catch (error) {
        alertError(error.message || 'Ocorreu um erro ao listar os itens.');
    }
}

// Expõe deleteItem globalmente para uso inline no HTML das linhas da tabela
window.deleteItem = deleteItem;

// ─── Inicialização ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    // Se estiver em modo edição, já carrega os itens da venda
    if (Action.value === 'e') {
        await listItemSale();
    }

    // ── Máscara monetária no campo valorPago ──────────────────────────────
    $('#valorPago').maskMoney({
        prefix: 'R$ ',
        decimal: ',',
        thousands: '.',
        formatOnBlur: true,
        selectAllOnFocus: true,
    });

    // ── Datepicker no campo diaVencimento ─────────────────────────────────
    flatpickr('#diaVencimento', {
        locale: 'pt',
        dateFormat: 'd/m/Y',
    });

    // ── Select2 para pesquisa de produtos (via IPC) ───────────────────────
    // A busca AJAX do Select2 é substituída por uma função IPC assíncrona
    $('#pesquisa').select2({
        theme: 'bootstrap-5',
        placeholder: 'Selecione um produto',
        language: 'pt-BR',
        ajax: {
            // Em vez de uma URL HTTP, usamos um transport customizado com IPC
            transport: async (params, success, failure) => {
                try {
                    const result = await window.electronAPI.invoke(
                        'produto:listproductdata',
                        { term: params.data.term ?? '' }
                    );
                    success(result);
                } catch (err) {
                    failure(err);
                }
            },
        },
    });

    // Foca o campo de busca ao abrir o Select2
    $('.form-select').on('select2:open', () => {
        const input = document.querySelector('.select2-search__field');
        if (input) {
            input.placeholder = 'Digite para pesquisar...';
            input.focus();
        }
    });
});

// ─── Event Listeners ──────────────────────────────────────────────────────────

// Feedback visual em cliques de botão
document.addEventListener('click', (e) => {
    if (e.target.matches('button')) {
        e.target.style.transition = 'transform 0.1s';
    }
});

// Botão principal: salva venda + adiciona item
insertItemButton.addEventListener('click', async () => {
    const saleSaved = await InsertSale();
    if (saleSaved !== false) {
        await InsertItemSale();
    }
});

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    // F4 → Abre modal de pesquisa de produto
    if (e.key === 'F4') {
        e.preventDefault();
        const myModalEl = document.getElementById('pesquisaProdutoModal');
        new bootstrap.Modal(myModalEl).show();
    }

    // F8 → Fecha modal de pesquisa de produto
    if (e.key === 'F8') {
        e.preventDefault();
        const myModalEl = document.getElementById('pesquisaProdutoModal');
        bootstrap.Modal.getInstance(myModalEl)?.hide();
    }

    // F9 → Acionar inserção de item (equivalente ao clique no botão)
    if (e.key === 'F9') {
        e.preventDefault();
        insertItemButton.click();
    }
});

// ─── Modal de Pagamento ───────────────────────────────────────────────────────

modalPayment.addEventListener('shown.bs.modal', async () => {
    try {
        const formData = collectFormData();

        // Carrega totais da venda
        const saledata = await window.electronAPI.invoke('venda:selectsaledata', formData);

        if (saledata.itens <= 0) {
            alertError('Para faturar é necessário inserir pelo menos um item!');
            bootstrap.Modal.getInstance(modalPayment)?.hide();
            return;
        }

        document.getElementById('totalBruto').value   = saledata.total_bruto;
        document.getElementById('totalLiquido').value = saledata.total_liquido;
        document.getElementById('valorPago').value    = parseFloat(saledata.total_liquido)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        document.getElementById('valorPago').focus();

        // Carrega condições de pagamento
        const paymentData = await window.electronAPI.invoke('pagamento:loaddatapayment', formData);

        const options = paymentData.data
            .map(item => `<option value="${item.id}">${item.titulo}</option>`)
            .join('');

        document.getElementById('condicaoPagamento').innerHTML = options;

    } catch (error) {
        alertError(error.message || 'Erro ao carregar dados do pagamento.');
    }
});

// Exibe/oculta campo de parcelamento conforme valor pago
valorPago.addEventListener('keydown', () => {
    const valorpago    = parseBRLToFloat(valorPago.value);
    const totalliquido = parseBRLToFloat(document.getElementById('totalLiquido').value);
    const btnParcela   = document.getElementById('adicionarParcela');

    btnParcela.classList.toggle('d-none', valorpago >= totalliquido);
});

// Carrega parcelas ao mudar condição de pagamento
condicaoPagamento.addEventListener('change', async () => {
    try {
        const formData = collectFormData();
        const response = await window.electronAPI.invoke('venda:listinstallments', formData);

        const parcelamento = document.getElementById('parcelamento');
        parcelamento.classList.toggle('d-none', response.data.length === 0);

        const options = response.data
            .map(item =>
                `<option value="${item.id}">Intervalo: ${item.intervalor} dias - ${item.parcela} X</option>`
            )
            .join('');

        document.getElementById('parcelas').innerHTML = options;

        const valorpago    = parseBRLToFloat(valorPago.value);
        const totalliquido = parseBRLToFloat(document.getElementById('totalLiquido').value);

        document.getElementById('adicionarParcela')
            .classList.toggle('d-none', valorpago >= totalliquido);

    } catch (error) {
        alertError(error.message || 'Erro ao carregar parcelas.');
    }
});