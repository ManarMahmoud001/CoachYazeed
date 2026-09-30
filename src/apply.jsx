import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "./supabaseClient";
import Header from "./Header";
import Footer from "./Footer";
import "./styles.css";

function Apply() {
  const [searchParams] = useSearchParams();
  const initialTier = searchParams.get("tier") || "Starter";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState(initialTier);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      // 1) Save to Supabase as a backup record
      await supabase.from("subscription_requests").insert({
        user_id: userId,
        full_name: fullName,
        email,
        phone,
        tier,
        notes,
      });

      // 2) Send the email via EmailJS
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          full_name: fullName,
          email,
          phone,
          tier,
          notes,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setSubmitted(true);
    } catch (err) {
      setError(
        "Something went wrong while sending your application. Please try again or contact us on WhatsApp."
      );
    }

    setSubmitting(false);
  };

  return (
    <>
      <Header />

      <main className="apply-page section-grid-texture">
        <div className="container apply-container">
          <a href="/#coaching" className="profile-back-link apply-back-link">
            <ArrowLeft size={18} />
            Back to Plans
          </a>

          {submitted ? (
            <div className="apply-success">
              <CheckCircle2 size={48} />
              <h2>Application Sent!</h2>
              <p>
                Thanks, {fullName || "athlete"} — your request for the{" "}
                <strong>{tier}</strong> plan has been received. Coach Yazeed
                will get back to you shortly.
              </p>
              <a href="/" className="btn">
                Back to Home
              </a>
            </div>
          ) : (
            <>
              <div className="apply-header">
                <span className="coach-pricing-eyebrow">APPLY NOW</span>
                <h1 className="apply-title">
                  Apply for the <span>{tier}</span> Plan
                </h1>
                <p className="apply-subtitle">
                  Fill in your details below and Coach Yazeed will reach
                  out to get you started.
                </p>
              </div>

              <form className="apply-form" onSubmit={handleSubmit}>
                <label>
                  Full Name
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Phone / WhatsApp Number
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Selected Plan
                  <select value={tier} onChange={(e) => setTier(e.target.value)}>
                    <option value="Starter">Starter — 1 Month (130 JD)</option>
                    <option value="Pro">Pro — 2 Months (250 JD)</option>
                    <option value="Elite">Elite — 3 Months (300 JD)</option>
                  </select>
                </label>

                <label>
                  Your Goals / Notes (optional)
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us about your goals, training experience, or any questions."
                  />
                </label>

                {error && <p className="login-error">{error}</p>}

                <button
                  type="submit"
                  className="btn btn-large apply-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Submit Application"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Apply;
