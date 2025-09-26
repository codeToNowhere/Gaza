// Sequence.js
const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  value: { type: Number, default: 0 },
});

module.exports = mongoose.model("Sequence", sequenceSchema);
