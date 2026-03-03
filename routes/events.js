const express = require("express");
const prisma = require("../lib/prisma");

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

// inserting row
router.post("/", async (req, res) => {
    let idempotency_key, event_type, occurred_at, user_id, properties;

    try {
        const parseResult = postBody.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({
                error: parseResult.error
            });
        }

        ({ event_type, occurred_at, idempotency_key, user_id, properties } = parseResult.data); 

        const event = await prisma.event.create({
            data: {
                event_type,
                user_id,
                occurred_at: new Date(occurred_at),
                properties,
                idempotency_key
            }
        });

        return res.status(201).json(event);

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

module.exports = router;