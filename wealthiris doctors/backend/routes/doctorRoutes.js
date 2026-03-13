const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'doctor-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET /api/doctor/profile - Get logged-in doctor profile
router.get('/profile', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor.id).select('-password');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/doctor/profile - Update doctor profile
router.put('/profile', protect, upload.single('profilePhoto'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const fieldsToUpdate = ['fullName', 'phoneNumber', 'qualification', 'specialization', 
      'yearsOfExperience', 'hospitalClinicName', 'clinicAddress', 'consultationFees', 'aboutDoctor'];
    
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) doctor[field] = req.body[field];
    });

    if (req.body.availableDays) doctor.availableDays = JSON.parse(req.body.availableDays);
    if (req.body.availableTimeSlots) doctor.availableTimeSlots = JSON.parse(req.body.availableTimeSlots);
    
    if (req.file) {
      doctor.profilePhoto = `/uploads/${req.file.filename}`;
    }

    await doctor.save();
    
    // Return updated doctor without password
    const updatedDoctor = await Doctor.findById(req.doctor.id).select('-password');
    res.json({ message: 'Profile updated successfully', doctor: updatedDoctor });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ message: error.message || 'Server error during profile update' });
  }
});

// GET /api/doctor/dashboard - Get dashboard statistics
router.get('/dashboard', protect, async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    
    const appointments = await Appointment.find({ doctorId });
    
    const totalPatients = new Set(appointments.map(a => a.phoneNumber)).size; // Unique patients based on phone
    const totalAppointments = appointments.length;
    const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;
    const completedAppointments = appointments.filter(a => a.status === 'Completed').length;
    
    // Today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments.filter(a => a.appointmentDate === today).length;

    res.json({
      totalPatients,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      todaysAppointments
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

// ADMIN ROUTES
// GET /api/doctor/all - Admin: Get all doctors
router.get('/all', async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-password');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/doctor/:id/approve - Admin: Approve/Reject doctor
router.put('/:id/approve', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    
    doctor.isApproved = req.body.isApproved;
    await doctor.save();
    
    res.json({ message: 'Doctor status updated', isApproved: doctor.isApproved });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/doctor/:id - Admin: Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    // Also delete their appointments
    await Appointment.deleteMany({ doctorId: req.params.id });
    res.json({ message: 'Doctor deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
