// models/vehicleHistoryModel.js
const mongoose = require("mongoose");

const vehicleHistorySchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true },
  actionType: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  performedBy: { type: String }, // optional: user name or ID
  previousData: { type: Object }, // before update/delete
  newData: { type: Object }, // after create/update
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("VehicleHistory", vehicleHistorySchema);
