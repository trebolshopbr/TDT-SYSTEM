/* eslint-disable @typescript-eslint/no-require-imports -- Node executa estes testes CommonJS sem dependências extras. */
// Testes isolados: não conectam ao Supabase nem alteram dados reais.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loader(mocks) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const mod = new Module(file);
    cache.set(file, mod);
    const realRequire = Module.createRequire(file);
    mod.require = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith('.')) {
        const base = path.resolve(path.dirname(file), id);
        for (const suffix of ['', '.ts', '.tsx']) {
          if (fs.existsSync(base + suffix) && fs.statSync(base + suffix).isFile()) return load(base + suffix);
        }
      }
      return realRequire(id);
    };
    mod._compile(compiled, file);
    return mod.exports;
  }
  return load;
}
const produto = { id: 'teste-isolado', nombre: 'Produto de teste isolado', precio: 100, costo: 60, stock: 2, activo: true, moneda_costo: 'BRL', imagen_url: null };
const baseMocks = {
  "@/lib/supabase/client": { createClient: () => ({}) },
  'next/link': ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children),
  'next/navigation': {
    useRouter: () => ({ refresh() {} }),
    redirect: () => { throw new Error('login'); },
    notFound: () => { throw new Error('notFound'); },
  },
};
function query(result) {
  return { select() { return this; }, order() { return this; }, eq() { return this; }, maybeSingle() { return this; }, then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); } };
}
async function renderPage(relative, responses, search = {}) {
  const load = loader({ ...baseMocks, '@/lib/supabase/server': {
    getSessionUser: async () => ({ id: 'usuario-teste' }),
    createClient: async () => ({ from: (table) => query(responses[table] ?? { data: [], error: null }) }),
  } });
  const page = load(path.join(__dirname, '..', relative)).default;
  return renderToStaticMarkup(await page({ params: Promise.resolve({ id: produto.id }), searchParams: Promise.resolve(search) }));
}

test('falhas de consulta mostram erro e nova tentativa em todas as telas do fluxo', async () => {
  for (const relative of ['page.tsx', 'margens/page.tsx', '[id]/page.tsx', 'nuevo/page.tsx']) {
    const html = await renderPage(relative, {
      productos: { data: null, error: { message: 'falha isolada' } },
      plataformas: { data: null, error: { message: 'falha isolada' } },
    });
    assert.match(html, /Não foi possível carregar os dados/);
    assert.match(html, /Tentar novamente/);
    assert.doesNotMatch(html, /Ainda não há produtos|Nenhum produto neste filtro|100\.0%/);
  }
});

test('produto ausente difere de falha de consulta', async () => {
  await assert.rejects(renderPage('[id]/page.tsx', { productos: { data: null, error: null } }), /notFound/);
});

test('margens mostram pendência sem inventar lucro', async () => {
  const html = await renderPage('margens/page.tsx', { productos: { data: [{ ...produto, costo: 0 }], error: null } });
  assert.match(html, /Custo pendente/);
  assert.match(html, /0 de 1/);
  assert.doesNotMatch(html, /100\.0%/);
});

async function submitEdit({ result, throws = false, initial = produto, formFile = "form.tsx" }) {
  const state = [];
  const navigation = [];
  let cursor = 0;
  let payload;
  let selected;
  let matched;
  const load = loader({ ...baseMocks,
    react: { ...React, useEffect() {}, useState(value) { const i = cursor++; state[i] = value; return [value, (next) => { state[i] = next; }]; } },
    'next/navigation': { useRouter: () => ({ push: (url) => navigation.push(url), refresh() {} }) },
    '@/lib/supabase/client': { createClient: () => ({ from: () => ({
      update(value) { payload = value; return this; },
      eq(key, value) { matched = [key, value]; return this; },
      select(value) { selected = value; return this; },
      async single() { if (throws) throw new Error('offline'); return result; },
    }) }) },
  });
  const form = load(path.join(__dirname, '../[id]', formFile)).default({ producto: initial, plataformas: [], userId: 'usuario-teste' });
  await form.props.onSubmit({ preventDefault() {} });
  return { state, navigation, payload, selected, matched };
}

test('salvamento envia valores e confirma uma única ficha antes de voltar', async () => {
  const r = await submitEdit({ result: { data: { id: produto.id }, error: null } });
  assert.equal(r.payload.precio, 100);
  assert.equal(r.payload.costo, 60);
  assert.equal(r.selected, 'id');
  assert.deepEqual(r.matched, ['id', produto.id]);
  assert.deepEqual(r.navigation, ['/productos']);
});

test('rejeição ou perda de conexão mantém a ficha e libera nova tentativa', async () => {
  for (const options of [{ result: { data: null, error: { message: 'nenhuma linha alterada' } } }, { throws: true }]) {
    const r = await submitEdit(options);
    assert.deepEqual(r.navigation, []);
    assert.ok(r.state.some((s) => typeof s === 'string' && s.includes('Não foi possível confirmar')));
    assert.equal(r.state.at(-2), false); // loading, antes de deleting
  }
});

test('custo USD incompleto é barrado antes de qualquer gravação', async () => {
  const r = await submitEdit({ initial: { ...produto, moneda_costo: 'USD', costo_original: 10, tipo_cambio_costo: null } });
  assert.equal(r.payload, undefined);
  assert.deepEqual(r.navigation, []);
  assert.ok(r.state.some((s) => typeof s === 'string' && s.includes('Informe o custo em US$')));
});


test('lista de pendências mostra apenas produtos sem custo e dá acesso direto à ficha', async () => {
  const html = await renderPage('page.tsx', { productos: { data: [
    { ...produto, id: 'pendente', nombre: 'Custo a completar', costo: 0 },
    { ...produto, id: 'completo', nombre: 'Custo conhecido' },
  ], error: null } }, { pendente: 'custo' });
  assert.match(html, /Custo a completar/);
  assert.doesNotMatch(html, /Custo conhecido/);
  assert.match(html, /\/productos\/pendente\?completar=custo/);
});

test('lista concluída oferece um estado vazio honesto', async () => {
  const html = await renderPage('page.tsx', { productos: { data: [produto], error: null } }, { pendente: 'custo' });
  assert.match(html, /Nenhum custo pendente/);
});

test('formulário de custo salva somente campos de compra, preservando estoque e preço', async () => {
  const r = await submitEdit({ formFile: 'cost-form.tsx', result: { data: { id: produto.id }, error: null } });
  assert.deepEqual(r.payload, { costo: 60, moneda_costo: 'BRL', costo_original: null, tipo_cambio_costo: null });
  assert.deepEqual(r.navigation, ['/productos?pendente=custo&salvo=custo']);
  assert.equal(r.selected, 'id');
  assert.deepEqual(r.matched, ['id', produto.id]);
});

test('formulário converte USD usando câmbio informado e arredonda em centavos', async () => {
  const r = await submitEdit({ formFile: 'cost-form.tsx', initial: { ...produto, moneda_costo: 'USD', costo_original: 10, tipo_cambio_costo: 5.1234 }, result: { data: { id: produto.id }, error: null } });
  assert.deepEqual(r.payload, { costo: 51.23, moneda_costo: 'USD', costo_original: 10, tipo_cambio_costo: 5.1234 });
});

test('custo desconhecido não é gravado como custo confirmado', async () => {
  const r = await submitEdit({ formFile: 'cost-form.tsx', initial: { ...produto, costo: 0 } });
  assert.equal(r.payload, undefined);
  assert.deepEqual(r.navigation, []);
});

test('falha ao salvar custo conserva a ficha para tentar novamente', async () => {
  const r = await submitEdit({ formFile: 'cost-form.tsx', result: { data: null, error: { message: 'permissão' } } });
  assert.deepEqual(r.navigation, []);
  assert.equal(r.state.at(-2), false);
  assert.match(r.state.at(-1), /conferir seu acesso/);
});
