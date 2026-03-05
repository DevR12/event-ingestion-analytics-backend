const prisma = require("./lib/prisma");

function randomEventType() {
    const types = ["page_view","page_click","purchase","signup"];
    return types[Math.floor(Math.random() * types.length)];
}

function randomUser() {
    return "user_" + Math.floor(Math.random()*1000);
}

async function seed() {

    const events = [];

    for (let i = 0; i < 50000; i++) {

        const occurred = new Date(
            Date.now() - Math.random()*30*24*60*60*1000
        );

        events.push({
            event_type: randomEventType(),
            user_id: randomUser(),
            occurred_at: occurred,
            idempotency_key: crypto.randomUUID()
        });
    }

    console.log("Inserting events...");

    await prisma.event.createMany({
        data: events,
        skipDuplicates: true
    });

    console.log("Done");
}

seed();