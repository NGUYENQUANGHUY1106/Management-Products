import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const compiled = ts.transpileModule(await readFile('src/utils/favorites.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const output = {};
runInNewContext(compiled, { exports: output });
const { favoritesKey, parseFavorites, toggleFavorite } = output;
test('favorites storage is isolated by account and Firebase project', () => {
  assert.notEqual(favoritesKey('product', 'admin-a'), favoritesKey('product', 'admin-b'));
  assert.notEqual(favoritesKey('product', 'admin-a'), favoritesKey('demo-product', 'admin-a'));
  assert.notEqual(favoritesKey('a/b', 'c'), favoritesKey('a', 'b/c'));
});
test('loads only product IDs and rejects malformed local data', () => {
  assert.deepEqual(Array.from(parseFavorites(null)), []);
  assert.deepEqual(Array.from(parseFavorites('["product-1","product-1","product-2"]')), ['product-1','product-2']);
  for (const raw of ['{}', 'null', '[1]', '[""]', '{broken']) assert.throws(() => parseFavorites(raw));
});
test('adding/removing favorites preserves original IDs and never changes product fields', () => {
  const ids = ['product-1'];
  assert.deepEqual(Array.from(toggleFavorite(ids, 'product-2')), ['product-1','product-2']);
  assert.deepEqual(Array.from(toggleFavorite(ids, 'product-1')), []);
  assert.deepEqual(ids, ['product-1']);
});
