// ===== GLOBAL WEBSOCKET CONNECTION =====
// Use dynamic URL to work in production
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const socket = new WebSocket(`${protocol}//${host}/ws/telemetry/`);

console.log(`🔌 WebSocket URL: ${protocol}//${host}/ws/telemetry/`);

socket.onopen = () => {
    console.log("✅ WebSocket connected");
};

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("📨 WebSocket message received:", data);
        
        // Handle control acknowledgments
        if (data.type === "ack") {
            console.log(`✅ ACK: ${data.original_type} - ${data.message || 'OK'}`);
            return;
        }
        
        // ===== HANDLE TELEMETRY UPDATES FROM SERVER =====
        if (data.type === "telemetry_update") {
            console.log(`📡 Telemetry update from ${data.device_id}:`, {
                battery: data.battery,
                cpu: data.cpu,
                temperature: data.temperature,
                signal: data.signal
            });
            
            // Update dashboard with telemetry data
            updateDashboardFromTelemetry(data);
            return;
        }
        
        // ===== HANDLE ROBOT STATUS UPDATES =====
        if (data.type === "robot_status") {
            console.log(`ℹ️  Robot status from ${data.device_id}: ${data.status}`);
            
            // Update robot connection status if needed
            if (data.status === "disconnected") {
                showModernToast(`Robot ${data.device_id} disconnected`, 'error');
            }
            return;
        }
        
    } catch (err) {
        console.error("❌ Error parsing WebSocket message:", err, event.data);
    }
};

socket.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
};

socket.onclose = () => {
    console.warn("⚠️  WebSocket closed");
};

// Simple throttling for control messages (per type)
const controlSendState = {
    lastSentAt: {},
    minIntervalMs: 50 // max ~20 msgs/sec per type
};

function sendControlMessage(payload) {
    if (!socket || socket.readyState !== 1) {
        console.warn("WS not open  cannot send control message", payload);
        return;
    }

    const now = Date.now();
    const typeKey = payload && payload.type ? payload.type : "generic";
    const last = controlSendState.lastSentAt[typeKey] || 0;
    if (now - last < controlSendState.minIntervalMs) {
        return;
    }
    controlSendState.lastSentAt[typeKey] = now;

    try {
        const withTs = Object.assign({ client_ts: now }, payload || {});
        socket.send(JSON.stringify(withTs));
        // Optional debug
        // console.log("WS control →", withTs);
    } catch (err) {
        console.warn("WS send error (control)", err, payload);
    }
}

// Modern IoT Robot Controller - Fixed Application
document.addEventListener('DOMContentLoaded', function () {
    console.log('🤖 Modern IoT Robot Controller Starting...');
    // Detect current page context
    const isLoginPage = document.getElementById('loginPage') !== null;
    const isRobotPage = (
        document.getElementById('controllerPage') !== null ||
        document.getElementById('dashboardPage') !== null ||
        document.getElementById('loadingScreen') !== null
    );

    console.log(`🧭 Detected page: ${isLoginPage ? 'Login Page' : isRobotPage ? 'Robot Dashboard' : 'Unknown'}`);


    // Application state
    const appState = {
        currentPage: 'login',
        loading: false,
        user: null,
        connected: true,
        devices: {
            '1': { name: 'Device 1', battery: 85, cpu: 38, temperature: 41, signal: 93, memory: 64, storage: 23, download: 125, upload: 32 },
            '2': { name: 'Device 2', battery: 72, cpu: 44, temperature: 39, signal: 88, memory: 58, storage: 31, download: 118, upload: 28 }
        },
        activeDevice: '1',
        robotPosition: { x: 0.00, y: 0.00 },
        cameraPosition: { x: 0.00, y: 0.00 },
        joysticks: {
            robot: { active: false, x: 0, y: 0 },
            camera: { active: false, x: 0, y: 0 }
        },
        interactingWithSlider: false,
        batteryChart: null
    };

    // Advanced loading messages with step mapping
    const loadingSteps = [
        { message: "Connecting to robot...", step: 1, progress: 25 },
        { message: "Authenticating user...", step: 2, progress: 50 },
        { message: "Loading dashboard...", step: 3, progress: 75 },
        { message: "System ready!", step: 4, progress: 100 }
    ];

    // Demo credentials
    const demoCredentials = {
        email: "demo@iot-robot.com",
        password: "password123"
    };

    // Enhanced battery chart data
    const batteryChartData = [
        { time: "00:00", battery: 100 },
        { time: "01:00", battery: 98 },
        { time: "02:00", battery: 95 },
        { time: "03:00", battery: 92 },
        { time: "04:00", battery: 89 },
        { time: "05:00", battery: 87 },
        { time: "06:00", battery: 84 },
        { time: "07:00", battery: 82 },
        { time: "08:00", battery: 80 },
        { time: "09:00", battery: 78 },
        { time: "10:00", battery: 76 },
        { time: "11:00", battery: 75 },
        { time: "12:00", battery: 73 }
    ];

    // Get DOM Elements
    let elements = {};

    // Validation state
    const validationState = {
        email: false,
        password: false
    };

    // Initialize elements after DOM is loaded
    function initElements() {
        elements = {
            // Pages
            loginPage: document.getElementById('loginPage'),
            controllerPage: document.getElementById('controllerPage'),
            dashboardPage: document.getElementById('dashboardPage'),
            loadingScreen: document.getElementById('loadingScreen'),

            // Login elements
            loginForm: document.getElementById('loginForm'),
            emailInput: document.getElementById('email'),
            passwordInput: document.getElementById('password'),
            submitBtn: document.getElementById('submitBtn'),
            passwordToggle: document.getElementById('passwordToggle'),
            emailFeedback: document.getElementById('email-feedback'),
            passwordFeedback: document.getElementById('password-feedback'),
            rememberMe: document.getElementById('rememberMe'),

            // Advanced loading elements
            progressRing: document.getElementById('progressRing'),
            progressPercentage: document.getElementById('progressPercentage'),
            loadingMessage: document.getElementById('loadingMessage'),
            step1: document.getElementById('step1'),
            step2: document.getElementById('step2'),
            step3: document.getElementById('step3'),
            step4: document.getElementById('step4'),

            // Controller elements
            profileBtn: document.getElementById('profileBtn'),
            profileDropdown: document.getElementById('profileDropdown'),
            logoutBtn: document.getElementById('logoutBtn'),
            dashboardNavBtn: document.getElementById('dashboardNavBtn'),
            timestamp: document.getElementById('timestamp'),
            signalStrength: document.getElementById('signalStrength'),
            batteryLevel: document.getElementById('batteryLevel'),
            batteryPercentage: document.getElementById('batteryPercentage'),
            positionX: document.getElementById('positionX'),
            positionY: document.getElementById('positionY'),
            cameraX: document.getElementById('cameraX'),
            cameraY: document.getElementById('cameraY'),
            robotJoystick: document.getElementById('robotJoystick'),
            cameraJoystick: document.getElementById('cameraJoystick'),
            robotKnob: document.getElementById('robotKnob'),
            cameraKnob: document.getElementById('cameraKnob'),
            speedSlider: document.getElementById('speedSlider'),
            brightnessSlider: document.getElementById('brightnessSlider'),
            speedValue: document.getElementById('speedValue'),
            brightnessValue: document.getElementById('brightnessValue'),

            // Dashboard elements
            backToControllerBtn: document.getElementById('backToControllerBtn'),
            profileBtnDashboard: document.getElementById('profileBtnDashboard'),
            profileDropdownDashboard: document.getElementById('profileDropdownDashboard'),
            logoutBtnDashboard: document.getElementById('logoutBtnDashboard'),
            // Dashboard device UI
            deviceBtns: document.querySelectorAll('.device-btn'),
            activeDeviceTitle: document.getElementById('activeDeviceTitle'),
            batteryValue: document.getElementById('batteryValue'),
            cpuValue: document.getElementById('cpuValue'),
            temperatureValue: document.getElementById('temperatureValue'),
            signalValue: document.getElementById('signalValue'),
            cpuBar: document.getElementById('cpuBar'),
            memoryBar: document.getElementById('memoryBar'),
            storageBar: document.getElementById('storageBar'),
            cpuPercent: document.getElementById('cpuPercent'),
            memoryPercent: document.getElementById('memoryPercent'),
            storagePercent: document.getElementById('storagePercent'),
            networkSignal: document.getElementById('networkSignal'),
            networkDownload: document.getElementById('networkDownload'),
            networkUpload: document.getElementById('networkUpload'),

            // Toast
            toastNotification: document.getElementById('toastNotification')
        };

        console.log('Elements initialized:', Object.keys(elements).length);
    }

    function sendSpeedToRobot(value) {
        const speedValue = Number(value);
        console.log('⚡ SENDING SPEED TO ROBOT:', speedValue + '%');
        console.log('⚡ Calling sendControlMessage with:', {type: 'set_speed', value: speedValue});
        const message = {
            type: 'set_speed',
            value: speedValue
        };
        console.log('📤 Speed message:', JSON.stringify(message));
        sendControlMessage(message);
        console.log('⚡ sendControlMessage completed for speed');
    }

    function sendBrightnessToRobot(value) {
        const brightnessValue = Number(value);
        console.log('💡 SENDING BRIGHTNESS TO ROBOT:', brightnessValue + '%');
        console.log('💡 Calling sendControlMessage with:', {type: 'set_brightness', value: brightnessValue});
        const message = {
            type: 'set_brightness',
            value: brightnessValue
        };
        console.log('📤 Brightness message:', JSON.stringify(message));
        sendControlMessage(message);
        console.log('💡 sendControlMessage completed for brightness');
    }

    // Initialize the application
    function init() {
        console.log('🚀 Initializing Modern IoT Robot Controller...');

        // Read preferred view from URL (?view=dashboard)
        const params = new URLSearchParams(window.location.search);
        let preferredView = params.get('view');
        const hasController = document.getElementById('controllerPage') !== null;
        const hasDashboard = document.getElementById('dashboardPage') !== null;
        if (!preferredView) {
            // Default to the only available view on split pages
            if (hasDashboard && !hasController) preferredView = 'dashboard';
            else preferredView = 'controller';
        }

        // Initialize elements first
        //initElements();

        // Setup event listeners
        //setupEventListeners();

        // Setup modern animations
        //setupModernAnimations();
        // Initialize based on detected page
        if (isLoginPage) {
            console.log('🚀 Initializing Login Page features...');
            initElements();
            setupEventListeners();
            setupModernAnimations();
            // Disabled demo auto-fill to avoid delays
        }

        if (isRobotPage) {
            console.log('🤖 Initializing Robot Controller/Dashboard...');
            initElements();
            setupEventListeners();
            updateTimestamp();
            setInterval(updateTimestamp, 1000);
            startAdvancedDataSimulation();

            // If this is a split page containing only the dashboard, initialize it now
            const onlyDashboard = document.getElementById('dashboardPage') && !document.getElementById('controllerPage');
            if (onlyDashboard) {
                initializeEnhancedDashboard();
            }
        }


        // Demo auto-fill disabled

        // Start time updates
        updateTimestamp();
        setInterval(updateTimestamp, 1000);

        // Start enhanced data simulation
        startAdvancedDataSimulation();
        if (isRobotPage && elements.loadingScreen) {
            const params = new URLSearchParams(window.location.search);
            const preferredView = params.get('view');
            const fromLogin = document.referrer && /\/login\/?$/.test(new URL(document.referrer).pathname);
            const wantDashboard = preferredView === 'dashboard';

            if (fromLogin && !wantDashboard) {
                // Coming from login -> quick loader to controller
                showAdvancedLoadingScreen();
            } else if (wantDashboard) {
                // Directly show dashboard, hide loader immediately
                elements.loadingScreen.classList.remove('active');
                completeAdvancedLoading();
            } else {
                // Direct access to /robot without login referrer: skip loader
                elements.loadingScreen.classList.remove('active');
                completeAdvancedLoading();
            }
        }
        console.log('✅ Initialization complete');

        // Normalize initial URL state and attach popstate handler
        if (isRobotPage) {
            // Ensure URL reflects the current view without adding history entries
            const initialView = preferredView === 'dashboard' ? 'dashboard' : 'controller';
            setViewInUrl(initialView, true);

            // Only attach in-page routing if both sections exist in the same document
            if (hasController && hasDashboard) {
                window.addEventListener('popstate', () => {
                    const params = new URLSearchParams(window.location.search);
                    const view = params.get('view');
                    if (view === 'dashboard') {
                        navigateToDashboard();
                    } else {
                        navigateToController();
                    }
                });

                if (initialView === 'dashboard') {
                    navigateToDashboard();
                }
            }
        }
    }

    // Setup modern animations
    function setupModernAnimations() {
        // Add entrance animations to login elements
        const loginElements = document.querySelectorAll('.form-container > *');
        loginElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';

            setTimeout(() => {
                el.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 150 + 300);
        });
    }

    // Fill demo credentials with enhanced animations
    function fillDemoCredentials() {
        console.log('🎯 Filling demo credentials with animations...');

        if (elements.emailInput && elements.passwordInput) {
            // Animate email input
            setTimeout(() => {
                typeEffect(elements.emailInput, demoCredentials.email, () => {
                    updateFloatingLabel(elements.emailInput);
                    validateField('email');
                });
            }, 800);

            // Animate password input
            setTimeout(() => {
                typeEffect(elements.passwordInput, demoCredentials.password, () => {
                    updateFloatingLabel(elements.passwordInput);
                    validateField('password');
                    updateSubmitButton();
                });
            }, 1500);
        }
    }

    // Type effect animation
    function typeEffect(input, text, callback) {
        let index = 0;
        input.value = '';

        const typeInterval = setInterval(() => {
            if (index < text.length) {
                input.value += text[index];
                index++;

                // Trigger input event for real-time validation
                input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                clearInterval(typeInterval);
                if (callback) callback();
            }
        }, 100);
    }

    // Setup enhanced event listeners
    function setupEventListeners() {
        console.log('🔗 Setting up enhanced event listeners...');

        // Login form events - Fixed
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', function (e) {
                console.log('Form submit event triggered');
                handleModernFormSubmit(e);
            });
            console.log('✅ Login form submit listener added');
        }

        if (elements.submitBtn) {
            elements.submitBtn.addEventListener('click', function (e) {
                console.log('Submit button clicked');
                handleModernFormSubmit(e);
            });
            console.log('✅ Submit button click listener added');
        }

        // Enhanced input validation and interactions
        // Login page: keep it simple, avoid aggressive validations
        if (!isLoginPage) {
            if (elements.emailInput) {
                elements.emailInput.addEventListener('input', (e) => {
                    updateFloatingLabel(elements.emailInput);
                    setTimeout(() => validateField('email'), 50);
                });
                elements.emailInput.addEventListener('blur', (e) => {
                    elements.emailInput.dataset.touched = 'true';
                    validateField('email');
                });
                elements.emailInput.addEventListener('focus', () => handleInputFocus('email'));
                elements.emailInput.addEventListener('keypress', handleKeyPress);
            }

            if (elements.passwordInput) {
                elements.passwordInput.addEventListener('input', (e) => {
                    updateFloatingLabel(elements.passwordInput);
                    setTimeout(() => validateField('password'), 50);
                });
                elements.passwordInput.addEventListener('blur', (e) => {
                    elements.passwordInput.dataset.touched = 'true';
                    validateField('password');
                });
                elements.passwordInput.addEventListener('focus', () => handleInputFocus('password'));
                elements.passwordInput.addEventListener('keypress', handleKeyPress);
            }
        }

        // Enhanced password visibility toggle
        if (elements.passwordToggle) {
            elements.passwordToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                togglePasswordVisibility();
            });
            console.log('✅ Password toggle listener added');
        }

        // Controller events
        if (elements.profileBtn) {
            elements.profileBtn.addEventListener('click', toggleProfileDropdown);
        }

        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', handleLogout);
        }

        if (elements.dashboardNavBtn) {
            elements.dashboardNavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToDashboard();
            });
        }

        if (elements.controllerNavBtn) {
            elements.controllerNavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToController();
            });
        }

        // Sliders
        console.log('🔧 Setting up sliders - speedSlider:', !!elements.speedSlider, 'brightnessSlider:', !!elements.brightnessSlider);
        if (elements.speedSlider) {
            console.log('✅ Speed slider found, adding event listener');
            elements.speedSlider.addEventListener('input', () => {
                console.log('⚡ Speed slider input event fired:', elements.speedSlider.value);
                if (elements.speedValue) {
                    elements.speedValue.textContent = elements.speedSlider.value + '%';
                }
                sendSpeedToRobot(elements.speedSlider.value);
                updateRangeFill(elements.speedSlider);
            });
            ['pointerdown', 'touchstart', 'mousedown'].forEach(evt => {
                elements.speedSlider.addEventListener(evt, (e) => {
                    appState.interactingWithSlider = true;
                    e.stopPropagation();
                }, { passive: false });
            });
            ['pointerup', 'touchend', 'mouseup', 'change', 'blur', 'mouseleave'].forEach(evt => {
                elements.speedSlider.addEventListener(evt, (e) => {
                    appState.interactingWithSlider = false;
                    e.stopPropagation();
                });
            });
            // Initialize fill
            updateRangeFill(elements.speedSlider);
        }
        if (elements.brightnessSlider) {
            console.log('✅ Brightness slider found, adding event listener');
            elements.brightnessSlider.addEventListener('input', () => {
                console.log('💡 Brightness slider input event fired:', elements.brightnessSlider.value);
                if (elements.brightnessValue) {
                    elements.brightnessValue.textContent = elements.brightnessSlider.value + '%';
                }
                sendBrightnessToRobot(elements.brightnessSlider.value);
                updateRangeFill(elements.brightnessSlider);
            });
            ['pointerdown', 'touchstart', 'mousedown'].forEach(evt => {
                elements.brightnessSlider.addEventListener(evt, (e) => {
                    appState.interactingWithSlider = true;
                    e.stopPropagation();
                }, { passive: false });
            });
            ['pointerup', 'touchend', 'mouseup', 'change', 'blur', 'mouseleave'].forEach(evt => {
                elements.brightnessSlider.addEventListener(evt, (e) => {
                    appState.interactingWithSlider = false;
                    e.stopPropagation();
                });
            });
            // Initialize fill
            updateRangeFill(elements.brightnessSlider);
        }

        // ... (rest of the code remains the same)

        if (elements.profileBtnDashboard) {
            elements.profileBtnDashboard.addEventListener('click', toggleProfileDropdownDashboard);
        }

        if (elements.logoutBtnDashboard) {
            elements.logoutBtnDashboard.addEventListener('click', handleLogout);
        }

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Device selection
        if (elements.deviceBtns && elements.deviceBtns.length) {
            elements.deviceBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const deviceId = btn.getAttribute('data-device');
                    if (!deviceId || appState.activeDevice === deviceId) return;
                    appState.activeDevice = deviceId;
                    elements.deviceBtns.forEach(b => b.classList.toggle('active', b === btn));
                    updateActiveDeviceUI();
                });
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (elements.profileDropdown && !elements.profileDropdown.contains(e.target)) {
                elements.profileDropdown.classList.remove('active');
            }
            if (elements.profileDropdownDashboard && !elements.profileDropdownDashboard.contains(e.target)) {
                elements.profileDropdownDashboard.classList.remove('active');
            }
        });

        // Enhanced joystick controls
        setupAdvancedJoystickControls();

        // Window resize handler
        window.addEventListener('resize', handleResize);

        // Initialize dashboard device UI once
        updateActiveDeviceUI();

        // Generic: apply dynamic fill updates to any DaisyUI accent ranges on the page
        const accentRanges = document.querySelectorAll('.range.range-accent');
        accentRanges.forEach((slider) => {
            // initialize
            updateRangeFill(slider);
            // live update
            slider.addEventListener('input', () => updateRangeFill(slider));
        });

        console.log('✅ Event listeners setup complete');
    }

    // Handle key press events
    function handleKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            console.log('Enter key pressed');
            handleModernFormSubmit(e);
        }
    }

    // Enhanced floating label updates
    function updateFloatingLabel(input) {
        if (!input) return;

        const label = input.parentElement.querySelector('.floating-label');
        if (!label) return;

        if (input.value.trim() || input === document.activeElement) {
            label.style.transform = 'translateY(-140%) scale(0.85)';
            label.style.color = 'var(--color-primary)';
            label.style.fontWeight = '600';
        } else {
            label.style.transform = 'translateY(-50%) scale(1)';
            label.style.color = 'var(--color-text-secondary)';
            label.style.fontWeight = '500';
        }
    }

    // Enhanced input focus handling
    function handleInputFocus(fieldName) {
        const input = fieldName === 'email' ? elements.emailInput : elements.passwordInput;
        const feedback = fieldName === 'email' ? elements.emailFeedback : elements.passwordFeedback;

        if (!input || !feedback) return;

        updateFloatingLabel(input);

        // Add focus glow effect
        const borderEffect = input.parentElement.querySelector('.input-border-effect');
        if (borderEffect) {
            borderEffect.style.opacity = '0.3';
        }

        if (input.classList.contains('invalid')) {
            input.classList.remove('invalid');
            feedback.textContent = '';
            feedback.className = 'input-feedback';
        }
    }

    // Enhanced field validation with modern feedback
    function validateField(fieldName) {
        const input = fieldName === 'email' ? elements.emailInput : elements.passwordInput;
        const feedback = fieldName === 'email' ? elements.emailFeedback : elements.passwordFeedback;

        if (!input || !feedback) {
            console.warn(`Missing elements for field: ${fieldName}`);
            return false;
        }

        const value = input.value.trim();
        let isValid = false;
        let message = '';

        switch (fieldName) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    if (input.dataset.touched) {
                        message = 'Email address is required';
                    }
                } else if (!emailRegex.test(value)) {
                    message = 'Please enter a valid email address';
                } else {
                    isValid = true;
                    message = 'Email looks perfect!';
                }
                break;

            case 'password':
                if (!value) {
                    if (input.dataset.touched) {
                        message = 'Password is required';
                    }
                } else if (value.length < 6) {
                    message = 'Password must be at least 6 characters';
                } else {
                    isValid = true;
                    message = 'Password strength: Strong';
                }
                break;
        }

        updateFieldValidation(input, feedback, isValid, message);
        validationState[fieldName] = isValid;
        updateSubmitButton();

        return isValid;
    }

    // Enhanced field validation display
    function updateFieldValidation(input, feedback, isValid, message) {
        if (!input || !feedback) return;

        input.classList.remove('valid', 'invalid');

        if (input.value.trim()) {
            input.classList.add(isValid ? 'valid' : 'invalid');

            // Add validation animation
            input.style.transform = 'scale(1.02)';
            setTimeout(() => {
                input.style.transform = 'scale(1)';
            }, 200);
        }

        if (message) {
            feedback.textContent = message;
            feedback.className = `input-feedback ${isValid ? 'success' : 'error'}`;

            // Add feedback animation
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                feedback.style.transition = 'all 0.3s ease';
                feedback.style.opacity = '1';
                feedback.style.transform = 'translateY(0)';
            }, 50);
        } else {
            feedback.textContent = '';
            feedback.className = 'input-feedback';
        }
    }

    // Enhanced password visibility toggle
    function togglePasswordVisibility() {
        if (!elements.passwordInput || !elements.passwordToggle) return;

        const icon = elements.passwordToggle.querySelector('i');

        // Add toggle animation
        elements.passwordToggle.style.transform = 'translateY(-50%) scale(0.8)';

        setTimeout(() => {
            if (elements.passwordInput.type === 'password') {
                elements.passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
                elements.passwordToggle.setAttribute('aria-label', 'Hide password');
            } else {
                elements.passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
                elements.passwordToggle.setAttribute('aria-label', 'Show password');
            }

            elements.passwordToggle.style.transform = 'translateY(-50%) scale(1)';
        }, 150);
    }

    // Enhanced submit button state
    function updateSubmitButton() {
        if (!elements.submitBtn) return;

        const emailFilled = elements.emailInput?.value.trim();
        const passwordFilled = elements.passwordInput?.value.trim();

        console.log('Updating submit button:', { emailFilled: !!emailFilled, passwordFilled: !!passwordFilled });

        if (emailFilled && passwordFilled) {
            elements.submitBtn.disabled = false;
            elements.submitBtn.style.transform = 'translateY(0)';
            elements.submitBtn.style.opacity = '1';
            elements.submitBtn.style.cursor = 'pointer';
            console.log('Submit button enabled');
        } else {
            elements.submitBtn.disabled = true;
            elements.submitBtn.style.transform = 'translateY(2px)';
            elements.submitBtn.style.opacity = '0.7';
            elements.submitBtn.style.cursor = 'not-allowed';
            console.log('Submit button disabled');
        }
    }

    // Enhanced form submission - FIXED
    function handleModernFormSubmit(e) {
        e.preventDefault();
        console.log('🔐 Submitting real Django login form...');
        elements.loginForm.submit(); // Let Django handle login authentication
    }

    // Enhanced login process
    function startEnhancedLoginProcess(email) {
        console.log('🚀 Starting enhanced login process...');
        appState.loading = true;
        showEnhancedLoadingState(true);

        setTimeout(() => {
            console.log('✅ Authentication completed');
            showEnhancedLoadingState(false);

            appState.user = {
                email: email,
                name: 'Alex Johnson'
            };

            showModernToast('Login successful! Welcome back!', 'success');

            setTimeout(() => {
                console.log('🎬 Transitioning to advanced loading screen');
                showAdvancedLoadingScreen();
            }, 1200);
        }, 2500);
    }

    // Enhanced loading state on submit button
    function showEnhancedLoadingState(loading) {
        if (!elements.submitBtn) return;

        const btnText = elements.submitBtn.querySelector('.btn-text');
        const btnLoading = elements.submitBtn.querySelector('.btn-loading');

        console.log('Setting loading state:', loading, { btnText: !!btnText, btnLoading: !!btnLoading });

        if (btnText && btnLoading) {
            if (loading) {
                btnText.classList.add('hidden');
                btnLoading.classList.remove('hidden');
                elements.submitBtn.disabled = true;
                elements.submitBtn.style.pointerEvents = 'none';

                // Add loading pulse effect
                elements.submitBtn.style.animation = 'pulse 1.5s ease-in-out infinite';
            } else {
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
                elements.submitBtn.disabled = false;
                elements.submitBtn.style.pointerEvents = 'auto';
                elements.submitBtn.style.animation = '';
                appState.loading = false;
            }
        }
    }

    // Advanced loading screen with morphing animations
    function showAdvancedLoadingScreen() {
        console.log('🎭 Showing advanced loading screen...');

        if (!elements.loadingScreen) {
            console.warn('Loading screen element not found');
            return;
        }

        // Enhanced login page exit animation
        if (elements.loginPage) {
            elements.loginPage.style.transform = 'scale(0.95)';
            elements.loginPage.style.opacity = '0';
            elements.loginPage.style.filter = 'blur(10px)';

            setTimeout(() => {
                elements.loginPage.classList.remove('active');
                elements.loginPage.style.transform = '';
                elements.loginPage.style.opacity = '';
                elements.loginPage.style.filter = '';
            }, 600);
        }

        // Show loading screen immediately
        elements.loadingScreen.classList.add('active');
        appState.currentPage = 'loading';
        startAdvancedLoadingProgress();
    }

    // Advanced loading progress with multiple animations
    function startAdvancedLoadingProgress() {
        console.log('🎪 Starting advanced loading progress...');

        if (!elements.progressRing || !elements.progressPercentage) {
            console.warn('Progress elements not found');
            return;
        }

        let currentStep = 0;
        let progress = 0;
        const totalDuration = 1200; // 1.2 seconds
        const updateInterval = 50;
        const progressIncrement = 100 / (totalDuration / updateInterval);

        const progressInterval = setInterval(() => {
            progress += progressIncrement;
            if (progress > 100) progress = 100;

            updateCircularProgress(Math.floor(progress));

            // Update steps based on progress
            const stepThresholds = [20, 45, 75, 95];
            const currentThreshold = Math.floor(progress);

            if (stepThresholds[currentStep] && currentThreshold >= stepThresholds[currentStep]) {
                if (currentStep < loadingSteps.length) {
                    updateLoadingStep(currentStep + 1);
                    updateLoadingMessage(loadingSteps[currentStep].message);
                    currentStep++;
                }
            }

            if (progress >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => {
                    completeAdvancedLoading();
                }, 200);
            }
        }, updateInterval);
    }

    // Update circular progress ring
    function updateCircularProgress(percentage) {
        if (elements.progressRing && elements.progressPercentage) {
            const circumference = 2 * Math.PI * 54; // radius = 54
            const offset = circumference - (percentage / 100) * circumference;

            elements.progressRing.style.strokeDashoffset = offset;
            elements.progressPercentage.textContent = `${percentage}%`;
        }
    }

    // Update loading step with animations
    function updateLoadingStep(stepNumber) {
        const stepElement = elements[`step${stepNumber}`];
        if (!stepElement) return;

        // Activate current step
        stepElement.classList.add('active');

        // Complete previous steps
        for (let i = 1; i < stepNumber; i++) {
            const prevStep = elements[`step${i}`];
            if (prevStep) {
                prevStep.classList.remove('active');
                prevStep.classList.add('completed');

                const icon = prevStep.querySelector('.step-circle i');
                const check = prevStep.querySelector('.step-check');
                if (icon && check) {
                    icon.style.opacity = '0';
                    setTimeout(() => {
                        check.classList.remove('hidden');
                        check.style.transform = 'scale(0)';
                        setTimeout(() => {
                            check.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                            check.style.transform = 'scale(1)';
                        }, 50);
                    }, 200);
                }
            }
        }
    }

    // Update loading message with smooth transition
    function updateLoadingMessage(message) {
        if (elements.loadingMessage) {
            elements.loadingMessage.style.opacity = '0';
            elements.loadingMessage.style.transform = 'translateY(10px)';

            setTimeout(() => {
                elements.loadingMessage.textContent = message;
                elements.loadingMessage.style.transition = 'all 0.4s ease';
                elements.loadingMessage.style.opacity = '1';
                elements.loadingMessage.style.transform = 'translateY(0)';
            }, 200);
        }
    }

    // Complete advanced loading
    function completeAdvancedLoading() {
        console.log('🎉 Advanced loading completed!');

        // Enhanced loading screen exit
        if (elements.loadingScreen) {
            elements.loadingScreen.style.transform = 'scale(1.05)';
            elements.loadingScreen.style.opacity = '0';
            elements.loadingScreen.style.filter = 'blur(10px)';

            setTimeout(() => {
                elements.loadingScreen.classList.remove('active');
                elements.loadingScreen.style.transform = '';
                elements.loadingScreen.style.opacity = '';
                elements.loadingScreen.style.filter = '';

                // Reset for next time
                resetLoadingScreen();
            }, 600);
        }

        // Show target page (respect ?view=dashboard)
        setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const preferredView = params.get('view');
            const showDashboard = preferredView === 'dashboard';

            const target = showDashboard ? elements.dashboardPage : elements.controllerPage;
            if (target) {
                target.classList.add('active');
                target.style.opacity = '0';
                target.style.transform = 'translateY(30px) scale(0.98)';
                setTimeout(() => {
                    target.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                    target.style.opacity = '1';
                    target.style.transform = 'translateY(0) scale(1)';
                }, 100);
            }

            appState.currentPage = showDashboard ? 'dashboard' : 'controller';
            if (!showDashboard) {
                setTimeout(() => {
                    animateControllerEntrance();
                }, 800);
            }
        }, 200);
    }

    // Reset loading screen
    function resetLoadingScreen() {
        // Reset progress ring
        if (elements.progressRing) {
            elements.progressRing.style.strokeDashoffset = '339.292';
        }
        if (elements.progressPercentage) {
            elements.progressPercentage.textContent = '0%';
        }

        // Reset steps
        for (let i = 1; i <= 4; i++) {
            const step = elements[`step${i}`];
            if (step) {
                step.classList.remove('active', 'completed');
                const icon = step.querySelector('.step-circle i');
                const check = step.querySelector('.step-check');
                if (icon && check) {
                    icon.style.opacity = '1';
                    check.classList.add('hidden');
                    check.style.transform = '';
                    check.style.transition = '';
                }
            }
        }
    }

    // Enhanced controller entrance animations
    function animateControllerEntrance() {
        console.log('🎬 Starting controller entrance animations');

        // Animate battery level
        if (elements.batteryLevel) {
            elements.batteryLevel.style.width = '0%';
            setTimeout(() => {
                elements.batteryLevel.style.transition = 'width 2s cubic-bezier(0.16, 1, 0.3, 1)';
                elements.batteryLevel.style.width = `${appState.battery}%`;
            }, 500);
        }

        // Animate status values
        setTimeout(() => {
            animateStatusEntrance();
        }, 700);

        updateAllStatusDisplays();
    }

    // Enhanced navigation functions
    function setViewInUrl(view, replace = false) {
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('view', view);
            if (replace) {
                history.replaceState({}, '', url);
            } else {
                history.pushState({}, '', url);
            }
        } catch (e) {
            // no-op if URL API not supported
        }
    }

    function navigateToDashboard() {
        console.log('🎯 Enhanced navigation to dashboard...');
        // Update URL to reflect dashboard
        setViewInUrl('dashboard');

        // If this page does not contain a dashboard section, redirect to separate route
        if (!elements.dashboardPage) {
            window.location.href = '/robot/dashboard/';
            return;
        }

        // Enhanced controller exit
        if (elements.controllerPage) {
            elements.controllerPage.style.transform = 'translateX(-30px) scale(0.98)';
            elements.controllerPage.style.opacity = '0';
            elements.controllerPage.style.filter = 'blur(5px)';

            setTimeout(() => {
                elements.controllerPage.classList.remove('active');
                elements.controllerPage.style.transform = '';
                elements.controllerPage.style.opacity = '';
                elements.controllerPage.style.filter = '';
            }, 600);
        }

        // Enhanced dashboard entrance
        setTimeout(() => {
            if (elements.dashboardPage) {
                elements.dashboardPage.classList.add('active');
                elements.dashboardPage.style.opacity = '0';
                elements.dashboardPage.style.transform = 'translateX(30px) scale(0.98)';

                setTimeout(() => {
                    elements.dashboardPage.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                    elements.dashboardPage.style.opacity = '1';
                    elements.dashboardPage.style.transform = 'translateX(0) scale(1)';
                }, 100);
            }

            appState.currentPage = 'dashboard';
            showModernToast('📊 Dashboard loaded successfully!', 'success');

            setTimeout(() => {
                initializeEnhancedDashboard();
            }, 800);
        }, 400);
    }

    function navigateToController() {
        console.log('🎯 Enhanced navigation back to controller...');
        // Update URL to reflect controller
        setViewInUrl('controller');

        // If this page does not contain a controller section, redirect to separate route
        if (!elements.controllerPage) {
            window.location.href = '/robot/controller/';
            return;
        }

        // Enhanced dashboard exit
        if (elements.dashboardPage) {
            elements.dashboardPage.style.transform = 'translateX(30px) scale(0.98)';
            elements.dashboardPage.style.opacity = '0';
            elements.dashboardPage.style.filter = 'blur(5px)';

            setTimeout(() => {
                elements.dashboardPage.classList.remove('active');
                elements.dashboardPage.style.transform = '';
                elements.dashboardPage.style.opacity = '';
                elements.dashboardPage.style.filter = '';
            }, 600);
        }

        // Enhanced controller entrance
        setTimeout(() => {
            if (elements.controllerPage) {
                elements.controllerPage.classList.add('active');
                elements.controllerPage.style.opacity = '0';
                elements.controllerPage.style.transform = 'translateX(-30px) scale(0.98)';

                setTimeout(() => {
                    elements.controllerPage.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                    elements.controllerPage.style.opacity = '1';
                    elements.controllerPage.style.transform = 'translateX(0) scale(1)';
                }, 100);
            }

            appState.currentPage = 'controller';
            showModernToast('🎮 Back to controller view', 'info');
        }, 400);
    }

    // Enhanced dashboard initialization
    function initializeEnhancedDashboard() {
        console.log('📊 Initializing enhanced dashboard...');

        // Update metric displays with animations
        updateMetricDisplaysWithAnimation();

        // Initialize enhanced chart
        initializeEnhancedBatteryChart();
    }

    // Enhanced metric display updates
    function updateMetricDisplaysWithAnimation() {
        const metrics = [
            { element: elements.metricBattery, value: `${Math.round(appState.battery)}%` },
            { element: elements.metricCpu, value: `${appState.cpu}%` },
            { element: elements.metricTemperature, value: `${appState.temperature}°C` },
            { element: elements.metricSignal, value: `${Math.round(appState.signal)}%` }
        ];

        metrics.forEach((metric, index) => {
            if (metric.element) {
                setTimeout(() => {
                    metric.element.style.transform = 'scale(1.1)';
                    metric.element.style.color = 'var(--color-primary)';
                    metric.element.textContent = metric.value;

                    setTimeout(() => {
                        metric.element.style.transform = 'scale(1)';
                        metric.element.style.color = '';
                    }, 300);
                }, index * 200);
            }
        });
    }

    // Enhanced battery chart
    function initializeEnhancedBatteryChart() {
        const chartCanvas = document.getElementById('batteryChart');
        if (!chartCanvas) return;

        const ctx = chartCanvas.getContext('2d');

        // Destroy existing chart if it exists
        if (appState.batteryChart) {
            appState.batteryChart.destroy();
        }

        appState.batteryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: batteryChartData.map(d => d.time),
                datasets: [{
                    label: 'Battery Level',
                    data: batteryChartData.map(d => d.battery),
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#1FB8CD',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                family: 'Inter, system-ui, sans-serif'
                            }
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                family: 'Inter, system-ui, sans-serif'
                            },
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#1FB8CD'
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutCubic'
                }
            }
        });
    }

    // Enhanced tab switching
    function switchTab(tabId) {
        console.log('🔄 Switching to tab:', tabId);

        // Update tab buttons with animation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
                btn.style.transform = 'translateY(-2px)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 200);
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab panels with fade animation
        const tabPanels = document.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            if (panel.id === `${tabId}-panel`) {
                panel.style.opacity = '0';
                panel.classList.add('active');
                setTimeout(() => {
                    panel.style.transition = 'opacity 0.4s ease';
                    panel.style.opacity = '1';
                }, 50);
            } else {
                panel.classList.remove('active');
                panel.style.opacity = '';
                panel.style.transition = '';
            }
        });
    }

    // Enhanced dropdown toggles
    function toggleProfileDropdown(e) {
        e.stopPropagation();
        if (elements.profileDropdown) {
            elements.profileDropdown.classList.toggle('active');

            // Add animation
            const menu = elements.profileDropdown.querySelector('.dropdown-menu');
            if (menu && elements.profileDropdown.classList.contains('active')) {
                menu.style.transform = 'translateY(-10px) scale(0.95)';
                menu.style.opacity = '0';
                setTimeout(() => {
                    menu.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
                    menu.style.transform = 'translateY(0) scale(1)';
                    menu.style.opacity = '1';
                }, 50);
            }
        }
    }

    function toggleProfileDropdownDashboard(e) {
        e.stopPropagation();
        if (elements.profileDropdownDashboard) {
            elements.profileDropdownDashboard.classList.toggle('active');
        }
    }

    // Enhanced logout
    function handleLogout() {
        console.log('🚪 Enhanced logout process...');

        showModernToast('Signing out...', 'info');

        // Close dropdowns
        if (elements.profileDropdown) elements.profileDropdown.classList.remove('active');
        if (elements.profileDropdownDashboard) elements.profileDropdownDashboard.classList.remove('active');

        setTimeout(() => {
            // Enhanced page exit
            const currentPageEl = document.querySelector('.page-view.active');
            if (currentPageEl) {
                currentPageEl.style.transform = 'scale(0.9)';
                currentPageEl.style.opacity = '0';
                currentPageEl.style.filter = 'blur(10px)';

                setTimeout(() => {
                    currentPageEl.classList.remove('active');
                    currentPageEl.style.transform = '';
                    currentPageEl.style.opacity = '';
                    currentPageEl.style.filter = '';
                }, 600);
            }

            // Enhanced login page entrance
            setTimeout(() => {
                if (elements.loginPage) {
                    elements.loginPage.classList.add('active');
                    elements.loginPage.style.opacity = '0';
                    elements.loginPage.style.transform = 'scale(1.1)';

                    setTimeout(() => {
                        elements.loginPage.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                        elements.loginPage.style.opacity = '1';
                        elements.loginPage.style.transform = 'scale(1)';
                    }, 100);
                }

                appState.currentPage = 'login';
                appState.user = null;
                appState.loading = false;

                resetEnhancedForm();
                showModernToast('✅ Successfully signed out', 'success');
            }, 400);
        }, 1000);
    }

    // Enhanced form reset
    function resetEnhancedForm() {
        if (!elements.loginForm) return;

        console.log('🔄 Resetting enhanced form');

        Object.keys(validationState).forEach(key => {
            validationState[key] = false;
        });

        [elements.emailInput, elements.passwordInput].forEach(input => {
            if (input) {
                input.value = '';
                input.classList.remove('valid', 'invalid');
                input.removeAttribute('data-touched');
                updateFloatingLabel(input);
            }
        });

        [elements.emailFeedback, elements.passwordFeedback].forEach(feedback => {
            if (feedback) {
                feedback.textContent = '';
                feedback.className = 'input-feedback';
            }
        });

        if (elements.passwordInput) {
            elements.passwordInput.type = 'password';
        }
        if (elements.passwordToggle) {
            const icon = elements.passwordToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-eye';
            }
            elements.passwordToggle.setAttribute('aria-label', 'Show password');
        }
    }

    // Enhanced joystick controls
    function setupAdvancedJoystickControls() {
        if (elements.robotJoystick && elements.robotKnob) {
            setupEnhancedJoystick(elements.robotJoystick, elements.robotKnob, 'robot');
        }

        if (elements.cameraJoystick && elements.cameraKnob) {
            setupEnhancedJoystick(elements.cameraJoystick, elements.cameraKnob, 'camera');
        }
    }

    // Enhanced individual joystick setup
    function setupEnhancedJoystick(joystickElement, knobElement, type) {
        let isDragging = false;
        let centerX, centerY;
        const maxDistance = 40;

        function startDrag(e) {
            if (appState.interactingWithSlider) {
                e.preventDefault();
                return;
            }
            isDragging = true;
            const rect = joystickElement.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;

            joystickElement.classList.add('active');
            appState.joysticks[type].active = true;

            // Enhanced visual feedback
            knobElement.style.transform = 'translate(-50%, -50%) scale(1.1)';
            knobElement.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.5)';

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', stopDrag);

            e.preventDefault();
        }

        function drag(e) {
            if (!isDragging) return;
            if (appState.interactingWithSlider) return;

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            let deltaX = clientX - centerX;
            let deltaY = clientY - centerY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }

            knobElement.style.transform = `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(1.1)`;

            const normalizedX = deltaX / maxDistance;
            const normalizedY = -deltaY / maxDistance;

            appState.joysticks[type].x = normalizedX;
            appState.joysticks[type].y = normalizedY;

            // Debug: show drag movement per event
            try {
                console.log(`Drag → ${type}: ${normalizedX.toFixed(2)}, ${normalizedY.toFixed(2)}`);
            } catch {}

            updatePositionFromJoystick(type, normalizedX, normalizedY);

            e.preventDefault();
        }

        function stopDrag() {
            if (!isDragging) return;

            isDragging = false;
            joystickElement.classList.remove('active');
            appState.joysticks[type].active = false;

            // Enhanced return animation
            knobElement.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            knobElement.style.transform = 'translate(-50%, -50%) scale(1)';
            knobElement.style.boxShadow = '';

            setTimeout(() => {
                knobElement.style.transition = '';
            }, 300);

            appState.joysticks[type].x = 0;
            appState.joysticks[type].y = 0;

            // Send a stop/zero command when joystick is released
            if (type === 'robot') {
                sendControlMessage({
                    type: 'robot_move',
                    x: 0,
                    y: 0
                });
            } else if (type === 'camera') {
                sendControlMessage({
                    type: 'camera_move',
                    x: 0,
                    y: 0
                });
            }

            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', stopDrag);
        }

        knobElement.addEventListener('mousedown', startDrag);
        knobElement.addEventListener('touchstart', startDrag, { passive: false });
    }

    // Enhanced position updates + WebSocket sending
    function updatePositionFromJoystick(type, x, y) {
        // sensitivity logic — keep original
        const sensitivity = 0.15;

        // Debug log for joystick values
        try {
            console.log("Joystick:", type, "X:", x.toFixed(2), "Y:", y.toFixed(2));
        } catch {}

        if (type === 'robot') {
            appState.robotPosition.x += x * sensitivity;
            appState.robotPosition.y += y * sensitivity;

            appState.robotPosition.x = Math.max(-99.99, Math.min(99.99, appState.robotPosition.x));
            appState.robotPosition.y = Math.max(-99.99, Math.min(99.99, appState.robotPosition.y));

            // SEND ROBOT JOYSTICK DATA as robot_move control message
            sendControlMessage({
                type: 'robot_move',
                x: appState.robotPosition.x,
                y: appState.robotPosition.y
            });

            updateStatusDisplay('position');

        } else if (type === 'camera') {
            appState.cameraPosition.x += x * sensitivity;
            appState.cameraPosition.y += y * sensitivity;

            appState.cameraPosition.x = Math.max(-99.99, Math.min(99.99, appState.cameraPosition.x));
            appState.cameraPosition.y = Math.max(-99.99, Math.min(99.99, appState.cameraPosition.y));

            // SEND CAMERA JOYSTICK DATA as camera_move control message
            sendControlMessage({
                type: 'camera_move',
                x: appState.cameraPosition.x,
                y: appState.cameraPosition.y
            });

            updateStatusDisplay('camera');
        }
    }

    // Enhanced status display updates
    function updateStatusDisplay(type) {
        if (type === 'position') {
            if (elements.positionX) {
                elements.positionX.textContent = appState.robotPosition.x.toFixed(2);
                elements.positionX.classList.add('updating');
                setTimeout(() => elements.positionX.classList.remove('updating'), 300);
            }
            if (elements.positionY) {
                elements.positionY.textContent = appState.robotPosition.y.toFixed(2);
                elements.positionY.classList.add('updating');
                setTimeout(() => elements.positionY.classList.remove('updating'), 300);
            }
        } else if (type === 'camera') {
            if (elements.cameraX) {
                elements.cameraX.textContent = appState.cameraPosition.x.toFixed(2);
                elements.cameraX.classList.add('updating');
                setTimeout(() => elements.cameraX.classList.remove('updating'), 300);
            }
            if (elements.cameraY) {
                elements.cameraY.textContent = appState.cameraPosition.y.toFixed(2);
                elements.cameraY.classList.add('updating');
                setTimeout(() => elements.cameraY.classList.remove('updating'), 300);
            }
        }
    }

    // Update all status displays
    function updateAllStatusDisplays() {
        if (elements.positionX) elements.positionX.textContent = appState.robotPosition.x.toFixed(2);
        if (elements.positionY) elements.positionY.textContent = appState.robotPosition.y.toFixed(2);
        if (elements.cameraX) elements.cameraX.textContent = appState.cameraPosition.x.toFixed(2);
        if (elements.cameraY) elements.cameraY.textContent = appState.cameraPosition.y.toFixed(2);
        // Controller sidebar legacy values remain handled in simulation
    }

    // ===== UPDATE DASHBOARD FROM TELEMETRY (from WebSocket server) =====
    function updateDashboardFromTelemetry(telemetryData) {
        console.log("📊 Updating dashboard with telemetry:", telemetryData);
        
        // Extract data
        const deviceId = telemetryData.device_id || "1";
        const battery = telemetryData.battery;
        const cpu = telemetryData.cpu;
        const temperature = telemetryData.temperature;
        const signal = telemetryData.signal;
        
        // Update app state if this is the active device
        if (deviceId === appState.activeDevice || deviceId === "1") {
            appState.devices[deviceId] = {
                ...appState.devices[deviceId],
                battery: battery,
                cpu: cpu,
                temperature: temperature,
                signal: signal
            };
        }
        
        // Update controller sidebar (if visible)
        if (elements.batteryLevel) {
            elements.batteryLevel.style.width = `${battery}%`;
        }
        if (elements.batteryPercentage) {
            elements.batteryPercentage.textContent = `${Math.round(battery)}%`;
        }
        if (elements.signalStrength) {
            elements.signalStrength.textContent = `${Math.round(signal)}%`;
        }
        
        // Update dashboard if visible
        if (appState.currentPage === 'dashboard') {
            updateActiveDeviceUI();
        }
        
        // Update metric values if dashboard page
        const batteryEl = document.getElementById("metricBattery");
        const cpuEl = document.getElementById("metricCpu");
        const tempEl = document.getElementById("metricTemperature");
        const signalEl = document.getElementById("metricSignal");
        
        if (batteryEl) batteryEl.textContent = `${Math.round(battery)}%`;
        if (cpuEl) cpuEl.textContent = `${Math.round(cpu)}%`;
        if (tempEl) tempEl.textContent = `${Math.round(temperature)}°C`;
        if (signalEl) signalEl.textContent = `${Math.round(signal)}%`;
        
        console.log("✅ Dashboard updated with real telemetry data");
    }

    // Enhanced status entrance animation
    function animateStatusEntrance() {
        const statusElements = [elements.positionX, elements.positionY, elements.cameraX, elements.cameraY];
        statusElements.forEach((el, index) => {
            if (el) {
                setTimeout(() => {
                    el.style.transform = 'scale(1.2)';
                    el.style.color = 'var(--color-primary)';
                    setTimeout(() => {
                        el.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                        el.style.transform = 'scale(1)';
                        el.style.color = '';
                    }, 100);
                }, index * 200);
            }
        });
    }

    // Update timestamp
    function updateTimestamp() {
        if (elements.timestamp) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            elements.timestamp.textContent = timeString;
        }
    }

    // Enhanced data simulation
    function startAdvancedDataSimulation() {
        // Signal simulation per device
        setInterval(() => {
            if ((appState.currentPage === 'controller' || appState.currentPage === 'dashboard')) {
                Object.keys(appState.devices).forEach(id => {
                    const dev = appState.devices[id];
                    const variation = Math.random() * 8 - 4;
                    dev.signal = Math.max(70, Math.min(100, dev.signal + variation));
                });

                // Update controller sidebar signal (use active device for display if available)
                const activeDev = appState.devices[appState.activeDevice];
                if (elements.signalStrength && activeDev) {
                    elements.signalStrength.textContent = `${Math.round(activeDev.signal)}%`;
                }
                if (appState.currentPage === 'dashboard') updateActiveDeviceUI();
            }
        }, 3000);

        // Battery simulation per device
        setInterval(() => {
            if ((appState.currentPage === 'controller' || appState.currentPage === 'dashboard')) {
                Object.keys(appState.devices).forEach(id => {
                    const dev = appState.devices[id];
                    dev.battery = Math.max(15, dev.battery - 0.02);
                });

                const activeDev = appState.devices[appState.activeDevice];
                if (elements.batteryLevel && elements.batteryPercentage && activeDev) {
                    elements.batteryLevel.style.width = `${activeDev.battery}%`;
                    elements.batteryPercentage.textContent = `${Math.round(activeDev.battery)}%`;

                    if (activeDev.battery < 25) {
                        elements.batteryLevel.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
                        if (activeDev.battery < 15) {
                            elements.batteryLevel.style.animation = 'batteryBlink 1s ease-in-out infinite';
                        }
                    } else if (activeDev.battery < 50) {
                        elements.batteryLevel.style.background = 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)';
                        elements.batteryLevel.style.animation = '';
                    } else {
                        elements.batteryLevel.style.background = 'linear-gradient(90deg, #10b981 0%, #1FB8CD 100%)';
                        elements.batteryLevel.style.animation = '';
                    }
                }

                if (appState.currentPage === 'dashboard') updateActiveDeviceUI();
            }
        }, 12000);

        // CPU/Temp/Network simulation per device
        setInterval(() => {
            if (appState.currentPage === 'dashboard') {
                Object.keys(appState.devices).forEach(id => {
                    const dev = appState.devices[id];
                    dev.cpu = Math.max(15, Math.min(95, dev.cpu + (Math.random() * 10 - 5)));
                    dev.temperature = Math.max(30, Math.min(70, dev.temperature + (Math.random() * 4 - 2)));
                    dev.memory = Math.max(20, Math.min(95, dev.memory + (Math.random() * 6 - 3)));
                    dev.storage = Math.max(10, Math.min(90, dev.storage + (Math.random() * 3 - 1.5)));
                    dev.download = Math.max(50, Math.min(200, dev.download + (Math.random() * 20 - 10)));
                    dev.upload = Math.max(10, Math.min(80, dev.upload + (Math.random() * 10 - 5)));
                });

                updateActiveDeviceUI();
            }
        }, 6000);
    }

    function updateActiveDeviceUI() {
        if (!document.getElementById('dashboardPage')) return;
        const dev = appState.devices[appState.activeDevice];
        if (!dev) return;

        if (elements.activeDeviceTitle) {
            elements.activeDeviceTitle.textContent = `${dev.name} — Live Metrics`;
        }
        if (elements.batteryValue) elements.batteryValue.textContent = `${Math.round(dev.battery)}%`;
        if (elements.cpuValue) elements.cpuValue.textContent = `${Math.round(dev.cpu)}%`;
        if (elements.temperatureValue) elements.temperatureValue.textContent = `${Math.round(dev.temperature)}°C`;
        if (elements.signalValue) elements.signalValue.textContent = `${Math.round(dev.signal)}%`;

        if (elements.cpuBar) {
            elements.cpuBar.style.width = `${Math.round(dev.cpu)}%`;
            elements.cpuBar.style.background = '#06B6D4';
        }
        if (elements.memoryBar) {
            elements.memoryBar.style.width = `${Math.round(dev.memory)}%`;
            elements.memoryBar.style.background = '#B4413C';
        }
        if (elements.storageBar) {
            elements.storageBar.style.width = `${Math.round(dev.storage)}%`;
            elements.storageBar.style.background = '#5D878F';
        }
        if (elements.cpuPercent) elements.cpuPercent.textContent = `${Math.round(dev.cpu)}%`;
        if (elements.memoryPercent) elements.memoryPercent.textContent = `${Math.round(dev.memory)}%`;
        if (elements.storagePercent) elements.storagePercent.textContent = `${Math.round(dev.storage)}%`;
        if (elements.networkSignal) elements.networkSignal.textContent = `${Math.round(dev.signal)}%`;
        if (elements.networkDownload) elements.networkDownload.textContent = `${Math.round(dev.download)} Mbps`;
        if (elements.networkUpload) elements.networkUpload.textContent = `${Math.round(dev.upload)} Mbps`;
    }

    // Handle window resize
    function handleResize() {
        if (window.innerWidth < 768) {
            // Mobile-specific adjustments
        }
    }

    // Update a range input's visual fill track to match its current value
    function updateRangeFill(inputEl) {
        if (!inputEl) return;
        const min = Number(inputEl.min || 0);
        const max = Number(inputEl.max || 100);
        const val = Number(inputEl.value || 0);
        const pct = ((val - min) * 100) / (max - min);
        // Update CSS variable for gradient fill
        inputEl.style.setProperty('--value', `${pct}%`);
    }

    // Enhanced toast notifications
    function showModernToast(message, type = 'info') {
        if (!elements.toastNotification) return;

        const toastIcon = elements.toastNotification.querySelector('.toast-icon');
        const toastMessage = elements.toastNotification.querySelector('.toast-message');

        if (!toastIcon || !toastMessage) return;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        toastIcon.className = `toast-icon ${icons[type]}`;
        toastMessage.textContent = message;
        elements.toastNotification.className = `toast-notification ${type}`;

        // Enhanced entrance animation
        elements.toastNotification.style.transform = 'translateX(400px) scale(0.9)';
        setTimeout(() => {
            elements.toastNotification.classList.add('show');
            elements.toastNotification.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            elements.toastNotification.style.transform = 'translateX(0) scale(1)';
        }, 100);

        setTimeout(() => {
            hideModernToast();
        }, 4500);
    }

    // Hide toast with enhanced exit animation
    function hideModernToast() {
        if (elements.toastNotification) {
            elements.toastNotification.style.transform = 'translateX(400px) scale(0.9)';
            elements.toastNotification.style.opacity = '0';

            setTimeout(() => {
                elements.toastNotification.classList.remove('show');
                elements.toastNotification.style.transform = '';
                elements.toastNotification.style.opacity = '';
                elements.toastNotification.style.transition = '';
            }, 400);
        }
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        
        @keyframes batteryBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);

    // Initialize the enhanced application
    init();

    console.log('🎉 Modern IoT Robot Controller fully loaded and ready!');


});