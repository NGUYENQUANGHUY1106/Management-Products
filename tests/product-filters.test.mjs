import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const source = await readFile('src/utils/productFilters.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
runInNewContext(compiled, { exports });
const { filterProducts, parsePriceRange } = exports;
const products = [{ id: 'zero', name: 'Chuột miễn phí', price: 0 }, { id: 'min', name: 'Chuột cơ bản', price: 250000 }, { id: 'max', name: 'Chuột cao cấp', price: 350000 }, { id: 'other', name: 'Bàn phím', price: 500000 }];
const ids = result => Array.from(result, product => product.id);
test('range includes both boundaries and composes with case-insensitive search', () => {
  assert.deepEqual(ids(filterProducts(products, '  CHUỘT ', parsePriceRange('250000','350000'), 'default')), ['min','max']);
  assert.deepEqual(ids(filterProducts(products, '', parsePriceRange('0','0'), 'default')), ['zero']);
  assert.deepEqual(ids(filterProducts(products, '', parsePriceRange('250000','250000'), 'default')), ['min']);
});
test('open-ended ranges, clear filters and no results', () => {
  assert.deepEqual(ids(filterProducts(products, '', parsePriceRange('350000',''), 'default')), ['max','other']);
  assert.deepEqual(ids(filterProducts(products, '', parsePriceRange('','250000'), 'default')), ['zero','min']);
  assert.equal(filterProducts(products, '', parsePriceRange('',''), 'default').length, 4);
  assert.equal(filterProducts(products, '', parsePriceRange('1','2'), 'default').length, 0);
});
test('invalid ranges are rejected instead of silently hiding data', () => {
  for (const [min,max] of [['5','4'],['-1',''],['abc','3'],['1e3',''],['Infinity',''],['','1000000000001']]) assert.throws(() => parsePriceRange(min,max));
});
test('sorts numeric prices without mutating the original collection', () => {
  assert.deepEqual(ids(filterProducts(products, '', {}, 'price-desc')), ['other','max','min','zero']);
  assert.deepEqual(ids(filterProducts(products, '', {}, 'price-asc')), ['zero','min','max','other']);
  assert.deepEqual(ids(products), ['zero','min','max','other']);
});
test('local product image URLs use the current backend while public images are preserved', async () => {
  const source = await readFile('src/utils/productImage.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const output = {};
  runInNewContext(code, { exports: output, URL });
  const resolve = output.resolveProductImageUrl;
  const base = 'http://172.26.100.127:3001';
  assert.equal(resolve('http://localhost:3001/uploads/abcd-1234.jpg', base), base + '/uploads/abcd-1234.jpg');
  assert.equal(resolve('http://192.168.1.20:3001/uploads/abcd.jpg', base), base + '/uploads/abcd.jpg');
  for (const url of ['https://images.unsplash.com/photo-123', 'https://example.com/uploads/abcd.jpg', 'http://localhost:9000/another-image.png', 'invalid']) assert.equal(resolve(url, base), url);
});
