import Swal from "sweetalert2";

const insertItemPurchase = document.getElementById('insertItemPurchase');
const Action = document.getElementById('acao');
const Id = document.getElementById('id');
$('#fornecedor_id').select2({
    theme: 'bootstrap-5',
    placeholder: "Selecione um fornecedor",
    language: "pt-BR",
    ajax: {
        transport: async function (params, success, failure) {
            try {
                const searchTerm = params.data.q || '';

                const result = await window.api.supplier.supplierSearch({ q: searchTerm });

                // Adapta para o formato esperado pelo Select2
                success({
                    results: result.data.map(item => ({
                        id: item.id,
                        text: item.nome_fantasia + ' ' + item.razao_social

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

$('#product-id').select2({
    theme: 'bootstrap-5',
    placeholder: "Selecione um produto",
    language: "pt-BR",
    ajax: {
        transport: async function (params, success, failure) {
            try {
                const searchTerm = params.data.q || '';

                const result = await window.api.product.find({ q: searchTerm });

                // Adapta para o formato esperado pelo Select2
                success({
                    results: result.data.map(item => ({
                        id: item.id,
                        text: 'Cód: ' + item.id + ' - ' + item.nome + ' Cód. barra: ' + item.codigo_barra
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

$('.form-select').on('select2:open', function (e) {
    let inputElement = document.querySelector('.select2-search__field');
    inputElement.placeholder = 'Digite para pesquisar...';
    inputElement.focus();
});

async function InsertPurchase(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        throw new Error("Formulário não encontrado!");
    }
    const json = formToJson(form);
    const response = await api.purchase.insert(json);
    return response;
}

async function UpdatePurchase(id, formId) {
    const form = document.getElementById(formId);
    if (!form) {
        throw new Error("Formulário não encontrado!");
    }
    const json = formToJson(form);
    const response = await api.purchase.update(id, json);
    return response;
}

// =============================================================================
// compra-form.js — Página de cadastro/edição de compra
// Lê os parâmetros da URL para saber se é nova compra (c) ou edição (e)
// =============================================================================

// ─── Referências DOM ──────────────────────────────────────────────────────────
const Action            = document.getElementById('acao');
const Id                = document.getElementById('id');
const insertItemButton  = document.getElementById('insertItemPurchase');

// ─── Lê parâmetros da URL ─────────────────────────────────────────────────────
// Ex: compra-form.html?acao=e&id=5
const urlParams = new URLSearchParams(window.location.search);
const acaoParam = urlParams.get('acao') ?? 'c'; // padrão: nova compra
const idParam   = urlParams.get('id')   ?? '';

// ─── Aplica os parâmetros nos campos hidden do form ───────────────────────────
Action.value = acaoParam;
Id.value     = idParam;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const collectFormData = (formId = 'form') => {
    const data = {};
    new FormData(document.getElementById(formId)).forEach((value, key) => {
        data[key] = value;
    });
    return data;
};

// ─── Carrega dados da compra para edição ──────────────────────────────────────
async function loadPurchase(id) {
    try {
        const response = await window.electronAPI.invoke('compra:find', { id });
        if (!response.status) {
            toast('error', 'Erro', response.msg, 3000);
            return;
        }

        // Preenche os campos do formulário com os dados da compra
        const compra = response.data;
        document.getElementById('fornecedor').value  = compra.fornecedor_id ?? '';
        document.getElementById('observacao').value  = compra.observacao    ?? '';
        // ... preencha os demais campos conforme seu formulário

        // Carrega os itens já inseridos nessa compra
        await ListItemsPurchase();

    } catch (error) {
        toast('error', 'Erro', error.message, 3000);
    }
}

// ─── Inserir Compra (acao = c) ────────────────────────────────────────────────
async function InsertPurchase(formId = 'form') {
    const form = document.getElementById(formId);
    if (!form.checkValidity()) {
        form.reportValidity();
        return { status: false, msg: 'Preencha os campos obrigatórios.' };
    }
    try {
        const formData = collectFormData(formId);
        return await window.electronAPI.invoke('compra:insert', formData);
    } catch (error) {
        return { status: false, msg: error.message };
    }
}

// ─── Inserir Item na Compra ───────────────────────────────────────────────────
async function InsertItemPurchase(formId = 'form') {
    const form = document.getElementById(formId);
    if (!form.checkValidity()) {
        form.reportValidity();
        return { status: false, msg: 'Preencha os campos do item.' };
    }
    try {
        const formData = collectFormData(formId);
        return await window.electronAPI.invoke('compra:insertitem', formData);
    } catch (error) {
        return { status: false, msg: error.message };
    }
}

// ─── Atualizar totais na tela ─────────────────────────────────────────────────
function UpdatePurchaseTotals(compra) {
    document.getElementById('total-amount').innerText =
        parseFloat(compra.total_liquido)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('amount').innerText =
        parseFloat(compra.total_bruto)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Listar itens da compra na tabela ─────────────────────────────────────────
async function ListItemsPurchase() {
    try {
        const formData = collectFormData();
        const response = await window.electronAPI.invoke('compra:listitems', formData);

        if (!response.status) {
            toast('error', 'Erro', response.msg, 3000);
            return;
        }

        let trs = '';
        response.data.forEach(item => {
            const totalItem = parseFloat(item.total_liquido)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            trs += `
                <tr id="tritem${item.id}">
                    <td>${item.id}</td>
                    <td>${item.nome}</td>
                    <td>${totalItem}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteItemPurchase(${item.id})">
                            Excluir cód: ${item.id}
                        </button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('products-table-tbody').innerHTML = trs;
        document.getElementById('product-count').innerText = `Itens ${response.data.length}`;
        UpdatePurchaseTotals(response.compra);

    } catch (error) {
        toast('error', 'Erro', error.message, 3000);
    }
}

// ─── Excluir item da compra ───────────────────────────────────────────────────
async function deleteItemPurchase(id) {
    document.getElementById('id_item_compra').value = id;
    try {
        const formData = collectFormData();
        const response = await window.electronAPI.invoke('compra:deleteitem', formData);

        if (!response.status) {
            toast('error', 'Erro', response.msg, 3000);
            return;
        }

        document.getElementById(`tritem${id}`)?.remove();
        UpdatePurchaseTotals(response.compra);
        document.getElementById('product-count').innerText = `Itens ${response.itens}`;

    } catch (error) {
        toast('error', 'Erro', error.message, 3000);
    }
}

window.deleteItemPurchase = deleteItemPurchase;

// ─── Event Listener principal ─────────────────────────────────────────────────
insertItemButton.addEventListener('click', async () => {
    let timer = 3000;

    if (Action.value === 'c') {
        // Primeira vez: cria a compra no banco
        const response = await InsertPurchase('form');
        if (!response.status) {
            Swal.fire({ icon: 'error', title: 'Erro', text: response.msg });
            return;
        }
        // Muda para modo edição e guarda o ID gerado
        Action.value = 'e';
        Id.value     = response.id;
        toast('success', 'Sucesso', response.msg, timer);
    }

    // Insere o item (roda sempre, em 'c' e 'e')
    const itemResponse = await InsertItemPurchase('form');
    if (!itemResponse.status) {
        toast('error', 'Erro', itemResponse.msg, timer);
        return;
    }
    toast('success', 'Sucesso', itemResponse.msg, timer);

    // Recarrega tabela e atualiza totais
    await ListItemsPurchase();
});

// ─── Inicialização ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (Action.value === 'e' && Id.value) {
        // Veio da lista clicando em "Editar": carrega dados da compra
        await loadPurchase(Id.value);
    }
    // Se acao === 'c', o form já está vazio e pronto para nova compra
});

