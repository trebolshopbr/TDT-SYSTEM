/* eslint-disable @typescript-eslint/no-require-imports -- Testes isolados de regras, sem conexão ao banco. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculate, emptyLot, categories, parseLot, schemaMissing } = require('./model.ts');
const complete = (patch = {}) => ({ ...emptyLot(), reference: 'TESTE ISOLADO', supplier: 'Fixture', quantity: '10', unitPrice: '100', discount: '50', paidOn: '2026-09-24', source: 'comprovante fictício apenas no teste', reviewed: [...categories], ...patch });
const movement = (patch = {}) => ({ id: 'fixture1', category: 'Transporte', amount: '10', currency: 'BRL', rate: '', paidOn: '2026-09-24', source: 'fixture', allocation: 'integral', ...patch });

test('lote vazio não vira custo zero', () => {
  const r = calculate(emptyLot());
  assert.equal(r.unit, null); assert.equal(r.purchase, null); assert.equal(r.movement, null); assert.equal(r.knownTotal, null); assert.ok(r.pending.length > 0);
});
test('desconto total é aplicado uma vez antes de dividir por unidades', () => {
  const r = calculate(complete()); assert.equal(r.total, 950); assert.equal(r.unit, 95); assert.equal(r.complete, true);
});
test('cada pagamento usa seu próprio câmbio, inclusive em datas diferentes', () => {
  const r = calculate(complete({ currency: 'USD', rate: '5', movements: [movement({ currency: 'USD', rate: '5.2', paidOn: '2026-09-23' })] }));
  assert.equal(r.purchase, 4750); assert.equal(r.movement, 52); assert.equal(r.unit, 480.2);
});
test('pagamentos parciais conhecidos não fecham custo nem inventam zero', () => {
  const r = calculate(complete({ movements: [movement({ amount: '' })] }));
  assert.equal(r.movement, null); assert.equal(r.knownTotal, 950); assert.equal(r.total, null); assert.equal(r.unit, null);
});
test('zero explicitamente informado é válido; desconto desconhecido não é zero', () => {
  assert.equal(calculate(complete({ unitPrice: '0', discount: '0' })).unit, 0);
  assert.equal(calculate(complete({ discount: '' })).unit, null);
});
test('conversão arredonda centavos sem perda em multiplicação binária', () => {
  const r = calculate(complete({ quantity: '1', unitPrice: '0.07', discount: '0', currency: 'USD', rate: '1.5' }));
  assert.equal(r.purchase, 0.11);
});
test('custos compartilhados entram só pela parcela declarada e exigem critério', () => {
  assert.equal(calculate(complete({ movements: [movement({ amount: '25', allocation: '25 dos 100; 1/4 das unidades' })] })).total, 975);
  assert.equal(calculate(complete({ movements: [movement({ allocation: '' })] })).unit, null);
});
test('câmbio, data, fonte e levantamento incompletos impedem custo final', () => {
  for (const patch of [{ currency: 'USD', rate: '' }, { source: '' }, { paidOn: '' }, { reviewed: categories.slice(1) }]) assert.equal(calculate(complete(patch)).unit, null);
});
test('valores negativos, excesso de desconto, quantidade fracionária, datas inválidas e precisão são barrados', () => {
  for (const patch of [{ unitPrice: '-1' }, { discount: '1001' }, { quantity: '0' }, { quantity: '1.5' }, { paidOn: '2026-02-30' }, { unitPrice: '1.001' }, { currency: 'USD', rate: '0' }, { unitPrice: '1e300' }]) {
    const r = calculate(complete(patch)); assert.ok(r.errors.length, JSON.stringify(patch)); assert.equal(r.unit, null);
  }
});
test('documentos malformados e categorias/ids duplicados são rejeitados', () => {
  assert.equal(parseLot(null), null);
  for (const patch of [{ reviewed: ['Transporte', 'Transporte'] }, { reviewed: ['Inventado'] }, { movements: [movement(), movement()] }, { quantity: 10 }]) assert.equal(parseLot(complete(patch)), null);
  assert.deepEqual(parseLot(complete()), complete());
});
test('falta de tabela é distinta de falta de permissão ou falha de conexão', () => {
  assert.equal(schemaMissing({ code: 'PGRST205' }), true); assert.equal(schemaMissing({ code: '42P01' }), true);
  assert.equal(schemaMissing({ code: '42501' }), false); assert.equal(schemaMissing(null), false);
});

test('identificação manual não é necessária e fornecedor selecionado sobrevive ao parse', () => {
 const lot=complete({reference:'',supplierId:'11111111-1111-4111-8111-111111111111'});
 assert.equal(calculate(lot).complete,true);assert.equal(parseLot(lot).supplierId,lot.supplierId);
 assert.equal(parseLot(complete({supplierId:'invalido'})),null);
});
