const app = require("./app");
const redis = require("./config/redis");
const PORT = process.env.PORT || 3000;
const { invalidateUserTasks } = require("./utils/cache");

redis
  .connect()
  .then(async () => {
    console.log("Redis connected");

    await invalidateUserTasks(5);

    console.log("Cache invalidated");
    await redis.set("test", "Hello Redis", { EX: 10 });

    const value = await redis.get("test");

    console.log(value);

    app.listen(PORT, () => {
      console.log(`server is running on PORT ${PORT}`);
    });
  })

  .catch((error) => {
    console.error("Redis connection Failed", error);
  });
