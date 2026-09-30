const cache = {};
const TTL = 60 * 1000; // 1 minute in milliseconds

const checkCache = (req, res, next) => {
  // We only cache GET requests
  if (req.method !== 'GET') return next();

  const key = req.url;
  const cachedItem = cache[key];

  // 1. Check if data exists in cache AND is less than 1 minute old
  if (cachedItem && (Date.now() - cachedItem.createdAt < TTL)) {
    console.log(`[Cache HIT] for ${key}`);
    res.setHeader('X-Cache', 'HIT');
    
    // Return the cached data immediately
    return res.json(cachedItem.data);
  }

  // 2. If no valid cache, it's a MISS
  console.log(`[Cache MISS] for ${key}`);
  res.setHeader('X-Cache', 'MISS');

  // 3. Intercept the res.json function to save the data to cache before it goes to the user
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    cache[key] = {
      data: data,
      createdAt: Date.now() // Save the time it was created for TTL check
    };
    
    // Call the original res.json to actually send the response
    originalJson(data);
  };

  next();
};

const invalidateCache = (req, res, next) => {
  // If the request changes data, simply clear the entire cache object
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    console.log(`[Cache CLEARED] Data was modified by ${req.method} request.`);
    
    for (let key in cache) {
      delete cache[key];
    }
  }
  
  next();
};

module.exports = {
  checkCache,
  invalidateCache
};
