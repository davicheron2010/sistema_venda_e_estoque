exports.seed = async function (knex) {

    // Limpa as tabelas antes (respeita a FK)
    await knex('installment').del();
    await knex('payment_terms').del();

    // Helper para inserir condição + parcelas
    async function inserirCondicao(codigo, titulo, atalho, parcelas) {
        const [id_pagamento] = await knex('payment_terms').insert({
            codigo,
            titulo,
            atalho,
            data_cadastro:    new Date(),
            data_atualizacao: new Date(),
        }).returning('id');

        const paymentId = typeof id_pagamento === 'object' ? id_pagamento.id : id_pagamento;

        const itens = parcelas.map(({ parcela, intervalor }) => ({
            id_pagamento:             paymentId,
            parcela,
            intervalor,
            alterar_vencimento_conta: 0,
            data_cadastro:            new Date(),
            data_atualizacao:         new Date(),
        }));

        await knex('installment').insert(itens);
    }

    // ─── À vista ─────────────────────────────────────────────────────────────
    await inserirCondicao('AVISTA', 'À vista', 'AV', [
        { parcela: 1, intervalor: 0 }
    ]);

    // ─── 2x ──────────────────────────────────────────────────────────────────
    await inserirCondicao('2X', 'Parcelado 2x', '2X', [
        { parcela: 1, intervalor: 30 },
        { parcela: 2, intervalor: 60 },
    ]);

    // ─── 3x ──────────────────────────────────────────────────────────────────
    await inserirCondicao('3X', 'Parcelado 3x', '3X', [
        { parcela: 1, intervalor: 30 },
        { parcela: 2, intervalor: 60 },
        { parcela: 3, intervalor: 90 },
    ]);

    // ─── 4x ──────────────────────────────────────────────────────────────────
    await inserirCondicao('4X', 'Parcelado 4x', '4X', [
        { parcela: 1, intervalor: 30 },
        { parcela: 2, intervalor: 60 },
        { parcela: 3, intervalor: 90 },
        { parcela: 4, intervalor: 120 },
    ]);

    // ─── 5x ──────────────────────────────────────────────────────────────────
    await inserirCondicao('5X', 'Parcelado 5x', '5X', [
        { parcela: 1, intervalor: 30 },
        { parcela: 2, intervalor: 60 },
        { parcela: 3, intervalor: 90 },
        { parcela: 4, intervalor: 120 },
        { parcela: 5, intervalor: 150 },
    ]);

    // ─── 6x ──────────────────────────────────────────────────────────────────
    await inserirCondicao('6X', 'Parcelado 6x', '6X', [
        { parcela: 1, intervalor: 30 },
        { parcela: 2, intervalor: 60 },
        { parcela: 3, intervalor: 90 },
        { parcela: 4, intervalor: 120 },
        { parcela: 5, intervalor: 150 },
        { parcela: 6, intervalor: 180 },
    ]);

    // ─── 7x ──────────────────────────────────────────────────────────────────
    await inserirCondicao('7X', 'Parcelado 7x', '7X', [
        { parcela: 1, intervalor: 30 },
        { parcela: 2, intervalor: 60 },
        { parcela: 3, intervalor: 90 },
        { parcela: 4, intervalor: 120 },
        { parcela: 5, intervalor: 150 },
        { parcela: 6, intervalor: 180 },
        { parcela: 7, intervalor: 210 },
    ]);

    // ─── 8x ──────────────────────────────────────────────────────────────────
    await inserirCondicao('8X', 'Parcelado 8x', '8X', [
        { parcela: 1, intervalor: 30 },
        { parcela: 2, intervalor: 60 },
        { parcela: 3, intervalor: 90 },
        { parcela: 4, intervalor: 120 },
        { parcela: 5, intervalor: 150 },
        { parcela: 6, intervalor: 180 },
        { parcela: 7, intervalor: 210 },
        { parcela: 8, intervalor: 240 },
    ]);

    // ─── 9x ──────────────────────────────────────────────────────────────────
    await inserirCondicao('9X', 'Parcelado 9x', '9X', [
        { parcela: 1, intervalor: 30 },
        { parcela: 2, intervalor: 60 },
        { parcela: 3, intervalor: 90 },
        { parcela: 4, intervalor: 120 },
        { parcela: 5, intervalor: 150 },
        { parcela: 6, intervalor: 180 },
        { parcela: 7, intervalor: 210 },
        { parcela: 8, intervalor: 240 },
        { parcela: 9, intervalor: 270 },
    ]);

    // ─── 10x ─────────────────────────────────────────────────────────────────
    await inserirCondicao('10X', 'Parcelado 10x', '10X', [
        { parcela: 1,  intervalor: 30  },
        { parcela: 2,  intervalor: 60  },
        { parcela: 3,  intervalor: 90  },
        { parcela: 4,  intervalor: 120 },
        { parcela: 5,  intervalor: 150 },
        { parcela: 6,  intervalor: 180 },
        { parcela: 7,  intervalor: 210 },
        { parcela: 8,  intervalor: 240 },
        { parcela: 9,  intervalor: 270 },
        { parcela: 10, intervalor: 300 },
    ]);

    // ─── 11x ─────────────────────────────────────────────────────────────────
    await inserirCondicao('11X', 'Parcelado 11x', '11X', [
        { parcela: 1,  intervalor: 30  },
        { parcela: 2,  intervalor: 60  },
        { parcela: 3,  intervalor: 90  },
        { parcela: 4,  intervalor: 120 },
        { parcela: 5,  intervalor: 150 },
        { parcela: 6,  intervalor: 180 },
        { parcela: 7,  intervalor: 210 },
        { parcela: 8,  intervalor: 240 },
        { parcela: 9,  intervalor: 270 },
        { parcela: 10, intervalor: 300 },
        { parcela: 11, intervalor: 330 },
    ]);

    // ─── 12x ─────────────────────────────────────────────────────────────────
    await inserirCondicao('12X', 'Parcelado 12x', '12X', [
        { parcela: 1,  intervalor: 30  },
        { parcela: 2,  intervalor: 60  },
        { parcela: 3,  intervalor: 90  },
        { parcela: 4,  intervalor: 120 },
        { parcela: 5,  intervalor: 150 },
        { parcela: 6,  intervalor: 180 },
        { parcela: 7,  intervalor: 210 },
        { parcela: 8,  intervalor: 240 },
        { parcela: 9,  intervalor: 270 },
        { parcela: 10, intervalor: 300 },
        { parcela: 11, intervalor: 330 },
        { parcela: 12, intervalor: 360 },
    ]);

    console.log('✅ Seeds de condições de pagamento inseridas com sucesso!');
};