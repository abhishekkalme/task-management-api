const redis = require("../config/redis");

const invalidateUserTasks = async (userId) => {
    const pattern = `tasks:user:${userId}:*`;

    for await (const keys of redis.scanIterator({
        MATCH: pattern
    })) {
        for (const key of keys) {
            console.log("Deleting:", key);
            await redis.del(key);
        }
    }
};

module.exports = { invalidateUserTasks };