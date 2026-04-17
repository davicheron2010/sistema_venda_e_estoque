import { fakerPT_BR as faker } from '@faker-js/faker';

export async function seed(knex) {
  await knex('company').del();
  const total = 1000;
  const batchSize = 100;


  for (let i = 0; i < total; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, total - i);
    const batch = Array.from({ length: currentBatchSize }, () => {
      const nomeEmpresa = faker.company.name();
      return {
        nome: nomeEmpresa,
        cnpj: faker.string.numeric(14),
        email: faker.internet.email({ firstName: nomeEmpresa.split(' ')[0] }).toLowerCase(),
        telefone: faker.phone.number(),
        ativo: true,
        excluido: false
      };
    });
    await knex('company').insert(batch);
  }
}