const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { checkCache, invalidateCache } = require('../middleware/cacheMiddleware');

const app = express();
const dbPath = path.join(__dirname, '../database/db.json');

app.use(express.json());

app.use(invalidateCache);


const getProducts = async () => {
  const data = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(data);
};


app.get('/products', checkCache, async (req, res) => {
  const products = await getProducts();
  res.json(products);
});

// GET /products/:id
app.get('/products/:id', checkCache, async (req, res) => {
  const products = await getProducts();
  const product = products.find(p => p.id == req.params.id);
  
  if (!product) return res.status(404).json({ error: "Not found" });
  
  res.json(product);
});

// POST /products
app.post('/products', async (req, res) => {
  const products = await getProducts();
  
  const newProduct = { 
    id: Date.now().toString(), 
    ...req.body 
  };
  
  products.push(newProduct);
  
  // Write the new product list back to the database file
  await fs.writeFile(dbPath, JSON.stringify(products, null, 2));
  
  res.json(newProduct);
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
