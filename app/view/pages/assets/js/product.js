import { SellingPriceCalculator } from "../components/SellingPriceCalculator.js";

const InsertButton = document.getElementById("insert");
const Action = document.getElementById("action");
const Id = document.getElementById("id");
const form = document.getElementById("form");
const inputTotalTax = document.getElementById("total_imposto");
const inputProfitMargin = document.getElementById("margem_lucro");
const inputOperatingCost = document.getElementById("custo_operacional");
const inputPurchasePrice = document.getElementById("preco_compra");

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

function determineSalePrice() {
  const purchasePrice =
    parseFloat(
      String(inputPurchasePrice.value)
        .replace("R$", "")
        .replace(".", "")
        .replace(",", "."),
    ) || 0;
  const tax =
    parseFloat(
      String(inputTotalTax.value).replace("%", "").replace(",", "."),
    ) || 0;
  const profitMargin =
    parseFloat(
      String(inputProfitMargin.value).replace("%", "").replace(",", "."),
    ) || 0;
  const operatingCost =
    parseFloat(
      String(inputOperatingCost.value).replace("%", "").replace(",", "."),
    ) || 0;
  if (profitMargin <= 0 && purchasePrice <= 0) {
    document.getElementById("resultado-row").className =
      "resultado-row mb-2 d-none";
    return;
  }
  const result = SellingPriceCalculator.create()
    .addTotalTax(tax)
    .addProfitMargin(profitMargin)
    .addOperatingCost(operatingCost)
    .addPurchasePrice(purchasePrice)
    .getData();
  document.getElementById("val-venda").innerHTML =
    `${result.valor_venda_sugerido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
  document.getElementById("val-margem").innerHTML =
    `${result.valor_margem_lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
  document.getElementById("val-custo").innerHTML =
    `${result.valor_custo_operacional.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
  document.getElementById("val-imposto").innerHTML =
    `${result.valor_total_imposto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
  document.getElementById("resultado-row").className = "resultado-row mb-2";
}

inputTotalTax.addEventListener("input", () => {
  determineSalePrice();
});

inputProfitMargin.addEventListener("input", () => {
  determineSalePrice();
});

inputOperatingCost.addEventListener("input", () => {
  determineSalePrice();
});
inputPurchasePrice.addEventListener("input", () => {
  determineSalePrice();
});

//  CARREGA DADOS DE EDIÇÃO (se existirem)
(async () => {
  const editData = await api.temp.get("product:edit");
  if (editData) {
    // Modo edição
    Action.value = editData.action || "e";
    Id.value = editData.id || "";
    // Preenche todos os campos pelo atributo name
    for (const [key, value] of Object.entries(editData)) {
      const field = form.querySelector(`[name="${key}"]`);
      if (!field) continue;

      if (field.type === "checkbox") {
        field.checked = value === true || value === "true";
      } else {
        field.value = value || "";
      }
    }
  } else {
    // Modo cadastro novo
    Action.value = "c";
    Id.value = "";
  }
})();

InsertButton.addEventListener("click", async () => {
  let timer = 3000;
  $("#insert").prop("disabled", true);
  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  data.preco_venda = String(data.preco_venda)
    .replace("R$", "")
    .replace(".", "")
    .replace(",", ".");
  data.preco_compra = String(data.preco_compra)
    .replace("R$", "")
    .replace(".", "")
    .replace(",", ".");
  data.total_imposto = String(data.total_imposto)
    .replace("%", "")
    .replace(",", ".");
  data.margem_lucro = String(data.margem_lucro)
    .replace("%", "")
    .replace(",", ".");
  data.custo_operacional = String(data.custo_operacional)
    .replace("%", "")
    .replace(",", ".");
  // Se NÃO é cadastro novo, pega o ID para update, senão deixa null para insert

  let id = Action.value !== "c" ? Id.value : null;

  try {
    const response =
      Action.value === "c"
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
    }, timer);
  } catch (err) {
    toast("error", "Falha", "Erro: " + err.message, timer);
  } finally {
    $("#insert").prop("disabled", false);
  }
});