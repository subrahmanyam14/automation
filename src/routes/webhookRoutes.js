// src/routes/webhookRoutes.js
const express = require("express");
const {
  twilioWebhook,
  sendGridWebhook,
  sendGridWebhookResponse,
  twilioVoiceCall,
  twilioVoiceResponse,
  smsResponse,
} = require("../controllers/webhookController");
const router = express.Router();

router.post("/sms", twilioWebhook);
router.post("/sms-response", smsResponse);
router.post("/email", sendGridWebhook);
router.post("/voice", twilioVoiceCall);
router.post("/voice-response", twilioVoiceResponse);
router.get("/email-response", sendGridWebhookResponse);

module.exports = router;
