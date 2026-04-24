const InsertButton = document.getElementById('insert');
const Action = document.getElementById('action');
const Id = document.getElementById('id');
const form = document.getElementById('form');

// Máscara CPF/CNPJ
Inputmask({
    mask: ['999.999.999-99', '99.999.999/9999-99'],
}).mask('[name="cnpj_cpf"]');

// CARREGA DADOS DE EDIÇÃO (se existirem)
(async () => {
    const editData = await api.temp.get('supplier:edit');

    if (editData) {
        Action.value = editData.action || 'e';
        Id.value = editData.id || '';

        for (const [key, value] of Object.entries(editData)) {
            const field = form.querySelector(`[name="${key}"]`);

            if (!field) continue;

            if (field.type === 'checkbox') {
                field.checked = value === true || value === 'true';
            } else {
                field.value = value || '';
            }
        }
    } else {
        Action.value = 'c';
        Id.value = '';
    }
})();

// SALVAR
InsertButton.addEventListener('click', async () => {
    let timer = 3000;

    try {
        InsertButton.disabled = true;

        const data = formToJson(form);
        const id = Action.value !== 'c' ? Id.value : null;

        if (!data.nome_fantasia || data.nome_fantasia.trim() === '') {
            toast('error', 'Erro', 'Nome fantasia é obrigatório', timer);
            return;
        }

        data.nome_fantasia = data.nome_fantasia.trim();
        if (data.razao_social) data.razao_social = data.razao_social.trim();

        const response = Action.value === 'c'
            ? await api.supplier.insert(data)
            : await api.supplier.update(id, data);

        if (!response.status) {
            toast('error', 'Erro', response.msg, timer);
            return;
        }

        toast('success', 'Sucesso', response.msg, timer);
        form.reset();

        setTimeout(() => {
            api.window.close();
        }, timer);

    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message, timer);
    } finally {
        InsertButton.disabled = false;
    }
});