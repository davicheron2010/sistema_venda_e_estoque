$('#fornecedor_id').select2({
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