import { fakerPT_BR as faker } from '@faker-js/faker';

const unidades = ['UN', 'KG', 'L', 'CX', 'PC', 'MT', 'M2', 'PAR', 'DZ', 'G'];

function gerarCodigoBarra() {
  return faker.string.numeric(13);
}

function gerarProduto() {
  const precoCompra = parseFloat(faker.commerce.price({ min: 1, max: 500, dec: 4 }));
  const totalImposto = parseFloat((precoCompra * faker.number.float({ min: 0.05, max: 0.30, fractionDigits: 4 })).toFixed(4));
  const margemLucro = parseFloat(faker.number.float({ min: 10, max: 80, fractionDigits: 4 }));
  const custoOperacional = parseFloat((precoCompra * faker.number.float({ min: 0.02, max: 0.15, fractionDigits: 4 })).toFixed(4));
  const valorVendaSugerido = parseFloat((precoCompra + totalImposto + custoOperacional + (precoCompra * margemLucro / 100)).toFixed(4));
  const precoVenda = parseFloat((valorVendaSugerido * faker.number.float({ min: 0.95, max: 1.05, fractionDigits: 4 })).toFixed(4));

  return {
    nome: faker.commerce.productName(),
    codigo_barra: faker.datatype.boolean(0.8) ? gerarCodigoBarra() : null,
    unidade: faker.helpers.arrayElement(unidades),
    preco_compra: precoCompra,
    total_imposto: totalImposto,
    margem_lucro: margemLucro,
    custo_operacional: custoOperacional,
    valor_venda_sugerido: valorVendaSugerido,
    preco_venda: precoVenda,
    descricao: faker.datatype.boolean(0.7) ? faker.commerce.productDescription() : null,
    ativo: faker.datatype.boolean(0.9),
    excluido: faker.datatype.boolean(0.05),
  };
}

export async function seed(knex) {
  await knex('product').del();

  const produtos = Array.from({ length: 50 }, gerarProduto);

  await knex('product').insert(produtos);
}