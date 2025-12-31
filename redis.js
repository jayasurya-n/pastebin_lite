import Redis from "ioredis";

let redis;
console.log("test mode", process.env.TEST_MODE)
if (!global.redis) {
    global.redis = new Redis(process.env.REDIS_URL);
}

redis = global.redis;

export default redis;
