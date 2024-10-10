const Log = require("../models/logModel");

exports.createLog = async (logData) => {
  const log = new Log(logData);
  return await log.save();
};

exports.createEmailLog = async (logData) => {
  const log = new Log(logData);
  return await log.save();
};

exports.getAllLogs = async () => {
  const logs = await Log.find();
  return { logs };
};

exports.getLogById = async (id) => {
  return await Log.findById(id);
};

exports.updateLog = async (id, logData) => {
  return await Log.findByIdAndUpdate(id, logData, {
    new: true,
    runValidators: true,
  });
};

exports.deleteLog = async (id) => {
  return await Log.findByIdAndDelete(id);
};

exports.addOrUpdateLogEmail = async (logData) => {
  const { scheduleId, email, action, practiceId } = logData;

  try {
    const existingLog = await Log.findOne({
      scheduleId,
      "entries.to": email,
    });

    if (existingLog) {
      const updatedLog = await Log.findOneAndUpdate(
        { scheduleId, "entries.to": email },
        {
          $set: {
            "entries.$.response": action,
            "entries.$.updatedAt": Date.now(),
          },
        },
        { new: true }
      );

      return updatedLog;
    }
    // else {
    //   const updatedLog = await Log.findOneAndUpdate(
    //     { scheduleId },
    //     {
    //       $push: {
    //         entries: {
    //           to: email,
    //           response: action,
    //           updatedAt: Date.now(),
    //           dateSent: new Date(), // Add additional fields as needed
    //         },
    //       },
    //       $setOnInsert: { createdAt: new Date() }, // Set createdAt only on insert
    //     },
    //     { new: true, upsert: true }
    //   );

    // return updatedLog;
    // }
  } catch (error) {
    console.error("Error adding or updating log entry:", error);
    throw error;
  }
};
