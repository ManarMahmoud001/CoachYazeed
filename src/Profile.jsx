import { useEffect, useState } from "react";
import {
  User,
  Activity,
  Utensils,
  Dumbbell,
  Pencil,
  Save,
  Weight,
  Percent,
  Flame,
  Gauge,
  Mail,
  KeyRound,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import Header from "./Header";
import Footer from "./Footer";
import "./styles.css";
import { Video, PhoneCall, XCircle } from "lucide-react";
import VideoCallModal from "./VideoCallModal";

const DAYS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const toISODate = (ddmmyyyy) => {
  const [day, month, year] = ddmmyyyy.split("/");
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (iso) => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

const groupByDay = (rows) => {
  const grouped = {};
  rows.forEach((row) => {
    if (!grouped[row.day]) grouped[row.day] = [];
    grouped[row.day].push(row);
  });
  return DAYS_ORDER.filter((day) => grouped[day]).map((day) => ({
    day,
    items: grouped[day],
  }));
};

const formatDiff = (value, unit) => {
  if (value === null || value === undefined || isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} ${unit}`;
};

const daysUntil = (isoDate) => {
  if (!isoDate) return null;
  const today = new Date();
  const target = new Date(isoDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};


function TierBadge({ tier }) {
  if (!tier) {
    return <span className="tier-badge tier-badge-none">No Active Plan</span>;
  }
  return (
    <span className={`tier-badge tier-badge-${tier.toLowerCase()}`}>
      {tier} Member
    </span>
  );
}

function Profile() {
  const [callRequest, setCallRequest] = useState(null);
const [requestNote, setRequestNote] = useState("");
const [submittingRequest, setSubmittingRequest] = useState(false);
const [callRequestError, setCallRequestError] = useState("");
const [showCallModal, setShowCallModal] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    birth_date: "",
    gender: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [latestInbody, setLatestInbody] = useState(null);
  const [previousInbody, setPreviousInbody] = useState(null);
  const [editingInbody, setEditingInbody] = useState(false);
  const [inbodyForm, setInbodyForm] = useState({
    weight: "",
    skeletal_muscle_mass: "",
    body_fat_percentage: "",
    body_fat_mass: "",
    visceral_fat_level: "",
    bmr: "",
  });
  const [savingInbody, setSavingInbody] = useState(false);

  const [workoutDays, setWorkoutDays] = useState([]);
  const [nutritionDays, setNutritionDays] = useState([]);

  // Account settings
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        setNewEmail(data.session.user.email);
        loadAllData(data.session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadAllData = async (userId) => {
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileData) {
      setProfile(profileData);
      setProfileForm({
        full_name: profileData.full_name || "",
        birth_date: toDisplayDate(profileData.birth_date),
        gender: profileData.gender || "",
      });
    }

    const { data: inbodyRows } = await supabase
      .from("inbody_records")
      .select("*")
      .eq("user_id", userId)
      .order("record_date", { ascending: false })
      .limit(2);

    if (inbodyRows && inbodyRows.length > 0) {
      setLatestInbody(inbodyRows[0]);
      setInbodyForm({
        weight: inbodyRows[0].weight ?? "",
        skeletal_muscle_mass: inbodyRows[0].skeletal_muscle_mass ?? "",
        body_fat_percentage: inbodyRows[0].body_fat_percentage ?? "",
        body_fat_mass: inbodyRows[0].body_fat_mass ?? "",
        visceral_fat_level: inbodyRows[0].visceral_fat_level ?? "",
        bmr: inbodyRows[0].bmr ?? "",
      });
    }
    if (inbodyRows && inbodyRows.length > 1) {
      setPreviousInbody(inbodyRows[1]);
    }

    const { data: latestWorkoutWeek } = await supabase
      .from("workout_plans")
      .select("week_start_date")
      .eq("user_id", userId)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestWorkoutWeek) {
      const { data: workoutRows } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start_date", latestWorkoutWeek.week_start_date);

      setWorkoutDays(groupByDay(workoutRows || []));
    }

    const { data: latestNutritionWeek } = await supabase
      .from("nutrition_plans")
      .select("week_start_date")
      .eq("user_id", userId)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestNutritionWeek) {
      const { data: nutritionRows } = await supabase
        .from("nutrition_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start_date", latestNutritionWeek.week_start_date);

      setNutritionDays(groupByDay(nutritionRows || []));
    }
     const { data: callData, error: callError } = await supabase
  .from("call_requests")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (callError) {
  console.error("loadAllData call_requests error:", callError);
}
setCallRequest(callData || null);
    setLoading(false);
  };

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

    setProfileForm((prev) => ({ ...prev, birth_date: formatted }));
  };
  const handleRequestCall = async (e) => {
  e.preventDefault();
  setSubmittingRequest(true);
  setCallRequestError("");

  const { error } = await supabase.from("call_requests").insert({
    user_id: session.user.id,
    requested_note: requestNote,
    status: "pending",
  });

  if (error) {
    console.error("handleRequestCall error:", error);
    setCallRequestError(
      "Couldn't send your request. Please try again in a moment."
    );
    setSubmittingRequest(false);
    return;
  }

  setRequestNote("");
  setSubmittingRequest(false);
  loadAllData(session.user.id);
};

const handleCancelCall = async () => {
  await supabase
    .from("call_requests")
    .update({ status: "cancelled" })
    .eq("id", callRequest.id);

  loadAllData(session.user.id);
};

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    await supabase
      .from("profiles")
      .update({
        full_name: profileForm.full_name,
        birth_date: toISODate(profileForm.birth_date),
        gender: profileForm.gender,
      })
      .eq("id", session.user.id);

    setEditingProfile(false);
    setSavingProfile(false);
    loadAllData(session.user.id);
  };

  const handleSaveInbody = async (e) => {
    e.preventDefault();
    setSavingInbody(true);

    await supabase.from("inbody_records").insert({
      user_id: session.user.id,
      weight: parseFloat(inbodyForm.weight) || null,
      skeletal_muscle_mass:
        parseFloat(inbodyForm.skeletal_muscle_mass) || null,
      body_fat_percentage: parseFloat(inbodyForm.body_fat_percentage) || null,
      body_fat_mass: parseFloat(inbodyForm.body_fat_mass) || null,
      visceral_fat_level: parseInt(inbodyForm.visceral_fat_level) || null,
      bmr: parseInt(inbodyForm.bmr) || null,
    });

    setEditingInbody(false);
    setSavingInbody(false);
    loadAllData(session.user.id);
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMessage("");

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      setEmailMessage(error.message);
    } else {
      setEmailMessage(
        "Confirmation links sent to your old and new email. Confirm both to complete the change."
      );
    }

    setEmailSaving(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordMessage(error.message);
    } else {
      setPasswordMessage("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordSaving(false);
  };

  const handleSendResetEmail = async () => {
    setResetSending(true);
    setResetMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      session.user.email
    );

    if (error) {
      setResetMessage(error.message);
    } else {
      setResetMessage("Password reset link sent to your email.");
    }

    setResetSending(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="profile-page">
          <p className="profile-loading">Loading your profile...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header />
        <div className="profile-page">
          <div className="profile-locked">
            <User size={40} />
            <h2>You need to log in to view your profile</h2>
            <a href="/" className="btn">
              Back to Home
            </a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const subscriptionDays = daysUntil(profile?.subscription_end_date);
  const weightDiff =
    latestInbody && previousInbody
      ? latestInbody.weight - previousInbody.weight
      : null;
  const muscleDiff =
    latestInbody && previousInbody
      ? latestInbody.skeletal_muscle_mass -
        previousInbody.skeletal_muscle_mass
      : null;
  const fatPercentDiff =
    latestInbody && previousInbody
      ? latestInbody.body_fat_percentage - previousInbody.body_fat_percentage
      : null;
  const fatMassDiff =
    latestInbody && previousInbody
      ? latestInbody.body_fat_mass - previousInbody.body_fat_mass
      : null;

  return (
    <>
      <Header />

      <main className="profile-page">
        {/* ================= HERO ================= */}
        <section className="profile-hero section-grid-texture">
          <div className="profile-hero-glow" />

          <div className="container profile-hero-inner">
            <div className="profile-avatar">
              <User size={44} />
            </div>

            <div className="profile-hero-text">
              <h1>{profile?.full_name || "Athlete"}</h1>
              <p className="profile-email">{session.user.email}</p>
              <TierBadge tier={profile?.tier} />
            </div>

            {subscriptionDays !== null && (
              <p className="subscription-note">
                {subscriptionDays >= 0
                  ? `Your subscription ends in ${subscriptionDays} day${
                      subscriptionDays === 1 ? "" : "s"
                    }`
                  : "Your subscription has ended"}
              </p>
            )}
          </div>
        </section>

        <div className="container profile-content">
          {/* ================= PERSONAL INFO ================= */}
          <section className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">
                <User size={20} />
                <h3>Personal Information</h3>
              </div>

              {!editingProfile && (
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={() => setEditingProfile(true)}
                >
                  <Pencil size={15} />
                  Edit
                </button>
              )}
            </div>

            {!editingProfile ? (
              <div className="profile-info-grid">
                <div>
                  <span className="profile-info-label">Full Name</span>
                  <span className="profile-info-value">
                    {profile?.full_name || "—"}
                  </span>
                </div>

                <div>
                  <span className="profile-info-label">Date of Birth</span>
                  <span className="profile-info-value">
                    {toDisplayDate(profile?.birth_date) || "—"}
                  </span>
                </div>

                <div>
                  <span className="profile-info-label">Gender</span>
                  <span className="profile-info-value">
                    {profile?.gender
                      ? profile.gender.charAt(0).toUpperCase() +
                        profile.gender.slice(1)
                      : "—"}
                  </span>
                </div>
              </div>
            ) : (
              <form
                className="profile-edit-form"
                onSubmit={handleSaveProfile}
              >
                <label>
                  Full Name
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  Date of Birth
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={profileForm.birth_date}
                    onChange={handleBirthDateChange}
                    maxLength={10}
                    required
                  />
                </label>

                <label>
                  Gender
                  <select
                    value={profileForm.gender}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>

                <div className="profile-edit-actions">
                  <button
                    type="button"
                    className="profile-cancel-btn"
                    onClick={() => setEditingProfile(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn profile-save-btn"
                    disabled={savingProfile}
                  >
                    <Save size={15} />
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </section>
           {/* ================= ACCOUNT SETTINGS ================= */}
          <section className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">
                <KeyRound size={20} />
                <h3>Account Settings</h3>
              </div>
            </div>

            <div className="account-settings-grid">
              <form
                className="profile-edit-form"
                onSubmit={handleUpdateEmail}
              >
                <label>
                  Email Address
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </label>

                {emailMessage && (
                  <p className="signup-success">{emailMessage}</p>
                )}

                <button
                  type="submit"
                  className="btn profile-save-btn"
                  disabled={emailSaving}
                >
                  {emailSaving ? "Saving..." : "Update Email"}
                </button>
              </form>

              <form
                className="profile-edit-form"
                onSubmit={handleUpdatePassword}
              >
                <label>
                  New Password
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>

                <label>
                  Confirm New Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>

                {passwordMessage && (
                  <p
                    className={
                      passwordMessage.includes("success")
                        ? "signup-success"
                        : "login-error"
                    }
                  >
                    {passwordMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn profile-save-btn"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Saving..." : "Update Password"}
                </button>

                <button
                  type="button"
                  className="profile-cancel-btn reset-link-btn"
                  onClick={handleSendResetEmail}
                  disabled={resetSending}
                >
                  {resetSending
                    ? "Sending..."
                    : "Or send me a password reset link"}
                </button>

                {resetMessage && (
                  <p className="signup-success">{resetMessage}</p>
                )}
              </form>
            </div>
          </section>
          {/* ================= INBODY ================= */}
          <section className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">
                <Activity size={20} />
                <h3>InBody Measurements</h3>
              </div>

              {!editingInbody && (
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={() => setEditingInbody(true)}
                >
                  <Pencil size={15} />
                  Update
                </button>
              )}
            </div>

            {!editingInbody ? (
              <>
                <div className="inbody-stats-grid">
                  <div className="inbody-stat">
                    <Weight size={22} />
                    <span className="profile-info-value">
                      {latestInbody?.weight ?? "—"} <small>kg</small>
                    </span>
                    <span className="profile-info-label">Weight</span>
                  </div>

                  <div className="inbody-stat">
                    <Dumbbell size={22} />
                    <span className="profile-info-value">
                      {latestInbody?.skeletal_muscle_mass ?? "—"}{" "}
                      <small>kg</small>
                    </span>
                    <span className="profile-info-label">
                      Skeletal Muscle Mass
                    </span>
                  </div>

                  <div className="inbody-stat">
                    <Percent size={22} />
                    <span className="profile-info-value">
                      {latestInbody?.body_fat_percentage ?? "—"}{" "}
                      <small>%</small>
                    </span>
                    <span className="profile-info-label">Body Fat %</span>
                  </div>

                  <div className="inbody-stat">
                    <Percent size={22} />
                    <span className="profile-info-value">
                      {latestInbody?.body_fat_mass ?? "—"} <small>kg</small>
                    </span>
                    <span className="profile-info-label">Body Fat Mass</span>
                  </div>

                  <div className="inbody-stat">
                    <Gauge size={22} />
                    <span className="profile-info-value">
                      Level {latestInbody?.visceral_fat_level ?? "—"}
                    </span>
                    <span className="profile-info-label">Visceral Fat</span>
                  </div>

                  <div className="inbody-stat">
                    <Flame size={22} />
                    <span className="profile-info-value">
                      {latestInbody?.bmr
                        ? latestInbody.bmr.toLocaleString()
                        : "—"}{" "}
                      <small>kcal</small>
                    </span>
                    <span className="profile-info-label">BMR</span>
                  </div>
                </div>

                {latestInbody?.record_date && (
                  <p className="inbody-updated-note">
                    Last updated: {toDisplayDate(latestInbody.record_date)}
                  </p>
                )}

                {previousInbody && (
                  <div className="progress-section">
                    <h4 className="progress-title">
                      Progress Since Last Scan
                    </h4>

                    <div className="progress-grid">
                      <div className="progress-item">
                        <span className="profile-info-label">Weight</span>
                        <span className="progress-value">
                          {formatDiff(weightDiff, "kg")}
                        </span>
                      </div>

                      <div className="progress-item">
                        <span className="profile-info-label">Muscle</span>
                        <span className="progress-value">
                          {formatDiff(muscleDiff, "kg")}
                        </span>
                      </div>

                      <div className="progress-item">
                        <span className="profile-info-label">Body Fat</span>
                        <span className="progress-value">
                          {formatDiff(fatPercentDiff, "%")}
                        </span>
                      </div>

                      <div className="progress-item">
                        <span className="profile-info-label">Fat Mass</span>
                        <span className="progress-value">
                          {formatDiff(fatMassDiff, "kg")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <form className="profile-edit-form" onSubmit={handleSaveInbody}>
                <label>
                  Weight (kg)
                  <input
                    type="number"
                    step="0.1"
                    value={inbodyForm.weight}
                    onChange={(e) =>
                      setInbodyForm((prev) => ({
                        ...prev,
                        weight: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  Skeletal Muscle Mass (kg)
                  <input
                    type="number"
                    step="0.1"
                    value={inbodyForm.skeletal_muscle_mass}
                    onChange={(e) =>
                      setInbodyForm((prev) => ({
                        ...prev,
                        skeletal_muscle_mass: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  Body Fat (%)
                  <input
                    type="number"
                    step="0.1"
                    value={inbodyForm.body_fat_percentage}
                    onChange={(e) =>
                      setInbodyForm((prev) => ({
                        ...prev,
                        body_fat_percentage: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  Body Fat Mass (kg)
                  <input
                    type="number"
                    step="0.1"
                    value={inbodyForm.body_fat_mass}
                    onChange={(e) =>
                      setInbodyForm((prev) => ({
                        ...prev,
                        body_fat_mass: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  Visceral Fat Level
                  <input
                    type="number"
                    value={inbodyForm.visceral_fat_level}
                    onChange={(e) =>
                      setInbodyForm((prev) => ({
                        ...prev,
                        visceral_fat_level: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  BMR (kcal)
                  <input
                    type="number"
                    value={inbodyForm.bmr}
                    onChange={(e) =>
                      setInbodyForm((prev) => ({
                        ...prev,
                        bmr: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <div className="profile-edit-actions">
                  <button
                    type="button"
                    className="profile-cancel-btn"
                    onClick={() => setEditingInbody(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn profile-save-btn"
                    disabled={savingInbody}
                  >
                    <Save size={15} />
                    {savingInbody ? "Saving..." : "Save Measurement"}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* ================= WORKOUT + NUTRITION SIDE BY SIDE ================= */}
          <div className="plans-grid">
            <section className="profile-card">
              <div className="profile-card-head">
                <div className="profile-card-title">
                  <Dumbbell size={20} />
                  <h3>Your Workout Plan</h3>
                </div>
              </div>

              {workoutDays.length === 0 ? (
                <p className="profile-empty-note">
                  Your coach hasn't added a workout plan yet.
                </p>
              ) : (
                workoutDays.map((group) => (
                  <div className="plan-day-block" key={group.day}>
                    <h4 className="plan-day-title">{group.day}</h4>

                    <div className="plan-table">
                      {group.items.map((item) => (
                        <div className="plan-row" key={item.id}>
                          <div className="plan-row-main">
                            <span className="plan-row-name">
                              {item.exercise_name}
                            </span>
                            <span className="plan-row-detail">
                              {item.sets} sets × {item.reps}
                            </span>
                            {item.notes && (
                              <span className="plan-row-notes">
                                {item.notes}
                              </span>
                            )}
                          </div>

                          {item.video_url && (
                            <a
                              href={item.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="plan-video-link"
                            >
                              <Video size={16} />
                              Watch
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>
            <section className="profile-card">
  <div className="profile-card-head">
    <div className="profile-card-title">
      <Video size={20} />
      <h3>Request Video Call</h3>
    </div>
  </div>

  {!callRequest ||
  callRequest.status === "cancelled" ||
  callRequest.status === "completed" ? (
    <form className="profile-edit-form" onSubmit={handleRequestCall}>
      <label>
        Note (preferred time, topic, etc. — optional)
        <textarea
          rows={3}
          value={requestNote}
          onChange={(e) => setRequestNote(e.target.value)}
        />
      </label>

      {callRequestError && (
        <p className="login-error">{callRequestError}</p>
      )}

      <button
        type="submit"
        className="btn profile-save-btn"
        disabled={submittingRequest}
      >
        <PhoneCall size={15} />
        {submittingRequest ? "Sending..." : "Request a Video Call"}
      </button>
    </form>
  ) : callRequest.status === "pending" ? (
    <div className="call-status-box">
      <p>Your request is pending — Coach Yazeed will confirm a time soon.</p>
      <button
        type="button"
        className="profile-cancel-btn"
        onClick={handleCancelCall}
      >
        <XCircle size={14} />
        Cancel Request
      </button>
    </div>
  ) : callRequest.status === "scheduled" ? (
    <div className="call-status-box">
      <p>
        Your call is scheduled for{" "}
        <strong>
          {new Date(callRequest.scheduled_time).toLocaleString()}
        </strong>
      </p>
      <button
        type="button"
        className="btn profile-save-btn"
        onClick={() => setShowCallModal(true)}
      >
        <Video size={15} />
        Join Call
      </button>
    </div>
  ) : (
    <p className="profile-empty-note">No active call requests.</p>
  )}
</section>
            <section className="profile-card">
              <div className="profile-card-head">
                <div className="profile-card-title">
                  <Utensils size={20} />
                  <h3>Your Nutrition Plan</h3>
                </div>
              </div>

              {nutritionDays.length === 0 ? (
                <p className="profile-empty-note">
                  Your coach hasn't added a nutrition plan yet.
                </p>
              ) : (
                nutritionDays.map((group) => (
                  <div className="plan-day-block" key={group.day}>
                    <h4 className="plan-day-title">{group.day}</h4>

                    <div className="plan-table">
                      {group.items.map((item) => (
                        <div className="plan-row" key={item.id}>
                          <div className="plan-row-main">
                            <span className="plan-row-name">
                              {item.meal_name}
                            </span>
                            <span className="plan-row-detail">
                              {item.details}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          
        </div>
      </main>

      <Footer />
      {showCallModal && (
  <VideoCallModal
    roomName={callRequest?.room_name}
    callRequestId={callRequest?.id}
    onClose={() => setShowCallModal(false)}
  />
)}
    </>
  );
}

export default Profile;
