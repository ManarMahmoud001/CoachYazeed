import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient";
import NotificationBell from "./NotificationBell";

const toISODate = (ddmmyyyy) => {
  const [day, month, year] = ddmmyyyy.split("/");
  return `${year}-${month}-${day}`;
};

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [session, setSession] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [isAdmin, setIsAdmin] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupBirthDate, setSignupBirthDate] = useState("");
  const [signupGender, setSignupGender] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    const loadAdminStatus = async (userId) => {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single();
      setIsAdmin(data?.is_admin || false);
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadAdminStatus(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadAdminStatus(newSession.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleBirthDateChange = (e) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.length > 8) digits = digits.slice(0, 8);

    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(
        4
      )}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    setSignupBirthDate(formatted);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginError("Incorrect email or password");
    } else {
      setShowLoginModal(false);
      setLoginEmail("");
      setLoginPassword("");
    }

    setLoginLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError("");
    setSignupSuccess("");

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          full_name: signupName,
          birth_date: toISODate(signupBirthDate),
          gender: signupGender,
        },
      },
    });

    if (error) {
      setSignupError(error.message);
    } else {
      setSignupSuccess(
        "Account created! Please check your email to confirm your account."
      );
      setSignupName("");
      setSignupBirthDate("");
      setSignupGender("");
      setSignupEmail("");
      setSignupPassword("");
    }

    setSignupLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowAccountMenu(false);
    window.location.href = "/";
  };

  const handleLoginIconClick = () => {
    if (session) {
      setShowAccountMenu((value) => !value);
    } else {
      setAuthMode("login");
      setShowLoginModal(true);
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginError("");
    setSignupError("");
    setSignupSuccess("");
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a href="/" className="brand-lockup" onClick={closeMenu}>
            <img
              src="/brand/logo.png"
              alt="Yazeed Flifel"
              className="brand-mark"
            />
          </a>

          <nav
            className={`desktop-nav ${menuOpen ? "mobile-open" : ""}`}
            aria-label="Primary navigation"
          >
            <a href="/#home" onClick={closeMenu}>
              Home
            </a>
            <a href="/#coaching" onClick={closeMenu}>
              Coaching
            </a>
            <a href="/#nutrition" onClick={closeMenu}>
              Nutrition
            </a>
            <a href="/#consultations" onClick={closeMenu}>
              Consultations
            </a>

            <a
              className="btn btn-small"
              href="https://wa.me/962782985444?text=Hi%20Yazeed,%20I%20want%20to%20start%20training!"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              Start Training
            </a>
          </nav>

          <div className="header-actions">
            {session && <NotificationBell session={session} isAdmin={isAdmin} />}

            <div className="account-wrap">
              <button
                type="button"
                className="login-icon-btn"
                aria-label={session ? "Account" : "Login"}
                onClick={handleLoginIconClick}
              >
                <User size={20} />
              </button>

              {showAccountMenu && session && (
                <div className="account-dropdown">
                  <p className="account-email">{session.user.email}</p>

                  {isAdmin && (
                    <a href="/admin" className="account-menu-btn">
                      <User size={16} />
                      Dashboard
                    </a>
                  )}

                  <a href="/profile" className="account-menu-btn">
                    <User size={16} />
                    Profile
                  </a>

                  <button
                    type="button"
                    className="account-menu-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>

            <button
              className="menu-toggle"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>

      {showLoginModal && (
        <div className="login-modal-overlay" onClick={closeLoginModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="login-modal-close"
              aria-label="Close"
              onClick={closeLoginModal}
            >
              <X size={20} />
            </button>

            {authMode === "login" ? (
              <>
                <h3>Log In</h3>

                <form onSubmit={handleLogin}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />

                  {loginError && <p className="login-error">{loginError}</p>}

                  <button
                    type="submit"
                    className="btn login-submit-btn"
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Logging in..." : "Log In"}
                  </button>
                </form>

                <p className="auth-toggle-text">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="auth-toggle-link"
                    onClick={() => {
                      setAuthMode("signup");
                      setLoginError("");
                    }}
                  >
                    Sign Up
                  </button>
                </p>
              </>
            ) : (
              <>
                <h3>Sign Up</h3>

                <form onSubmit={handleSignup}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />

                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={signupBirthDate}
                    onChange={handleBirthDateChange}
                    maxLength={10}
                    required
                  />

                  <select
                    value={signupGender}
                    onChange={(e) => setSignupGender(e.target.value)}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>

                  <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />

                  {signupError && (
                    <p className="login-error">{signupError}</p>
                  )}
                  {signupSuccess && (
                    <p className="signup-success">{signupSuccess}</p>
                  )}

                  <button
                    type="submit"
                    className="btn login-submit-btn"
                    disabled={signupLoading}
                  >
                    {signupLoading ? "Creating account..." : "Sign Up"}
                  </button>
                </form>

                <p className="auth-toggle-text">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-toggle-link"
                    onClick={() => {
                      setAuthMode("login");
                      setSignupError("");
                      setSignupSuccess("");
                    }}
                  >
                    Log In
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
