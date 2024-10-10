const ReminderConfig = require("../models/reminderConfigModel");
const RemindersLog = require("../models/logModel");
const ScriptModel = require("../models/scriptModel");
const RuleModel = require("../models/rulesModel");

exports.getAllConfigs = async () => {
  const allConfigs = await ReminderConfig.find();

  return { configs: allConfigs };
};

exports.createReminderConfig = async (reminderConfigData) => {
  const reminderConfig = new ReminderConfig(reminderConfigData);
  return await reminderConfig.save();
};

exports.getRemindersLog = async (practiceId) => {
  const remindersLog = await RemindersLog.find({ practiceId: practiceId });
  return { remindersLog };
};

exports.deleteConfig = async (configId) => {
  return await ReminderConfig.findByIdAndDelete(configId);
};

exports.editConfig = async (configId) => {
  return await ReminderConfig.findByIdAndUpdate(id, reminderConfigData, {
    new: true,
    runValidators: true,
  });
};

exports.getReminderSetting = async () => {
  const reminderSetting = await ReminderSettingModel.findOne();
  return { reminderSetting };
};

exports.createReminderSetting = async (reminderSettingData) => {
  const reminderSetting = new ReminderSettingModel(reminderSettingData);
  return await reminderSetting.save();
};

exports.updateReminderSetting = async (reminderSettingData) => {
  return await ReminderSettingModel.findOneAndUpdate({}, reminderSettingData, {
    new: true,
  });
};

exports.getAllScripts = async () => {
  const scripts = await ScriptModel.find();
  return { scripts };
};

exports.getSingleScript = async (id) => {
  return await ScriptModel.findById(id);
};

exports.createScript = async (scriptData) => {
  const script = new ScriptModel(scriptData);
  return await script.save();
};

exports.updateScript = async (id, scriptData) => {
  return await ScriptModel.findByIdAndUpdate(id, scriptData, {
    new: true,
    runValidators: true,
  });
};

exports.deleteScript = async (id) => {
  return await ScriptModel.findByIdAndDelete(id);
};

exports.createScriptId = async () => {
  const scripts = await ScriptModel.find();
  const scriptId = scripts.length + 1;
  let formattedScriptID = scriptId.toString().padStart(4, "0");
  return { scriptId: formattedScriptID };
};

exports.getReminderSettings = async (providerId) => {
  const reminderSettings = await ReminderSettingModel.find({ providerId });
  return { reminderSettings };
};

exports.updateReminderSettings = async (providerId, reminderSettingsData) => {
  return await ReminderSettingModel.findOneAndUpdate(
    { providerId },
    reminderSettingsData,
    {
      new: true,
    }
  );
};

exports.updateScriptActiveStatus = async (id, scriptData) => {
  const { active } = scriptData;
  return await ScriptModel.findByIdAndUpdate(
    id,
    { active, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );
};

exports.getRules = async (practiceId) => {
  const rules = await RuleModel.find({ practiceId });
  console.log(rules);
  return { rules };
};

exports.createOrUpdateRule = async (practiceId, ruleData) => {
  try {
    const updatedRule = await RuleModel.findOneAndUpdate(
      { practiceId: practiceId },
      { $set: ruleData },
      { new: true, upsert: true }
    );
    return updatedRule;
  } catch (error) {
    throw new Error(`Failed to create or update rule: ${error.message}`);
  }
};
