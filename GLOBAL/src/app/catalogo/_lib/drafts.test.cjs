/* eslint-disable @typescript-eslint/no-require-imports -- Testes isolados com Node. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initialDraft, readDrafts, preparation, normalize } = require('./drafts.ts');
const product = { id: 'isolado', nombre: 'Nome confirmado no teste', precio: 100, imagen_url: '/teste.jpg' };
test('rascunho inicial conserva o nome e não inventa conteúdo nem revisão', () => {
  const d = initialDraft(product);
  assert.equal(d.title, product.nombre);
  assert.equal(d.description, '');
  assert.equal(d.category, '');
  assert.equal(d.showPrice, false);
  assert.equal(d.included, true);
  assert.equal(preparation(product, d).ready, false);
});
test('revisado exige conteúdo, fonte e confirmação da foto e do texto', () => {
  const d = { ...initialDraft(product), category: 'Teste', description: 'Texto de teste', audience: 'Público de teste', highlights: 'Destaque de teste', specifications: 'Especificação de teste', source: 'Fonte de teste', imageReviewed: true, contentReviewed: true };
  assert.equal(preparation(product, d).ready, true);
  for (const key of ['category', 'description', 'audience', 'highlights', 'specifications', 'source']) {
    assert.equal(preparation(product, { ...d, [key]: ' ' }).ready, false);
  }
  assert.equal(preparation({ ...product, imagen_url: null }, d).ready, false);
  assert.equal(preparation(product, { ...d, contentReviewed: false }).ready, false);
});
test('rascunho sobrevive à serialização, inclusive exclusão da seleção', () => {
  const d = { ...initialDraft(product), included: false, category: 'Categoria de teste' };
  assert.deepEqual(readDrafts(JSON.stringify({ [product.id]: d }))[product.id], d);
});
test('conteúdo local inválido não quebra a tela nem valida ficha parcial', () => {
  for (const raw of ['invalid', 'null', '[]', '{"id":null}', '{"id":{"title":"x"}}']) {
    assert.deepEqual(readDrafts(raw), {});
  }
});
test('busca ignora acentos e diferenças de caixa', () => {
  assert.equal(normalize('ÁUDIO'), 'audio');
});
