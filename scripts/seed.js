const prisma = require("../lib/prisma");

function randomEventType() {
  const types = ["page_view", "page_click", "signup", "purchase"];
  return types[Math.floor(Math.random() * types.length)];
}

function randomUser() {
  return "u" + Math.floor(Math.random() * 100);
}

function randomDate() {
  const start = new Date("2026-01-01");
  const end = new Date("2026-03-01");
  return new Date(start.getTime() + Math.random() * (end - start));
}

async function main() {
  const events = [];

  for (let i = 0; i < 1000; i++) {
    events.push({
      event_type: randomEventType(),
      user_id: randomUser(),
      occurred_at: randomDate(),
      properties: {}
    });
  }

  await prisma.event.createMany({
    data: events
  });

  console.log("Inserted 1000 events");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
