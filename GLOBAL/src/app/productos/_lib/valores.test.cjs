/* eslint-disable @typescript-eslint/no-require-imports -- Node executa estes testes CommonJS sem dependências extras. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calcularMargem, resumirMargens, validarFicha } = require('./valores.ts');

test('preço 100 e custo 60 resultam em R$ 40 e 40% sobre a venda', () => {
  assert.deepEqual(calcularMargem(100, 60), { valor: 40, percentual: 40 });
});

test('custo ou preço ausente/inválido nunca produz margem de 100%', () => {
  for (const value of [null, undefined, '', ' ', 0, -1, NaN, Infinity, 'inválido']) {
    assert.equal(calcularMargem(100, value), null);
    assert.equal(calcularMargem(value, 60), null);
  }
});

test('preserva perda e equilíbrio como resultados reais', () => {
  assert.deepEqual(calcularMargem(100, 120), { valor: -20, percentual: -20 });
  assert.deepEqual(calcularMargem('100', '100'), { valor: 0, percentual: 0 });
});

test('resumo exclui fichas incompletas de ambos os totais', () => {
  assert.deepEqual(resumirMargens([
    { precio: 100, costo: 60 }, { precio: 200, costo: 150 },
    { precio: 1000, costo: 0 }, { precio: 0, costo: 50 },
  ]), { incluidos: 2, pendentes: 2, percentual: 30 });
});

test('catálogo vazio ou sem valores válidos fica pendente', () => {
  assert.deepEqual(resumirMargens([]), { incluidos: 0, pendentes: 0, percentual: null });
  assert.deepEqual(resumirMargens([{ precio: 100, costo: 0 }]), {
    incluidos: 0, pendentes: 1, percentual: null,
  });
});

const ficha = { nombre: 'Teste isolado', precio: '100', costo: '', monedaCosto: 'BRL', costoUsd: '', tipoCambioCosto: '', stock: '' };
test('custo opcional fica pendente sem impedir cadastro', () => {
  assert.equal(validarFicha(ficha), null);
  assert.equal(validarFicha({ ...ficha, monedaCosto: 'USD' }), null);
});

test('USD exige custo e câmbio juntos, positivos', () => {
  for (const pair of [['10', ''], ['', '5'], ['10', '0'], ['-1', '5'], ['10', 'NaN']]) {
    assert.ok(validarFicha({ ...ficha, monedaCosto: 'USD', costoUsd: pair[0], tipoCambioCosto: pair[1] }));
  }
  assert.equal(validarFicha({ ...ficha, monedaCosto: 'USD', costoUsd: '10', tipoCambioCosto: '5.11' }), null);
});

test('rejeita nome vazio, números inválidos e estoque fracionado', () => {
  for (const change of [{ nombre: ' ' }, { precio: '' }, { precio: '-1' }, { costo: '-1' }, { costo: 'Infinity' }, { stock: '1.5' }]) {
    assert.ok(validarFicha({ ...ficha, ...change }));
  }
});
