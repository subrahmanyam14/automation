const mongoose = require("mongoose");

const templateParameterSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

const reminderSchema = new mongoose.Schema({
  templateParameter: [templateParameterSchema],
  payload: { type: String, default: "" },
  scheduleId: { type: String, required: true },
  timeZone: { type: String, required: true },
  templateLanguage: { type: String, required: true },
  templateId: { type: String, required: true },
  deliveryDateTime: { type: String, required: true },
  deliveryDestination: { type: String, required: true },
  deliveryMethod: { type: String, required: true },
  excludedKeyPrompt: [{ type: String }],
});

const reminderConfigSchema = new mongoose.Schema({
  practiceId: { type: String, required: true },
  reminders: [reminderSchema],
});

const ReminderConfig = mongoose.model("ReminderConfig", reminderConfigSchema);

module.exports = ReminderConfig;
