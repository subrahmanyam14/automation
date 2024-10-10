const ReminderConfig = require("../models/reminderConfigModel");
const ScriptModel = require("../models/scriptModel");
const Log = require("../models/logModel");
const { sendSMS, sendEmail, voiceCall } = require("../utils/utils");
const Agenda = require("agenda");
const moment = require("moment-timezone");

const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URL,
    collection: "agendaJobs",
  },
  processEvery: "1 minute",
});

function windowsToIANA(windowsZone) {
  const zoneMappings = {
    "Indian Standard Time": "Asia/Kolkata",
    "Central Standard Time": "America/Chicago",
    "Eastern Standard Time": "America/New_York",
    "Mountain Standard Time": "America/Denver",
    "Pacific Standard Time": "America/Los_Angeles",
  };

  return zoneMappings[windowsZone] || windowsZone;
}

agenda.define("sendReminder", async (job) => {
  const reminder = job.attrs.data;
  try {
    const script = await ScriptModel.findOne({ scriptId: reminder.templateId });
    if (!script) {
      throw new Error(`No script found for templateId: ${reminder.templateId}`);
    }

    let message = script.template;
    reminder.templateParameter.forEach((param) => {
      const placeholder = `{{${param.key}}}`;
      message = message.replace(new RegExp(placeholder, "g"), param.value);
    });

    const logData = {
      scriptId: script.scriptId,
      scheduleId: reminder.scheduleId,
      message,
      practiceId: reminder.practiceId,
    };

    const cancellationAllowed =
      reminder.excludedKeyPrompt &&
      !reminder.excludedKeyPrompt.includes("Cancel") &&
      !reminder.excludedKeyPrompt.includes("Confirm");

    const reminderTime = moment().tz(reminder.timeZone);
    console.log(
      `Sending reminder for ${reminder.scheduleId} (${reminder.timeZone})`
    );
    console.log(`Current time in reminder timezone: ${reminderTime.format()}`);

    switch (reminder.deliveryMethod) {
      case "SMS":
        await sendSMS({
          body: message,
          to: reminder.deliveryDestination,
          ...logData,
          deliveryMethod: "SMS",
          cancellationAllowed,
        });
        break;
      case "Email":
        const style = `
          <style>
            .button {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              color: #ffffff;
              background-color: #007bff;
              text-decoration: none;
              border-radius: 5px;
              margin: 5px;
            }
            .button:hover {
              background-color: #0056b3;
            }
          </style>
        `;

        let buttons = "";
        if (cancellationAllowed) {
          buttons = `
            <br><br>
            <a href="${process.env.WEBHOOK_URL}/webhook/email-response?action=cancel&scheduleId=${reminder.scheduleId}&email=${reminder.deliveryDestination}&practiceId=${reminder.practiceId}" class="button">Cancel</a>
            <a href="${process.env.WEBHOOK_URL}/webhook/email-response?action=confirm&scheduleId=${reminder.scheduleId}&email=${reminder.deliveryDestination}&practiceId=${reminder.practiceId}" class="button">Confirm</a>
          `;
        }

        const htmlContent = `
          ${style}
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Hello,</p>
            <p>${message}</p>
            ${buttons}
            <p>Best regards,<br>Your Company</p>
          </div>
        `;

        await sendEmail({
          msg: {
            to: reminder.deliveryDestination,
            from: process.env.EMAIL_FROM,
            subject: "Appointment Reminder",
            html: htmlContent,
            custom_args: {
              ...logData,
              type: "email",
              deliveryMethod: "Email",
            },
          },
          message,
        });
        break;
      case "Phone":
        await voiceCall({
          to: reminder.deliveryDestination,
          ...logData,
          deliveryMethod: "Phone",
          cancellationAllowed,
        });
        break;
      default:
        throw new Error(`Unknown delivery method: ${reminder.deliveryMethod}`);
    }

    console.log(`Reminder sent successfully: ${reminder.scheduleId}`);
  } catch (error) {
    console.error(`Failed to send reminder: ${reminder.scheduleId}`, error);
    await Log.create({
      practiceId: reminder.practiceId,
      scheduleId: reminder.scheduleId,
      entries: [
        {
          type: reminder.deliveryMethod.toLowerCase(),
          to: reminder.deliveryDestination,
          status: "failed",
          dateSent: new Date(),
          scriptId: reminder.templateId,
          message: message,
        },
      ],
      scriptId: reminder.templateId,
      dateSent: new Date(),
    });
    throw error;
  }
});

async function scheduleReminder(reminder) {
  try {
    const ianaTimeZone = windowsToIANA(reminder.timeZone);

    const deliveryTime = moment.tz(
      reminder.deliveryDateTime,
      "MM-DD-YYYY hh:mm A",
      ianaTimeZone
    );

    if (!deliveryTime.isValid()) {
      throw new Error(
        `Invalid delivery time or timezone: ${reminder.deliveryDateTime}, ${ianaTimeZone}`
      );
    }

    // const existingJobs = await agenda.jobs({
    //   "data.scheduleId": reminder.scheduleId,
    // });

    // if (existingJobs.length > 0) {
    //   // console.log(
    //   //   `Reminder for ${reminder.scheduleId} already scheduled. Skipping.`
    //   // );
    //   return;
    // }

    if (deliveryTime.isBefore(moment())) {
      console.log(
        `Reminder for ${reminder.scheduleId} is in the past. Skipping.`
      );
      return;
    }

    await agenda.schedule(deliveryTime.toDate(), "sendReminder", {
      ...reminder,
      timeZone: ianaTimeZone,
    });
    console.log(
      `Scheduled reminder for ${
        reminder.scheduleId
      } at ${deliveryTime.format()} (${ianaTimeZone})`
    );
  } catch (error) {
    console.error(
      `Error scheduling reminder for ${reminder.scheduleId}:`,
      error
    );
  }
}

async function cancelReminder(scheduleId) {
  try {
    await agenda.cancel({ "data.scheduleId": scheduleId });
    console.log(`Cancelled reminder for scheduleId: ${scheduleId}`);
  } catch (error) {
    console.error(
      `Error cancelling reminder for scheduleId: ${scheduleId}:`,
      error
    );
  }
}

exports.initializeQueue = async () => {
  try {
    await agenda.start();
    console.log("Agenda scheduler started");

    const reminderConfigs = await ReminderConfig.find();

    for (const config of reminderConfigs) {
      for (const reminder of config.reminders) {
        await scheduleReminder({
          ...reminder.toObject(),
          practiceId: config.practiceId,
        });
      }
    }

    console.log("All existing reminders have been scheduled");
  } catch (error) {
    console.error("Error initializing queue:", error);
  }
};

exports.addNewReminders = async (newConfig) => {
  try {
    for (const reminder of newConfig.reminders) {
      await scheduleReminder({
        ...reminder,
        practiceId: newConfig.practiceId,
      });
    }
  } catch (error) {
    console.error("Error adding new reminders:", error);
  }
};

exports.watchReminderConfigs = () => {
  const changeStream = ReminderConfig.watch();

  changeStream.on("change", async (change) => {
    try {
      if (change.operationType === "insert") {
        console.log("New reminder configuration added:", change.fullDocument);
        await this.addNewReminders(change.fullDocument);
      } else if (change.operationType === "update") {
        console.log(
          "Reminder configuration updated:",
          change.updateDescription
        );
        const updatedConfig = await ReminderConfig.findById(
          change.documentKey._id
        );
        if (updatedConfig) {
          for (const reminder of updatedConfig.reminders) {
            await cancelReminder(reminder.scheduleId);
          }
          await this.addNewReminders(updatedConfig);
        }
      } else if (change.operationType === "delete") {
        console.log("Reminder configuration deleted:", change.documentKey);

        console.log(
          "Note: Unable to cancel reminders for deleted configuration"
        );
      }
    } catch (error) {
      console.error("Error handling change in reminder configurations:", error);
    }
  });
};

async function clearPastReminders() {
  try {
    const now = new Date();
    await agenda.cancel({ nextRunAt: { $lt: now } });
    console.log("Past reminders cleared");
  } catch (error) {
    console.error("Error clearing past reminders:", error);
  }
}

agenda.on("error", (error) => {
  console.error("Agenda error:", error);
});

agenda.on("fail", (error, job) => {
  console.error(`Job failed: ${job.attrs._id}`, error);
});

module.exports = {
  initializeQueue: exports.initializeQueue,
  addNewReminders: exports.addNewReminders,
  watchReminderConfigs: exports.watchReminderConfigs,
  scheduleReminder,
  cancelReminder,
  clearPastReminders,
  agenda,
};
