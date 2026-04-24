(() => {
    const inputPreco = document.getElementById('preco_compra');
    const inputQuantidade = document.getElementById('quantidade');
    const inputTotal = document.getElementById('valor-total');
    const fornecedorSelect = $('#fornecedor_id');
    const produtoSelect2 = $('#produto');
    const insertListItemButton = document.getElementById('insert-item');
    const itemPurchaseId = document.getElementById('id');

    function parseMoney(value) {
        if (value === null || value === undefined || value === '') return 0;
        return Number(String(value)
            .replace(/R\$\s?/g, '')
            .replace(/\./g, '')
            .replace(',', '.')) || 0;
    }

    function formatMoney(value) {
        return Number(value || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function formatNumberBR(value) {
        return Number(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function calcItemTotal() {
        const p = inputPreco?.inputmask ? inputPreco.inputmask.unmaskedvalue() : inputPreco?.value;
        const q = inputQuantidade?.inputmask ? inputQuantidade.inputmask.unmaskedvalue() : inputQuantidade?.value;
        const total = parseMoney(p) * parseMoney(q);

        if (inputTotal) {
            inputTotal.value = formatNumberBR(total);
        }

        return total;
    }

    async function recalcPurchaseTotal() {
        try {
            const id = Number(itemPurchaseId?.value || 0);
            if (!id) return;

            const response = await window.api.purchase.listItemPurchase({ id });
            if (!response?.status) return;

            const items = response.data || [];
            const subtotal = items.reduce((acc, item) => acc + Number(item.total_calculado || item.total_liquido || 0), 0);

            const totalLiquidoEl = document.getElementById('total_liquido');
            if (totalLiquidoEl) {
                totalLiquidoEl.innerText = formatNumberBR(subtotal);
            }

            if (window.calcPurchaseTotal) {
                window.calcPurchaseTotal();
            }
        } catch (error) {
            console.error('Erro em recalcPurchaseTotal:', error);
        }
    }

    async function listItemPurchase() {
        try {
            const id = Number(itemPurchaseId?.value || 0);
            if (!id) return;

            const response = await window.api.purchase.listItemPurchase({ id });

            if (!response?.status) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        text: response?.msg || 'Não foi possível listar os itens.',
                        timer: 2000
                    });
                } else {
                    alert(response?.msg || 'Não foi possível listar os itens.');
                }
                return;
            }

            const items = response.data || [];
            const tbody = document.getElementById('products-table-tbody');
            if (!tbody) return;

            tbody.innerHTML = items.length
                ? items.map(item => `
                    <tr id="tritem${item.id}">
                        <td>${item.produto_nome || item.nome || '-'}</td>
                        <td>${item.fornecedor_nome || '-'}</td>
                        <td>${item.grupo_nome || '-'}</td>
                        <td class="text-end">${Number(item.quantidade || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 4
                        })}</td>
                        <td class="text-end">${formatMoney(item.unitario_bruto || item.unitario_liquido || 0)}</td>
                        <td class="text-end">${formatMoney(item.total_calculado || item.total_liquido || 0)}</td>
                        <td class="text-center">
                            <button type="button" class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})">Excluir</button>
                        </td>
                    </tr>
                `).join('')
                : `<tr id="empty-row"><td colspan="7" class="text-center text-muted py-4">Nenhum item adicionado.</td></tr>`;

            await recalcPurchaseTotal();
        } catch (error) {
            console.error('Erro em listItemPurchase:', error);
        }
    }

    async function deleteItem(id) {
        try {
            if (!id) return;

            const confirmed = window.Swal
                ? await Swal.fire({
                    icon: 'warning',
                    title: 'Excluir item?',
                    text: 'Essa ação não pode ser desfeita.',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, excluir',
                    cancelButtonText: 'Cancelar'
                })
                : { isConfirmed: confirm('Excluir este item?') };

            if (!confirmed?.isConfirmed) return;

            const response = await window.api.purchase.deleteItem({ id });

            if (!response?.status) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        text: response?.msg || 'Erro ao excluir item.'
                    });
                } else {
                    alert(response?.msg || 'Erro ao excluir item.');
                }
                return;
            }

            const row = document.getElementById(`tritem${id}`);
            if (row) row.remove();

            const tbody = document.getElementById('products-table-tbody');
            if (tbody && !tbody.querySelector('tr')) {
                tbody.innerHTML = `<tr id="empty-row"><td colspan="7" class="text-center text-muted py-4">Nenhum item adicionado.</td></tr>`;
            }

            await recalcPurchaseTotal();

            if (window.Swal) {
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso',
                    text: 'Item excluído com sucesso!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            if (window.Swal) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: error.message
                });
            } else {
                alert(error.message);
            }
        }
    }

    async function InsertItemPurchase() {
        const btn = $(insertListItemButton);
        if (btn?.length) btn.prop('disabled', true);

        try {
            let purchaseIdValue = Number(itemPurchaseId?.value || 0);

            if (!purchaseIdValue) {
                const saved = await window.Insertpurchase();
                purchaseIdValue = Number(itemPurchaseId?.value || 0);

                if (!saved?.status || !purchaseIdValue) {
                    if (window.Swal) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Atenção',
                            text: 'Salve a compra antes de inserir itens.'
                        });
                    } else {
                        alert('Salve a compra antes de inserir itens.');
                    }
                    return;
                }
            }

            const produtoId = Number($('#produto').val() || 0);
            if (!produtoId) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Atenção',
                        text: 'Selecione um produto antes de inserir.'
                    });
                } else {
                    alert('Selecione um produto antes de inserir.');
                }
                return;
            }

            const quantidade = parseMoney(inputQuantidade?.value || 0);
            const preco = parseMoney(inputPreco?.value || 0);

            if (!quantidade || quantidade <= 0) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Atenção',
                        text: 'Quantidade inválida.'
                    });
                } else {
                    alert('Quantidade inválida.');
                }
                return;
            }

            if (!preco || preco <= 0) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Atenção',
                        text: 'Preço inválido.'
                    });
                } else {
                    alert('Preço inválido.');
                }
                return;
            }

            const responseItem = await window.api.purchase.insertItem({
                id_compra: purchaseIdValue,
                id_produto: produtoId,
                quantidade,
                preco_compra: preco
            });

            if (!responseItem?.status) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro',
                        text: responseItem?.msg || 'Erro ao inserir item'
                    });
                } else {
                    alert(responseItem?.msg || 'Erro ao inserir item');
                }
                return;
            }

            $('#produto').val(null).trigger('change');
            if (inputQuantidade) inputQuantidade.value = '1';
            if (inputPreco) inputPreco.value = '';
            if (inputTotal) inputTotal.value = '';
            if (inputQuantidade) inputQuantidade.dispatchEvent(new Event('input'));

            await listItemPurchase();

            if (window.Swal) {
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso',
                    text: 'Item inserido com sucesso!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error('Erro ao inserir item:', err);
            if (window.Swal) {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: err.message
                });
            } else {
                alert(err.message);
            }
        } finally {
            if (btn?.length) btn.prop('disabled', false);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (inputPreco && inputQuantidade) {
            inputPreco.addEventListener('input', calcItemTotal);
            inputQuantidade.addEventListener('input', calcItemTotal);
            calcItemTotal();
        }

        if (inputPreco) {
            Inputmask('currency', {
                radixPoint: ',',
                groupSeparator: '.',
                allowMinus: false,
                prefix: 'R$ ',
                autoGroup: true,
                rightAlign: false
            }).mask(inputPreco);
        }

        if (inputQuantidade) {
            Inputmask({
                alias: 'numeric',
                digits: 4,
                digitsOptional: true,
                radixPoint: ',',
                groupSeparator: '',
                autoGroup: false,
                allowMinus: false,
                rightAlign: false,
                placeholder: '0'
            }).mask(inputQuantidade);
        }

        if (fornecedorSelect.length) {
            fornecedorSelect.select2({
                theme: 'bootstrap-5',
                placeholder: 'Selecione um fornecedor',
                language: 'pt-BR',
                ajax: {
                    transport: async function (params, success, failure) {
                        try {
                            const result = await window.api.supplier.supplierSearch({ q: params.data.q || '' });

                            success({
                                results: (result?.data || []).map(item => {
                                    const nome = item.nome_fantasia || item.razao_social || '-';
                                    const cnpj = item.cnpj_cpf || '';

                                    return {
                                        id: String(item.id),
                                        text: nome,
                                        nome_fantasia: nome,
                                        razao_social: item.razao_social || '',
                                        cnpj_cpf: cnpj
                                    };
                                })
                            });
                        } catch (error) {
                            console.error(error);
                            failure();
                        }
                    },
                    delay: 250
                },
                templateResult: function (item) {
                    if (item.loading) return item.text || '';
                    const nome = item.nome_fantasia || item.text || '';
                    const cnpj = item.cnpj_cpf || '';
                    return cnpj ? `${nome} - ${cnpj}` : nome;
                },
                templateSelection: function (item) {
                    if (!item) return '';
                    const nome = item.nome_fantasia || item.text || '';
                    const cnpj = item.cnpj_cpf || '';
                    return cnpj ? `${nome} - ${cnpj}` : nome;
                },
                escapeMarkup: function (markup) {
                    return markup;
                }
            });

            fornecedorSelect.on('select2:select', function (e) {
                const data = e.params.data;
                const option = this.querySelector(`option[value="${data.id}"]`);
                if (option) {
                    option.dataset.cnpjCpf = data.cnpj_cpf || '';
                    option.dataset.razaoSocial = data.razao_social || '';
                    option.dataset.nomeFantasia = data.nome_fantasia || '';
                }
            });
        }

        if (produtoSelect2.length) {
            produtoSelect2.select2({
                theme: 'bootstrap-5',
                placeholder: 'Selecione um produto',
                language: 'pt-BR',
                ajax: {
                    transport: async function (params, success, failure) {
                        try {
                            const result = await window.api.product.find({ q: params.data.q || '' });
                            success({
                                results: (result?.data || []).map(item => ({
                                    id: String(item.id),
                                    text: `Cód: ${item.id} - ${item.nome} | Barra: ${item.codigo_barra || ''}`
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

            produtoSelect2.on('select2:select', async function (e) {
                try {
                    const productId = e.params.data.id;
                    const response = await window.api.product.findById(productId);

                    if (response?.preco_compra && inputPreco) {
                        inputPreco.value = Number(response.preco_compra).toFixed(2).replace('.', ',');
                        inputPreco.dispatchEvent(new Event('input'));
                    }

                    $(this).val(productId).trigger('change');
                } catch (err) {
                    console.error('Erro ao buscar detalhes do produto:', err);
                }
            });
        }

        $(document).on('select2:open', () => {
            const searchField = document.querySelector('.select2-search__field');
            if (searchField) searchField.focus();
        });

        if (insertListItemButton) {
            insertListItemButton.addEventListener('click', InsertItemPurchase);
        }

        if (itemPurchaseId?.value) {
            listItemPurchase();
        }
    });

    window.listItemPurchase = listItemPurchase;
    window.InsertItemPurchase = InsertItemPurchase;
    window.deleteItem = deleteItem;
})();