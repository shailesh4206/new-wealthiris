const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/authMiddleware');

// POST /api/appointments - Create an appointment (Public or Patient facing)
router.post('/', async (req, res) => {
  try {
    const { doctorId, patientName, phoneNumber, age, problem, appointmentDate, appointmentTime } = req.body;

    // Check if patient exists, else create one
    let patient = await Patient.findOne({ phoneNumber });
    if (!patient) {
      patient = new Patient({ name: patientName, phoneNumber, age });
      await patient.save();
    }

    const appointment = new Appointment({
      doctorId,
      patientId: patient._id,
      patientName,
      phoneNumber,
      age,
      problem,
      appointmentDate,
      appointmentTime
    });

    await appointment.save();

    res.status(201).json({ message: 'Appointment created successfully', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating appointment' });
  }
});

// GET /api/appointments/doctor - Get logged in doctor's appointments
router.get('/doctor', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.doctor.id }).sort({ appointmentDate: 1, appointmentTime: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// GET /api/appointments/doctor/today - Get today's appointments
router.get('/doctor/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const appointments = await Appointment.find({ doctorId: req.doctor.id, appointmentDate: today }).sort({ appointmentTime: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// PUT /api/appointments/:id/status - Accept, Mark Completed, Cancel
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, prescriptionNotes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Ensure the appointment belongs to the logged-in doctor
    if (appointment.doctorId.toString() !== req.doctor.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (status) appointment.status = status;
    if (prescriptionNotes !== undefined) appointment.prescriptionNotes = prescriptionNotes;

    await appointment.save();

    res.json({ message: `Appointment marked as ${status}`, appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating appointment' });
  }
});

// ADMIN ROUTES
// GET /api/appointments/all - Admin: View all appointments
router.get('/all', async (req, res) => {
  try {
    // Populate doctor details
    const appointments = await Appointment.find().populate('doctorId', 'fullName specializaton hospitalClinicName');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
