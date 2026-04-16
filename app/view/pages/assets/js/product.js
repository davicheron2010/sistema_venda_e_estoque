const InsertButton = document.getElementById("insert");
const Action = document.getElementById("action");
const Id = document.getElementById("id");
const form = document.getElementById("form");

const inputTotalTax = document.getElementById("total_imposto");
const inputProfitMargin = document.getElementById("margem_lucro");
const inputOperatingCost = document.getElementById("custo_operacional");
const inputPurchasePrice = document.getElementById("preco_compra");

// --- MÁSCARAS ---
Inputmask("currency", {
  radixPoint: ",",
  inputtype: "text",
  prefix: "R$ ",
  autoGroup: true,
  groupSeparator: ".",
  rightAlign: false,
  onBeforeMask: function (value) {
    return String(value).replace(".", ",");
  },
}).mask("#preco_venda, #preco_compra");

Inputmask("currency", {
  radixPoint: ",",
  inputtype: "text",
  prefix: "% ",
  autoGroup: true,
  groupSeparator: ".",
  rightAlign: false,
  onBeforeMask: function (value) {
    return String(value).replace(".", ",");
  },
}).mask("#total_imposto, #margem_lucro, #custo_operacional");

// --- LÓGICA DE CÁLCULO DE PREÇO SUGERIDO ---
function determineSalePrice() {
  const cleanValue = (val, symbol) => 
    parseFloat(String(val).replace(symbol, "").replace(/\./g, "").replace(",", ".")) || 0;

  const purchasePrice = cleanValue(inputPurchasePrice.value, "R$");
  const tax = cleanValue(inputTotalTax.value, "%");
  const profitMargin = cleanValue(inputProfitMargin.value, "%");
  const operatingCost = cleanValue(inputOperatingCost.value, "%");

  if (profitMargin <= 0 && purchasePrice <= 0) {
    document.getElementById("resultado-row").classList.add("d-none");
    return;
  }

  const result = SellingPriceCalculator.create()
    .addTotalTax(tax)
    .addProfitMargin(profitMargin)
    .addOperatingCost(operatingCost)
    .addPurchasePrice(purchasePrice)
    .getData();

  const toBRL = (val) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("val-venda").innerHTML = toBRL(result.valor_venda_sugerido);
  document.getElementById("val-margem").innerHTML = toBRL(result.valor_margem_lucro);
  document.getElementById("val-custo").innerHTML = toBRL(result.valor_custo_operacional);
  document.getElementById("val-imposto").innerHTML = toBRL(result.valor_total_imposto);
  
  document.getElementById("resultado-row").classList.remove("d-none");
}

// Eventos para recalcular preço
[inputTotalTax, inputProfitMargin, inputOperatingCost, inputPurchasePrice].forEach(input => {
  input.addEventListener("input", determineSalePrice);
});

// --- CARREGA DADOS DE EDIÇÃO ---
(async () => {
  const editData = await api.temp.get("product:edit");
  if (editData) {
    Action.value = editData.action || "e";
    Id.value = editData.id || "";
    
    for (const [key, value] of Object.entries(editData)) {
      const field = form.querySelector(`[name="${key}"]`);
      if (!field) continue;

      if (field.type === "checkbox") {
        field.checked = (value === true || value === "true" || value === 1);
      } else {
        field.value = value || "";
      }
    }
    // Chama o cálculo caso existam valores carregados
    determineSalePrice();
  } else {
    Action.value = "c";
    Id.value = "";
  }
})();

// --- BOTÃO SALVAR (INSERT / UPDATE) ---
InsertButton.addEventListener("click", async () => {
  let timer = 3000;
  const btn = $(InsertButton);
  btn.prop("disabled", true);

  const formData = new FormData(form);
  const data = {};

  formData.forEach((value, key) => {
    data[key] = value;
  });

  // Função auxiliar para limpar máscaras antes de enviar ao banco
  const cleanInput = (val) => String(val).replace(/[R$%\s.]/g, "").replace(",", ".");

  data.preco_venda = cleanInput(data.preco_venda);
  data.preco_compra = cleanInput(data.preco_compra);
  data.total_imposto = cleanInput(data.total_imposto);
  data.margem_lucro = cleanInput(data.margem_lucro);
  data.custo_operacional = cleanInput(data.custo_operacional);

  // Tratamento explícito para o checkbox 'ativo'
  const activeCheckbox = form.querySelector('[name="ativo"]');
  if (activeCheckbox) {
      data.ativo = activeCheckbox.checked;
  }

  let id = Action.value !== "c" ? Id.value : null;

  try {
    const response = (Action.value === "c")
        ? await api.product.insert(data)
        : await api.product.update(id, data);

    if (!response.status) {
      toast("error", "Erro", response.msg, timer);
      return;
    }

    toast("success", "Sucesso", response.msg, timer);
    form.reset();
    
    setTimeout(() => {
      api.window.close();
    }, 1500);

  } catch (err) {
    console.error(err);
    toast("error", "Falha", "Erro interno: " + err.message, timer);
  } finally {
    btn.prop("disabled", false);
  }
});