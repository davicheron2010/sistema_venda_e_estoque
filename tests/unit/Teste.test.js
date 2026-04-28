import { describe, it, expect } from 'vitest';
import SellingPriceCalculator from '../../app/view/pages/assets/components/SellingPriceCalculator';

describe('SellingPriceCalculator', () => {

    describe('create()', () => {

        it('deve retornar uma instância de SellingPriceCalculator', () => {
            const calculator = SellingPriceCalculator.create();
            expect(calculator).toBeInstanceOf(SellingPriceCalculator);
        });

        it('cada chamada de create() deve retornar uma instância nova e independente', () => {
            const a = SellingPriceCalculator.create();
            const b = SellingPriceCalculator.create();
            expect(a).not.toBe(b);
        });

    });

    describe('Method chaining', () => {

        it('addPurchasePrice() deve retornar a própria instância', () => {
            const calculator = SellingPriceCalculator.create();
            expect(calculator.addPurchasePrice(100)).toBe(calculator);
        });

        it('addTotalTax() deve retornar a própria instância', () => {
            const calculator = SellingPriceCalculator.create();
            expect(calculator.addTotalTax(10)).toBe(calculator);
        });

        it('addProfitMargin() deve retornar a própria instância', () => {
            const calculator = SellingPriceCalculator.create();
            expect(calculator.addProfitMargin(20)).toBe(calculator);
        });

        it('operatingCost() deve retornar a própria instância', () => {
            const calculator = SellingPriceCalculator.create();
            expect(calculator.operatingCost(50)).toBe(calculator);
        });

        it('deve permitir encadeamento completo dos métodos', () => {
            const result = SellingPriceCalculator
                .create()
                .addPurchasePrice(100)
                .addTotalTax(10)
                .addProfitMargin(20)
                .operatingCost(50)
                .getData();

            expect(result).toBeDefined();
        });

    });

    describe('getData()', () => {

        it('deve retornar um objeto com as três chaves corretas', () => {
            const result = SellingPriceCalculator.create().getData();
            expect(result).toHaveProperty('valor_venda_sugerido');
            expect(result).toHaveProperty('valor_total_imposto');
            expect(result).toHaveProperty('valor_margem_lucro');
        });

        it('deve retornar zeros quando todos os valores são zero', () => {
            // totalCost = 0 / divisor = 1 / sellingPrice = 0
            const result = SellingPriceCalculator
                .create()
                .addPurchasePrice(0)
                .addTotalTax(0)
                .addProfitMargin(0)
                .operatingCost(0)
                .getData();

            expect(result.valor_venda_sugerido).toBe(0);
            expect(result.valor_total_imposto).toBe(0);
            expect(result.valor_margem_lucro).toBe(0);
        });

        it('deve calcular corretamente sem custo operacional', () => {
            // totalCost = 100 / divisor = 1 - (0.10 + 0.20) = 0.70
            // sellingPrice = 100 / 0.70 = 142.857...
            const result = SellingPriceCalculator
                .create()
                .addPurchasePrice(100)
                .addTotalTax(10)
                .addProfitMargin(20)
                .operatingCost(0)
                .getData();

            expect(result.valor_venda_sugerido).toBeCloseTo(142.857, 2);
            expect(result.valor_total_imposto).toBeCloseTo(14.285, 2);
            expect(result.valor_margem_lucro).toBeCloseTo(28.571, 2);
        });

        it('deve incluir o custo operacional no cálculo do preço de venda', () => {
            // totalCost = 100 + 50 = 150 / divisor = 0.70
            // sellingPrice = 150 / 0.70 = 214.285...
            const result = SellingPriceCalculator
                .create()
                .addPurchasePrice(100)
                .addTotalTax(10)
                .addProfitMargin(20)
                .operatingCost(50)
                .getData();

            expect(result.valor_venda_sugerido).toBeCloseTo(214.285, 2);
            expect(result.valor_total_imposto).toBeCloseTo(21.428, 2);
            expect(result.valor_margem_lucro).toBeCloseTo(42.857, 2);
        });

        it('deve calcular corretamente apenas com imposto, sem margem de lucro', () => {
            // totalCost = 200 / divisor = 1 - 0.15 = 0.85
            // sellingPrice = 200 / 0.85 = 235.294...
            const result = SellingPriceCalculator
                .create()
                .addPurchasePrice(200)
                .addTotalTax(15)
                .addProfitMargin(0)
                .operatingCost(0)
                .getData();

            expect(result.valor_venda_sugerido).toBeCloseTo(235.294, 2);
            expect(result.valor_total_imposto).toBeCloseTo(35.294, 2);
            expect(result.valor_margem_lucro).toBe(0);
        });

        it('deve calcular corretamente apenas com margem de lucro, sem imposto', () => {
            // totalCost = 200 / divisor = 1 - 0.30 = 0.70
            // sellingPrice = 200 / 0.70 = 285.714...
            const result = SellingPriceCalculator
                .create()
                .addPurchasePrice(200)
                .addTotalTax(0)
                .addProfitMargin(30)
                .operatingCost(0)
                .getData();

            expect(result.valor_venda_sugerido).toBeCloseTo(285.714, 2);
            expect(result.valor_total_imposto).toBe(0);
            expect(result.valor_margem_lucro).toBeCloseTo(85.714, 2);
        });

        it('deve calcular corretamente apenas com custo operacional, sem outros valores', () => {
            // totalCost = 0 + 80 = 80 / divisor = 1
            // sellingPrice = 80
            const result = SellingPriceCalculator
                .create()
                .addPurchasePrice(0)
                .addTotalTax(0)
                .addProfitMargin(0)
                .operatingCost(80)
                .getData();

            expect(result.valor_venda_sugerido).toBe(80);
            expect(result.valor_total_imposto).toBe(0);
            expect(result.valor_margem_lucro).toBe(0);
        });

        it('instâncias distintas não devem compartilhar estado entre si', () => {
            const resultA = SellingPriceCalculator
                .create()
                .addPurchasePrice(100)
                .addTotalTax(10)
                .addProfitMargin(20)
                .operatingCost(0)
                .getData();

            const resultB = SellingPriceCalculator
                .create()
                .addPurchasePrice(200)
                .addTotalTax(5)
                .addProfitMargin(10)
                .operatingCost(0)
                .getData();

            expect(resultA.valor_venda_sugerido).not.toBe(resultB.valor_venda_sugerido);
        });

    });

});