const e = require("express");
const appointmentService = require("../services/appointmentService");
const eventEmitter = require("../utils/eventEmitter");

exports.createReminderConfig = async (req, res) => {
  try {
    const reminderConfig = await appointmentService.createReminderConfig(
      req.body
    );
    res.status(201).json(reminderConfig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRemindersLogs = async (req, res) => {
  const practiceId = req.query.practiceId;
  try {
    const reminderLogs = await appointmentService.getRemindersLog(practiceId);
    res.status(201).json(reminderLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReminderConfigs = async (req, res) => {
  try {
    const reminderConfigs = await appointmentService.getAllConfigs();
    res.status(201).json(reminderConfigs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReminderConfig = async (req, res) => {
  try {
    const result = await appointmentService.deleteReminderConfig(req.params.id);
    if (result) {
      res
        .status(200)
        .json({ message: "Reminder configuration deleted successfully" });
    } else {
      res.status(404).json({ message: "Reminder configuration not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReminderConfig = async (req, res) => {
  try {
    const updatedReminderConfig = await appointmentService.updateReminderConfig(
      req.params.id,
      req.body
    );
    if (updatedReminderConfig) {
      res.status(200).json(updatedReminderConfig);
    } else {
      res.status(404).json({ message: "Reminder configuration not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReminderSetting = async (req, res) => {
  try {
    const reminderSetting = await appointmentService.getReminderSetting();
    res.status(200).json(reminderSetting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReminderSetting = async (req, res) => {
  try {
    const reminderSetting = await appointmentService.createReminderSetting(
      req.body
    );
    res.status(201).json(reminderSetting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReminderSetting = async (req, res) => {
  try {
    const updatedReminderSetting =
      await appointmentService.updateReminderSetting(req.body);
    if (updatedReminderSetting) {
      res.status(200).json(updatedReminderSetting);
    } else {
      res.status(404).json({ message: "Reminder setting not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllScripts = async (req, res) => {
  try {
    const scripts = await appointmentService.getAllScripts();
    res.status(200).json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSingleScript = async (req, res) => {
  try {
    const script = await appointmentService.getSingleScript(req.params.id);
    if (script) {
      res.status(200).json(script);
    } else {
      res.status(404).json({ message: "Script not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createScript = async (req, res) => {
  try {
    const script = await appointmentService.createScript(req.body);
    res.status(201).json(script);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateScript = async (req, res) => {
  try {
    const updatedScript = await appointmentService.updateScript(
      req.params.id,
      req.body
    );
    if (updatedScript) {
      res.status(200).json(updatedScript);
    } else {
      res.status(404).json({ message: "Script not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteScript = async (req, res) => {
  try {
    const result = await appointmentService.deleteScript(req.params.id);
    if (result) {
      res.status(200).json({ message: "Script deleted successfully", result });
    } else {
      res.status(404).json({ message: "Script not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createScriptId = async (req, res) => {
  try {
    const scriptId = await appointmentService.createScriptId();
    res.status(200).json(scriptId);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReminderSettings = async (req, res) => {
  try {
    const reminderSettings = await appointmentService.getReminderSettings();
    res.status(200).json(reminderSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReminderSettings = async (req, res) => {
  try {
    const updatedReminderSettings =
      await appointmentService.updateReminderSettings(req.body);
    res.status(200).json(updatedReminderSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateScriptActiveStatus = async (req, res) => {
  try {
    const updatedScript = await appointmentService.updateScriptActiveStatus(
      req.params.id,
      req.body
    );
    if (updatedScript) {
      res.status(200).json(updatedScript);
    } else {
      res.status(404).json({ message: "Script not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRules = async (req, res) => {
  try {
    const rules = await appointmentService.getRules(req.params.practiceId);
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRules = async (req, res) => {
  try {
    const { practiceId } = req.params;
    const rule = await appointmentService.createOrUpdateRule(
      practiceId,
      req.body
    );
    console.log("Create rule, ", rule);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.subscribeToLogUpdates = (req, res) => {
  const practiceId = req.query.practiceId;

  if (!practiceId) {
    return res.status(400).json({ message: "Practice ID is required" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      message: "Connected to log updates",
    })}\n\n`
  );

  const handleLogUpdate = (log) => {
    if (log.practiceId === practiceId) {
      res.write(`event: logUpdated\ndata: ${JSON.stringify(log)}\n\n`);
    }
  };

  eventEmitter.addClient(res);
  eventEmitter.on("logUpdated", handleLogUpdate);

  req.on("close", () => {
    eventEmitter.removeClient(res);
    eventEmitter.removeListener("logUpdated", handleLogUpdate);
  });
};

module.exports = exports;
