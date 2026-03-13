const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {

  // Simple Tab Switching
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

  const loadTabData = (tabId) => {
    if (tabId === 'doctorsTab') loadDoctors();
    if (tabId === 'appointmentsTab') loadAppointments();
  };

  loadTabData('doctorsTab');

  // Load Doctors
  async function loadDoctors() {
    try {
      const res = await fetch(`${API_URL}/doctor/all`);
      const doctors = await res.json();
      
      const tbody = document.querySelector('#doctorsTable tbody');
      tbody.innerHTML = '';
      
      if(doctors.length === 0){
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No doctors registered.</td></tr>';
        return;
      }

      doctors.forEach(doc => {
        const statusBadge = doc.isApproved 
          ? `<span class="status-badge status-completed">Approved</span>`
          : `<span class="status-badge status-pending">Pending Approval</span>`;

        let actionBtns = '';
        if(!doc.isApproved) {
            actionBtns += `<button class="btn btn-success btn-sm" onclick="approveDoctor('${doc._id}')">Approve</button> `;
        }
        actionBtns += `<button class="btn btn-danger btn-sm" onclick="deleteDoctor('${doc._id}')">Delete</button>`;

        const img = doc.profilePhoto ? `http://localhost:5000${doc.profilePhoto}` : 'https://via.placeholder.com/50';

        tbody.innerHTML += `
          <tr>
            <td><img src="${img}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;"></td>
            <td><strong>${doc.fullName}</strong><br><small>${doc.email}</small></td>
            <td>${doc.qualification} - ${doc.specialization}</td>
            <td>${statusBadge}</td>
            <td>${actionBtns}</td>
          </tr>
        `;
      });
    } catch(err) {
      console.error(err);
    }
  }

  // Load All Appointments
  async function loadAppointments() {
    try {
      const res = await fetch(`${API_URL}/appointments/all`);
      const appointments = await res.json();
      
      const tbody = document.querySelector('#allAppointmentsTable tbody');
      tbody.innerHTML = '';
      
      if(appointments.length === 0){
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No appointments found.</td></tr>';
        return;
      }

      appointments.forEach(appt => {
        const docName = appt.doctorId ? appt.doctorId.fullName : 'Unknown';
        tbody.innerHTML += `
          <tr>
            <td>${appt.appointmentDate} <small>${appt.appointmentTime}</small></td>
            <td><strong>${docName}</strong></td>
            <td>${appt.patientName} (${appt.phoneNumber})</td>
            <td><span class="status-badge status-${appt.status.toLowerCase()}">${appt.status}</span></td>
          </tr>
        `;
      });
    } catch(err) {
      console.error(err);
    }
  }

  // Global actions for admin
  window.approveDoctor = async (id) => {
    if(!confirm('Approve this doctor?')) return;
    try {
      await fetch(`${API_URL}/doctor/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true })
      });
      loadDoctors();
    } catch(err) {
      alert(err.message);
    }
  };

  window.deleteDoctor = async (id) => {
    if(!confirm('Are you sure you want to delete this doctor? Have you verified they are fake?')) return;
    try {
      await fetch(`${API_URL}/doctor/${id}`, {
        method: 'DELETE'
      });
      loadDoctors();
    } catch(err) {
      alert(err.message);
    }
  };
});
