const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // Optional, linking to Patient model
  patientName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  age: { type: Number, required: true },
  problem: { type: String, required: true },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Canceled'], default: 'Pending' },
  prescriptionNotes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
