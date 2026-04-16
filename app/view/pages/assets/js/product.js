Inputmask("currency", {
    radixPoint: ',',
    inputtype: "text",
    prefix: 'R$ ',
    autoGroup: true,
    groupSeparator: '.',
    //Alinha o texto para a esquerda
    rightAlign: false
}).mask("#preco_venda, #preco_compra");