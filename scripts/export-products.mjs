import { mkdir, writeFile } from 'node:fs/promises';
import { db } from '../backend-admin/firebase.js';
const snapshot = await db.collection('products').get();
const products = snapshot.docs.map(doc => {
  const data = doc.data();
  if (Object.keys(data).sort().join(',') !== 'image,name,price,soluong') throw Error('Unexpected product fields: ' + doc.id);
  return data;
});
await mkdir('docs/database', { recursive: true });
await writeFile('docs/database/products.json', JSON.stringify(products, null, 2));
console.log('Exported ' + products.length + ' products (exactly four fields each).');
