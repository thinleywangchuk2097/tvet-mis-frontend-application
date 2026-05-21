import { useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const FB_CATEGORIES = [
    { id: "training", label: "Training Quality", icon: "◈" },
    { id: "institute", label: "Institute Facilities", icon: "◉" },
    { id: "assessor", label: "Assessor Performance", icon: "◎" },
    { id: "support", label: "Admin & Support", icon: "◇" },
    { id: "other", label: "Other", icon: "◌" },
];

const CP_CATEGORIES = [
    { id: "misconduct", label: "Staff Misconduct", icon: "⚑" },
    { id: "negligence", label: "Negligence", icon: "◬" },
    { id: "corruption", label: "Corruption / Bribery", icon: "⊘" },
    { id: "harassment", label: "Harassment", icon: "◭" },
    { id: "process", label: "Process Failure", icon: "⊛" },
    { id: "other", label: "Other", icon: "◌" },
];

const URGENCY = [
    { id: "low", label: "Low", desc: "General concern", color: "#1A6B4A" },
    { id: "medium", label: "Medium", desc: "Needs attention", color: "#C9A84C" },
    { id: "high", label: "High", desc: "Urgent resolution", color: "#C05621" },
    { id: "critical", label: "Critical", desc: "Immediate action needed", color: "#8B1A1A" },
];

const RATINGS = [
    { value: 1, label: "Poor" },
    { value: 2, label: "Fair" },
    { value: 3, label: "Good" },
    { value: 4, label: "Very Good" },
    { value: 5, label: "Excellent" },
];

const ROLES = ["Trainee", "Trainer", "Assessor", "Institute Staff", "Employer", "Other"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    name: "", email: "", contactNo: "", role: "",
    // feedback
    fbCategory: "", rating: 0, experience: "", suggestions: "", recommend: null,
    // complaint
    cpCategory: "", incidentDate: "", against: "", institution: "",
    urgency: "", incidentDetails: "", desiredResolution: "", anonymous: false,
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function FeedbackForm() {
    const [mode, setMode] = useState(null); // null | 'feedback' | 'complaint'
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [hoveredRating, setHoveredRating] = useState(0);
    const [hoveredRecommend, setHoveredRecommend] = useState(null);

    const set = (key, val) => {
        setForm((f) => ({ ...f, [key]: val }));
        setErrors((e) => ({ ...e, [key]: undefined }));
    };

    const totalSteps = mode === "feedback" ? 3 : 3;

    const validateStep = () => {
        const errs = {};
        if (step === 1) {
            if (!form.anonymous) {
                if (!form.name.trim()) errs.name = "Name is required";
                if (!form.email.trim()) errs.email = "Email is required";
                else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
            }
            if (!form.role) errs.role = "Please select your role";
        }
        if (step === 2) {
            if (mode === "feedback") {
                if (!form.fbCategory) errs.fbCategory = "Please select a category";
                if (!form.rating) errs.rating = "Please provide a rating";
            } else {
                if (!form.cpCategory) errs.cpCategory = "Please select a category";
                if (!form.urgency) errs.urgency = "Please select urgency level";
            }
        }
        if (step === 3) {
            if (mode === "feedback") {
                if (!form.experience.trim()) errs.experience = "Please share your experience";
                if (form.recommend === null) errs.recommend = "Please answer this question";
            } else {
                if (!form.incidentDetails.trim()) errs.incidentDetails = "Please describe the incident";
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const next = () => { if (validateStep()) setStep((s) => s + 1); };
    const back = () => setStep((s) => s - 1);
    const submit = () => { if (validateStep()) setSubmitted(true); };

    const reset = () => {
        setForm(EMPTY_FORM); setStep(1);
        setSubmitted(false); setMode(null);
        setErrors({});
    };

    const isFeedback = mode === "feedback";
    const isComplaint = mode === "complaint";
    const accentColor = isComplaint ? "#8B1A1A" : "#1B3A6B";
    const accentLight = isComplaint ? "#C0392B" : "#2C5282";
    const accentGold = isComplaint ? "#C05621" : "#C9A84C";
    const progress = ((step - 1) / totalSteps) * 100;
    const stepLabels = mode === "feedback"
        ? ["Your Details", "Assessment", "Your Thoughts"]
        : ["Your Details", "Incident Info", "Full Account"];

    // ── Mode Selection ───────────────────────────────────────────────────────────
    if (!mode) {
        return (
            <div style={styles.page}>
                <div style={{ ...styles.card, maxWidth: 680 }}>
                    <div style={{ ...styles.accentBar, background: "linear-gradient(90deg,#1B3A6B,#8B1A1A)" }} />
                    <div style={{ ...styles.header, background: "linear-gradient(135deg,#1B3A6B 0%,#16305A 100%)", textAlign: "center", padding: "44px 40px 36px" }}>
                        <div style={{ ...styles.logoMark, margin: "0 auto 20px" }}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <rect x="1" y="1" width="20" height="20" rx="4" stroke="#fff" strokeWidth="1.5" />
                                <path d="M6 11h10M11 6v10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h1 style={{ ...styles.title, fontSize: "1.7rem" }}>How can we help?</h1>
                        <p style={styles.subtitle}>Choose the type of submission you'd like to make.</p>
                    </div>
                    <div style={{ padding: "32px 40px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Feedback option */}
                        <button style={styles.modeBtn} onClick={() => setMode("feedback")}>
                            <div style={{ ...styles.modeBtnIcon, backgroundColor: "rgba(27,58,107,0.08)", color: "#1B3A6B" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div style={styles.modeBtnText}>
                                <div style={{ ...styles.modeBtnTitle, color: "#1B3A6B" }}>Submit Feedback</div>
                                <div style={styles.modeBtnDesc}>Share your experience, rate a course, institute or assessor, and suggest improvements.</div>
                            </div>
                            <div style={{ ...styles.modeBtnArrow, color: "#1B3A6B" }}>→</div>
                        </button>

                        {/* Complaint option */}
                        <button style={styles.modeBtn} onClick={() => setMode("complaint")}>
                            <div style={{ ...styles.modeBtnIcon, backgroundColor: "rgba(139,26,26,0.08)", color: "#8B1A1A" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div style={styles.modeBtnText}>
                                <div style={{ ...styles.modeBtnTitle, color: "#8B1A1A" }}>Lodge a Complaint</div>
                                <div style={styles.modeBtnDesc}>Report misconduct, negligence, corruption, harassment or a process failure. You may remain anonymous.</div>
                            </div>
                            <div style={{ ...styles.modeBtnArrow, color: "#8B1A1A" }}>→</div>
                        </button>

                        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#A0AEC0", marginTop: 4 }}>
                            All submissions are treated with strict confidentiality.
                        </p>
                    </div>
                </div>
                <style>{keyframes}</style>
            </div>
        );
    }

    // ── Success Screen ───────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div style={styles.page}>
                <div style={{ ...styles.card, maxWidth: 680 }}>
                    <div style={{ ...styles.accentBar, background: `linear-gradient(90deg,${accentColor},${accentGold})` }} />
                    <div style={styles.successInner}>
                        <div style={{ marginBottom: 20 }}>
                            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                <circle cx="28" cy="28" r="27" stroke={accentColor} strokeWidth="2" />
                                <path d="M17 28l8 8 14-14" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div style={{ ...styles.successTag, marginBottom: 16, backgroundColor: isComplaint ? "rgba(139,26,26,0.08)" : "rgba(27,58,107,0.07)", color: accentColor }}>
                            {isFeedback ? "✦ Feedback Received" : "⚑ Complaint Lodged"}
                        </div>
                        <h2 style={styles.successTitle}>
                            {form.anonymous ? "Submission received." : `Thank you, ${form.name.split(" ")[0]}.`}
                        </h2>
                        <p style={styles.successText}>
                            {isFeedback
                                ? "Your feedback has been received and will help us improve vocational training standards across Bhutan."
                                : "Your complaint has been securely recorded. Our team will review it and take appropriate action within 5–7 working days."}
                        </p>
                        {isFeedback && form.fbCategory && (
                            <div style={styles.successMeta}>
                                <span style={{ ...styles.successTag, color: "#1B3A6B", backgroundColor: "rgba(27,58,107,0.07)" }}>
                                    {FB_CATEGORIES.find(c => c.id === form.fbCategory)?.label}
                                </span>
                                {form.rating > 0 && (
                                    <span style={{ ...styles.successTag, color: "#7A600A", backgroundColor: "rgba(201,168,76,0.1)" }}>
                                        {"★".repeat(form.rating)}{"☆".repeat(5 - form.rating)} · {RATINGS.find(r => r.value === form.rating)?.label}
                                    </span>
                                )}
                            </div>
                        )}
                        {isComplaint && form.cpCategory && (
                            <div style={styles.successMeta}>
                                <span style={{ ...styles.successTag, color: "#8B1A1A", backgroundColor: "rgba(139,26,26,0.08)" }}>
                                    {CP_CATEGORIES.find(c => c.id === form.cpCategory)?.label}
                                </span>
                                {form.urgency && (
                                    <span style={{ ...styles.successTag, color: URGENCY.find(u => u.id === form.urgency)?.color, backgroundColor: "rgba(0,0,0,0.04)" }}>
                                        {URGENCY.find(u => u.id === form.urgency)?.label} Priority
                                    </span>
                                )}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                            <button style={styles.restartBtn} onClick={reset}>← Back to Home</button>
                            <button style={{ ...styles.restartBtn, backgroundColor: accentColor, borderColor: accentColor, color: "#fff" }}
                                onClick={() => { setForm(EMPTY_FORM); setStep(1); setSubmitted(false); }}>
                                Submit Another
                            </button>
                        </div>
                    </div>
                </div>
                <style>{keyframes}</style>
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────────
    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={{ ...styles.accentBar, background: `linear-gradient(90deg,${accentColor},${accentGold})` }} />

                {/* Header */}
                <div style={{ ...styles.header, background: `linear-gradient(135deg,${accentColor} 0%,${accentLight} 100%)` }}>
                    <div style={styles.headerTop}>
                        <button style={styles.modeBackBtn} onClick={() => { setMode(null); setStep(1); setErrors({}); }}>
                            ← Back
                        </button>
                        <span style={{ ...styles.headerLabel, marginLeft: "auto" }}>
                            {isFeedback ? "Feedback Portal" : "Complaints Portal"}
                        </span>
                    </div>
                    <h1 style={styles.title}>
                        {isFeedback ? "Share Your Experience" : "Lodge a Complaint"}
                    </h1>
                    <p style={styles.subtitle}>
                        {isFeedback
                            ? "Help us raise standards in vocational education and training."
                            : "All complaints are handled with strict confidentiality and impartiality."}
                    </p>
                </div>

                {/* Progress */}
                <div style={styles.progressWrap}>
                    <div style={styles.progressTrack}>
                        <div style={{ ...styles.progressFill, width: `${progress}%`, background: `linear-gradient(90deg,${accentColor},${accentGold})` }} />
                    </div>
                    <div style={styles.stepLabels}>
                        {stepLabels.map((label, i) => (
                            <div key={i} style={{ ...styles.stepLabel, ...(step > i + 1 ? styles.stepDone : step === i + 1 ? styles.stepActive : {}) }}>
                                <div style={{ ...styles.stepDot, ...(step > i + 1 ? { ...styles.stepDotDone, backgroundColor: accentColor, borderColor: accentColor } : step === i + 1 ? { ...styles.stepDotActive, borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}15` } : {}) }}>
                                    {step > i + 1 ? "✓" : i + 1}
                                </div>
                                <span style={styles.stepText}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={styles.body}>

                    {/* ── STEP 1: Identity (shared) ── */}
                    {step === 1 && (
                        <div style={styles.stepContent}>
                            <div style={styles.sectionLabel}>
                                <span style={{ ...styles.sectionNum, color: accentGold }}>01</span>
                                {isComplaint ? "Your Identity" : "Who are you?"}
                            </div>

                            {/* Anonymous toggle — complaint only */}
                            {isComplaint && (
                                <div style={styles.anonToggleWrap}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#2D3748" }}>Submit Anonymously</div>
                                        <div style={{ fontSize: "0.78rem", color: "#718096", marginTop: 2 }}>Your identity will not be recorded or shared.</div>
                                    </div>
                                    <button
                                        style={{ ...styles.toggle, ...(form.anonymous ? { ...styles.toggleOn, backgroundColor: accentColor } : {}) }}
                                        onClick={() => set("anonymous", !form.anonymous)}
                                    >
                                        <div style={{ ...styles.toggleKnob, ...(form.anonymous ? styles.toggleKnobOn : {}) }} />
                                    </button>
                                </div>
                            )}

                            {!form.anonymous && (
                                <>
                                    <div style={styles.fieldRow}>
                                        <div style={styles.field}>
                                            <label style={styles.label}>Full Name <span style={styles.req}>*</span></label>
                                            <input style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
                                                placeholder="e.g. Pema Dorji" value={form.name}
                                                onChange={(e) => set("name", e.target.value)} />
                                            {errors.name && <span style={styles.error}>{errors.name}</span>}
                                        </div>
                                        <div style={styles.field}>
                                            <label style={styles.label}>Email Address <span style={styles.req}>*</span></label>
                                            <input style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
                                                placeholder="e.g. pema@example.bt" value={form.email}
                                                onChange={(e) => set("email", e.target.value)} />
                                            {errors.email && <span style={styles.error}>{errors.email}</span>}
                                        </div>
                                    </div>
                                    <div style={{ ...styles.field, marginBottom: 20 }}>
                                        <label style={styles.label}>Contact Number <span style={{ ...styles.req, color: "#A0AEC0", fontWeight: 400 }}>(optional)</span></label>
                                        <input style={styles.input} placeholder="e.g. 77123456" value={form.contactNo}
                                            onChange={(e) => set("contactNo", e.target.value)} />
                                    </div>
                                </>
                            )}

                            <div style={styles.field}>
                                <label style={styles.label}>Your Role <span style={styles.req}>*</span></label>
                                <div style={styles.roleGrid}>
                                    {ROLES.map((r) => (
                                        <button key={r}
                                            style={{ ...styles.roleBtn, ...(form.role === r ? { ...styles.roleBtnActive, backgroundColor: accentColor, borderColor: accentColor } : {}) }}
                                            onClick={() => set("role", r)}>{r}</button>
                                    ))}
                                </div>
                                {errors.role && <span style={styles.error}>{errors.role}</span>}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Feedback — Category + Rating ── */}
                    {step === 2 && isFeedback && (
                        <div style={styles.stepContent}>
                            <div style={styles.sectionLabel}>
                                <span style={{ ...styles.sectionNum, color: accentGold }}>02</span> What are you rating?
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Feedback Category <span style={styles.req}>*</span></label>
                                <div style={styles.categoryGrid}>
                                    {FB_CATEGORIES.map((cat) => (
                                        <button key={cat.id}
                                            style={{ ...styles.catBtn, ...(form.fbCategory === cat.id ? { ...styles.catBtnActive, backgroundColor: accentColor, borderColor: accentColor } : {}) }}
                                            onClick={() => set("fbCategory", cat.id)}>
                                            <span style={styles.catIcon}>{cat.icon}</span>
                                            <span style={styles.catLabel}>{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.fbCategory && <span style={styles.error}>{errors.fbCategory}</span>}
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Overall Rating <span style={styles.req}>*</span></label>
                                <div style={styles.ratingRow}>
                                    {RATINGS.map((r) => (
                                        <button key={r.value}
                                            style={{ ...styles.starBtn, color: (hoveredRating || form.rating) >= r.value ? "#C9A84C" : "#CBD5E0", transform: hoveredRating === r.value ? "scale(1.25)" : "scale(1)" }}
                                            onMouseEnter={() => setHoveredRating(r.value)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            onClick={() => set("rating", r.value)}>★</button>
                                    ))}
                                    <span style={styles.ratingLabel}>
                                        {hoveredRating ? RATINGS.find(r => r.value === hoveredRating)?.label
                                            : form.rating ? RATINGS.find(r => r.value === form.rating)?.label
                                                : "Select a rating"}
                                    </span>
                                </div>
                                {errors.rating && <span style={styles.error}>{errors.rating}</span>}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Complaint — Category + Urgency ── */}
                    {step === 2 && isComplaint && (
                        <div style={styles.stepContent}>
                            <div style={styles.sectionLabel}>
                                <span style={{ ...styles.sectionNum, color: accentGold }}>02</span> Incident Information
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Complaint Category <span style={styles.req}>*</span></label>
                                <div style={{ ...styles.categoryGrid, gridTemplateColumns: "repeat(3, 1fr)" }}>
                                    {CP_CATEGORIES.map((cat) => (
                                        <button key={cat.id}
                                            style={{ ...styles.catBtn, ...(form.cpCategory === cat.id ? { ...styles.catBtnActive, backgroundColor: accentColor, borderColor: accentColor } : {}) }}
                                            onClick={() => set("cpCategory", cat.id)}>
                                            <span style={styles.catIcon}>{cat.icon}</span>
                                            <span style={styles.catLabel}>{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.cpCategory && <span style={styles.error}>{errors.cpCategory}</span>}
                            </div>

                            <div style={styles.fieldRow}>
                                <div style={styles.field}>
                                    <label style={styles.label}>Complaint Against <span style={{ ...styles.req, color: "#A0AEC0", fontWeight: 400 }}>(optional)</span></label>
                                    <input style={styles.input} placeholder="Name or designation"
                                        value={form.against} onChange={(e) => set("against", e.target.value)} />
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Institution / Organisation <span style={{ ...styles.req, color: "#A0AEC0", fontWeight: 400 }}>(optional)</span></label>
                                    <input style={styles.input} placeholder="e.g. Paro VTC"
                                        value={form.institution} onChange={(e) => set("institution", e.target.value)} />
                                </div>
                            </div>

                            <div style={styles.fieldRow}>
                                <div style={styles.field}>
                                    <label style={styles.label}>Date of Incident <span style={{ ...styles.req, color: "#A0AEC0", fontWeight: 400 }}>(optional)</span></label>
                                    <input type="date" style={styles.input} value={form.incidentDate}
                                        onChange={(e) => set("incidentDate", e.target.value)} />
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Urgency Level <span style={styles.req}>*</span></label>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {URGENCY.map((u) => (
                                            <button key={u.id}
                                                style={{
                                                    ...styles.urgencyBtn,
                                                    ...(form.urgency === u.id ? { backgroundColor: u.color, borderColor: u.color, color: "#fff", boxShadow: `0 4px 12px ${u.color}40` } : {}),
                                                }}
                                                onClick={() => set("urgency", u.id)}>
                                                {u.label}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.urgency && <span style={styles.error}>{errors.urgency}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Feedback — Thoughts ── */}
                    {step === 3 && isFeedback && (
                        <div style={styles.stepContent}>
                            <div style={styles.sectionLabel}>
                                <span style={{ ...styles.sectionNum, color: accentGold }}>03</span> Tell us more
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Describe your experience <span style={styles.req}>*</span></label>
                                <textarea style={{ ...styles.textarea, ...(errors.experience ? styles.inputError : {}) }}
                                    placeholder="What went well? What could be improved? Be as specific as possible…"
                                    rows={4} value={form.experience}
                                    onChange={(e) => set("experience", e.target.value)} />
                                <span style={styles.charCount}>{form.experience.length} characters</span>
                                {errors.experience && <span style={styles.error}>{errors.experience}</span>}
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Suggestions for improvement <span style={{ color: "#A0AEC0", fontWeight: 400, fontSize: "0.78rem" }}>(optional)</span></label>
                                <textarea style={styles.textarea} placeholder="Any specific recommendations or ideas…"
                                    rows={3} value={form.suggestions}
                                    onChange={(e) => set("suggestions", e.target.value)} />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Would you recommend this programme? <span style={styles.req}>*</span></label>
                                <div style={styles.recommendRow}>
                                    {[{ val: true, label: "Yes, definitely", icon: "👍" }, { val: false, label: "No, not yet", icon: "👎" }].map(({ val, label, icon }) => (
                                        <button key={String(val)}
                                            style={{ ...styles.recommendBtn, ...(form.recommend === val ? (val ? styles.recommendYes : styles.recommendNo) : {}), ...(hoveredRecommend === val && form.recommend !== val ? styles.recommendHover : {}) }}
                                            onMouseEnter={() => setHoveredRecommend(val)}
                                            onMouseLeave={() => setHoveredRecommend(null)}
                                            onClick={() => set("recommend", val)}>
                                            <span style={{ fontSize: 22 }}>{icon}</span>
                                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{label}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.recommend && <span style={styles.error}>{errors.recommend}</span>}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Complaint — Full Account ── */}
                    {step === 3 && isComplaint && (
                        <div style={styles.stepContent}>
                            <div style={styles.sectionLabel}>
                                <span style={{ ...styles.sectionNum, color: accentGold }}>03</span> Full Account
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Describe the incident in detail <span style={styles.req}>*</span></label>
                                <textarea style={{ ...styles.textarea, ...(errors.incidentDetails ? styles.inputError : {}) }}
                                    placeholder="Describe what happened, when, where, and who was involved. Include any evidence or witnesses if applicable…"
                                    rows={5} value={form.incidentDetails}
                                    onChange={(e) => set("incidentDetails", e.target.value)} />
                                <span style={styles.charCount}>{form.incidentDetails.length} characters</span>
                                {errors.incidentDetails && <span style={styles.error}>{errors.incidentDetails}</span>}
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Desired Resolution <span style={{ color: "#A0AEC0", fontWeight: 400, fontSize: "0.78rem" }}>(optional)</span></label>
                                <textarea style={styles.textarea}
                                    placeholder="What outcome are you hoping for? e.g. apology, investigation, disciplinary action…"
                                    rows={3} value={form.desiredResolution}
                                    onChange={(e) => set("desiredResolution", e.target.value)} />
                            </div>
                            {/* Complaint notice */}
                            <div style={styles.noticeBox}>
                                <div style={styles.noticeIcon}>ℹ</div>
                                <p style={styles.noticeText}>
                                    Your complaint will be reviewed by a designated officer within <strong>5–7 working days</strong>.
                                    False or malicious complaints may result in disciplinary action.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    {step > 1 ? (
                        <button style={styles.backBtn} onClick={back}>← Back</button>
                    ) : (
                        <button style={styles.backBtn} onClick={() => { setMode(null); setErrors({}); }}>← Home</button>
                    )}
                    <div style={{ flex: 1 }} />
                    {step < totalSteps ? (
                        <button style={{ ...styles.nextBtn, background: `linear-gradient(135deg,${accentColor} 0%,${accentLight} 100%)`, boxShadow: `0 4px 16px ${accentColor}40` }} onClick={next}>
                            Continue →
                        </button>
                    ) : (
                        <button style={{ ...styles.submitBtn, background: `linear-gradient(135deg,${accentColor} 0%,${accentGold} 160%)`, boxShadow: `0 4px 20px ${accentColor}40` }} onClick={submit}>
                            {isFeedback ? "Submit Feedback ✦" : "Lodge Complaint ⚑"}
                        </button>
                    )}
                </div>
            </div>
            <style>{keyframes}</style>
        </div>
    );
}

// ── Keyframes ─────────────────────────────────────────────────────────────────
const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes checkPop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.15); }
    100% { transform: scale(1);   opacity: 1; }
  }
  input:focus, textarea:focus { outline: none !important; box-shadow: 0 0 0 3px rgba(27,58,107,0.1) !important; }
  input[type=date] { font-family: 'DM Sans', sans-serif; }
  input::placeholder, textarea::placeholder { color: #A0AEC0; }
  button:focus { outline: none; }
`;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#F0F4FA",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "12px 16px 20px",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        backgroundImage: "radial-gradient(circle at 20% 20%, rgba(27,58,107,0.07) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(201,168,76,0.07) 0%, transparent 60%)",
    },
    card: {
        width: "100%", maxWidth: 860,
        backgroundColor: "#fff",
        borderRadius: 20,
        boxShadow: "0 20px 60px rgba(27,58,107,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
        position: "relative",
        animation: "fadeUp 0.45s ease both",
    },
    accentBar: { position: "absolute", top: 0, left: 0, width: "100%", height: 4 },
    header: { padding: "20px 40px 16px", color: "#fff" },
    headerTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
    logoMark: {
        width: 36, height: 36, borderRadius: 8,
        border: "1.5px solid rgba(255,255,255,0.3)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    headerLabel: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" },
    modeBackBtn: {
        background: "none", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 8,
        color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", fontWeight: 600,
        padding: "5px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.55rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 8 },
    subtitle: { fontSize: "0.9rem", color: "rgba(255,255,255,0.65)", fontWeight: 400, lineHeight: 1.5 },
    progressWrap: { padding: "14px 40px 0" },
    progressTrack: { height: 3, backgroundColor: "#EDF2F7", borderRadius: 4, overflow: "hidden", marginBottom: 16 },
    progressFill: { height: "100%", borderRadius: 4, transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)" },
    stepLabels: { display: "flex", justifyContent: "space-between" },
    stepLabel: { display: "flex", alignItems: "center", gap: 8, opacity: 0.4 },
    stepActive: { opacity: 1 },
    stepDone: { opacity: 0.7 },
    stepDot: { width: 24, height: 24, borderRadius: "50%", border: "2px solid #CBD5E0", display: "flex", alignItems: "flex-start", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#A0AEC0", flexShrink: 0 },
    stepDotActive: { borderColor: "#1B3A6B", color: "#1B3A6B", backgroundColor: "rgba(27,58,107,0.08)" },
    stepDotDone: { borderColor: "#1B3A6B", backgroundColor: "#1B3A6B", color: "#fff" },
    stepText: { fontSize: "0.78rem", fontWeight: 600, color: "#4A5568", letterSpacing: "0.01em" },
    body: { padding: "18px 40px 4px" },
    stepContent: { animation: "fadeUp 0.3s ease both" },
    sectionLabel: { display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #EDF2F7" },
    sectionNum: { fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.04em" },
    anonToggleWrap: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderRadius: 12, border: "1.5px solid #EDF2F7",
        backgroundColor: "#FAFBFC", marginBottom: 20,
    },
    toggle: {
        width: 44, height: 24, borderRadius: 12, border: "none",
        backgroundColor: "#E2E8F0", cursor: "pointer", position: "relative",
        transition: "background-color 0.2s", padding: 0, flexShrink: 0,
    },
    toggleOn: { backgroundColor: "#8B1A1A" },
    toggleKnob: {
        position: "absolute", top: 3, left: 3,
        width: 18, height: 18, borderRadius: "50%",
        backgroundColor: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
    },
    toggleKnobOn: { left: 23 },
    fieldRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    field: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 },
    label: { fontSize: "0.83rem", fontWeight: 600, color: "#2D3748", letterSpacing: "0.01em" },
    req: { color: "#E53E3E", marginLeft: 2 },
    input: {
        height: 44, borderRadius: 10, border: "1.5px solid #E2E8F0",
        padding: "0 14px", fontSize: "0.9rem", color: "#1A2540",
        backgroundColor: "#FAFBFC", transition: "border-color 0.15s, box-shadow 0.15s", width: "100%",
    },
    inputError: { borderColor: "#FC8181", backgroundColor: "#FFF5F5" },
    textarea: {
        borderRadius: 10, border: "1.5px solid #E2E8F0",
        padding: "12px 14px", fontSize: "0.9rem", color: "#1A2540",
        backgroundColor: "#FAFBFC", resize: "vertical", lineHeight: 1.6,
        fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s", width: "100%",
    },
    charCount: { fontSize: "0.72rem", color: "#A0AEC0", textAlign: "right", marginTop: -2 },
    error: { fontSize: "0.78rem", color: "#E53E3E", fontWeight: 500, marginTop: -2 },
    roleGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
    roleBtn: { padding: "8px 16px", borderRadius: 8, border: "1.5px solid #E2E8F0", backgroundColor: "#FAFBFC", fontSize: "0.85rem", fontWeight: 500, color: "#4A5568", cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" },
    roleBtnActive: { backgroundColor: "#1B3A6B", borderColor: "#1B3A6B", color: "#fff", boxShadow: "0 4px 12px rgba(27,58,107,0.2)" },
    categoryGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 },
    catBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 8px", borderRadius: 12, border: "1.5px solid #E2E8F0", backgroundColor: "#FAFBFC", cursor: "pointer", transition: "all 0.18s", fontFamily: "'DM Sans', sans-serif", color: "#4A5568" },
    catBtnActive: { backgroundColor: "#1B3A6B", borderColor: "#1B3A6B", color: "#fff", boxShadow: "0 4px 14px rgba(27,58,107,0.22)", transform: "translateY(-2px)" },
    catIcon: { fontSize: "1.3rem", lineHeight: 1 },
    catLabel: { fontSize: "0.72rem", fontWeight: 600, textAlign: "center", lineHeight: 1.3, color: "inherit" },
    urgencyBtn: { flex: 1, padding: "8px 6px", borderRadius: 8, border: "1.5px solid #E2E8F0", backgroundColor: "#FAFBFC", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif", color: "#4A5568" },
    ratingRow: { display: "flex", alignItems: "center", gap: 4 },
    starBtn: { fontSize: "2.2rem", background: "none", border: "none", cursor: "pointer", lineHeight: 1, transition: "transform 0.12s, color 0.12s", padding: "2px" },
    ratingLabel: { marginLeft: 12, fontSize: "0.85rem", fontWeight: 600, color: "#718096", minWidth: 80 },
    recommendRow: { display: "flex", gap: 12 },
    recommendBtn: { flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 10, padding: "14px 20px", borderRadius: 12, border: "1.5px solid #E2E8F0", backgroundColor: "#FAFBFC", cursor: "pointer", transition: "all 0.18s", fontFamily: "'DM Sans', sans-serif", color: "#4A5568" },
    recommendHover: { borderColor: "#CBD5E0", backgroundColor: "#F7FAFC", transform: "translateY(-1px)" },
    recommendYes: { backgroundColor: "rgba(26,107,74,0.08)", borderColor: "rgba(26,107,74,0.4)", color: "#1A6B4A", boxShadow: "0 4px 14px rgba(26,107,74,0.12)" },
    recommendNo: { backgroundColor: "rgba(139,26,26,0.07)", borderColor: "rgba(139,26,26,0.3)", color: "#8B1A1A", boxShadow: "0 4px 14px rgba(139,26,26,0.1)" },
    noticeBox: { display: "flex", gap: 12, padding: "14px 18px", borderRadius: 10, backgroundColor: "rgba(139,26,26,0.05)", border: "1px solid rgba(139,26,26,0.15)", marginBottom: 4 },
    noticeIcon: { fontSize: "1rem", color: "#8B1A1A", flexShrink: 0, marginTop: 1 },
    noticeText: { fontSize: "0.8rem", color: "#5A3030", lineHeight: 1.6 },
    footer: { display: "flex", alignItems: "center", padding: "12px 40px 20px", gap: 12 },
    backBtn: { height: 44, padding: "0 20px", borderRadius: 10, border: "1.5px solid #E2E8F0", backgroundColor: "transparent", fontSize: "0.875rem", fontWeight: 600, color: "#718096", cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" },
    nextBtn: { height: 44, padding: "0 28px", borderRadius: 10, border: "none", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.01em" },
    submitBtn: { height: 44, padding: "0 28px", borderRadius: 10, border: "none", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.02em" },
    // Mode selection
    modeBtn: { display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", borderRadius: 14, border: "1.5px solid #E2E8F0", backgroundColor: "#FAFBFC", cursor: "pointer", textAlign: "left", transition: "all 0.18s", fontFamily: "'DM Sans', sans-serif", width: "100%" },
    modeBtnIcon: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "flex-start", justifyContent: "center", flexShrink: 0 },
    modeBtnText: { flex: 1 },
    modeBtnTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: 4 },
    modeBtnDesc: { fontSize: "0.82rem", color: "#718096", lineHeight: 1.5 },
    modeBtnArrow: { fontSize: "1.2rem", fontWeight: 700, flexShrink: 0, opacity: 0.5 },
    // Success
    successInner: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "56px 48px", animation: "checkPop 0.5s ease both" },
    successTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: 700, color: "#1A2540", marginBottom: 12 },
    successText: { fontSize: "0.95rem", color: "#5A6A85", lineHeight: 1.7, maxWidth: 420, marginBottom: 24 },
    successMeta: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 },
    successTag: { padding: "6px 14px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600 },
    restartBtn: { height: 44, padding: "0 22px", borderRadius: 10, border: "1.5px solid #E2E8F0", backgroundColor: "transparent", fontSize: "0.875rem", fontWeight: 600, color: "#4A5568", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
};