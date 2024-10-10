const { unique } = require("agenda/dist/job/unique");
const mongoose = require("mongoose");

const ruleSchema = new mongoose.Schema({
  practiceId: { type: String, required: true, unique: true },
  blackoutStartTimes: { type: String },
  blackoutEndTimes: { type: String },
  phoneNum: { type: String },
  allowCancel: { type: Boolean },
  allowCall: { type: Boolean },
  appointmentFilter: { type: Boolean },
  sendRemindersAfterConfirmation: { type: Boolean },
  blackoutWeekends: { type: Boolean },
});

const Rules = mongoose.model("Rule", ruleSchema);

module.exports = Rules;
