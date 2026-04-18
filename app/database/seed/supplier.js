import { fakerPT_BR as faker } from '@faker-js/faker';

export async function seed(knex) {
  await knex('supplier').del();
  const total = 1000;
  const batchSize = 100;

  for (let i = 0; i < total; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, total - i);
    const batch = Array.from({ length: currentBatchSize }, () => {
      const isPessoaJuridica = faker.datatype.boolean({ probability: 0.8 });

      return {
        nome_fantasia: faker.company.name(),
        razao_social: `${faker.company.name()} ${faker.helpers.arrayElement(['Ltda', 'S.A.', 'ME', 'Eireli', 'S/A', 'LTDA ME'])}`,
        cnpj_cpf: isPessoaJuridica
          ? faker.string.numeric(14)
          : faker.string.numeric(11),
        ie_rg: faker.string.numeric(12),
        ativo: faker.datatype.boolean(),
        excluido: false,
      };
    });
    await knex('supplier').insert(batch);
  }
}