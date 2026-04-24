
const codigo = document.getElementById('codigo');
const InsertButton = document.getElementById('insertPaymentoTermsButton');

// paymentterms.js
// Gerencia condições de pagamento e parcelas

// Estado local das parcelas
let installments = [];

// ─── Utilitários ──────────────────────────────────────────────────────────────

function getField(id) {
  return document.getElementById(id);
}

function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container") || createToastContainer();
  const id = `toast-${Date.now()}`;
  const bg = type === "success" ? "bg-success" : type === "danger" ? "bg-danger" : "bg-warning";

  toastContainer.insertAdjacentHTML(
    "beforeend",
    `<div id="${id}" class="toast align-items-center text-white ${bg} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body fw-semibold">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`
  );

  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

function createToastContainer() {
  const div = document.createElement("div");
  div.id = "toast-container";
  div.className = "toast-container position-fixed bottom-0 end-0 p-3";
  div.style.zIndex = 9999;
  document.body.appendChild(div);
  return div;
}

function clearInstallmentFields() {
  getField("parcela").value = "";
  getField("intervalo").value = "";
}

// ─── Renderizar tabela de parcelas ────────────────────────────────────────────

function renderInstallments() {
  const tbody = document.getElementById("tbInstallments");

  if (installments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td class="text-center py-4 text-muted" colspan="4">
          Nenhuma parcela configurada para esta condição.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = installments
    .map(
      (item, index) => `
      <tr>
        <td class="ps-3 py-2">${String(index + 1).padStart(2, "0")}</td>
        <td>${item.parcela}x</td>
        <td>${item.intervalo} dias</td>
        <td class="text-center">
          <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2"
            onclick="removeInstallment(${index})" title="Remover parcela">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`
    )
    .join("");
}

// ─── Carregar parcelas existentes (modo edição) ───────────────────────────────

async function loadInstallments(id) {
  if (!id) return;

  try {
    const data = await window.api.paymentTermsAPI.findById(id);
    installments = data?.parcelas || [];
    renderInstallments();
  } catch (err) {
    console.error(err);
    showToast("Erro ao carregar parcelas.", "danger");
  }
}

// ─── Adicionar parcela na tabela ──────────────────────────────────────────────

function addInstallment() {
  const parcela = parseInt(getField("parcela").value);
  const intervalo = parseInt(getField("intervalo").value);

  if (!parcela || parcela < 1) {
    showToast("Informe a quantidade de parcelas.", "warning");
    getField("parcela").focus();
    return;
  }
  if (isNaN(intervalo) || intervalo < 0) {
    showToast("Informe o intervalo em dias.", "warning");
    getField("intervalo").focus();
    return;
  }

  installments.push({ parcela, intervalo });

  renderInstallments();
  clearInstallmentFields();
  getField("parcela").focus();
}

// ─── Remover parcela da tabela ────────────────────────────────────────────────

function removeInstallment(index) {
  installments.splice(index, 1);
  renderInstallments();
}

// ─── Salvar condição de pagamento ─────────────────────────────────────────────

async function savePaymentTerms() {
  const acao = getField("acao").value;
  const id = getField("id").value;
  const codigo = getField("codigo").value;
  const titulo = getField("titulo_campo").value.trim();

  if (!codigo) {
    showToast("Selecione o tipo de pagamento.", "warning");
    getField("codigo").focus();
    return;
  }
  if (!titulo) {
    showToast("Informe o título da condição.", "warning");
    getField("titulo_campo").focus();
    return;
  }
  if (installments.length === 0) {
    showToast("Adicione ao menos uma parcela.", "warning");
    return;
  }

  const payload = { codigo, titulo, parcelas: installments };

  const btn = document.getElementById("insertPaymentoTermsButton");

  try {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Salvando...`;

    const isEdit = acao === "editar" && id;
    const result = isEdit
      ? await window.api.paymentTermsAPI.update(id, payload)
      : await window.api.paymentTermsAPI.insert(payload);

    if (!result?.status) {
      throw new Error(result?.msg || "Erro ao salvar.");
    }

    showToast(
      isEdit ? "Condição atualizada com sucesso!" : "Condição cadastrada com sucesso!",
      "success"
    );

    setTimeout(() => {
      window.api.window.open('pages/listapagamento');
    }, 1800);

  } catch (err) {
    console.error(err);
    showToast(err.message || "Erro inesperado ao salvar.", "danger");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check-circle me-2"></i> Salvar Condição`;
  }
}

// ─── Inicialização ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("insertInstallmentButton").addEventListener("click", addInstallment);
  document.getElementById("insertPaymentoTermsButton").addEventListener("click", savePaymentTerms);

  // Enter nos campos de parcela para adicionar
  ["parcela", "intervalo"].forEach((id) => {
    getField(id)?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addInstallment();
      }
    });
  });

  // Modo edição: carrega parcelas já salvas
  const idParcelamento = getField("id_parcelamento")?.value;
  if (idParcelamento) {
    loadInstallments(idParcelamento);
  }
});


codigo.addEventListener('change', () => {
  document.getElementById('titulo_campo').value = codigo.options[codigo.selectedIndex].text;
  document.getElementById('titulo_campo').focus();
});

InsertButton.addEventListener('click', async () => {
  //Validar os compo do formulario.
  const form = document.getElementById('form');
  const data = formToJson(form);
  api.paymentTerms.insert(data);
});

window.removeInstallment = removeInstallment;