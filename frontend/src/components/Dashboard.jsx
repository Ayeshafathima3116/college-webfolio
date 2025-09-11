import { useEffect, useState } from "react";
import StudentInformation from "./StudentInformation";
import StudentForm from "./.StudentForm";

import {
  FaUser,
  FaBullseye,
  FaGraduationCap,
  FaCode,
  FaProjectDiagram,
  FaCertificate,
  FaChalkboardTeacher,
  FaFileAlt,
  FaCheckCircle,
} from "react-icons/fa";

const sections = [
  { key: "personal", label: "Personal", icon: <FaUser /> },
  { key: "objective", label: "Objective", icon: <FaBullseye /> },
  { key: "education", label: "Education", icon: <FaGraduationCap /> },
  { key: "skills", label: "Skills", icon: <FaCode /> },
  { key: "projects", label: "Projects", icon: <FaProjectDiagram /> },
  { key: "certifications", label: "Certifications", icon: <FaCertificate /> },
  { key: "trainings", label: "Trainings", icon: <FaChalkboardTeacher /> },
  { key: "template", label: "Template", icon: <FaFileAlt /> },
];

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function Dashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(user || null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Left app sidebar state
  const [activeSection, setActiveSection] = useState("profile");
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  const [resumeBuilderOpen, setResumeBuilderOpen] = useState(false);

  // Resume builder progression state
  const [completedSections, setCompletedSections] = useState([]);
  const [activeResumeSection, setActiveResumeSection] = useState("personal");
  const [postGradAdded, setPostGradAdded] = useState(false);

  // Small styled inputs
  const StyledInput = (props) => (
    <input
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #ccc",
        outline: "none",
        fontSize: 14,
        fontFamily: "Poppins, sans-serif",
        transition: "0.2s",
        width: "100%",
        ...props.style,
      }}
      onFocus={(e) => (e.target.style.border = "1px solid #1565c0")}
      onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
    />
  );

  const StyledTextarea = (props) => (
    <textarea
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #ccc",
        outline: "none",
        fontSize: 14,
        fontFamily: "Poppins, sans-serif",
        transition: "0.2s",
        width: "100%",
        ...props.style,
      }}
      onFocus={(e) => (e.target.style.border = "1px solid #1565c0")}
      onBlur={(e) => (e.target.style.border = "1px solid #ccc")}
    />
  );

  const buttonStyle = {
    background: "#1565c0",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontFamily: "Poppins, sans-serif",
    transition: "0.2s",
  };

  // Resume builder data
  const [resumeData, setResumeData] = useState({
    personal: {
      fullName: "",
      email: "",
      address: "",
      github: "",
      linkedin: "",
      contactNumber: "",
    },
    objective: "",
    education: {
      ssc: { institute: "", year: "", marks: "" },
      interOrDiploma: { institute: "", year: "", marks: "" },
      btech: { institute: "", year: "", marks: "" },
      postGrad: null,
    },
    skills: {
      technical: [],
      softSkills: [],
      field: [],
    },
    projects: [],
    certifications: [],
    trainings: [],
    template: "template1",
  });

  // Fetch profile
  async function refreshProfile() {
    try {
      const res = await fetch(`${BACKEND}/api/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (!data.department) {
          setIsEditing(false);
          setShowFormModal(true);
        }
      }
    } catch (err) {
      console.warn("refreshProfile failed", err);
    }
  }

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaved = async () => {
    await refreshProfile();
    setShowFormModal(false);
  };

  // Resume data updaters
  const updateResumeData = (path, value) => {
    setResumeData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (typeof path === "string") path = path.split(".");
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (cur[path[i]] === undefined) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = value;
      return next;
    });
  };

  const addToArray = (path, item) => {
    setResumeData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (typeof path === "string") path = path.split(".");
      let cur = next;
      for (let i = 0; i < path.length; i++) {
        if (cur[path[i]] === undefined) cur[path[i]] = [];
        if (i === path.length - 1) {
          cur[path[i]].push(item);
        } else {
          cur = cur[path[i]];
        }
      }
      return next;
    });
  };

  const removeFromArray = (path, index) => {
    setResumeData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (typeof path === "string") path = path.split(".");
      let cur = next;
      for (let i = 0; i < path.length; i++) {
        if (i === path.length - 1) {
          cur[path[i]].splice(index, 1);
        } else {
          cur = cur[path[i]];
        }
      }
      return next;
    });
  };

  // Save & go next inside resume builder
  const handleSave = () => {
    if (!completedSections.includes(activeResumeSection)) {
      setCompletedSections([...completedSections, activeResumeSection]);
    }

    const currentIndex = sections.findIndex((s) => s.key === activeResumeSection);
    if (currentIndex < sections.length - 1) {
      setActiveResumeSection(sections[currentIndex + 1].key);
    } else {
      alert("All sections completed!");
    }
  };

  // Render forms for each resume section
  const renderResumeForm = () => {
    const sectionStyle = { display: "grid", gap: 12, maxWidth: 800 };

    switch (activeResumeSection) {
      case "personal":
        return (
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "8px" }}>
              Personal Details
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>
              Enter your basic information
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {[
                { label: " Full Name *", placeholder: "Enter your full name", key: "fullName" },
                { label: "Email *", placeholder: "Enter your email", key: "email" },
                { label: "Contact Number *", placeholder: "Enter your phone number", key: "contactNumber" },
                { label: "Address", placeholder: "Enter your address", key: "address" },
                { label: "GitHub", placeholder: "Enter your GitHub URL", key: "github" },
                { label: "LinkedIn", placeholder: "Enter your LinkedIn URL", key: "linkedin" },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
                  >
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={resumeData.personal[field.key]}
                    onChange={(e) =>
                      updateResumeData(["personal", field.key], e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              style={{
                marginTop: "24px",
                padding: "12px 18px",
                background: "#1E40AF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Save & Next
            </button>
          </div>
        );

      case "objective":
        return (
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "8px" }}>
              Career Objective
            </h2>
            <textarea
              placeholder="Enter your career objective"
              value={resumeData.objective}
              onChange={(e) => setResumeData({ ...resumeData, objective: e.target.value })}
              style={{
                width: "100%",
                height: "120px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={handleSave}
              style={{
                marginTop: "24px",
                padding: "12px 18px",
                background: "#1E40AF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Save & Next
            </button>
          </div>
        );

      case "education":
        return (
          <div style={sectionStyle}>
            <h3>Education</h3>
            {[
              { key: "ssc", label: "SSC" },
              { key: "interOrDiploma", label: "INTER / Diploma" },
              { key: "btech", label: "B.Tech" },
            ].map(({ key, label }) => (
              <div key={key} style={{ ...sectionStyle, marginBottom: 20 }}>
                <h4 style={{ marginBottom: 8 }}>{label}</h4>
                <StyledInput
                  placeholder={`${label} Institute`}
                  value={resumeData.education[key].institute}
                  onChange={(e) =>
                    updateResumeData(["education", key, "institute"], e.target.value)
                  }
                />
                <StyledInput
                  placeholder="Year"
                  value={resumeData.education[key].year}
                  onChange={(e) =>
                    updateResumeData(["education", key, "year"], e.target.value)
                  }
                />
                <StyledInput
                  placeholder="Marks (%)"
                  value={resumeData.education[key].marks}
                  onChange={(e) =>
                    updateResumeData(["education", key, "marks"], e.target.value)
                  }
                />
              </div>
            ))}

            {postGradAdded ? (
              <div style={sectionStyle}>
                <h4 style={{ marginBottom: 8 }}>Post Graduation</h4>
                <StyledInput
                  placeholder="Post Graduation Institute"
                  value={resumeData.education.postGrad?.institute || ""}
                  onChange={(e) =>
                    updateResumeData(["education", "postGrad", "institute"], e.target.value)
                  }
                />
                <StyledInput
                  placeholder="Year"
                  value={resumeData.education.postGrad?.year || ""}
                  onChange={(e) =>
                    updateResumeData(["education", "postGrad", "year"], e.target.value)
                  }
                />
                <StyledInput
                  placeholder="Marks (%)"
                  value={resumeData.education.postGrad?.marks || ""}
                  onChange={(e) =>
                    updateResumeData(["education", "postGrad", "marks"], e.target.value)
                  }
                />
              </div>
            ) : (
              <button
                style={buttonStyle}
                onClick={() => {
                  setPostGradAdded(true);
                  updateResumeData("education.postGrad", {
                    institute: "",
                    year: "",
                    marks: "",
                  });
                }}
              >
                + Add Post Graduation
              </button>
            )}

            <button
              onClick={handleSave}
              style={{
                marginTop: "12px",
                padding: "12px 18px",
                background: "#1E40AF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                width: "fit-content",
              }}
            >
              Save & Next
            </button>
          </div>
        );

      case "skills":
        return (
          <div style={sectionStyle}>
            <h3>Skills</h3>
            {["technical", "softSkills", "field"].map((type) => (
              <div key={type}>
                <h4 style={{ textTransform: "capitalize" }}>{type}</h4>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {resumeData.skills[type].map((skill, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#e3f2fd",
                        padding: "6px 12px",
                        borderRadius: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {skill}
                      <span
                        onClick={() => removeFromArray(["skills", type], i)}
                        style={{ cursor: "pointer", color: "red" }}
                      >
                        ✕
                      </span>
                    </div>
                  ))}
                </div>
                <StyledInput
                  placeholder={`Add ${type} skill (press Enter)`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      addToArray(["skills", type], e.target.value.trim());
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            ))}

            <button
              onClick={handleSave}
              style={{
                marginTop: "12px",
                padding: "12px 18px",
                background: "#1E40AF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                width: "fit-content",
              }}
            >
              Save & Next
            </button>
          </div>
        );

      case "projects":
        return (
          <div style={sectionStyle}>
            <h3>Projects</h3>

            {resumeData.projects.map((proj, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0 }}>Project {idx + 1}</h4>
                  <button
                    style={{ ...buttonStyle, background: "#ef4444" }}
                    onClick={() => removeFromArray("projects", idx)}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <StyledInput
                    placeholder="Title"
                    value={proj.title || ""}
                    onChange={(e) =>
                      updateResumeData(["projects", idx, "title"], e.target.value)
                    }
                  />
                  <StyledTextarea
                    placeholder="Description"
                    value={proj.description || ""}
                    onChange={(e) =>
                      updateResumeData(["projects", idx, "description"], e.target.value)
                    }
                    rows={4}
                  />
                  <StyledInput
                    placeholder="Tech (press Enter to add)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim()) {
                        const nextTech = Array.isArray(proj.tech) ? proj.tech.slice() : [];
                        nextTech.push(e.target.value.trim());
                        updateResumeData(["projects", idx, "tech"], nextTech);
                        e.target.value = "";
                      }
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(proj.tech || []).map((t, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          background: "#f0f9ff",
                          padding: "6px 10px",
                          borderRadius: 16,
                          border: "1px solid #dbeafe",
                          fontSize: 13,
                        }}
                        onClick={() => {
                          const nextTech = (proj.tech || []).slice();
                          nextTech.splice(tIdx, 1);
                          updateResumeData(["projects", idx, "tech"], nextTech);
                        }}
                      >
                        {t} ✕
                      </span>
                    ))}
                  </div>
                  <StyledInput
                    placeholder="Link (GitHub / Live)"
                    value={proj.link || ""}
                    onChange={(e) =>
                      updateResumeData(["projects", idx, "link"], e.target.value)
                    }
                  />
                </div>
              </div>
            ))}

            <button
              style={buttonStyle}
              onClick={() =>
                addToArray("projects", { title: "", description: "", tech: [], link: "" })
              }
            >
              + Add Project
            </button>

            <button
              onClick={handleSave}
              style={{
                marginTop: "12px",
                padding: "12px 18px",
                background: "#1E40AF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                width: "fit-content",
              }}
            >
              Save & Next
            </button>
          </div>
        );

      case "certifications":
        return (
          <div style={sectionStyle}>
            <h3>Certifications</h3>

            <div style={{ display: "grid", gap: 10 }}>
              {resumeData.certifications.map((cert, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <StyledInput
                    placeholder={`Certification ${idx + 1}`}
                    value={cert || ""}
                    onChange={(e) => updateResumeData(["certifications", idx], e.target.value)}
                  />
                  <button
                    style={{ ...buttonStyle, background: "#ef4444" }}
                    onClick={() => removeFromArray("certifications", idx)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              style={{ ...buttonStyle, marginTop: 8 }}
              onClick={() => addToArray("certifications", "")}
            >
              + Add Certification
            </button>

            <button
              onClick={handleSave}
              style={{
                marginTop: "12px",
                padding: "12px 18px",
                background: "#1E40AF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                width: "fit-content",
              }}
            >
              Save & Next
            </button>
          </div>
        );

      case "trainings":
        return (
          <div style={sectionStyle}>
            <h3>Trainings</h3>

            <div style={{ display: "grid", gap: 10 }}>
              {resumeData.trainings.map((tr, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <StyledInput
                    placeholder={`Training ${idx + 1}`}
                    value={tr || ""}
                    onChange={(e) => updateResumeData(["trainings", idx], e.target.value)}
                  />
                  <button
                    style={{ ...buttonStyle, background: "#ef4444" }}
                    onClick={() => removeFromArray("trainings", idx)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              style={{ ...buttonStyle, marginTop: 8 }}
              onClick={() => addToArray("trainings", "")}
            >
              + Add Training
            </button>

            <button
              onClick={handleSave}
              style={{
                marginTop: "12px",
                padding: "12px 18px",
                background: "#1E40AF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                width: "fit-content",
              }}
            >
              Save & Next
            </button>
          </div>
        );

      case "template":
        return (
          <div style={sectionStyle}>
            <h3>Template</h3>
            <label style={{ display: "block", marginBottom: 8 }}>Choose a template</label>
            <select
              value={resumeData.template}
              onChange={(e) => updateResumeData("template", e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                width: 240,
              }}
            >
              <option value="template1">Template 1</option>
              <option value="template2">Template 2</option>
              <option value="template3">Template 3</option>
            </select>

            <button
              onClick={handleSave}
              style={{
                marginTop: "12px",
                padding: "12px 18px",
                background: "#1E40AF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                width: "fit-content",
              }}
            >
              Save
            </button>
          </div>
        );

      default:
        return <div>Select a section</div>;
    }
  };

  // Modal for editing profile
  const modal = showFormModal ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "min(720px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#f7f7f8",
          borderRadius: 10,
          padding: 22,
          boxShadow: "0 12px 32px rgba(0,0,0,.25)",
        }}
      >
        {(profile?.department || isEditing) && (
          <button
            onClick={() => setShowFormModal(false)}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              lineHeight: 1,
              float: "right",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            ×
          </button>
        )}

        {!profile?.department ? (
          <StudentForm user={profile} onSaved={onSaved} />
        ) : (
          <StudentInformation
            startEditing
            onSaved={onSaved}
            onCancel={() => setShowFormModal(false)}
          />
        )}
      </div>
    </div>
  ) : null;

  // Download resume JSON
  const downloadResumeJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `${(resumeData.personal.fullName || "resume").replace(
      /\s+/g,
      "_"
    )}_resume.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Styles for resume builder (left sections list)
  const builderSidebarStyle = {
    width: "280px",
    minWidth: "240px",
    backgroundColor: "#f7f7f8",
    borderRight: "1px solid #e5e5e5",
    padding: "20px",
  };

  const builderSectionItem = (active) => ({
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    background: active ? "#e3f2fd" : "transparent",
  });

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#ffffff" }}>
      {/* App Sidebar */}
      <div
        style={{
          width: "25%",
          minWidth: "260px",
          backgroundColor: "#f7f7f8",
          borderRight: "1px solid #e5e5e5",
          color: "#000",
          display: "flex",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Webfolio</h2>

        {/* Sidebar buttons */}
        <div style={{ marginTop: 20 }}>
          {/* Profile button */}
          <div
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 15,
              borderRadius: 8,
              background: activeSection === "profile" ? "#e3f2fd" : "transparent",
              marginBottom: 6,
            }}
            onClick={() => {
              setActiveSection("profile");
              setShowResumeDropdown(false);
              setResumeBuilderOpen(false);
            }}
          >
            👤 Profile
          </div>

          {/* Resume Builder button */}
          <div
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 15,
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: activeSection === "resume" ? "#e3f2fd" : "transparent",
            }}
            onClick={() => {
              setActiveSection("resume");
              setShowResumeDropdown((prev) => !prev);
            }}
          >
            📄 Resume Builder
            <span>{showResumeDropdown ? "▲" : "▼"}</span>
          </div>

          {/* Resume Builder dropdown */}
          {showResumeDropdown && (
            <div
              style={{
                marginLeft: 20,
                marginTop: 6,
                paddingLeft: 10,
                borderLeft: "2px solid #ccc",
              }}
            >
              <div
                style={{ padding: "6px 0", cursor: "pointer", fontSize: 14 }}
                onClick={() => {
                  setResumeBuilderOpen(true);
                  setActiveSection("resume");
                  setActiveResumeSection("personal");
                }}
              >
                ➕ Create New Resume
              </div>
              <div
                style={{ padding: "6px 0", cursor: "pointer", fontSize: 14 }}
                onClick={() => alert("Edit Resume clicked")}
              >
                ✏️ Edit Resume (placeholder)
              </div>
              <div
                style={{ padding: "6px 0", cursor: "pointer", fontSize: 14 }}
                onClick={() => downloadResumeJSON()}
              >
                ⬇️ Download Resume
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div
          style={{
            marginTop: "auto",
            marginBottom: 20,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onLogout}
            style={{
              backgroundColor: "#4dafff",
              color: "#fff",
              padding: "10px 20px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              width: 150,
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Section */}
      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto", backgroundColor: "#fafafa" }}>
        {/* Profile Section */}
        {!resumeBuilderOpen && activeSection === "profile" && profile?.department && (
          <>
            <h1
              style={{
                marginBottom: 8,
                fontSize: "28px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Welcome,{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #6a11cb, #ff6a00)",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                {profile.name || profile.username}
              </span>{" "}
              👋
            </h1>
            <p style={{ marginTop: 0, color: "#666", textAlign: "center" }}>
              Your professional student portfolio dashboard showcasing your academic journey and achievements
            </p>

            {/* Profile Card */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 16,
                padding: 24,
                maxWidth: 700,
                margin: "24px auto",
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <div style={{ position: "relative", display: "inline-block" }}>
                {profile.photoPath && (
                  <img
                    src={`${BACKEND}/${profile.photoPath}`}
                    alt="Student"
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      border: "3px solid #ddd",
                      objectFit: "cover",
                    }}
                  />
                )}
                <span
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    background: "#4caf50",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 14,
                  }}
                >
                  ✓
                </span>
              </div>

              <h2 style={{ marginTop: 16, marginBottom: 4 }}>{profile.name || profile.username}</h2>
              <p style={{ margin: 0, color: "#777" }}>Your submitted details:</p>

              <div
                style={{
                  marginTop: 20,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  textAlign: "left",
                }}
              >
                <p><b>Name:</b> {profile.name || profile.username}</p>
                <p><b>Roll Number:</b> {profile.rollNumber}</p>
                <p><b>Department:</b> {profile.department}</p>
                <p><b>Batch:</b> {profile.batch}</p>
                <p><b>Blood Group:</b> {profile.bloodGroup}</p>
                <p>
                  <b>Percentage:</b>{" "}
                  <span style={{ color: "#1565c0", fontWeight: "bold", marginLeft: 6 }}>
                    {profile.percentage ?? "-"}%
                  </span>
                </p>
                <p style={{ gridColumn: "1 / -1" }}>
                  <b>Portfolio:</b>{" "}
                  <a href={profile.portfolio} target="_blank" rel="noreferrer" style={{ color: "#1565c0" }}>
                    {profile.portfolio}
                  </a>
                </p>
              </div>

              <div style={{ marginTop: 16, textAlign: "left" }}>
                <b>Skills:</b>
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile.skills?.length ? (
                    profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#f0f0f0",
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: 14,
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowFormModal(true);
                }}
                style={{
                  marginTop: 24,
                  backgroundColor: "#1565c0",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 18px",
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: "bold",
                }}
              >
                Edit Profile
              </button>
            </div>
          </>
        )}

        {/* If profile not completed */}
        {!resumeBuilderOpen && activeSection === "profile" && !profile?.department && (
          <div style={{ maxWidth: 900, margin: "auto" }}>
            <h2>Please complete your profile</h2>
            <StudentForm user={profile} onSaved={onSaved} />
          </div>
        )}

        {/* Resume Builder */}
        {resumeBuilderOpen && (
          <div
            style={{
              display: "flex",
              height: "100%",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              background: "#fff",
            }}
          >
            {/* Left 1/4: Sections list */}
            <div style={builderSidebarStyle}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
                Sections
              </h3>
              {sections.map((sec) => (
                <div
                  key={sec.key}
                  style={builderSectionItem(sec.key === activeResumeSection)}
                  onClick={() => setActiveResumeSection(sec.key)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {sec.icon} {sec.label}
                  </div>
                  {completedSections.includes(sec.key) && <FaCheckCircle color="#16a34a" />}
                </div>
              ))}
            </div>

            {/* Right 3/4: Form content */}
            <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
              {renderResumeForm()}
            </div>
          </div>
        )}
      </div>

      {modal}
    </div>
  );
}
