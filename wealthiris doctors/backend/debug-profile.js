const mongoose = require('mongoose');
require('dotenv').config();
const Doctor = require('./models/Doctor');

async function debugUpdate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected DB');
  
  // Find a doctor
  const doctor = await Doctor.findOne();
  if(!doctor) { console.log('No doctor found'); process.exit(1); }
  console.log('Found doctor:', doctor.email);

  try {
    const fieldsToUpdate = ['fullName', 'phoneNumber', 'qualification', 'specialization', 
      'yearsOfExperience', 'hospitalClinicName', 'clinicAddress', 'consultationFees', 'aboutDoctor'];
    
    // Simulate updating
    const reqBody = {
      fullName: 'Dr. Test 2',
      phoneNumber: '123456',
      qualification: 'MBBS',
      specialization: 'Surgeon',
      yearsOfExperience: 10,
      hospitalClinicName: 'Test Hosp',
      clinicAddress: '123 Main St',
      consultationFees: 100,
      aboutDoctor: 'Testing'
    };

    fieldsToUpdate.forEach(field => {
      if (reqBody[field] !== undefined) doctor[field] = reqBody[field];
    });

    doctor.availableDays = ["Mon", "Tue"];
    doctor.availableTimeSlots = ["09:00 AM"];
    
    await doctor.save();
    console.log('Doctor saved successfully!');
  } catch(e) {
    console.error('Validation/Save Error:', e);
  }

  process.exit();
}

debugUpdate();
