import { Redis } from "@upstash/redis";
import webpush from "web-push";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function sendPushNotification(payload) {
  const endpointKeys = await redis.smembers("push:endpoints").catch(() => []);
  if (!endpointKeys.length) return { sent: 0, reason: "no-subscribers" };

  let sent = 0;
  let failed = 0;
  const expired = [];

  const payloadString = JSON.stringify(payload);

  await Promise.allSettled(
    endpointKeys.map(async (key) => {
      try {
        const raw = await redis.get(key);
        if (!raw) return;
        const sub = typeof raw === "string" ? JSON.parse(raw) : raw;
        await webpush.sendNotification(sub, payloadString);
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          expired.push(key);
        } else {
          failed++;
          console.error("[push-notify] Gönderim hatası:", err.message);
        }
      }
    }),
  );

  if (expired.length) {
    await Promise.all([
      ...expired.map((k) => redis.del(k)),
      redis.srem("push:endpoints", ...expired),
    ]);
  }

  return { sent, failed, expired: expired.length };
}
