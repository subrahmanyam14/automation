const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");

router.get("/ping", (req, res) => {
  res.send("pong");
});

router.get("/reminder-configs", appointmentController.getReminderConfigs);

router.get("/reminders-log", appointmentController.getRemindersLogs);

router.post("/reminder-config", appointmentController.createReminderConfig);
router.delete(
  "/reminder-config/:id",
  appointmentController.deleteReminderConfig
);
router.put("/reminder-config/:id", appointmentController.updateReminderConfig);

router.get("/reminder-setting", appointmentController.getReminderSetting);
router.post("/reminder-setting", appointmentController.createReminderSetting);
router.put("/reminder-setting", appointmentController.updateReminderSetting);

router.get("/scripts", appointmentController.getAllScripts);
router.get("/get-single-script/:id", appointmentController.getSingleScript);
router.post("/create-script", appointmentController.createScript);
router.put("/edit-script/:id", appointmentController.updateScript);
router.delete("/delete-script/:id", appointmentController.deleteScript);
router.get("/create-scriptId", appointmentController.createScriptId);
router.put(
  "/update-script-status/:id",
  appointmentController.updateScriptActiveStatus
);

router.get(
  "/subscribe-log-updates",
  appointmentController.subscribeToLogUpdates
);

router.get("/get-reminder-rules/:practiceId", appointmentController.getRules);

router.post(
  "/save-reminder-rules/:practiceId",
  appointmentController.createRules
);

module.exports = router;
