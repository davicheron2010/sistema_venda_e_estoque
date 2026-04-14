window.gerarPDF = function () {
  const tabela = document.querySelector("#table-products").outerHTML;

  const hoje = new Date().toLocaleDateString();

  // 🔹 TEMPLATE DO PDF
  const template = `
        <div id="pdf-content" style="font-family: Arial, sans-serif; padding: 20px;">
            
            <!-- Cabeçalho -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2 style="margin: 0;">Minha Empresa</h2>
                    <small>Sistema de Gestão</small>
                </div>
                <div style="text-align: right;">
                    <strong>Data:</strong> ${hoje}
                </div>
            </div>

            <hr/>

            <!-- Título -->
            <h3 style="text-align: center; margin: 20px 0;">
                Lista de Produtos
            </h3>

            <!-- Tabela -->
            <div>
                ${tabela}
            </div>

            <!-- Rodapé -->
            <div style="margin-top: 30px; font-size: 12px; text-align: center; color: #666;">
                Documento gerado automaticamente pelo sistema
            </div>
        </div>
        <style>
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }

    th, td {
        border: 1px solid #ccc;
        padding: 6px;
    }

    th {
        background: #f0f0f0;
    }
</style>
    `;

  // 🔹 cria elemento temporário (não polui a tela)
  const container = document.createElement("div");
  container.innerHTML = template;

  const opt = {
    margin: 10,
    filename: "lista-produtos.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "landscape",
    },
  };

  html2pdf().set(opt).from(container).save();
};
