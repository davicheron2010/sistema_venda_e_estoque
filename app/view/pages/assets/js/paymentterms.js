// paymentterms.js
// Gerencia condições de pagamento e parcelas

const API_BASE = "/pagamento";

// Estado local das parcelas
let installments = [];

// ─── Utilitários ──────────────────────────────────────────────────────────────

function getField(id) {
  return document.getElementById(id);
}

function showToast(message, type = "success") {
  // Cria toast Bootstrap dinamicamente
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
  getField("vencimento_incial_parcela").value = "";
}

// ─── Renderizar tabela de parcelas ────────────────────────────────────────────

function renderInstallments() {
  const tbody = document.getElementById("tbInstallments");

  if (installments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td class="text-center py-4 text-muted" colspan="5">
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
        <td>${item.vencimento_incial_parcela} dias</td>
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

async function loadInstallments(idParcelamento) {
  if (!idParcelamento) return;

  try {
    const res = await fetch(`${API_BASE}/parcelas/${idParcelamento}`);
    if (!res.ok) throw new Error("Erro ao buscar parcelas");
    const data = await res.json();
    installments = data || [];
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
  const vencimento = parseInt(getField("vencimento_incial_parcela").value);

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
  if (isNaN(vencimento) || vencimento < 0) {
    showToast("Informe o 1º vencimento em dias.", "warning");
    getField("vencimento_incial_parcela").focus();
    return;
  }

  installments.push({
    parcela,
    intervalo,
    vencimento_incial_parcela: vencimento,
  });

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
  const acao = getField("acao").value;       // 'inserir' | 'editar'
  const id = getField("id").value;
  const codigo = getField("codigo").value;
  const titulo = getField("titulo_campo").value.trim();
  const atalho = getField("atalho").value.trim();

  // Validações
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

  const payload = {
    codigo,
    titulo,
    atalho,
    parcelas: installments,
  };

  const isEdit = acao === "editar" && id;
  const url = isEdit ? `${API_BASE}/editar/${id}` : `${API_BASE}/inserir`;
  const method = isEdit ? "PUT" : "POST";

  try {
    const btn = document.getElementById("insertPaymentoTermsButton");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Salvando...`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Erro ao salvar.");
    }

    showToast(
      isEdit ? "Condição atualizada com sucesso!" : "Condição cadastrada com sucesso!",
      "success"
    );

    // Redireciona após salvar
    setTimeout(() => {
      window.location.href = "/pagamento/lista";
    }, 1800);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Erro inesperado ao salvar.", "danger");
  } finally {
    const btn = document.getElementById("insertPaymentoTermsButton");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-check-circle me-2"></i> Salvar Condição`;
    }
  }
}

// ─── Inicialização ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Botão adicionar parcela
  document.getElementById("insertInstallmentButton").addEventListener("click", addInstallment);

  // Botão salvar condição
  document.getElementById("insertPaymentoTermsButton").addEventListener("click", savePaymentTerms);

  // Permitir Enter nos campos de parcela para adicionar
  ["parcela", "intervalo", "vencimento_incial_parcela"].forEach((id) => {
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

// Expor para uso inline (botão remover via onclick no HTML gerado dinamicamente)
window.removeInstallment = removeInstallment;