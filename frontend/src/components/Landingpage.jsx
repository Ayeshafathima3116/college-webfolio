import React, { useState, useRef, useEffect } from "react";
import CardsPagination from "./Cardspagination";
import "./Landingpage.css";
import { useNavigate } from "react-router-dom";

const Landingpage = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    department: "",
    year: "",
    skills: [],
    otherSkill: "",
    percentage: "",
    rollNumber: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "percentage") {
      if (/^\d{0,3}$/.test(value)) {
        if (value === "" || (Number(value) >= 1 && Number(value) <= 100)) {
          setFilters((prev) => ({ ...prev, percentage: value }));
        }
      }
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillChange = (skill) => {
    if (skill === "Other") {
      setFilters((prev) => ({
        ...prev,
        otherSkill: prev.otherSkill === "" ? " " : "",
      }));
      return;
    }

    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const skillsList = [
    "C","JavaScript","React.js","Node.js","Python","Java","C++","CSS","HTML",
    "Django","SQL","Shell/Bash scripting","Angular","Vue.js","Spring Boot",
    "REST APIs","Git","GitHub","MySQL","MongoDB","Express.js","Next.js",
    "TypeScript","PostgreSQL","Excel","Pandas","Matplotlib","Power BI",
    "Tableau","VS Code","IntelliJ","PyCharm","Postman","Figma",
    "Data Structures and Algorithms","OOP concepts","Operating Systems Basics",
    "Computer Networks","AWS","Azure","GCP","Docker","CI/CD","Excel Automation",
    "Cybersecurity","AI & Machine Learning","Other"
  ];

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters }); // ✅ Send filters only on Apply
  };

  const handleReset = () => {
    const resetState = {
      department: "",
      year: "",
      skills: [],
      otherSkill: "",
      percentage: "",
      rollNumber: "",
    };
    setFilters(resetState);
    setAppliedFilters(resetState);
  };

  return (
    <div className="page-background">
      {/* NAVBAR */}
      <div className="navbar">
        <h1 className="nav-title">HR Dashboard</h1>
        <button className="login-btn" onClick={() => navigate("/login")}>
          Student Login
        </button>
      </div>

      {/* FILTERS CONTAINER */}
      <div className="filters-container">
        <h3 className="filter-heading">Candidate Profile Search</h3>

        <div className="filters-row">
          {/* Skills Multi-select */}
          <div
            className={`multi-select ${dropdownOpen ? "open" : ""}`}
            ref={dropdownRef}
          >
            <div
              className="multi-select-header"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {filters.skills.length > 0 || filters.otherSkill ? (
                <div className="tags-list">
                  {filters.skills.map((skill, idx) => (
                    <span key={idx} className="tag">
                      {skill}
                      <button
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkillChange(skill);
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {filters.otherSkill && filters.otherSkill.trim() !== "" && (
                    <span className="tag">
                      {filters.otherSkill}
                      <button
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((prev) => ({
                            ...prev,
                            otherSkill: "",
                          }));
                        }}
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              ) : (
                <span className="placeholder">All Skills</span>
              )}
              <span className="arrow">{dropdownOpen ? "▲" : "▼"}</span>
            </div>

            {dropdownOpen && (
              <div
                className="multi-select-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                {skillsList.map((skill, index) => (
                  <label key={index} className="multi-select-item">
                    <input
                      type="checkbox"
                      checked={
                        skill === "Other"
                          ? filters.otherSkill !== ""
                          : filters.skills.includes(skill)
                      }
                      onChange={() => handleSkillChange(skill)}
                    />
                    {skill}
                    {skill === "Other" && filters.otherSkill !== "" && (
                      <input
                        type="text"
                        className="other-skill-input"
                        placeholder="Enter custom skill"
                        value={filters.otherSkill.trim()}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            otherSkill: e.target.value,
                          }))
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Department */}
          <select
            name="department"
            value={filters.department}
            onChange={handleChange}
            className="filter-input"
          >
            <option value="">All Departments</option>
            <option value="CIVIL">CIVIL</option>
            <option value="EEE">EEE</option>
            <option value="ECE">ECE</option>
            <option value="MECHANICAL">MECHANICAL</option>
            <option value="CSE">CSE</option>
            <option value="CSE-AI">CSE-AI</option>
            <option value="CSE-DS">CSE-DS</option>
            <option value="MBA">MBA</option>
          </select>

          {/* Year */}
          <select
            name="year"
            value={filters.year}
            onChange={handleChange}
            className="filter-input"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">Prefinal Year</option>
            <option value="4">Final Year</option>
          </select>

          {/* Percentage */}
          <input
            type="text"
            name="percentage"
            placeholder=" Minimum Percent (1-100)"
            value={filters.percentage}
            onChange={handleChange}
            className="filter-input"
          />

          {/* Roll Number */}
          <input
            type="text"
            name="rollNumber"
            placeholder="Roll Number"
            value={filters.rollNumber}
            onChange={handleChange}
            className="filter-input"
          />
        </div>

        <div className="filter-buttons">
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
          <button className="apply-btn" onClick={handleApplyFilters}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* CANDIDATES */}
      <div className="dashboard-container">
        <h2 className="section-title">Candidates</h2>
        <CardsPagination filters={appliedFilters} />
      </div>
    </div>
  );
};

export default Landingpage;
