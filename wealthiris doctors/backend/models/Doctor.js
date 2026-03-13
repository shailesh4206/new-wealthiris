const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  profilePhoto: { type: String }, // Store path to image
  qualification: { type: String, required: true },
  specialization: { type: String, required: true },
  yearsOfExperience: { type: Number, required: true },
  hospitalClinicName: { type: String, required: true },
  clinicAddress: { type: String, required: true },
  consultationFees: { type: Number, required: true },
  availableDays: [{ type: String }],
  availableTimeSlots: [{ type: String }],
  aboutDoctor: { type: String },
  isApproved: { type: Boolean, default: false } // For Admin Panel
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
