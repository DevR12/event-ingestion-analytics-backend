const express = require("express");
const prisma = require("../lib/prisma");
const pLimit = require("p-limit");

const router = express.Router();

const zod = require("zod");

const singlePostBody = zod.object({
    event_type: zod.string(),
    occurred_at: zod.iso.datetime(),
    idempotency_key: zod.uuid(),
    user_id: zod.string(),
    properties: zod.any().optional()
});

const batchPostBody = zod.array(singlePostBody).min(1).max(1000);

// inserting single event
router.post("/", async (req, res) => {
    let idempotency_key, event_type, occurred_at, user_id, properties;

    try {
        const parseResult = singlePostBody.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({
                error: parseResult.error
            });
        }

        ({ event_type, occurred_at, idempotency_key, user_id, properties } = parseResult.data); 

        const createdEvent = await prisma.$transaction(async (tx) => {

            const event = await tx.event.create({
                data: {
                    event_type,
                    user_id,
                    occurred_at: new Date(occurred_at),
                    properties,
                    idempotency_key
                }
            });

            const d = new Date(occurred_at);
            d.setHours(0,0,0,0);

            await tx.dailyEventCount.upsert({
                where: {
                    date_event_type: {
                        date: d,
                        event_type: event_type
                    }
                },
                update: {
                    count: { increment: 1 }
                },
                create: {
                    date: d,
                    event_type: event_type,
                    count: 1
                }
            });

            return event;
        });

        return res.status(201).json(createdEvent);

    } catch (error) {
        if (error.code == 'P2002' && error.meta?.target?.includes('idempotency_key')) {
            const idemKey = idempotency_key;
            const existing = await prisma.event.findUnique({
                where: {
                    idempotency_key: idemKey
                }
            })


            if (
                existing.event_type !== event_type || 
                existing.user_id !== user_id || 
                new Date(existing.occurred_at).getTime() !== new Date(occurred_at).getTime()
            ) {
                return res.status(409).json({
                    error: "Idempotency key reused with different payload"
                });
            };

            return res.status(200).json(existing);
        }

        else {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

// inserting batches
router.post("/batch", async (req, res) => {
    try {
        const parseResult = batchPostBody.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error });
        }

        const events = parseResult.data;

        const summary = {
            inserted: 0,
            duplicates: 0,
            conflicts: 0,
            failed: 0
        }

        const limit = pLimit(10);

        await Promise.allSettled(
            events.map(entry => limit(async () => {
                try {

                    await prisma.$transaction(async (tx) => {

                        const createdEvent = await tx.event.create({
                            data: {
                                event_type: entry.event_type,
                                user_id: entry.user_id,
                                occurred_at: new Date(entry.occurred_at),
                                properties: entry.properties,
                                idempotency_key: entry.idempotency_key
                            }
                        })

                        const d = new Date(entry.occurred_at);
                        d.setHours(0, 0, 0, 0);

                        await tx.dailyEventCount.upsert({
                            where: {
                                date_event_type: {
                                    date: d,
                                    event_type: entry.event_type
                                }
                            },
                            update: {
                                count: { increment: 1 }
                            },
                            create: {
                                date: d,
                                event_type: entry.event_type,
                                count: 1
                            }
                        });

                    })

                    summary.inserted++;


                } catch (error) {

                    if (error.code == 'P2002' && error.meta?.target?.includes('idempotency_key')) {
                        
                        const existing = await prisma.event.findUnique({
                            where: {
                                idempotency_key: entry.idempotency_key
                            }
                        });

                        if (
                            existing.event_type !== entry.event_type ||
                            existing.user_id !== entry.user_id ||
                            new Date(existing.occurred_at).getTime() !== new Date(entry.occurred_at).getTime()
                        ) {
                            summary.conflicts++;
                        } else {
                            summary.duplicates++;
                        }
                    }
                    else {
                        summary.failed++;
                    }
                }
            }))
        )

        return res.status(200).json(summary);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;