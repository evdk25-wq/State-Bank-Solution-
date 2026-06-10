'use strict';

/* 1. DOM SELECTORS — Accès centralisé au DOM */
const DOMSelectors = {
  /* Étapes */
  steps:       () => [1, 2, 3].map(i => document.getElementById(`step${i}`)),
  stepNodes:   () => [1, 2, 3].map(i => document.getElementById(`sn${i}`)),
  stepCircles: () => [1, 2, 3].map(i => document.getElementById(`sc${i}`)),
  stepLines:   () => [1, 2].map(i => document.getElementById(`sl${i}`)),

  /* Header dynamique */
  eyebrow:  () => document.getElementById('formEyebrow'),
  title:    () => document.getElementById('formTitle'),
  sub:      () => document.getElementById('formSub'),
  secBadge: () => document.getElementById('secBadge'),
  secText:  () => document.getElementById('secBadgeText'),

  /* Étape 1 */
  loginForm:  () => document.getElementById('loginForm'),
  iban:       () => document.getElementById('iban'),
  password:   () => document.getElementById('password'),
  togglePwd:  () => document.getElementById('togglePwd'),
  eyeIcon:    () => document.getElementById('eyeIcon'),
  remember:   () => document.getElementById('remember'),
  btn1:       () => document.getElementById('btn1'),
  btn1Text:   () => document.getElementById('btn1Text'),
  btn1Arr:    () => document.getElementById('btn1Arr'),
  spin1:      () => document.getElementById('spin1'),
  fb1:        () => document.getElementById('fb1'),
  attemptDots: () => [1, 2, 3].map(i => document.getElementById(`d${i}`)),

  /* Étape 2 */
  otpBoxes:  () => [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`o${i}`)),
  countdown: () => document.getElementById('countdown'),
  resendBtn: () => document.getElementById('resendBtn'),
  btn2:      () => document.getElementById('btn2'),
  btn2Text:  () => document.getElementById('btn2Text'),
  spin2:     () => document.getElementById('spin2'),
  fb2:       () => document.getElementById('fb2'),
  btnBack:   () => document.getElementById('btnBack'),
};

/* SVG icons */
const ICON_EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const ICON_EYE_SHUT = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
  <line x1="1" y1="1" x2="23" y2="23"/>`;
const ICON_CHECK = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
  <path d="M20 6L9 17l-5-5"/></svg>`;

/* 2. FORM VALIDATOR — Responsabilité unique : validation */
const FormValidator = {
  isIbanValid(value) {
    // Accept any non-empty IBAN-like string (frontend check only)
    return value.replace(/\s/g, '').length >= 8;
  },

  isPasswordValid(value) {
    return value.length >= 6;
  },

  isOtpComplete(boxes) {
    return boxes.every(box => box.value.trim() !== '');
  },

  getOtpCode(boxes) {
    return boxes.map(box => box.value).join('');
  },
};

/* 3. UI MANAGER — Responsabilité unique : mise à jour du DOM */
const UIManager = {
  setFeedback(element, type, message) {
    element.className = `feedback feedback--${type}`;
    element.textContent = message;
  },

  clearFeedback(element) {
    element.className = 'feedback';
    element.textContent = '';
  },

  setButtonLoading(btn, spinner, textEl, arrowEl, isLoading) {
    btn.disabled = isLoading;
    spinner.style.display    = isLoading ? 'block' : 'none';
    textEl.style.display     = isLoading ? 'none'  : 'inline';
    if (arrowEl) arrowEl.style.display = isLoading ? 'none' : 'block';
  },

  markAttemptUsed(dots, index) {
    if (dots[index]) dots[index].classList.add('attempt-dot--used');
  },

  disableButton(btn) {
    btn.disabled = true;
  },

  updateSecurityBadge(text, isGold = false) {
    const badge = DOMSelectors.secBadge();
    const label = DOMSelectors.secText();
    if (!badge || !label) return;

    label.textContent = text;
    badge.style.borderColor = isGold ? 'rgba(200,168,75,.4)' : 'rgba(82,160,122,.3)';
    badge.style.color       = isGold ? 'var(--color-gold)'   : 'var(--color-success)';
  },

  updateHeader(eyebrow, title, sub) {
    DOMSelectors.eyebrow().textContent = eyebrow;
    DOMSelectors.title().textContent   = title;
    DOMSelectors.sub().textContent     = sub;
  },

  togglePasswordVisibility(input, iconEl) {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    iconEl.innerHTML = isHidden ? ICON_EYE_SHUT : ICON_EYE_OPEN;
  },
};

/* 4. OTP HANDLER — Responsabilité unique : gestion OTP */
const OTPHandler = {
  init() {
    const boxes = DOMSelectors.otpBoxes();

    boxes.forEach((box, index) => {
      box.addEventListener('input',   e => this._onInput(e, boxes, index));
      box.addEventListener('keydown', e => this._onKeydown(e, boxes, index));
      box.addEventListener('paste',   e => this._onPaste(e, boxes));
    });
  },

  _onInput(event, boxes, index) {
    const raw = event.target.value.replace(/\D/g, '');
    event.target.value = raw.slice(-1);
    event.target.classList.toggle('otp-box--filled', !!event.target.value);

    if (raw && index < boxes.length - 1) {
      boxes[index + 1].focus();
    }
  },

  _onKeydown(event, boxes, index) {
    if (event.key === 'Backspace' && !boxes[index].value && index > 0) {
      boxes[index - 1].focus();
      boxes[index - 1].value = '';
      boxes[index - 1].classList.remove('otp-box--filled');
    }
  },

  _onPaste(event, boxes) {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    digits.split('').forEach((char, i) => {
      if (boxes[i]) {
        boxes[i].value = char;
        boxes[i].classList.add('otp-box--filled');
      }
    });
    const nextEmpty = boxes[digits.length];
    if (nextEmpty) nextEmpty.focus();
  },

  reset() {
    DOMSelectors.otpBoxes().forEach(box => {
      box.value = '';
      box.classList.remove('otp-box--filled');
    });
    DOMSelectors.otpBoxes()[0].focus();
  },
};

/* 5. TIMER — Responsabilité unique : compte à rebours */
const Timer = {
  _intervalId: null,
  _seconds: 300,

  start() {
    this.stop();
    this._seconds = 300;
    this._tick();
    this._intervalId = setInterval(() => this._tick(), 1000);
  },

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  },

  _tick() {
    const el = DOMSelectors.countdown();
    if (!el) return;

    if (this._seconds <= 0) {
      el.textContent = 'expiré';
      this.stop();
      return;
    }

    const m = String(Math.floor(this._seconds / 60)).padStart(2, '0');
    const s = String(this._seconds % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
    this._seconds--;
  },
};

/* 6. AUTH SERVICE — Appels API (simulés côté frontend) */
const AuthService = {
  /**
   * POST /api/auth/login
   * @param {string} iban
   * @param {string} password
   * @returns {Promise<{success: boolean}>}
   */
  async login(iban, password) {
    // Simple mock for frontend: simulate network delay
    await this._delay(800);
    return { success: FormValidator.isIbanValid(iban) && FormValidator.isPasswordValid(password) };
  },

  /**
   * POST /api/auth/verify-otp
   * @param {string} code
   * @returns {Promise<{success: boolean}>}
   */
  async verifyOtp(code) {
    // Mock verification: accept any 6-digit numeric code (frontend-only)
    await this._delay(700);
    return { success: /^\d{6}$/.test(code) };
  },

  _delay: ms => new Promise(resolve => setTimeout(resolve, ms)),
};

/* 7. STEP MANAGER — Responsabilité unique : orchestration des étapes */
const STEP_CONFIG = {
  1: {
    eyebrow: '',
    title:   'Identifiants',
    sub:     '',
    badge:   { text: 'Sécurité active', gold: false },
  },
  2: {
    eyebrow: 'Étape 2 sur 3',
    title:   'Vérification',
    sub:     'Saisissez le code reçu par SMS.',
    badge:   { text: 'Authentification à deux facteurs', gold: false },
  },
  3: {
    eyebrow: 'Terminé',
    title:   'Accès accordé',
    sub:     'Redirection en cours…',
    badge:   { text: 'Session chiffrée', gold: true },
  },
};

const StepManager = {
  _current: 1,

  goTo(n) {
    const steps   = DOMSelectors.steps();
    const nodes   = DOMSelectors.stepNodes();
    const circles = DOMSelectors.stepCircles();
    const lines   = DOMSelectors.stepLines();
    const config  = STEP_CONFIG[n];

    /* Panneaux */
    steps.forEach((panel, i) => {
      panel.classList.toggle('step-panel--active', i + 1 === n);
    });

    /* Nœuds + lignes */
    nodes.forEach((node, i) => {
      const step = i + 1;
      node.className = 'step-node' +
        (step < n  ? ' step-node--done'   : '') +
        (step === n ? ' step-node--active' : '');

      circles[i].innerHTML = step < n ? ICON_CHECK : String(step);
    });

    lines.forEach((line, i) => {
      line.classList.toggle('step-bar__line--filled', i + 1 < n);
    });

    /* Header */
    UIManager.updateHeader(config.eyebrow, config.title, config.sub);
    UIManager.updateSecurityBadge(config.badge.text, config.badge.gold);

    /* Masquer divider + session-info à l'étape 3 */
    const divider = document.querySelector('.panel-right__divider');
    const sessInfo = document.querySelector('.session-info');
    if (divider)  divider.style.display  = n === 3 ? 'none' : '';
    if (sessInfo) sessInfo.style.display = n === 3 ? 'none' : '';

    /* Actions spécifiques par étape */
    if (n === 2) Timer.start();
    if (n === 3) this._onSuccess();

    this._current = n;
  },

  _onSuccess() {
    setTimeout(() => {
      // Redirige vers le tableau de bord (ajuster l'URL côté back-end)
      window.location.href = '/dashboard.html';
    }, 1200);
  },
};

/* 8. APP — Bootstrap : lie les événements aux modules */
const App = {
  _attempts: 0,
  MAX_ATTEMPTS: 3,

  init() {
    this._bindStep1();
    this._bindStep2();
    this._bindIbanFormat();
    this._bindTogglePassword();
  },

  /* Étape 1 */
  _bindStep1() {
    DOMSelectors.loginForm().addEventListener('submit', async e => {
      e.preventDefault();
      const iban     = DOMSelectors.iban().value.trim();
      const password = DOMSelectors.password().value;
      const fb       = DOMSelectors.fb1();

      UIManager.clearFeedback(fb);

      if (!iban || !password) {
        UIManager.setFeedback(fb, 'error', 'Veuillez remplir tous les champs.');
        return;
      }

      UIManager.setButtonLoading(
        DOMSelectors.btn1(), DOMSelectors.spin1(),
        DOMSelectors.btn1Text(), DOMSelectors.btn1Arr(), true
      );

      const { success } = await AuthService.login(iban, password);

      UIManager.setButtonLoading(
        DOMSelectors.btn1(), DOMSelectors.spin1(),
        DOMSelectors.btn1Text(), DOMSelectors.btn1Arr(), false
      );

      if (success) {
        StepManager.goTo(2);
      } else {
        this._handleFailedAttempt(fb);
      }
    });
  },

  _handleFailedAttempt(fb) {
    this._attempts++;
    UIManager.markAttemptUsed(DOMSelectors.attemptDots(), this._attempts - 1);

    if (this._attempts >= this.MAX_ATTEMPTS) {
      UIManager.setFeedback(fb, 'error', 'Compte bloqué. Contactez le support : +32 2 000 0000.');
      UIManager.disableButton(DOMSelectors.btn1());
    } else {
      const remaining = this.MAX_ATTEMPTS - this._attempts;
      UIManager.setFeedback(fb, 'error', `Identifiants invalides. ${remaining} tentative(s) restante(s).`);
      DOMSelectors.password().value = '';
    }
  },

  /* Étape 2 */
  _bindStep2() {
    OTPHandler.init();

    DOMSelectors.btn2().addEventListener('click', async () => {
      const boxes = DOMSelectors.otpBoxes();
      const fb    = DOMSelectors.fb2();

      if (!FormValidator.isOtpComplete(boxes)) {
        UIManager.setFeedback(fb, 'error', 'Entrez les 6 chiffres du code.');
        return;
      }

      UIManager.setButtonLoading(
        DOMSelectors.btn2(), DOMSelectors.spin2(),
        DOMSelectors.btn2Text(), null, true
      );

      const { success } = await AuthService.verifyOtp(FormValidator.getOtpCode(boxes));

      UIManager.setButtonLoading(
        DOMSelectors.btn2(), DOMSelectors.spin2(),
        DOMSelectors.btn2Text(), null, false
      );

      if (success) {
        Timer.stop();
        StepManager.goTo(3);
      } else {
        UIManager.setFeedback(fb, 'error', 'Code incorrect. Vérifiez votre SMS.');
        OTPHandler.reset();
      }
    });

    DOMSelectors.btnBack().addEventListener('click', () => {
      Timer.stop();
      StepManager.goTo(1);
    });

    DOMSelectors.resendBtn().addEventListener('click', () => {
      OTPHandler.reset();
      UIManager.setFeedback(DOMSelectors.fb2(), 'success', 'Nouveau code envoyé.');
      Timer.start();
    });
  },

  /* Format IBAN */
  _bindIbanFormat() {
    DOMSelectors.iban().addEventListener('input', e => {
      const raw = e.target.value.replace(/\s/g, '').toUpperCase();
      e.target.value = raw.match(/.{1,4}/g)?.join(' ') ?? raw;
    });
  },

  /* Toggle mot de passe */
  _bindTogglePassword() {
    DOMSelectors.togglePwd().addEventListener('click', () => {
      UIManager.togglePasswordVisibility(
        DOMSelectors.password(),
        DOMSelectors.eyeIcon()
      );
    });
  },
};

/* Point d'entrée */
document.addEventListener('DOMContentLoaded', () => App.init());
