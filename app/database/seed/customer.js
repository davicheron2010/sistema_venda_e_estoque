import { fakerPT_BR as faker } from '@faker-js/faker';

export async function seed(knex) {
  await knex('customer').del();
  const total = 1000;
  const batchSize = 100;

  for (let i = 0; i < total; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, total - i);
    const batch = Array.from({ length: currentBatchSize }, () => ({
      nome: faker.person.fullName(),
      cpf: faker.string.numeric(11),
      rg: faker.string.numeric(8),
      ativo: faker.datatype.boolean(),
    }));
    await knex('customer').insert(batch);
  }
}