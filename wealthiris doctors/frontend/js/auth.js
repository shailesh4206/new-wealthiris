document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const landingSection = document.getElementById('landingSection');
  const authSection = document.getElementById('authSection');
  const loginBox = document.getElementById('loginBox');
  const registerBox = document.getElementById('registerBox');

  const showLoginBtn = document.getElementById('showLoginBtn');
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const heroRegisterBtn = document.getElementById('heroRegisterBtn');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Navigation logic
  const showLogin = () => {
    landingSection.classList.add('hidden');
    authSection.classList.remove('hidden');
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
  };

  const showRegister = () => {
    landingSection.classList.add('hidden');
    authSection.classList.remove('hidden');
    loginBox.classList.add('hidden');
    registerBox.classList.remove('hidden');
  };

  // Event Listeners
  if(showLoginBtn) showLoginBtn.addEventListener('click', showLogin);
  if(showRegisterBtn) showRegisterBtn.addEventListener('click', showRegister);
  if(heroRegisterBtn) heroRegisterBtn.addEventListener('click', showRegister);
  if(switchToRegister) switchToRegister.addEventListener('click', showRegister);
  if(switchToLogin) switchToLogin.addEventListener('click', showLogin);

  // Check if already logged in
  if (localStorage.getItem('doctorToken')) {
    window.location.href = 'dashboard.html';
  }

  // Login Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorMsg = document.getElementById('loginError');
      const submitBtn = document.getElementById('loginSubmitBtn');
      
      try {
        errorMsg.textContent = '';
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        const data = await api.loginDoctor({ email, password });
        
        // Save token and info
        localStorage.setItem('doctorToken', data.token);
        localStorage.setItem('doctorInfo', JSON.stringify(data.doctor));
        
        window.location.href = 'dashboard.html';
      } catch (err) {
        errorMsg.textContent = err.message;
        submitBtn.textContent = 'Login to Dashboard';
        submitBtn.disabled = false;
      }
    });
  }

  // Register Handler
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorMsg = document.getElementById('regError');
      const successMsg = document.getElementById('regSuccess');
      const submitBtn = document.getElementById('regSubmitBtn');
      
      try {
        errorMsg.textContent = '';
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('fullName', document.getElementById('regName').value);
        formData.append('email', document.getElementById('regEmail').value);
        formData.append('phoneNumber', document.getElementById('regPhone').value);
        formData.append('password', document.getElementById('regPassword').value);
        formData.append('profilePhoto', document.getElementById('regPhoto').files[0]);
        formData.append('qualification', document.getElementById('regQualification').value);
        formData.append('specialization', document.getElementById('regSpecialization').value);
        formData.append('yearsOfExperience', document.getElementById('regExperience').value);
        formData.append('hospitalClinicName', document.getElementById('regClinicName').value);
        formData.append('clinicAddress', document.getElementById('regClinicAddress').value);
        formData.append('consultationFees', document.getElementById('regFees').value);
        
        // Convert to JSON strings for arrays
        const days = document.getElementById('regDays').value.split(',').map(d => d.trim());
        const times = document.getElementById('regTimes').value.split(',').map(t => t.trim());
        formData.append('availableDays', JSON.stringify(days));
        formData.append('availableTimeSlots', JSON.stringify(times));
        
        formData.append('aboutDoctor', document.getElementById('regAbout').value);

        const data = await api.registerDoctor(formData);
        
        // Save token and info for auto-login
        if (data.token) {
          localStorage.setItem('doctorToken', data.token);
          localStorage.setItem('doctorInfo', JSON.stringify(data.doctor));
        }
        
        successMsg.style.display = 'block';
        successMsg.textContent = 'Registration Successful! Redirecting to dashboard...';
        registerForm.reset();
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);

      } catch (err) {
        errorMsg.textContent = err.message;
        submitBtn.textContent = 'Complete Registration';
        submitBtn.disabled = false;
      }
    });
  }
});
