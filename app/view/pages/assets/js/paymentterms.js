const codigo = document.getElementById('codigo');
const insertPaymentoTermsButton = document.getElementById('insertPaymentoTermsButton');
const insertInstallmentButton = document.getElementById('insertInstallmentButton');

//Salvar a condição de pagamento
async function InsertPaymentTerms() {
  //Validar os compo do formulario.
  const form = document.getElementById('form');
  const data = formToJson(form);
  try {

    const response = (document.getElementById('acao').value === 'c') ?
      await api.paymentTerms.insert(data)
      :
      await api.paymentTerms.update(document.getElementById('id').value, data);

    if (!response.status) {
      toast('error', 'Erro', response.msg, 3000);
      return;
    }
    document.getElementById('id').value = response.id;
    document.getElementById('acao').value = 'e';
    toast('success', 'Sucesso', 'Parcela adicionada com sucesso!', 3000);
  } catch (erro) {
    toast('error', 'Erro', erro.message, 3000);
  } finally {

  }
}
//Salvar a parcela da condição de pagamento
async function InsertInstallment() {
  if (document.getElementById('acao').value === 'c') {
    await InsertPaymentTerms();
  }
  //Validar os compo do formulario.
  const form = document.getElementById('form');
  const data = formToJson(form);
  try {
    const response = await api.installment.insert(data);

    if (!response.status) {
      toast('error', 'Erro', response.msg, 3000);
      return;
    }

    await ListInstallment();
    toast('success', 'Sucesso', 'Parcela adicionada com sucesso!', 3000);

  } catch (error) {
    toast('error', 'Erro', error.message, 3000);
  } finally {

  }
}
//Preencher a tabela de parcelas da condição de pagamento
async function ListInstallment() {

  const response = await api.installment.findBy();
  
  if (!response.status) {
    toast('error', 'Erro', response.msg, 3000);
    return;
  }
}
// Remover uma parcela pelo id da condição de pagamento
async function DeleteInstallment(id) {

}

codigo.addEventListener('change', () => {
  document.getElementById('titulo_campo').value = codigo.options[codigo.selectedIndex].text;
  document.getElementById('titulo_campo').focus();
});

insertPaymentoTermsButton.addEventListener('click', async () => { await InsertPaymentTerms(); });

insertInstallmentButton.addEventListener('click', async () => {
  await InsertInstallment();
});

//window.removeInstallment = removeInstallment;