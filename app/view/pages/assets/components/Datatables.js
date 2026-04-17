/**
 * Classe estática Datatables
 * 
 * Uso:
 *   Datatables.SetTable('#table-customers', columns, options).getData(filter => api.customer.find(filter));
 * 
 * Parâmetros de SetTable:
 *   - selector  {string}  Seletor da tabela (ex: '#table-customers')
 *   - columns   {Array}   Definição das colunas do DataTable
 *   - options   {Object}  (Opcional) Sobrescrever configurações padrão
 * 
 */
export class Datatables {
    //Configura a tabela e retorna um objeto com o método getData para encadear.
    static SetTable(selector, columns, options = {}) {
        return {
            //Conecta a fonte de dados e inicializa o DataTable.
            getData(apiFn) {
                // Destrói instância anterior se existir, para evitar re-inicialização
                if ($.fn.DataTable.isDataTable(selector)) {
                    $(selector).DataTable().destroy();
                }
                // Configuração padrão completa
                const defaultConfig = {
                    paging: true,
                    lengthChange: true,
                    ordering: true,
                    info: true,
                    autoWidth: false,
                    responsive: true,
                    stateSave: true,
                    select: true,
                    searching: true,
                    processing: true,
                    serverSide: true,
                    language: {
                        url: 'https://cdn.datatables.net/plug-ins/2.3.6/i18n/pt-BR.json',
                        searchPlaceholder: 'Digite sua pesquisa...'
                    },
                    ajax: async (data, callback) => {
                        const filter = {
                            draw: data.draw,
                            term: data?.search?.value,
                            limit: data?.length,
                            offset: data?.start,
                            orderType: data.order[0]?.dir,
                            column: data.order[0]?.column
                        };
                        try {
                            const response = await apiFn(filter);
                            callback(response);
                        } catch (error) {
                            callback({
                                draw: data?.draw,
                                recordsTotal: 0,
                                recordsFiltered: 0,
                                data: []
                            });
                        }
                    },
                    columns: columns,
                    layout: {
                        topStart: 'search',
                        topEnd: 'pageLength',
                        bottomStart: 'info',
                        bottomEnd: 'paging'
                    },
                    initComplete: function () {
                        setTimeout(() => {
                            // Remove o label "Pesquisar"
                            const label = document.querySelector(`${selector}_wrapper .dt-search label`);
                            if (label) {
                                label.remove();
                            }

                            // Ajusta a div do campo de pesquisa
                            const searchDiv = document.querySelector(`${selector}_wrapper .row > div.dt-layout-start`);
                            if (searchDiv) {
                                searchDiv.classList.remove('col-md-auto');
                                searchDiv.classList.add('col-lg-6', 'col-md-6', 'col-sm-12');
                            }

                            const divSearch = document.querySelector(`${selector}_wrapper .dt-search`);
                            if (divSearch) {
                                divSearch.classList.add('w-100');
                            }

                            const input = document.querySelector(`${selector}_wrapper .dt-search input`);
                            if (input) {
                                input.classList.remove('form-control-sm');
                                input.classList.add('form-control-md', 'w-100');
                                input.style.marginLeft = '0';
                                input.focus();
                            }

                            const pageLength = document.querySelector(`${selector}_wrapper .dt-length select`);
                            if (pageLength) {
                                pageLength.classList.add('form-select-md');
                            }
                        }, 100);
                    }
                };
                // Mescla configurações padrão com as opções extras (options sobrescreve o padrão)
                const finalConfig = { ...defaultConfig, ...options };
                // Se options tiver 'columns', usa as options; senão mantém as passadas em SetTable
                if (!options.columns) {
                    finalConfig.columns = columns;
                }
                return $(selector).DataTable(finalConfig);
            }
        };
    }
}