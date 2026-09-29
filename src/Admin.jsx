import { useEffect, useState } from "react";
import {
  Users,
  Inbox,
  Search,
  Trash2,
  Plus,
  Save,
  X,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import Header from "./Header";
import Footer from "./Footer";
import "./styles.css";
import { Video, Check, Bell } from "lucide-react";
import VideoCallModal from "./VideoCallModal";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];


const toISODate = (ddmmyyyy) => {
  if (!ddmmyyyy) return null;
  const [day, month, year] = ddmmyyyy.split("/");
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (iso) => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

const InbodyDiff = ({ value, unit }) => {
  if (value === null || value === undefined || value === 0) return null;
  const isUp = value > 0;
  return (
    <span className={`inbody-diff ${isUp ? "inbody-diff-up" : "inbody-diff-down"}`}>
      {isUp ? "▲" : "▼"} {Math.abs(value)}{unit}
    </span>
  );
};

const calculateAge = (birthDateISO) => {
  if (!birthDateISO) return null;
  const birth = new Date(birthDateISO);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const memberSinceLabel = (createdAtISO) => {
  if (!createdAtISO) return "Unknown";
  const created = new Date(createdAtISO);
  if (isNaN(created.getTime())) return "Unknown";
  const days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Joined today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return `${years} year${years === 1 ? "" : "s"}${remMonths ? `, ${remMonths} month${remMonths === 1 ? "" : "s"}` : ""}`;
};

const addDaysISO = (isoDate, days) => {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const formatDateInput = (rawValue) => {
  let digits = rawValue.replace(/\D/g, "");
  if (digits.length > 8) digits = digits.slice(0, 8);
  let formatted = digits;
  if (digits.length > 4) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(
      4
    )}`;
  } else if (digits.length > 2) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return formatted;
};

function TierBadge({ tier }) {
  if (!tier) {
    return <span className="tier-badge tier-badge-none">No Plan</span>;
  }
  return (
    <span className={`tier-badge tier-badge-${tier.toLowerCase()}`}>
      {tier}
    </span>
  );
}

function Admin() {
  const [callRequests, setCallRequests] = useState([]);
const [scheduleInputs, setScheduleInputs] = useState({});
const [activeCallRoom, setActiveCallRoom] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [activeTab, setActiveTab] = useState("subscribers");

  const [subscribers, setSubscribers] = useState([]);
  const [tierFilter, setTierFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [requests, setRequests] = useState([]);
  const [requestsTierFilter, setRequestsTierFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [editTier, setEditTier] = useState("");
  const [editSubEndDate, setEditSubEndDate] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const [inbodyEntries, setInbodyEntries] = useState([]);
  const [newInbody, setNewInbody] = useState({
    measured_at: "",
    weight_kg: "",
    body_fat_percent: "",
    muscle_mass_kg: "",
    notes: "",
  });
  const [savingInbody, setSavingInbody] = useState(false);

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSent, setNotifSent] = useState(false);

  const [weekDate, setWeekDate] = useState("");
  const [workoutRows, setWorkoutRows] = useState([]);
  const [nutritionRows, setNutritionRows] = useState([]);
  const [weekLoadInfo, setWeekLoadInfo] = useState("");

  const loadCallRequests = async () => {
    const { data: callRows, error } = await supabase
      .from("call_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("loadCallRequests error:", error);
      setCallRequests([]);
      return;
    }

    const rows = callRows || [];
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

    let profilesById = {};
    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profileError) {
        console.error("loadCallRequests profiles error:", profileError);
      } else {
        profilesById = Object.fromEntries(
          (profileRows || []).map((p) => [p.id, p])
        );
      }
    }

    setCallRequests(
      rows.map((r) => ({
        ...r,
        profiles: profilesById[r.user_id] || null,
      }))
    );
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.session.user.id)
          .single();

        setIsAdmin(profileData?.is_admin || false);
        if (profileData?.is_admin) {
          loadSubscribers();
        }
      }
      setCheckingAccess(false);
    });
  }, []);

  const loadSubscribers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setSubscribers(data || []);
  };

  const loadRequests = async () => {
    const { data } = await supabase
      .from("subscription_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests(data || []);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "requests" && requests.length === 0) {
      loadRequests();
    }
    if (tab === "calls") {
  loadCallRequests();
}
  };
  const handleScheduleCall = async (requestId) => {
  const input = scheduleInputs[requestId];
  if (!input?.date || input.date.length < 10 || !input?.time) return;

  const isoDate = toISODate(input.date);
  if (!isoDate) return;

  const scheduledTime = new Date(`${isoDate}T${input.time}:00`);
  if (isNaN(scheduledTime.getTime())) return;

  const roomName = `yazeed-call-${requestId.slice(0, 8)}`;

  await supabase
    .from("call_requests")
    .update({
      status: "scheduled",
      scheduled_time: scheduledTime.toISOString(),
      room_name: roomName,
    })
    .eq("id", requestId);

  loadCallRequests();
};

const handleCancelCallAdmin = async (requestId) => {
  await supabase
    .from("call_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);
  loadCallRequests();
};

const handleCompleteCall = async (requestId) => {
  await supabase
    .from("call_requests")
    .update({ status: "completed" })
    .eq("id", requestId);
  loadCallRequests();
};

  const handleSendNotification = async () => {
    if (!selectedUser || !notifTitle.trim()) return;
    setSendingNotif(true);
    setNotifSent(false);

    const { error } = await supabase.from("notifications").insert({
      user_id: selectedUser.id,
      audience: "user",
      type: "message",
      title: notifTitle.trim(),
      message: notifMessage.trim() || null,
    });

    if (error) {
      console.error("handleSendNotification error:", error);
    } else {
      setNotifSent(true);
      setNotifTitle("");
      setNotifMessage("");
    }
    setSendingNotif(false);
  };

  const loadInbodyEntries = async (userId) => {
    const { data, error } = await supabase
      .from("inbody_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("measured_at", { ascending: true });

    if (error) {
      console.error("loadInbodyEntries error:", error);
      setInbodyEntries([]);
      return;
    }
    setInbodyEntries(data || []);
  };

  const openSubscriber = async (user) => {
    setSelectedUser(user);
    setEditTier(user.tier || "");
    setEditSubEndDate(toDisplayDate(user.subscription_end_date));
    setEditFullName(user.full_name || "");
    setEditPhone(user.phone || "");
    setEditBirthDate(toDisplayDate(user.birth_date));
    setNotifTitle("");
    setNotifMessage("");
    setNotifSent(false);
    setWeekLoadInfo("");
    setNewInbody({
      measured_at: "",
      weight_kg: "",
      body_fat_percent: "",
      muscle_mass_kg: "",
      notes: "",
    });

    loadInbodyEntries(user.id);

    // Load their most recent week (or default to today for a new plan)
    const { data: latestWorkoutWeek } = await supabase
      .from("workout_plans")
      .select("week_start_date")
      .eq("user_id", user.id)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const weekToLoad =
      latestWorkoutWeek?.week_start_date ||
      new Date().toISOString().slice(0, 10);

    setWeekDate(toDisplayDate(weekToLoad));
    await loadPlansForWeek(user.id, weekToLoad);
  };

  const loadPlansForWeek = async (userId, weekStartISO) => {
    const { data: workoutData } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start_date", weekStartISO);

    const { data: nutritionData } = await supabase
      .from("nutrition_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start_date", weekStartISO);

    setWorkoutRows(workoutData || []);
    setNutritionRows(nutritionData || []);

    return {
      workoutCount: workoutData?.length || 0,
      nutritionCount: nutritionData?.length || 0,
    };
  };

  const handleLoadWeek = async () => {
    if (!selectedUser) return;

    if (weekDate.length < 10) {
      setWeekLoadInfo("Enter a full date (DD/MM/YYYY) first.");
      return;
    }

    const isoDate = toISODate(weekDate);
    if (!isoDate) {
      setWeekLoadInfo("That date doesn't look valid.");
      return;
    }

    setWeekLoadInfo("Loading...");
    const { workoutCount, nutritionCount } = await loadPlansForWeek(
      selectedUser.id,
      isoDate
    );

    setWeekLoadInfo(
      workoutCount === 0 && nutritionCount === 0
        ? `No plan yet for ${weekDate} — add exercises/meals below and save.`
        : `Loaded: ${workoutCount} exercise${workoutCount === 1 ? "" : "s"}, ${nutritionCount} meal${nutritionCount === 1 ? "" : "s"} for ${weekDate}.`
    );
  };

  const closeSubscriberPanel = () => {
    setSelectedUser(null);
    setWorkoutRows([]);
    setNutritionRows([]);
  };

  const handleSaveAccount = async () => {
    setSavingAccount(true);

    const updates = {
      full_name: editFullName.trim() || null,
      phone: editPhone.trim() || null,
      birth_date: editBirthDate.length === 10 ? toISODate(editBirthDate) : null,
      tier: editTier || null,
      subscription_end_date: editSubEndDate.length === 10 ? toISODate(editSubEndDate) : null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", selectedUser.id);

    if (error) console.error("handleSaveAccount error:", error);

    setSavingAccount(false);
    loadSubscribers();
    setSelectedUser((prev) => ({ ...prev, ...updates }));
  };

  // ===== InBody measurements =====
  const handleAddInbody = async () => {
    if (!selectedUser || newInbody.measured_at.length < 10) return;
    setSavingInbody(true);

    const { error } = await supabase.from("inbody_measurements").insert({
      user_id: selectedUser.id,
      measured_at: toISODate(newInbody.measured_at),
      weight_kg: newInbody.weight_kg ? parseFloat(newInbody.weight_kg) : null,
      body_fat_percent: newInbody.body_fat_percent
        ? parseFloat(newInbody.body_fat_percent)
        : null,
      muscle_mass_kg: newInbody.muscle_mass_kg
        ? parseFloat(newInbody.muscle_mass_kg)
        : null,
      notes: newInbody.notes.trim() || null,
    });

    if (error) {
      console.error("handleAddInbody error:", error);
    } else {
      setNewInbody({
        measured_at: "",
        weight_kg: "",
        body_fat_percent: "",
        muscle_mass_kg: "",
        notes: "",
      });
      await loadInbodyEntries(selectedUser.id);
    }
    setSavingInbody(false);
  };

  const handleDeleteInbody = async (id) => {
    await supabase.from("inbody_measurements").delete().eq("id", id);
    loadInbodyEntries(selectedUser.id);
  };

  // ===== Workout row helpers =====
  const updateWorkoutField = (index, field, value) => {
    setWorkoutRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addWorkoutRow = () => {
    setWorkoutRows((prev) => [
      ...prev,
      {
        id: null,
        day: "Monday",
        exercise_name: "",
        sets: "",
        reps: "",
        video_url: "",
        notes: "",
      },
    ]);
  };

  const saveWorkoutRow = async (index) => {
    const row = workoutRows[index];
    const payload = {
      user_id: selectedUser.id,
      week_start_date: toISODate(weekDate),
      day: row.day,
      exercise_name: row.exercise_name,
      sets: parseInt(row.sets) || null,
      reps: row.reps,
      video_url: row.video_url,
      notes: row.notes,
    };

    if (row.id) {
      await supabase.from("workout_plans").update(payload).eq("id", row.id);
    } else {
      const { data } = await supabase
        .from("workout_plans")
        .insert(payload)
        .select()
        .single();
      updateWorkoutField(index, "id", data.id);
    }
  };

  const deleteWorkoutRow = async (index) => {
    const row = workoutRows[index];
    if (row.id) {
      await supabase.from("workout_plans").delete().eq("id", row.id);
    }
    setWorkoutRows((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== Nutrition row helpers =====
  const updateNutritionField = (index, field, value) => {
    setNutritionRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addNutritionRow = () => {
    setNutritionRows((prev) => [
      ...prev,
      { id: null, day: "Monday", meal_name: "", details: "" },
    ]);
  };

  const saveNutritionRow = async (index) => {
    const row = nutritionRows[index];
    const payload = {
      user_id: selectedUser.id,
      week_start_date: toISODate(weekDate),
      day: row.day,
      meal_name: row.meal_name,
      details: row.details,
    };

    if (row.id) {
      await supabase.from("nutrition_plans").update(payload).eq("id", row.id);
    } else {
      const { data } = await supabase
        .from("nutrition_plans")
        .insert(payload)
        .select()
        .single();
      updateNutritionField(index, "id", data.id);
    }
  };

  const deleteNutritionRow = async (index) => {
    const row = nutritionRows[index];
    if (row.id) {
      await supabase.from("nutrition_plans").delete().eq("id", row.id);
    }
    setNutritionRows((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredSubscribers = subscribers.filter((user) => {
    const matchesTier =
      tierFilter === "all" ||
      (tierFilter === "none" && !user.tier) ||
      user.tier === tierFilter;

    const matchesSearch =
      !searchTerm ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTier && matchesSearch;
  });

  const filteredRequests = requests.filter(
    (req) => requestsTierFilter === "all" || req.tier === requestsTierFilter
  );

  if (checkingAccess) {
    return (
      <>
        <Header />
        <div className="profile-page">
          <p className="profile-loading">Checking access...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!session || !isAdmin) {
    return (
      <>
        <Header />
        <div className="profile-page">
          <div className="profile-locked">
            <ShieldAlert size={40} />
            <h2>You don't have access to this page</h2>
            <a href="/" className="btn">
              Back to Home
            </a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="admin-page">
        <div className="container">
          <h1 className="admin-title">Coach Dashboard</h1>

          <div className="admin-tabs">
            <button
              className={`admin-tab ${
                activeTab === "subscribers" ? "admin-tab-active" : ""
              }`}
              onClick={() => switchTab("subscribers")}
            >
              <Users size={16} />
              Subscribers
            </button>

            <button
              className={`admin-tab ${
                activeTab === "requests" ? "admin-tab-active" : ""
              }`}
              onClick={() => switchTab("requests")}
            >
              <Inbox size={16} />
              Requests
            </button>
            <button
  className={`admin-tab ${activeTab === "calls" ? "admin-tab-active" : ""}`}
  onClick={() => switchTab("calls")}
>
  <Video size={16} />
  Calls
</button>
          </div>

          {activeTab === "subscribers" && (
            <>
              <div className="admin-filters">
                <div className="admin-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="admin-filter-pills">
                  {["all", "Starter", "Pro", "Elite", "none"].map((t) => (
                    <button
                      key={t}
                      className={`admin-filter-pill ${
                        tierFilter === t ? "admin-filter-pill-active" : ""
                      }`}
                      onClick={() => setTierFilter(t)}
                    >
                      {t === "all"
                        ? "All"
                        : t === "none"
                        ? "No Plan"
                        : t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-list">
                {filteredSubscribers.map((user) => (
                  <div
                    className="admin-list-row"
                    key={user.id}
                    onClick={() => openSubscriber(user)}
                  >
                    <div className="admin-list-main">
                      <span className="admin-list-name">
                        {user.full_name || "Unnamed"}
                      </span>
                      <span className="admin-list-email">{user.email}</span>
                    </div>

                    <TierBadge tier={user.tier} />

                    <span className="admin-list-date">
                      {user.subscription_end_date
                        ? `Ends ${toDisplayDate(user.subscription_end_date)}`
                        : "—"}
                    </span>
                  </div>
                ))}

                {filteredSubscribers.length === 0 && (
                  <p className="profile-empty-note">No subscribers found.</p>
                )}
              </div>
            </>
          )}

          {activeTab === "requests" && (
            <>
              <div className="admin-filters">
                <div className="admin-filter-pills">
                  {["all", "Starter", "Pro", "Elite"].map((t) => (
                    <button
                      key={t}
                      className={`admin-filter-pill ${
                        requestsTierFilter === t
                          ? "admin-filter-pill-active"
                          : ""
                      }`}
                      onClick={() => setRequestsTierFilter(t)}
                    >
                      {t === "all" ? "All" : t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-list">
                {filteredRequests.map((req) => (
                  <div className="admin-request-row" key={req.id}>
                    <div className="admin-list-main">
                      <span className="admin-list-name">
                        {req.full_name}
                      </span>
                      <span className="admin-list-email">
                        {req.email} · {req.phone}
                      </span>
                      {req.notes && (
                        <span className="admin-request-notes">
                          {req.notes}
                        </span>
                      )}
                    </div>

                    <TierBadge tier={req.tier} />

                    <span className="admin-list-date">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}

                {filteredRequests.length === 0 && (
                  <p className="profile-empty-note">No requests found.</p>
                )}
              </div>
            </>
          )}
          {activeTab === "calls" && (
  <div className="admin-list">
    {callRequests.map((req) => (
      <div className="admin-request-row admin-call-row" key={req.id}>
        <div className="admin-list-main">
          <span className="admin-list-name">
            {req.profiles?.full_name || "Unknown"}
          </span>
          <span className="admin-list-email">{req.profiles?.email}</span>
          {req.requested_note && (
            <span className="admin-request-notes">{req.requested_note}</span>
          )}
        </div>

        <span className={`tier-badge tier-badge-${req.status}`}>
          {req.status}
        </span>

        {req.status === "pending" && (
          <div className="admin-call-actions">
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              maxLength={10}
              value={scheduleInputs[req.id]?.date || ""}
              onChange={(e) =>
                setScheduleInputs((prev) => ({
                  ...prev,
                  [req.id]: {
                    ...prev[req.id],
                    date: formatDateInput(e.target.value),
                  },
                }))
              }
            />
            <input
              type="time"
              value={scheduleInputs[req.id]?.time || ""}
              onChange={(e) =>
                setScheduleInputs((prev) => ({
                  ...prev,
                  [req.id]: { ...prev[req.id], time: e.target.value },
                }))
              }
            />
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => handleScheduleCall(req.id)}
              disabled={
                (scheduleInputs[req.id]?.date || "").length < 10 ||
                !scheduleInputs[req.id]?.time
              }
            >
              <Check size={15} />
            </button>
          </div>
        )}

        {req.status === "scheduled" && (
          <div className="admin-call-actions">
            <span className="admin-list-date">
              {new Date(req.scheduled_time).toLocaleString()}
            </span>
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => setActiveCallRoom(req.room_name)}
            >
              <Video size={15} />
            </button>
            <button
              type="button"
              className="admin-icon-btn"
              onClick={() => handleCompleteCall(req.id)}
            >
              <Check size={15} />
            </button>
          </div>
        )}
      </div>
    ))}

    {callRequests.length === 0 && (
      <p className="profile-empty-note">No call requests yet.</p>
    )}
  </div>
)}
        </div>
      </main>

      {/* ================= SUBSCRIBER EDIT PANEL ================= */}
      {selectedUser && (
        <div className="admin-panel-overlay" onClick={closeSubscriberPanel}>
          <div
            className="admin-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-panel-head">
              <div>
                <h2>{selectedUser.full_name || "Unnamed"}</h2>
                <p className="profile-email">{selectedUser.email}</p>
                <div className="admin-panel-meta">
                  {calculateAge(selectedUser.birth_date) !== null && (
                    <span>{calculateAge(selectedUser.birth_date)} yrs old</span>
                  )}
                  {selectedUser.phone && <span>{selectedUser.phone}</span>}
                  <span>Member for {memberSinceLabel(selectedUser.created_at)}</span>
                </div>
              </div>

              <button
                type="button"
                className="login-modal-close"
                onClick={closeSubscriberPanel}
              >
                <X size={20} />
              </button>
            </div>

            {/* Account info */}
            <div className="admin-panel-section">
              <h4 className="plan-day-title">Account Info</h4>

              <div className="admin-account-form">
                <label>
                  Full Name
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="text"
                    placeholder="e.g. 079xxxxxxx"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </label>

                <label>
                  Birth Date
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={editBirthDate}
                    onChange={(e) =>
                      setEditBirthDate(formatDateInput(e.target.value))
                    }
                    maxLength={10}
                  />
                </label>
              </div>
            </div>

            {/* Tier + subscription */}
            <div className="admin-panel-section">
              <h4 className="plan-day-title">Subscription</h4>

              <div className="admin-account-form">
                <label>
                  Tier
                  <select
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value)}
                  >
                    <option value="">No Plan</option>
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Elite">Elite</option>
                  </select>
                </label>

                <label>
                  Subscription End Date
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={editSubEndDate}
                    onChange={(e) =>
                      setEditSubEndDate(formatDateInput(e.target.value))
                    }
                    maxLength={10}
                  />
                </label>

                <button
                  type="button"
                  className="btn profile-save-btn"
                  onClick={handleSaveAccount}
                  disabled={savingAccount}
                >
                  <Save size={15} />
                  {savingAccount ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {/* InBody measurements */}
            <div className="admin-panel-section">
              <h4 className="plan-day-title">InBody Measurements</h4>

              <div className="admin-account-form admin-inbody-form">
                <label>
                  Date
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={newInbody.measured_at}
                    onChange={(e) =>
                      setNewInbody((prev) => ({
                        ...prev,
                        measured_at: formatDateInput(e.target.value),
                      }))
                    }
                    maxLength={10}
                  />
                </label>

                <label>
                  Weight (kg)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newInbody.weight_kg}
                    onChange={(e) =>
                      setNewInbody((prev) => ({ ...prev, weight_kg: e.target.value }))
                    }
                  />
                </label>

                <label>
                  Body Fat (%)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newInbody.body_fat_percent}
                    onChange={(e) =>
                      setNewInbody((prev) => ({
                        ...prev,
                        body_fat_percent: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Muscle Mass (kg)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newInbody.muscle_mass_kg}
                    onChange={(e) =>
                      setNewInbody((prev) => ({
                        ...prev,
                        muscle_mass_kg: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Notes (optional)
                  <input
                    type="text"
                    value={newInbody.notes}
                    onChange={(e) =>
                      setNewInbody((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </label>

                <button
                  type="button"
                  className="btn profile-save-btn"
                  onClick={handleAddInbody}
                  disabled={savingInbody || newInbody.measured_at.length < 10}
                >
                  <Save size={15} />
                  {savingInbody ? "Saving..." : "Add Measurement"}
                </button>
              </div>

              {inbodyEntries.length === 0 ? (
                <p className="profile-empty-note">No measurements recorded yet.</p>
              ) : (
                <div className="admin-inbody-list">
                  {[...inbodyEntries]
                    .map((entry, index) => {
                      const prev = index > 0 ? inbodyEntries[index - 1] : null;
                      const diff = (field) => {
                        if (!prev || entry[field] == null || prev[field] == null)
                          return null;
                        const d = entry[field] - prev[field];
                        return Math.abs(d) < 0.001 ? 0 : +d.toFixed(1);
                      };
                      return {
                        ...entry,
                        weightDiff: diff("weight_kg"),
                        fatDiff: diff("body_fat_percent"),
                        muscleDiff: diff("muscle_mass_kg"),
                      };
                    })
                    .reverse()
                    .map((entry) => (
                      <div className="admin-inbody-row" key={entry.id}>
                        <div className="admin-inbody-date">
                          {toDisplayDate(entry.measured_at)}
                        </div>

                        <div className="admin-inbody-stats">
                          {entry.weight_kg != null && (
                            <span>
                              {entry.weight_kg}kg
                              <InbodyDiff value={entry.weightDiff} unit="kg" />
                            </span>
                          )}
                          {entry.body_fat_percent != null && (
                            <span>
                              {entry.body_fat_percent}% fat
                              <InbodyDiff value={entry.fatDiff} unit="%" />
                            </span>
                          )}
                          {entry.muscle_mass_kg != null && (
                            <span>
                              {entry.muscle_mass_kg}kg muscle
                              <InbodyDiff value={entry.muscleDiff} unit="kg" />
                            </span>
                          )}
                        </div>

                        {entry.notes && (
                          <p className="admin-inbody-notes">{entry.notes}</p>
                        )}

                        <button
                          type="button"
                          className="admin-inbody-delete"
                          aria-label="Delete measurement"
                          onClick={() => handleDeleteInbody(entry.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Send notification */}
            <div className="admin-panel-section">
              <h4 className="plan-day-title">Send Notification</h4>

              <div className="admin-account-form">
                <label>
                  Title
                  <input
                    type="text"
                    placeholder="e.g. Your plan was updated"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                  />
                </label>

                <label>
                  Message (optional)
                  <textarea
                    rows={3}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                  />
                </label>

                {notifSent && (
                  <p className="signup-success">Notification sent.</p>
                )}

                <button
                  type="button"
                  className="btn profile-save-btn"
                  onClick={handleSendNotification}
                  disabled={sendingNotif || !notifTitle.trim()}
                >
                  <Bell size={15} />
                  {sendingNotif ? "Sending..." : "Send to this user"}
                </button>
              </div>
            </div>

            {/* Week selector */}
            <div className="admin-panel-section">
              <h4 className="plan-day-title">Plan Week</h4>

              <div className="admin-week-picker">
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={weekDate}
                  onChange={(e) => setWeekDate(formatDateInput(e.target.value))}
                  maxLength={10}
                />
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={handleLoadWeek}
                >
                  Load / Create Week
                </button>
              </div>

              {weekLoadInfo && (
                <p className="admin-week-load-info">{weekLoadInfo}</p>
              )}

              {weekDate.length === 10 && toISODate(weekDate) && (
                <p className="admin-week-range">
                  This plan runs {weekDate} → {toDisplayDate(addDaysISO(toISODate(weekDate), 6))}
                </p>
              )}
            </div>

            {/* Workout editor */}
            <div className="admin-panel-section">
              <h4 className="plan-day-title">Workout Plan</h4>

              {workoutRows.map((row, index) => (
                <div className="admin-row-editor" key={row.id || `new-${index}`}>
                  <select
                    value={row.day}
                    onChange={(e) =>
                      updateWorkoutField(index, "day", e.target.value)
                    }
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={row.exercise_name}
                    onChange={(e) =>
                      updateWorkoutField(index, "exercise_name", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Sets"
                    value={row.sets}
                    onChange={(e) =>
                      updateWorkoutField(index, "sets", e.target.value)
                    }
                    className="admin-input-small"
                  />

                  <input
                    type="text"
                    placeholder="Reps"
                    value={row.reps}
                    onChange={(e) =>
                      updateWorkoutField(index, "reps", e.target.value)
                    }
                    className="admin-input-small"
                  />

                  <input
                    type="text"
                    placeholder="Video URL"
                    value={row.video_url}
                    onChange={(e) =>
                      updateWorkoutField(index, "video_url", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Notes"
                    value={row.notes}
                    onChange={(e) =>
                      updateWorkoutField(index, "notes", e.target.value)
                    }
                  />

                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={() => saveWorkoutRow(index)}
                    >
                      <Save size={15} />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn-danger"
                      onClick={() => deleteWorkoutRow(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="profile-edit-btn admin-add-btn"
                onClick={addWorkoutRow}
              >
                <Plus size={15} />
                Add Exercise
              </button>
            </div>

            {/* Nutrition editor */}
            <div className="admin-panel-section">
              <h4 className="plan-day-title">Nutrition Plan</h4>

              {nutritionRows.map((row, index) => (
                <div
                  className="admin-row-editor admin-row-editor-nutrition"
                  key={row.id || `new-${index}`}
                >
                  <select
                    value={row.day}
                    onChange={(e) =>
                      updateNutritionField(index, "day", e.target.value)
                    }
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Meal name (e.g. Breakfast)"
                    value={row.meal_name}
                    onChange={(e) =>
                      updateNutritionField(index, "meal_name", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Details"
                    value={row.details}
                    onChange={(e) =>
                      updateNutritionField(index, "details", e.target.value)
                    }
                  />

                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={() => saveNutritionRow(index)}
                    >
                      <Save size={15} />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn-danger"
                      onClick={() => deleteNutritionRow(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="profile-edit-btn admin-add-btn"
                onClick={addNutritionRow}
              >
                <Plus size={15} />
                Add Meal
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      {activeCallRoom && (
  <VideoCallModal
    roomName={activeCallRoom}
    onClose={() => setActiveCallRoom(null)}
  />
)}
    </>
  );
}

export default Admin;
