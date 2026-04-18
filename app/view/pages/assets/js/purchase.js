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

insertItemPurchase.addEventListener('click', async () => {
    let timer = 3000;
    if (Action.value === 'c') {
        //Cria uma nova compra;
        const response = await InsertPurchase('form'); // {status: true, msg: "Cadastro realizado com sucesso!", id: 2}
        if (!response.status) {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: response.msg,
            });
            return;
        }
        Action.value = 'e';
        Id.value = response.id;
        toast('success', 'Sucesso', response.msg, timer);
    }
    //inserir o item na compra

    //atualizar a compra somando o total liquido do item e total bruto 

});

