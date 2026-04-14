const InsertButton = document.getElementById('insert');
const Action = document.getElementById('action');
const Id = document.getElementById('id');
const form = document.getElementById('form');

// Máscaras para Empresa
Inputmask('99.999.999/9999-99').mask('#cnpj');
Inputmask('(99) 99999-9999').mask('#telefone');

(async () => {
    const editData = await api.temp.get('company:edit');
    if (editData) {
        Action.value = editData.action || 'e';
        Id.value = editData.id || '';
        
        // Preencher formulário com dados existentes
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

InsertButton.addEventListener('click', async () => {
    let timer = 2000;
    $('#insert').prop('disabled', true);
    
    const data = formToJson(form);
    let id = Action.value !== 'c' ? Id.value : null;
    
    try {
        const response = Action.value === 'c'
            ? await api.company.insert(data)
            : await api.company.update(id, data);

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
        $('#insert').prop('disabled', false);
    }
});