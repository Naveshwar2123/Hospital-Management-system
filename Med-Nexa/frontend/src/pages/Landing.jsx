import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity, Calendar, Clock, Shield, Users, Stethoscope,
  ArrowRight, FileText, Sparkles, Building2, CheckCircle2, ChevronRight,
  Bell, Volume2, UserCheck, HeartPulse, Check, Play, MapPin, AlertCircle
} from 'lucide-react';

const QUEUE_DEMO_DATA = [
  { token: 14, patient: 'Rohan Sharma', doctor: 'Dr. Priya Sharma', dept: 'Cardiology', room: 'OPD Room 4', status: 'In Consultation', waitMins: 'Now' },
  { token: 15, patient: 'Sunil Kumar', doctor: 'Dr. Priya Sharma', dept: 'Cardiology', room: 'OPD Room 4', status: 'Next In Line', waitMins: '4 mins' },
  { token: 16, patient: 'Meera Iyer', doctor: 'Dr. Priya Sharma', dept: 'Cardiology', room: 'OPD Room 4', status: 'Waiting in Lobby', waitMins: '12 mins' },
  { token: 17, patient: 'Deepak Patel', doctor: 'Dr. Priya Sharma', dept: 'Cardiology', room: 'OPD Room 4', status: 'Waiting in Lobby', waitMins: '19 mins' },
  { token: 18, patient: 'Anjali Verma', doctor: 'Dr. Priya Sharma', dept: 'Cardiology', room: 'OPD Room 4', status: 'En Route', waitMins: '28 mins' },
];

const DEPARTMENTS_DATA = {
  Cardiology: {
    doctor: 'Dr. Priya Sharma',
    qual: 'MD, DM (Cardiology) • Senior Specialist',
    room: 'OPD Room 4',
    nextSlot: 'Today at 10:45 AM',
    availableSlots: ['10:45 AM', '11:30 AM', '2:00 PM', '4:15 PM'],
    waitTime: '12 mins avg',
    badge: 'Live OPD Active'
  },
  Pediatrics: {
    doctor: 'Dr. Vikram Seth',
    qual: 'MBBS, MD (Pediatrics) • Child Specialist',
    room: 'OPD Room 2',
    nextSlot: 'Today at 11:15 AM',
    availableSlots: ['11:15 AM', '1:00 PM', '2:30 PM'],
    waitTime: '8 mins avg',
    badge: 'Walk-ins Welcomed'
  },
  Orthopedics: {
    doctor: 'Dr. Rajesh Iyer',
    qual: 'MS (Ortho) • Joint Replacement & Trauma',
    room: 'OPD Room 6',
    nextSlot: 'Today at 1:30 PM',
    availableSlots: ['1:30 PM', '3:00 PM', '4:45 PM'],
    waitTime: '15 mins avg',
    badge: 'High Demand'
  },
  Neurology: {
    doctor: 'Dr. Sunita Patel',
    qual: 'MD, DM (Neurology) • Clinical Neurologist',
    room: 'OPD Room 1',
    nextSlot: 'Today at 2:00 PM',
    availableSlots: ['2:00 PM', '3:15 PM'],
    waitTime: '10 mins avg',
    badge: 'Slots Filling'
  }
};

const Landing = () => {
  const { isAuthenticated, isDoctor } = useAuth();
  const dashboardPath = isDoctor ? '/doctor/dashboard' : '/patient/dashboard';

  // Scroll tracking & sticky nav
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Animated stat counters
  const [statDoctors, setStatDoctors] = useState(0);
  const [statRecords, setStatRecords] = useState(0);
  const [statSatisfaction, setStatSatisfaction] = useState(0);

  // Interactive OPD Queue Simulator State
  const [queueIndex, setQueueIndex] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  const [callAlertText, setCallAlertText] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Interactive Department Selector State
  const [selectedDept, setSelectedDept] = useState('Cardiology');

  // Interactive E-Prescription Preview Tab
  const [rxTab, setRxTab] = useState('meds'); // 'meds' | 'vitals' | 'advice'

  // Ref for scroll reveal observer
  const containerRef = useRef(null);

  // Pleasant clinical Web Audio chime
  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio playback fails silently if restricted
    }
  };

  // Simulate calling next token
  const handleCallNextToken = () => {
    playChimeSound();
    setIsCalling(true);
    const nextIdx = (queueIndex + 1) % QUEUE_DEMO_DATA.length;
    const nextPatient = QUEUE_DEMO_DATA[nextIdx];
    setCallAlertText(`📢 Token #${nextPatient.token} (${nextPatient.patient}) called to ${nextPatient.room}!`);
    setQueueIndex(nextIdx);

    setTimeout(() => {
      setIsCalling(false);
    }, 2400);
  };

  // Auto-advance demo toggle
  useEffect(() => {
    if (!autoAdvance) return;
    const interval = setInterval(() => {
      handleCallNextToken();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoAdvance, queueIndex]);

  // Scroll listener for sticky navbar & progress bar
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
      setIsScrolled(winScroll > 35);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animated stat counter on mount
  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();

    const animateCounters = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setStatDoctors(Math.floor(eased * 50));
      setStatRecords(Math.floor(eased * 100));
      setStatSatisfaction(Math.floor(eased * 99));

      if (progress < 1) {
        requestAnimationFrame(animateCounters);
      } else {
        setStatDoctors(50);
        setStatRecords(100);
        setStatSatisfaction(99);
      }
    };

    requestAnimationFrame(animateCounters);
  }, []);

  // Intersection Observer for scroll-triggered reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const currentServing = QUEUE_DEMO_DATA[queueIndex];
  const upcomingQueue = QUEUE_DEMO_DATA.filter((_, idx) => idx !== queueIndex);
  const activeDeptInfo = DEPARTMENTS_DATA[selectedDept];

  return (
    <div className="landing-page" ref={containerRef}>
      {/* Top Scroll Indicator Bar */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* Navbar with smooth scroll transitions */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="landing-logo">
          <img
            src="/med-nexa-logo.png"
            alt="Med-Nexa Hospital Management System"
            className="landing-brand-logo"
          />
        </Link>

        {/* Quick Nav Anchor Links */}
        <div className="landing-nav-anchors">
          <a href="#how-it-works" className="landing-nav-anchor">How It Works</a>
          <a href="#features" className="landing-nav-anchor">OPD Features</a>
          <a href="#specialties" className="landing-nav-anchor">Specialties</a>
        </div>

        <div className="landing-nav-links">
          {isAuthenticated ? (
            <Link to={dashboardPath} className="btn btn-primary">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/patient/doctors" className="btn btn-primary">
              Book Appointment <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section with Hospital Management Copy & Floating Illustration */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Hero Content */}
          <div className="hero-content">
            <div className="hero-badge animate-fade-in">
              <span className="live-radar-dot" />
              <Building2 size={15} />
              Hospital Care &amp; Outpatient Management
            </div>

            <h1 className="animate-slide-up delay-1">
              Modern Hospital Care &amp;<br />
              <span>Zero OPD Wait Times</span>
            </h1>

            <p className="animate-slide-up delay-2">
              Streamline your hospital journey from specialist discovery and slot booking to automated OPD token tracking and secure digital prescriptions — all in one unified medical platform.
            </p>

            <div className="hero-actions animate-slide-up delay-3">
              <Link to="/patient/doctors" className="btn btn-primary btn-lg hero-cta-btn">
                Book Appointment <ArrowRight size={18} />
              </Link>
              <Link to="/login?role=doctor" className="btn btn-secondary btn-lg">
                Doctor Portal
              </Link>
            </div>

            {/* Dynamic Animated Stats */}
            <div className="hero-stats animate-slide-up delay-4">
              <div className="hero-stat">
                <h3>{statDoctors}+</h3>
                <p>Specialist Doctors</p>
              </div>
              <div className="hero-stat">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="live-radar-dot" />
                  <h3 style={{ color: '#00a651' }}>Live</h3>
                </div>
                <p>OPD Token Tracking</p>
              </div>
              <div className="hero-stat">
                <h3>{statSatisfaction}%</h3>
                <p>On-Time Consultations</p>
              </div>
              <div className="hero-stat">
                <h3>{statRecords}%</h3>
                <p>Digital Health Records</p>
              </div>
            </div>
          </div>

          {/* Right Hero: Clinical Doctor & Patient Illustration with Gentle Floating */}
          <div className="hero-illustration-clean animate-fade-in delay-2">
            <div className="hero-ambient-glow" />
            <img
              src="/hero-doctor-patient.png"
              alt="Medical consultation with doctor and patient"
              className="hero-illustration-img floating-illustration"
            />
          </div>
        </div>
      </section>

      {/* Interactive 3-Step Outpatient Journey */}
      <section id="how-it-works" className="journey-section reveal-on-scroll">
        <div className="section-header">
          <div className="bento-pill" style={{ margin: '0 auto 12px' }}>
            <Activity size={14} /> Seamless Patient Flow
          </div>
          <h2>How Med-Nexa Eliminates Waiting Room Congestion</h2>
          <p>
            Experience a stress-free outpatient visit in three straightforward steps designed for patients and doctors.
          </p>
        </div>

        <div className="journey-steps-grid">
          <div className="journey-step-card">
            <div className="journey-step-num">01</div>
            <div className="journey-step-icon">
              <Calendar size={28} />
            </div>
            <h4>Book Specialist Slot</h4>
            <p>
              Choose your physician and department online. Secure a confirmed consultation slot without waiting in early morning hospital queues.
            </p>
            <div className="journey-step-tag">Zero Counter Lineups</div>
          </div>

          <div className="journey-step-arrow">
            <ChevronRight size={24} />
          </div>

          <div className="journey-step-card active-card">
            <div className="journey-step-num">02</div>
            <div className="journey-step-icon highlight">
              <Clock size={28} />
            </div>
            <h4>Live Token &amp; Room Call</h4>
            <p>
              Receive your live digital OPD token. Relax in the hospital cafeteria or garden while monitoring your queue progress on your smartphone.
            </p>
            <div className="journey-step-tag active-tag">Real-Time Mobile Alerts</div>
          </div>

          <div className="journey-step-arrow">
            <ChevronRight size={24} />
          </div>

          <div className="journey-step-card">
            <div className="journey-step-num">03</div>
            <div className="journey-step-icon">
              <FileText size={28} />
            </div>
            <h4>Consult &amp; Digital Rx</h4>
            <p>
              Step into the doctor’s room when your token is called. Get your digital prescription instantly on your phone with full medication details.
            </p>
            <div className="journey-step-tag">Paperless &amp; Permanent</div>
          </div>
        </div>
      </section>

      {/* Bento Box Features Section with Interactive Live Simulation */}
      <section id="features" className="features-section">
        <div className="section-header reveal-on-scroll">
          <div className="bento-pill" style={{ margin: '0 auto 12px' }}>
            <Sparkles size={14} /> Integrated Clinical &amp; Outpatient Care
          </div>
          <h2>Everything Your Hospital Needs, Under One Platform</h2>
          <p>
            Designed to eliminate crowded waiting corridors, streamline physician consultations,
            and provide patients with transparent, compassionate, and efficient medical care.
          </p>
        </div>

        <div className="features-bento">
          {/* Bento Box 1: Live OPD Queue Management (Span 8) - WITH INTERACTIVE DEMO */}
          <div className="feature-bento-card span-8 highlight reveal-on-scroll interactive-card">
            <div className="bento-card-top">
              <div className="feature-icon"><Clock size={26} /></div>
              <div className="interactive-badge">
                <span className="live-radar-dot" /> Interactive OPD Demo
              </div>
            </div>

            <h3>Live Outpatient (OPD) Queue Management</h3>
            <p>
              Patients receive a live digital token upon arrival and can monitor queue progress directly
              from their phone or clinic display boards. Try the interactive token simulator below to see
              how doctors call the next patient seamlessly:
            </p>

            {/* Interactive Live OPD Board Simulator */}
            <div className={`opd-simulator-box ${isCalling ? 'pulse-calling' : ''}`}>
              <div className="opd-sim-header">
                <div className="opd-sim-status">
                  <span className="live-radar-dot" />
                  <span>CONSULTATION IN PROGRESS</span>
                </div>
                <div className="opd-sim-room">
                  <MapPin size={13} /> {currentServing.room} • {currentServing.dept}
                </div>
              </div>

              <div className="opd-sim-body">
                <div className="opd-sim-token-display">
                  <span className="opd-sim-token-label">NOW SERVING</span>
                  <div className="opd-sim-token-number">
                    TOKEN #{currentServing.token}
                  </div>
                  <div className="opd-sim-patient-name">
                    Patient: <strong>{currentServing.patient}</strong>
                  </div>
                  <div className="opd-sim-doctor">
                    Attending: {currentServing.doctor}
                  </div>
                </div>

                <div className="opd-sim-upcoming">
                  <div className="opd-sim-upcoming-title">
                    <Users size={14} /> Next Up in Waiting Lobby:
                  </div>
                  <div className="opd-sim-upcoming-list">
                    {upcomingQueue.slice(0, 3).map((item, idx) => (
                      <div key={item.token} className="opd-sim-upcoming-item">
                        <span className="opd-badge-token">#{item.token}</span>
                        <span className="opd-patient-snippet">{item.patient}</span>
                        <span className="opd-wait-snippet">{idx === 0 ? 'Next' : `~${(idx + 1) * 7}m`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calling Alert Banner */}
              {callAlertText && (
                <div className="opd-sim-alert-banner animate-fade-in">
                  <Volume2 size={16} />
                  <span>{callAlertText}</span>
                </div>
              )}

              {/* Simulator Action Bar */}
              <div className="opd-sim-actions">
                <button
                  type="button"
                  onClick={handleCallNextToken}
                  className="btn btn-primary opd-call-btn"
                  title="Click to simulate calling the next patient in queue"
                >
                  <Bell size={16} className={isCalling ? 'animate-bounce' : ''} />
                  Simulate Calling Next Token
                </button>

                <label className="opd-auto-toggle" title="Toggle automatic patient calling demonstration">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                  />
                  <span>Auto-Advance Demo</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <span className="bento-pill">Digital OPD Tokens</span>
              <span className="bento-pill">Live Room Call Alerts</span>
              <span className="bento-pill">Zero Waiting Hall Chaos</span>
            </div>
          </div>

          {/* Bento Box 2: Specialist Scheduling (Span 4) - WITH INTERACTIVE DEPARTMENT PICKER */}
          <div id="specialties" className="feature-bento-card span-4 reveal-on-scroll interactive-card">
            <div className="feature-icon"><Calendar size={26} /></div>
            <h3>Doctor Scheduling &amp; Slot Booking</h3>
            <p>
              Browse verified specialists across departments and view real-time slot availability:
            </p>

            {/* Interactive Department Switcher Tabs */}
            <div className="dept-tabs-selector">
              {Object.keys(DEPARTMENTS_DATA).map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`dept-tab-chip ${selectedDept === dept ? 'active' : ''}`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Dynamic Doctor Slot Card Preview */}
            <div className="dept-preview-card animate-fade-in" key={selectedDept}>
              <div className="dept-preview-header">
                <div>
                  <h5 className="dept-preview-doctor">{activeDeptInfo.doctor}</h5>
                  <span className="dept-preview-qual">{activeDeptInfo.qual}</span>
                </div>
                <span className="dept-preview-badge">{activeDeptInfo.badge}</span>
              </div>

              <div className="dept-preview-details">
                <div className="dept-preview-row">
                  <MapPin size={13} color="#00a651" />
                  <span>{activeDeptInfo.room}</span>
                </div>
                <div className="dept-preview-row">
                  <Clock size={13} color="#00a651" />
                  <span>Next Slot: <strong>{activeDeptInfo.nextSlot}</strong></span>
                </div>
              </div>

              <div className="dept-slots-chips">
                {activeDeptInfo.availableSlots.map((slot) => (
                  <span key={slot} className="slot-chip">{slot}</span>
                ))}
              </div>

              <Link to="/patient/doctors" className="btn btn-outline-primary btn-sm btn-block" style={{ marginTop: 14 }}>
                Book Consultation <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
              <span className="badge badge-primary">Guaranteed Appointment Slots</span>
            </div>
          </div>

          {/* Bento Box 3: Doctor Command Center (Span 4) */}
          <div className="feature-bento-card span-4 reveal-on-scroll interactive-card">
            <div className="feature-icon"><Stethoscope size={26} /></div>
            <h3>Physician &amp; Clinic Command Center</h3>
            <p>
              A focused workspace for doctors to view their daily outpatient roster, call the next patient
              with one tap, examine symptoms and clinical history, and update queue statuses in real time.
            </p>

            {/* Doctor Workflow Micro-Preview */}
            <div className="doctor-workflow-preview">
              <div className="workflow-item">
                <span className="workflow-check"><Check size={13} /></span>
                <div>
                  <strong>1-Tap Patient Calling:</strong> Instant chime &amp; digital board trigger
                </div>
              </div>
              <div className="workflow-item">
                <span className="workflow-check"><Check size={13} /></span>
                <div>
                  <strong>Live Roster Visibility:</strong> Track checked-in vs waiting patients
                </div>
              </div>
              <div className="workflow-item">
                <span className="workflow-check"><Check size={13} /></span>
                <div>
                  <strong>Rapid Symptom Notes:</strong> Structured digital clinical inputs
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
              <Link to="/login?role=doctor" className="btn btn-secondary btn-sm btn-block">
                Enter Doctor Workspace <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Bento Box 4: Digital Prescriptions & EHR (Span 8) - WITH INTERACTIVE PREVIEW TABS */}
          <div className="feature-bento-card span-8 reveal-on-scroll interactive-card">
            <div className="feature-icon"><FileText size={26} /></div>
            <h3>Digital Prescriptions &amp; Electronic Health Records</h3>
            <p>
              Doctors attach structured digital prescriptions with exact medication dosages, clinical advice,
              and follow-up instructions during consultation. Patients maintain an organized, permanent medical
              history accessible anytime for pharmacy visits or follow-ups.
            </p>

            {/* Interactive E-Rx Clinical Preview Box */}
            <div className="rx-preview-box">
              <div className="rx-preview-nav">
                <button
                  type="button"
                  className={`rx-nav-btn ${rxTab === 'meds' ? 'active' : ''}`}
                  onClick={() => setRxTab('meds')}
                >
                  <FileText size={14} /> Prescribed Medications
                </button>
                <button
                  type="button"
                  className={`rx-nav-btn ${rxTab === 'vitals' ? 'active' : ''}`}
                  onClick={() => setRxTab('vitals')}
                >
                  <HeartPulse size={14} /> Recorded Vitals
                </button>
                <button
                  type="button"
                  className={`rx-nav-btn ${rxTab === 'advice' ? 'active' : ''}`}
                  onClick={() => setRxTab('advice')}
                >
                  <AlertCircle size={14} /> Physician Advice
                </button>
              </div>

              <div className="rx-preview-content">
                {rxTab === 'meds' && (
                  <div className="rx-meds-list animate-fade-in">
                    <div className="rx-med-item">
                      <span className="rx-med-num">1</span>
                      <div className="rx-med-details">
                        <strong>Tab. Amoxicillin + Clavulanic Acid 625mg</strong>
                        <span>Dosage: 1 Tablet twice daily (After food) • Duration: 5 Days</span>
                      </div>
                      <span className="badge badge-success">Active</span>
                    </div>
                    <div className="rx-med-item">
                      <span className="rx-med-num">2</span>
                      <div className="rx-med-details">
                        <strong>Tab. Paracetamol 650mg</strong>
                        <span>Dosage: 1 Tablet as needed for fever/pain • SOS</span>
                      </div>
                      <span className="badge badge-success">Active</span>
                    </div>
                  </div>
                )}

                {rxTab === 'vitals' && (
                  <div className="rx-vitals-grid animate-fade-in">
                    <div className="rx-vital-card">
                      <span className="vital-label">Blood Pressure</span>
                      <strong className="vital-val">120 / 80 mmHg</strong>
                      <span className="vital-status normal">Optimal</span>
                    </div>
                    <div className="rx-vital-card">
                      <span className="vital-label">Heart Rate</span>
                      <strong className="vital-val">74 bpm</strong>
                      <span className="vital-status normal">Regular</span>
                    </div>
                    <div className="rx-vital-card">
                      <span className="vital-label">SpO2</span>
                      <strong className="vital-val">99%</strong>
                      <span className="vital-status normal">Normal</span>
                    </div>
                    <div className="rx-vital-card">
                      <span className="vital-label">Temperature</span>
                      <strong className="vital-val">98.4 °F</strong>
                      <span className="vital-status normal">Afebrile</span>
                    </div>
                  </div>
                )}

                {rxTab === 'advice' && (
                  <div className="rx-advice-body animate-fade-in">
                    <div className="advice-point">
                      <Check size={15} color="#00a651" />
                      <span>Maintain adequate oral hydration; drink 2.5 - 3 liters of warm water daily.</span>
                    </div>
                    <div className="advice-point">
                      <Check size={15} color="#00a651" />
                      <span>Complete the full 5-day antibiotic course even if symptoms resolve early.</span>
                    </div>
                    <div className="advice-point">
                      <Check size={15} color="#00a651" />
                      <span>Follow up in OPD Room 4 next Monday or earlier if symptoms persist.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <span className="bento-pill">Structured E-Prescriptions</span>
              <span className="bento-pill">Permanent Medical History</span>
              <span className="bento-pill">Printable Pharmacy Records</span>
            </div>
          </div>

          {/* Bento Box 5: Hospital Privacy & Security (Span 12) */}
          <div className="feature-bento-card span-12 reveal-on-scroll" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', border: '1.5px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ maxWidth: 760 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Shield size={20} color="#16a34a" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: 1 }}>Patient Privacy &amp; Security</span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 22 }}>Hospital-Grade Data Protection &amp; Patient Confidentiality</h3>
                <p style={{ margin: 0, fontSize: 14 }}>
                  Built with rigorous clinical data standards. Encrypted records and strict role isolation guarantee
                  that patient health records remain completely private and accessible only to authorized medical personnel and the patient.
                </p>
              </div>
              <Link to="/patient/doctors" className="btn btn-primary btn-lg">
                Find a Specialist <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <img src="/med-nexa-icon.png" alt="Med-Nexa" style={{ height: 28, width: 28, objectFit: 'contain' }} />
          <strong style={{ color: '#ffffff', fontSize: 16 }}>Med-Nexa Hospital Management System</strong>
        </div>
        <p>© 2024 Med-Nexa Healthcare Solutions. Advanced Hospital &amp; Outpatient Queue Management.</p>
      </footer>
    </div>
  );
};

export default Landing;
