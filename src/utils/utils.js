const twilio = require("twilio");
const sgMail = require("@sendgrid/mail");
const Log = require("../models/logModel");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function createOrUpdateLog(logData) {
  try {
    let log = await Log.findOne({
      scheduleId: logData.scheduleId,
      practiceId: logData.practiceId,
    });

    if (!log) {
      log = new Log({
        practiceId: logData.practiceId,
        scheduleId: logData.scheduleId,
        entries: [logData.entry],
        scriptId: logData.scriptId,
        dateSent: new Date(),
      });
    } else {
      const existingEntryIndex = log.entries.findIndex(
        (e) => e.to === logData.entry.to
      );
      if (existingEntryIndex !== -1) {
        log.entries[existingEntryIndex] = {
          ...log.entries[existingEntryIndex],
          ...logData.entry,
          updatedAt: new Date(),
        };
      } else {
        log.entries.push({
          ...logData.entry,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await log.save();
    console.log(`Log created/updated for ${logData.entry.type}:`, log);
  } catch (error) {
    console.error(
      `Error creating/updating log for ${logData.entry.type}:`,
      error
    );
  }
}

async function sendSMS({
  body,
  to,
  scriptId,
  message,
  scheduleId,
  deliveryMethod,
  practiceId,
  cancellationAllowed,
}) {
  const callBackUrl = `${
    process.env.WEBHOOK_URL
  }/webhook/twilio?scriptId=${encodeURIComponent(
    scriptId
  )}&message=${encodeURIComponent(message)}&scheduleId=${encodeURIComponent(
    scheduleId
  )}&dateSent=${encodeURIComponent(
    new Date().toISOString()
  )}&deliveryMethod=${encodeURIComponent(
    deliveryMethod
  )}&practiceId=${encodeURIComponent(practiceId)}`;

  try {
    const twilioMessage = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      statusCallback: callBackUrl,
    });

    console.log(`SMS sent: ${twilioMessage.sid}`);

    await createOrUpdateLog({
      practiceId,
      scheduleId,
      scriptId,
      entry: {
        type: "SMS",
        to,
        status: "sent",
        dateSent: new Date(),
        scriptId,
        messageId: twilioMessage.sid,
        message: body,
      },
    });

    return twilioMessage;
  } catch (err) {
    console.error("Error sending SMS:", err);
    throw err;
  }
}

async function sendEmail({ msg, message }) {
  try {
    const response = await sgMail.send(msg);
    console.log("Email sent:", response);

    await createOrUpdateLog({
      practiceId: msg.custom_args.practiceId,
      scheduleId: msg.custom_args.scheduleId,
      scriptId: msg.custom_args.scriptId,
      entry: {
        type: "Email",
        to: msg.to,
        status: "sent",
        dateSent: new Date(),
        scriptId: msg.custom_args.scriptId,
        messageId: response[0].headers["x-message-id"],
        message: message,
      },
    });

    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

async function voiceCall({
  to,
  scriptId,
  practiceId,
  deliveryMethod,
  message,
  scheduleId,
  cancellationAllowed = false,
}) {


  console.log("Message in the voice call", message);
   
  const callBackUrl = `${
    process.env.WEBHOOK_URL
  }/webhook/twilio?scriptId=${encodeURIComponent(
    scriptId
  )}&message=${encodeURIComponent(message)}&scheduleId=${encodeURIComponent(
    scheduleId
  )}&dateSent=${encodeURIComponent(
    new Date().toISOString()
  )}&deliveryMethod=${encodeURIComponent(
    deliveryMethod
  )}&practiceId=${encodeURIComponent(practiceId)}`;

  try {
    const call = await client.calls.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      url: `${
        process.env.WEBHOOK_URL
      }/webhook/voice?message=${encodeURIComponent(message)}`,
      statusCallback: callBackUrl,
    });

    console.log(`Call made: ${call.sid}`);

    const response = await createOrUpdateLog({
      practiceId,
      scheduleId,
      scriptId,
      entry: {
        type: "Phone",
        to,
        status: "initiated",
        dateSent: new Date(),
        scriptId,
        messageId: call.sid,
        message: message,
      },
    });

    console.log("Call created and details are updated in the createOrUpdateLog,,,,,,,,,,,,,,", response)

    return call;
  } catch (err) {
    console.error("Error making call:", err);
    throw err;
  }
}

module.exports = {
  sendSMS,
  sendEmail,
  voiceCall,
};
