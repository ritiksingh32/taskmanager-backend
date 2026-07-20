const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  orgId: { type: String, required: true },       // multi-tenancy, even in MongoDB
  taskId: { type: String, required: true },
  userId: { type: String, required: true },
  action: { type: String, required: true },       // e.g., "TASK_CREATED", "STATUS_CHANGED"
  details: { type: mongoose.Schema.Types.Mixed }, // flexible — different shape per action type
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);