const mongoose = require("mongoose");

const scriptSchema = new mongoose.Schema({
  template: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  practiceId: { type: String, required: true },
  scriptType: { type: String, required: true },
  scriptId: { type: Number, required: true },
  active: { type: Boolean, default: true },
});

scriptSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Script = mongoose.model("Scripts", scriptSchema);

module.exports = Script;
