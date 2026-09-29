import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Menu,
  X,
  CheckCircle2,
  Instagram,
  Youtube,
  Facebook,
  Music2,
  User,
  LogOut,
} from "lucide-react";
import "./styles.css";
import { supabase } from "./supabaseClient";
import Header from "./Header";
import Footer from "./Footer";

const BRAND = {
  lime: "#A8FF00",
  green: "#5C7F00",
  white: "#F5F5F5",
  gray: "#222222",
  black: "#050505",
};

const Check = ({ className = "" }) => (
  <img
    src="/brand/checkmark.png"
    alt=""
    aria-hidden="true"
    className={`brand-check ${className}`}
  />
);
const toISODate = (ddmmyyyy) => {
  const [day, month, year] = ddmmyyyy.split("/");
  return `${year}-${month}-${day}`;
};
function App() {
  
  const [menuOpen, setMenuOpen] = useState(false);

  // Pro selected by default
  const [selectedTier, setSelectedTier] = useState("Pro");

  const [isAdmin, setIsAdmin] = useState(false);

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

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    alert(`You selected the ${tier} tier!`);
  };

  return (
    <main className="app-shell">
           <Header />

      {/* ================= HERO ================= */}
      <section id="home" className="hero section-grid-texture">
        <div className="hero-glow" />

        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              Coach Yazeed
            </div>

            <h1 className="display">
              TRAIN <span>HARDER.</span>
              <br />
              MOVE <span>BETTER.</span>
              <br />
              BECOME <span>MORE.</span>
            </h1>

            <p className="hero-lede">
              Personalized coaching built around your goals,
              your body, and the performance you want to achieve.
            </p>

            <div className="hero-actions">
              <a
                href="https://wa.me/962782985444?text=Hi%20Yazeed,%20I%20want%20to%20start%20training!"
                className="btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Start Training <span>→</span>
              </a>

              <a href="#coaching" className="text-link">
                Explore Coaching
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Fitness photography">
            <div className="hero-photo-placeholder">
              <div className="placeholder-label">COACHING / PERFORMANCE</div>

              <div className="placeholder-cross" />

              <div className="placeholder-copy">
                <img
                  src="/brand/hero.png"
                  alt="Yazeed Flifel coaching a client in the gym"
                />
              </div>
            </div>

            <div className="visual-frame" />

            <Check className="floating-check" />

            <img src="/brand/brush.png" alt="" className="hero-brush" />
          </div>
        </div>
      </section>

      {/* ================= PERFORMANCE STRIP ================= */}
      <section className="performance-strip" aria-label="Coaching highlights">
        <div className="container strip-grid">
          {[
            "PERSONALIZED PROGRAMS",
            "RESULT-DRIVEN COACHING",
            "DIRECT COACH SUPPORT",
          ].map((item) => (
            <div className="strip-item" key={item}>
              <Check className="strip-check" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= COACHING + SERVICES ================= */}
      <section id="coaching" className="coach-offerings">
        <div className="coach-wrap">
          <div className="coach-heading">
            <div>
              <div className="coach-eyebrow">
                <span className="coach-eyebrow-line" />
                WHAT I OFFER
              </div>

              <h2 className="coach-title">
                COACHING BUILT
                <br />
                <span>AROUND YOU.</span>
              </h2>
            </div>

            <p className="coach-intro">
              Three focused ways to build a stronger body,
              smarter habits, and sustainable performance.
            </p>
          </div>

          {/* ================= SERVICES ================= */}
          <div className="coach-services">
            <article className="coach-service coach-online">
              <div className="coach-card-top">
                <div className="coach-number">01</div>
                <Check className="coach-check" />
              </div>

              <div className="coach-service-info">
                <h3>Online Coaching</h3>
                <p>
                  Structured coaching designed around your goals,
                  training level, schedule, and progress.
                </p>
              </div>
            </article>

            <article id="nutrition" className="coach-service coach-compact">
              <div className="coach-card-top">
                <div className="coach-number">02</div>
                <Check className="coach-check" />
              </div>

              <div className="coach-compact-content">
                <h3>Custom Nutrition Plans</h3>
                <p>
                  Personalized meal plans tailored to your goals,
                  lifestyle, preferences, training demands, and
                  individual nutritional needs.
                </p>

                <div className="coach-lime-line" />

                <a
                  href="https://wa.me/962782985444?text=Hi%20Yazeed,%20I%20want%20to%20start%20training!"
                  className="coach-action"
                >
                  Build My Plan <span>→</span>
                </a>
              </div>
            </article>

            <article
              id="consultations"
              className="coach-service coach-compact"
            >
              <div className="coach-card-top">
                <div className="coach-number">03</div>
                <Check className="coach-check" />
              </div>

              <div className="coach-compact-content">
                <h3>Priority Consultations</h3>
                <p>
                  Get exclusive access to focused one-on-one
                  consultations with quicker response times
                  and direct guidance when you need it most.
                </p>

                <div className="coach-lime-line" />

                <a href="#start" className="coach-action">
                  Book a Consultation <span>→</span>
                </a>
              </div>
            </article>
          </div>

          {/* ================= PRICING ================= */}
          <div className="coach-pricing-row">
            <div className="coach-pricing-header">
              <div className="coach-pricing-eyebrow">
                ONLINE COACHING BREAKDOWN
              </div>

              <h2>
                CHOOSE YOUR <span>COACHING TIER</span>
              </h2>

              <p>
                Select the exact intensity and support level
                that matches your transformation timeline.
              </p>
            </div>

            <div className="coach-pricing-grid">
              {/* ================= STARTER ================= */}
              <article
                className={`coach-price-card ${
                  selectedTier === "Starter" ? "coach-price-selected" : ""
                }`}
                onClick={() => setSelectedTier("Starter")}
              >
                <div className="coach-price-top">
                  <div>
                    <h3>STARTER</h3>
                    <span>1 Month Plan</span>
                  </div>
                </div>

                <p className="coach-price-description">
                  Ideal for self-driven lifters needing
                  structured progression.
                </p>

                <div className="coach-price-value">
                  <strong>130</strong>
                  <span>JD</span>
                </div>

                <div className="coach-features-title">TIER FEATURES:</div>

                <ul className="coach-feature-list">
                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Personalized Training Program
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Goal-Based Nutrition Plan
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Exercise Guidance & Recommendations
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Weekly Progress Check-In
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Direct WhatsApp Support
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Professional Guidance Throughout Your Journey
                  </li>
                </ul>
                 <a         
  href="/apply?tier=Starter"
  className="coach-price-button coach-price-cta"
  onClick={(e) => e.stopPropagation()}
>
  Apply
</a>
              </article>

              {/* ================= PRO ================= */}
              <article
                className={`coach-price-card ${
                  selectedTier === "Pro" ? "coach-price-selected" : ""
                }`}
                onClick={() => setSelectedTier("Pro")}
              >
                <div className="coach-popular">MOST POPULAR</div>

                <div className="coach-price-top">
                  <div>
                    <h3>PRO</h3>
                    <span>2 Month Plan</span>
                  </div>
                </div>

                <p className="coach-price-description">
                  Built for consistent progress with
                  ongoing coaching and accountability.
                </p>

                <div className="coach-price-value">
                  <strong>250</strong>
                  <span>JD</span>
                </div>

                <div className="coach-features-title">TIER FEATURES:</div>

                <ul className="coach-feature-list">
                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Personalized Training Program
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Customized Nutrition Plan
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Weekly Progress Tracking
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Training & Nutrition Adjustments
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Exercise Form & Technique Guidance
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Direct WhatsApp Coaching
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Ongoing Accountability & Support
                  </li>
                </ul>

       <a         
  href="/apply?tier=Pro"
  className="coach-price-button coach-price-cta"
  onClick={(e) => e.stopPropagation()}
>
  Apply
</a>
              </article>

              {/* ================= ELITE ================= */}
              <article
                className={`coach-price-card ${
                  selectedTier === "Elite" ? "coach-price-selected" : ""
                }`}
                onClick={() => setSelectedTier("Elite")}
              >
                <div className="coach-price-top">
                  <div>
                    <h3>ELITE</h3>
                    <span>3 Month Plan</span>
                  </div>
                </div>

                <p className="coach-price-description">
                  The complete coaching experience for
                  serious results and long-term transformation.
                </p>

                <div className="coach-price-value">
                  <strong>300</strong>
                  <span>JD</span>
                </div>

                <div className="coach-features-title">TIER FEATURES:</div>

                <ul className="coach-feature-list">
                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Fully Customized Training Program
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Personalized Nutrition Strategy
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Detailed Progress Tracking
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Regular Training & Nutrition Adjustments
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Exercise Form & Technique Support
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Personalized Cardio & Activity Recommendations
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Priority WhatsApp Support
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Continuous Coaching & Accountability
                  </li>

                  <li>
                    <span>
                      <CheckCircle2 size={18} />
                    </span>
                    Goal & Progress Reviews
                  </li>
                </ul>

                 <a         
  href="/apply?tier=Elite"
  className="coach-price-button coach-price-cta"
  onClick={(e) => e.stopPropagation()}
>
  Apply
</a>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PHILOSOPHY ================= */}
      <section className="philosophy section-grid-texture">
        <div className="honeycomb-bg" />

        <div className="container philosophy-grid">
          <div className="philosophy-type">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              THE APPROACH
            </div>

            <h2>
              YOUR <span>GOAL.</span>
              <br />
              YOUR <span>PLAN.</span>
              <br />
              YOUR <span>PROGRESS.</span>
            </h2>
          </div>

          <div className="philosophy-copy">
            <Check className="philosophy-check" />
            <p>
              Great results don't come from following
              someone else's routine. They come from having
              a strategy built around you — and the consistency
              to execute it.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section id="start" className="final-cta section-grid-texture">
        <div className="scratch-bg" />

        <div className="container cta-inner">
          <div className="eyebrow centered">
            <span className="eyebrow-line" />
            READY TO START?
            <span className="eyebrow-line" />
          </div>

          <h2>
            LET'S BUILD
            <br />
            <span>YOUR STRONGEST SELF.</span>
          </h2>

          <p>
            Stop guessing. Start training with a plan
            built for you.
          </p>

          <a
            href="https://wa.me/962782985444?text=Hi%20Yazeed,%20I%20want%20to%20start%20training!"
            className="btn btn-large"
          >
            Start Training <span>→</span>
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}

/* ================= ROOT ================= */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./Profile";
import Apply from "./Apply";
import Admin from "./Admin";
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}

export default App;
