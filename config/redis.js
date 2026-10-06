const {createClient} = require('redis')

// " it tell node.js = Connect to the Redis server running on my computer at port 16379."
const redis = createClient({
    url: "redis://redis:6379"
})

redis.on("error", (error) => {
    console.error("Redis Error",error);
    
})

module.exports = redis;