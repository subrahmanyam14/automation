const webhookService = require("../services/webhookService");
const Log = require("../models/logModel");
const twilio = require("twilio");

exports.twilioWebhook = async (req, res) => {
  const { SmsSid, CallSid, MessageStatus, CallStatus, To } = req.body;

  const { scriptId, scheduleId, practiceId, dateSent, deliveryMethod } =
    req.query;

  console.log("Received Twilio webhook:", req.body, req.query);

  const isSMS = !!SmsSid;
  const status = isSMS ? MessageStatus : CallStatus;
  const messageId = SmsSid || CallSid;

  try {
    const log = await Log.findOne({
      scheduleId,
      practiceId,
      "entries.messageId": messageId,
    });

    if (!log) {
      console.error(
        `No log found for ${
          isSMS ? "SMS" : "Call"
        } with messageId: ${messageId}`
      );
      return res.status(404).send("Log not found");
    }

    const entryIndex = log.entries.findIndex(
      (entry) => entry.messageId === messageId
    );

    if (entryIndex === -1) {
      console.error(
        `No entry found in log for ${
          isSMS ? "SMS" : "Call"
        } with messageId: ${messageId}`
      );
      return res.status(404).send("Log entry not found");
    }

    log.entries[entryIndex] = {
      ...log.entries[entryIndex],
      status,
      updatedAt: new Date(),
    };

    if (["delivered", "undelivered", "failed", "completed"].includes(status)) {
      log.entries[entryIndex].finalStatus = status;
    }

    await log.save();
    console.log(`Updated log for ${isSMS ? "SMS" : "Call"}:`, log);

    res.status(200).send("Webhook processed successfully");
  } catch (err) {
    console.error("Error processing Twilio webhook:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.smsResponse = async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const incomingMessage = req.body.Body.toLowerCase();
  const fromNumber = req.body.From;

  console.log("Received message:", req.body);

  try {
    const log = await Log.findOne(
      { "entries.to": fromNumber },
      {
        entries: {
          $elemMatch: {
            to: fromNumber,
          },
        },
      }
    ).sort({ "entries.dateSent": -1 });

    if (!log) {
      twiml.message(
        "We couldn't find any recent messages sent to this number."
      );
      res.writeHead(200, { "Content-Type": "text/xml" });
      return res.end(twiml.toString());
    }

    const entry = log.entries[0];

    let response;
    if (incomingMessage === "confirm") {
      response = "confirm";
      twiml.message("Thank you for confirming your appointment.");
    } else if (incomingMessage === "cancel") {
      response = "cancel";
      twiml.message("Your appointment has been cancelled.");
    } else {
      twiml.message(
        'Invalid response. Please reply with "confirm" or "cancel".'
      );
      res.writeHead(200, { "Content-Type": "text/xml" });
      return res.end(twiml.toString());
    }

    console.log("Updating log entry:", entry);

    await Log.updateOne(
      {
        _id: log._id,
        "entries.to": fromNumber,
      },
      {
        $set: {
          "entries.$.response": response,
          "entries.$.updatedAt": new Date(),
        },
      }
    );

    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  } catch (error) {
    console.error("Error processing SMS response:", error);
    twiml.message(
      "An error occurred while processing your response. Please try again later."
    );
    res.writeHead(500, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  }
};

exports.sendGridWebhook = async (req, res) => {
  const events = req.body;
  console.log("Received events:", events);

  try {
    for (const event of events) {
      const { email, timestamp, event: status, sg_message_id } = event;
      const { scriptId, visitType, template, scheduleId, practiceId } = event;

      const entry = {
        type: "email",
        to: email,
        status,
        messageId: sg_message_id,
        dateSent: timestamp ? new Date(timestamp * 1000) : new Date(),
        scriptId,
        visitType,
        template,
      };

      const updatedLog = await Log.findOneAndUpdate(
        { scheduleId },
        {
          $set: { practiceId },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, new: true }
      );

      const existingEntryIndex = updatedLog.entries.findIndex(
        (e) => e.to === email
      );

      if (existingEntryIndex !== -1) {
        updatedLog.entries[existingEntryIndex] = {
          ...updatedLog.entries[existingEntryIndex],
          ...entry,
          updatedAt: new Date(),
        };
      } else {
        updatedLog.entries.push({
          ...entry,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await updatedLog.save();
    }

    res.status(201).send("Email logs updated");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.sendGridWebhookResponse = async (req, res) => {
  const { action, scheduleId, practiceId, email } = req.query;

  try {
    const updatedLog = await Log.findOneAndUpdate(
      {
        scheduleId,
        "entries.to": email,
      },
      {
        $set: {
          practiceId,
          "entries.$.status": "responded",
          "entries.$.response": action,
          "entries.$.updatedAt": new Date(),
        },
      },
      { new: true, upsert: false }
    );

    if (!updatedLog) {
      console.log(`No log found for messageId: ${messageId}, email: ${email}`);
      return res.status(404).send("Log entry not found");
    }

    console.log(`Updated log for email response:`, updatedLog);

    res.status(200).send(`
      <html>
        <head>
          <title>Response Recorded</title>
        </head>
        <body>
          <h1>Thank you for your response</h1>
          <p>Your ${action} has been recorded.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Error processing email response:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.twilioVoiceCall = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const { message } = req.query;

  console.log("Calling with message", message);

  const gather = twiml.gather({
    numDigits: 1,
    action: "/webhook/voice-response",
    method: "POST",
  });

  gather.say(`${message}. Press 1 to confirm, or 2 to cancel.`);

  twiml.redirect("/voice");

  res.type("text/xml");
  res.send(twiml.toString());
};

exports.twilioVoiceResponse = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const selectedOption = req.body.Digits;
  const callSid = req.body.CallSid;
  let response;

  console.log("Twilio request body:", req.body);  // Log request body
  console.log("Received callSid:", callSid);  // Log callSid
  console.log("Selected option:", selectedOption);  // Log selected digits

  try {
    if (selectedOption === "1") {
      twiml.say("Thank you for confirming");
      response = "confirm";
    } else if (selectedOption === "2") {
      twiml.say("Your appointment has been cancelled");
      response = "cancel";
    } else {
      twiml.say("Invalid option selected. Please try again.");
      twiml.redirect("/webhook/voice");
      res.type("text/xml");
      return res.send(twiml.toString());
    }

    console.log("Twilio response: ", response);

    const updatedLog = await Log.findOneAndUpdate(
      { "entries.messageId": callSid },
      {
        $set: {
          "entries.$.response": response,
          "entries.$.updatedAt": new Date(),
          "entries.$.status": "responded",
        },
      },
      { new: true }
    );

    if (!updatedLog) {
      console.error("Log not found or not updated for callSid:", callSid);
      twiml.say("Sorry, we could not process your response.");
      res.type("text/xml");
      return res.send(twiml.toString());
    }

    console.log("Log updated:", updatedLog);  // Log updated log

    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error("Error processing voice response:", error);
    twiml.say("An error occurred while processing your response. Please try again later.");
    res.type("text/xml");
    res.send(twiml.toString());
  }
};

