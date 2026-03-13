document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  const token = localStorage.getItem('doctorToken');
  const doctorInfo = JSON.parse(localStorage.getItem('doctorInfo') || '{}');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // Set Profile info in nav
  document.getElementById('navName').textContent = doctorInfo.fullName || 'Doctor';
  const imgUrl = doctorInfo.profilePhoto ? `http://localhost:5000${doctorInfo.profilePhoto}` : 'https://via.placeholder.com/150';
  document.getElementById('navAvatar').src = imgUrl;

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorInfo');
    window.location.href = 'index.html';
  });

  // Tab Switching
  const tabs = document.querySelectorAll('.sidebar-menu li');
  const contents = document.querySelectorAll('.tab-content');

  window.switchTab = (targetId) => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.add('hidden'));

    const tab = Array.from(tabs).find(t => t.dataset.target === targetId);
    if (tab) tab.classList.add('active');
    
    const content = document.getElementById(targetId);
    if(content) {
      content.classList.remove('hidden');
      loadTabData(targetId);
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.target);
    });
  });

  // Load Data based on Tab
  const loadTabData = (tabId) => {
    if (tabId === 'dashboardTab') {
      loadDashboardStats();
      loadAppointments(true); // today only
    } else if (tabId === 'appointmentsTab') {
      loadAppointments(false); // all
    } else if (tabId === 'historyTab') {
      loadHistory();
    } else if (tabId === 'profileTab') {
      loadProfileInfo();
    }
  };

  // Initial Load
  loadTabData('dashboardTab');

  // --- Functions ---
  async function loadDashboardStats() {
    try {
      const stats = await api.getDashboardStats();
      document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
          <div class="stat-info"><h3>${stats.totalPatients}</h3><p>Total Patients</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-calendar-day"></i></div>
          <div class="stat-info"><h3>${stats.todaysAppointments}</h3><p>Today's Appointments</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="color:var(--warning); background:#feebc8;"><i class="fa-solid fa-hourglass-half"></i></div>
          <div class="stat-info"><h3>${stats.pendingAppointments}</h3><p>Pending Appointments</p></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="color:var(--success); background:#c6f6d5;"><i class="fa-solid fa-check-double"></i></div>
          <div class="stat-info"><h3>${stats.completedAppointments}</h3><p>Completed Appointments</p></div>
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAppointments(onlyToday = false) {
    try {
      const appointments = await api.getDoctorAppointments();
      const today = new Date().toISOString().split('T')[0];

      if (onlyToday) {
        const todaysList = appointments.filter(a => a.appointmentDate === today);
        renderTable('todayAppointmentsTable', todaysList, true);
      } else {
        const pendingList = appointments.filter(a => a.status === 'Pending');
        const pastList = appointments.filter(a => a.status !== 'Pending');
        renderTable('pendingAppointmentsTable', pendingList, false, true);
        renderPastTable('pastAppointmentsTable', pastList);
      }
    } catch (err) {
      console.error(err);
    }
  }
  
  async function loadHistory() {
     try {
       const appointments = await api.getDoctorAppointments();
       const pastList = appointments.filter(a => a.status !== 'Pending');
       
       const tbody = document.querySelector('#patientHistoryTable tbody');
       tbody.innerHTML = '';
       if (pastList.length === 0) {
           tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No history available</td></tr>';
           return;
       }
       pastList.forEach(appt => {
         tbody.innerHTML += `
           <tr>
             <td>${appt.appointmentDate}</td>
             <td><strong>${appt.patientName}</strong><br><small>${appt.phoneNumber}</small></td>
             <td>${appt.problem}</td>
             <td>${appt.prescriptionNotes || '-'}</td>
             <td><span class="status-badge status-${appt.status.toLowerCase()}">${appt.status}</span></td>
           </tr>
         `;
       });
     } catch (err) {
       console.error(err);
     }
  }

  function renderTable(tableId, data, isTodayView = false, isPendingView = false) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No appointments found.</td></tr>`;
      return;
    }

    data.forEach(appt => {
      let actions = '-';
      if (appt.status === 'Pending') {
        actions = `
          <button class="btn btn-success btn-sm" onclick="openModal('${appt._id}', 'Completed')"><i class="fa-solid fa-check"></i> Complete</button>
          <button class="btn btn-danger btn-sm" onclick="openModal('${appt._id}', 'Canceled')"><i class="fa-solid fa-xmark"></i> Cancel</button>
        `;
      }

      if (isTodayView) {
        tbody.innerHTML += `
          <tr>
            <td><strong>${appt.patientName}</strong><br><small>${appt.age} yrs, ${appt.phoneNumber}</small></td>
            <td>${appt.appointmentTime}</td>
            <td>${appt.problem}</td>
            <td><span class="status-badge status-${appt.status.toLowerCase()}">${appt.status}</span></td>
            <td>${actions}</td>
          </tr>
        `;
      } else if (isPendingView) {
        tbody.innerHTML += `
          <tr>
            <td><strong>${appt.appointmentDate}</strong><br><small>${appt.appointmentTime}</small></td>
            <td><strong>${appt.patientName}</strong><br><small>${appt.age} yrs, ${appt.phoneNumber}</small></td>
            <td>${appt.problem}</td>
            <td>${actions}</td>
          </tr>
        `;
      }
    });
  }

  function renderPastTable(tableId, data) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No past appointments.</td></tr>`;
      return;
    }

    data.forEach(appt => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${appt.appointmentDate}</strong><br><small>${appt.appointmentTime}</small></td>
          <td><strong>${appt.patientName}</strong><br><small>${appt.phoneNumber}</small></td>
          <td><span class="status-badge status-${appt.status.toLowerCase()}">${appt.status}</span></td>
          <td>${appt.prescriptionNotes || '-'}</td>
        </tr>
      `;
    });
  }

  // Profile
  async function loadProfileInfo() {
    try {
      const data = await api.getProfile();
      
      const img = data.profilePhoto ? `http://localhost:5000${data.profilePhoto}` : 'https://via.placeholder.com/150';
      document.getElementById('profileImg').src = img;
      document.getElementById('profileName').textContent = data.fullName;
      document.getElementById('profileQual').innerHTML = `<strong>${data.qualification}</strong> - ${data.specialization}`;
      document.getElementById('profileClinic').textContent = `${data.hospitalClinicName} (${data.yearsOfExperience} yrs exp)`;
      
      // Populate Form
      document.getElementById('upName').value = data.fullName;
      document.getElementById('upPhone').value = data.phoneNumber;
      document.getElementById('upQualification').value = data.qualification;
      document.getElementById('upSpecialization').value = data.specialization;
      document.getElementById('upExperience').value = data.yearsOfExperience;
      document.getElementById('upFees').value = data.consultationFees;
      document.getElementById('upClinicName').value = data.hospitalClinicName;
      document.getElementById('upClinicAddress').value = data.clinicAddress;
      document.getElementById('upDays').value = (data.availableDays || []).join(', ');
      document.getElementById('upTimes').value = (data.availableTimeSlots || []).join(', ');
      document.getElementById('upAbout').value = data.aboutDoctor || '';
    } catch(err){
      console.error(err);
    }
  }

  // Profile Edit
  document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.getElementById('profileViewCard').classList.add('hidden');
    document.getElementById('editProfileBox').classList.remove('hidden');
  });

  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editProfileBox').classList.add('hidden');
    document.getElementById('profileViewCard').classList.remove('hidden');
  });

  document.getElementById('updateProfileForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const btn = document.getElementById('upSubmitBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('fullName', document.getElementById('upName').value);
      formData.append('phoneNumber', document.getElementById('upPhone').value);
      formData.append('qualification', document.getElementById('upQualification').value);
      formData.append('specialization', document.getElementById('upSpecialization').value);
      formData.append('yearsOfExperience', document.getElementById('upExperience').value);
      formData.append('consultationFees', document.getElementById('upFees').value);
      formData.append('hospitalClinicName', document.getElementById('upClinicName').value);
      formData.append('clinicAddress', document.getElementById('upClinicAddress').value);
      formData.append('availableDays', JSON.stringify(document.getElementById('upDays').value.split(',').map(s=>s.trim())));
      formData.append('availableTimeSlots', JSON.stringify(document.getElementById('upTimes').value.split(',').map(s=>s.trim())));
      formData.append('aboutDoctor', document.getElementById('upAbout').value);

      const file = document.getElementById('upPhoto').files[0];
      if (file) formData.append('profilePhoto', file);

      await api.updateProfile(formData);
      
      document.getElementById('upSuccess').style.display = 'block';
      setTimeout(() => {
        document.getElementById('upSuccess').style.display = 'none';
        document.getElementById('editProfileBox').classList.add('hidden');
        document.getElementById('profileViewCard').classList.remove('hidden');
        loadProfileInfo();
      }, 1500);

    } catch (err) {
      document.getElementById('upError').textContent = err.message;
    } finally {
      btn.textContent = 'Save Changes';
      btn.disabled = false;
    }
  });

  // Modal actions
  const actionModal = document.getElementById('actionModal');
  actionModal.style.display = 'none'; // initialize

  window.openModal = (appId, action) => {
    actionModal.classList.remove('hidden');
    actionModal.style.display = 'flex'; 
    document.getElementById('modalApptId').value = appId;
    document.getElementById('modalActionType').value = action;
    
    const title = document.getElementById('modalTitle');
    const btn = document.getElementById('modalConfirmBtn');
    
    if (action === 'Completed') {
      title.textContent = 'Mark Appointment Completed';
      btn.className = 'btn btn-success btn-block';
      btn.textContent = 'Complete Appointment';
    } else {
      title.textContent = 'Cancel Appointment';
      btn.className = 'btn btn-danger btn-block';
      btn.textContent = 'Confirm Cancellation';
    }
  };

  document.getElementById('modalCancelBtn').addEventListener('click', () => {
    actionModal.classList.add('hidden');
    actionModal.style.display = 'none';
    document.getElementById('modalNotes').value = '';
  });

  document.getElementById('modalConfirmBtn').addEventListener('click', async () => {
    const id = document.getElementById('modalApptId').value;
    const action = document.getElementById('modalActionType').value;
    const notes = document.getElementById('modalNotes').value;

    const btn = document.getElementById('modalConfirmBtn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
      await api.updateAppointmentStatus(id, action, notes);
      actionModal.classList.add('hidden');
      actionModal.style.display = 'none';
      document.getElementById('modalNotes').value = '';
      
      // reload matching view
      const activeTab = document.querySelector('.sidebar-menu li.active').dataset.target;
      if (activeTab === 'dashboardTab') {
        loadDashboardStats();
        loadAppointments(true);
      } else {
        loadAppointments(false);
      }
    } catch(err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
    }
  });

});
