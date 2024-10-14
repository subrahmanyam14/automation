const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const appointmentRoutes = require("./src/routes/appointmentRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const reminderService = require("./src/services/reminderService");

const app = express();
const PORT = process.env.PORT || 3006;
const mongoUrl = process.env.MONGO_URL;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/appointment", appointmentRoutes);
app.use("/webhook", webhookRoutes);

// app.use((req, res, next) => {
//   res.status(404).send("Sorry, that route doesn't exist.");
// });

app.get("/", (req, res) => {
  return res.send(`Server running upon ${PORT}!`);
})

mongoose
  .connect(mongoUrl, { useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected successfully to MongoDB server");

    await reminderService.initializeQueue();
    await reminderService.clearPastReminders();
    reminderService.watchReminderConfigs();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  console.log("Gracefully shutting down...");
  await reminderService.agenda.stop();
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
