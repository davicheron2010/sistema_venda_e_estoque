// Calcula o preço de venda com base no preço de compra, impostos, custos operacionais
// e margem de lucro
export class SellingPriceCalculator {
  #purchasePrice = 0; // Preço de compra do produto (valor absoluto)
  #totalTax = 0; // Percentual total de impostos (ex: 15 para 15%)
  #profitMargin = 0; // Percentual de margem de lucro desejada (ex: 20 para 20%)
  #operatingCost = 0; // Percentual de custo operacional (ex: 10 para 10%)
  // Instancia a classe via método estático (padrão Factory)
  static create() {
    return new SellingPriceCalculator();
  }
  // Define o preço de compra e retorna a instância para encadeamento
  addPurchasePrice(purchasePrice) {
    this.#purchasePrice = purchasePrice;
    return this;
  }
  // Define o percentual de impostos e retorna a instância para encadeamento
  addTotalTax(totalTax) {
    this.#totalTax = totalTax;
    return this;
  }
  // Define o percentual de margem de lucro e retorna a instância para encadeamento
  addProfitMargin(profitMargin) {
    this.#profitMargin = profitMargin;
    return this;
  }
  // Define o percentual de custo operacional e retorna a instância para encadeamento
  addOperatingCost(operatingCost) {
    this.#operatingCost = operatingCost;
    return this;
  }
  // Calcula e retorna o preço de venda, impostos, custo operacional e margem de lucro
  getData() {
    // Testar valores null e undefined, convertendo para 0

    // Converte imposto para decimal
    const taxRate = this.#totalTax / 100;
    // Converte margem para decimal
    const marginRate = this.#profitMargin / 100;
    // Converte custo operacional para decimal
    const operatingCostRate = this.#operatingCost / 100;
    // Fator divisor: o que sobra do preço de venda após descontar todos os percentuais
    const divisor = 1 - (taxRate + marginRate + operatingCostRate);
    console.log({ taxRate, marginRate, operatingCostRate, divisor });
    // Soma dos percentuais <= 0%
    if (taxRate + marginRate + operatingCostRate <= 0) {
      throw new Error(
        "A soma de impostos, margem de lucro e custo operacional não pode ser 0",
      );
    }

    //Se o percentutal do calculo for maior ou igual a 100% retornar um erro.

    // Preço de venda que cobre o preço de compra e todos os percentuais embutidos
    const sellingPrice = this.#purchasePrice / divisor;

    return {
      valor_venda_sugerido: sellingPrice, // Preço final sugerido de venda
      valor_total_imposto: sellingPrice * taxRate, // Valor absoluto dos impostos embutidos
      valor_custo_operacional: sellingPrice * operatingCostRate, // Valor absoluto do custo operacional embutido
      valor_margem_lucro: sellingPrice * marginRate, // Valor absoluto da margem de lucro embutida
    };
  }
}
