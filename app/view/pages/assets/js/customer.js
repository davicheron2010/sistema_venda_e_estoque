
const InsertButton = document.getElementById('insert');
const Action = document.getElementById('action')
const Id = document.getElementById('id')
const form = document.getElementById('form');
Inputmask('999.999.999-99').mask('#cpf');

//  CARREGA DADOS DE EDIÇÃO (se existirem)
(async () => {
    const editData = await api.temp.get('customer:edit');
    if (editData) {
        // Modo edição
        Action.value = editData.action || 'e';
        Id.value = editData.id || '';
        // Preenche todos os campos pelo atributo name
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
        // Modo cadastro novo
        Action.value = 'c';
        Id.value = '';
    }
})();

InsertButton.addEventListener('click', async () => {
    let timer = 3000;
    $('#insert').prop('disabled', true);
    const data = formToJson(form);
    // Se NÃO é cadastro novo, pega o ID para update
    let id = Action.value !== 'c' ? Id.value : null;
    try {

        const response = Action.value === 'c'
            ? await api.customer.insert(data)
            : await api.customer.update(id, data);

        if (!response.status) {
            toast('error', 'Erro', response.msg, timer);
            return;
        }
        toast('success', 'Sucesso', response.msg, timer);
        form.reset();
        // Fecha a janela modal após 1.5s (tempo do toast)
        setTimeout(() => {
            api.window.close();
        }, timer);

    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message, timer);
    } finally {
        $('#insert').prop('disabled', false);
    }
});