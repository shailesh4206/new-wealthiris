const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const Doctor = require('../models/Doctor');

// Multer storage setup for profile photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'doctor-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// POST /api/auth/register - Doctor Registration
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const {
      fullName, email, phoneNumber, password, qualification, specialization,
      yearsOfExperience, hospitalClinicName, clinicAddress, consultationFees,
      availableDays, availableTimeSlots, aboutDoctor
    } = req.body;

    // Check if doctor exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) return res.status(400).json({ message: 'Doctor already exists with this email' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Profile photo path
    const profilePhoto = req.file ? `/uploads/${req.file.filename}` : '';

    // Create doctor
    const newDoctor = new Doctor({
      fullName, email, phoneNumber, password: hashedPassword, profilePhoto,
      qualification, specialization, yearsOfExperience, hospitalClinicName,
      clinicAddress, consultationFees, 
      availableDays: JSON.parse(availableDays || '[]'),
      availableTimeSlots: JSON.parse(availableTimeSlots || '[]'),
      aboutDoctor
    });

    await newDoctor.save();

    // Generate JWT for automatic login
    const token = jwt.sign(
      { id: newDoctor._id, email: newDoctor.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Registration Successful',
      token,
      doctor: {
        id: newDoctor._id,
        fullName: newDoctor.fullName,
        email: newDoctor.email,
        profilePhoto: newDoctor.profilePhoto,
        isApproved: newDoctor.isApproved
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login - Doctor Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(400).json({ message: 'Invalid credentials' });

    // Validate password
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT
    const token = jwt.sign(
      { id: doctor._id, email: doctor.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        profilePhoto: doctor.profilePhoto,
        isApproved: doctor.isApproved
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
