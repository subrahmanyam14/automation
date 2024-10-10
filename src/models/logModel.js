const mongoose = require("mongoose");
const eventEmitter = require("../utils/eventEmitter");

const entrySchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["SMS", "Email", "Phone"] },
  to: { type: String, required: true },
  status: { type: String, required: true },
  dateSent: { type: Date, required: true },
  scriptId: { type: String, required: true },
  response: {
    type: String,
    enum: ["confirm", "cancel", "N/A"],
    default: "N/A",
  },
  messageId: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const logSchema = new mongoose.Schema({
  practiceId: { type: String, required: true },
  scheduleId: { type: String, required: true },
  entries: [entrySchema],
  scriptId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

logSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

logSchema.post("save", function (doc) {
  eventEmitter.emit("logUpdated", doc);
});

const Log = mongoose.model("Log", logSchema);

module.exports = Log;
