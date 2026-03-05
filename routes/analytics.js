const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// add zod check for start and end time !!!!
const zod = require("zod");

const timeParams = zod.object({
    start_time: zod.iso.datetime(),
    end_time: zod.iso.datetime(),
});

// countng all event types within a time period
router.get("/event-count", async (req, res) => {
    try {
        const parseResult = timeParams.safeParse(req.query);

        if (!parseResult.success) {
            return res.status(400).json({
                error: parseResult.error
            });
        }

        const { start_time, end_time } = parseResult.data;
        const start = new Date(start_time);
        const end = new Date(end_time);

        if (start > end) {
            return res.status(400).json({
                error: "Start Time Must Be Before End Time !!"
            });
        }

        const result = await prisma.$queryRaw`
            SELECT event_type, COUNT(*) as count
            FROM Event
            WHERE occurred_at >= ${start}
            AND occurred_at < ${end}
            GROUP BY event_type`;
        
        const formatted = result.map(row => ({
            event_type: row.event_type,
            count: Number(row.count)
        }));

        return res.json(formatted);
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }

});

const typeParams = zod.object({
    start_time: zod.iso.datetime(),
    end_time: zod.iso.datetime(),
    event_type: zod.string(),
    idempotency_key: zod.uuid()
});

// each user's count for a particular event_type
router.get("/user-event-count", async (req, res) => {
    try {
        const parseResult = typeParams.safeParse(req.query);

        if(!parseResult.success) {
            return res.status(400).json({
                error: parseResult.error
            });
        }

        const { start_time, end_time, event_type } = parseResult.data;
        const start = new Date(start_time);
        const end = new Date(end_time);

        const result = await prisma.$queryRaw`
            SELECT user_id, COUNT(*) as count
            FROM Event
            WHERE occurred_at >= ${start}
            AND occurred_at < ${end}
            AND event_type = ${event_type}
            GROUP BY user_id`;

        const formatted = result.map(row => ({
            user_id: row.user_id,
            count: Number(row.count)
        }));

        return res.json(formatted);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;