const express = require('express');
const eventRouter = require("./routes/events");
const analyticsRouter = require("./routes/analytics");

const app = express();

app.use(express.json());

app.use("/api/v1/events",eventRouter);
app.use("/api/v1/analytics", analyticsRouter);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
