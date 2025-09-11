import React, { Component } from "react";
import "./StudentInformation.css";

export default class StudentForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      editing: !!props.startEditing,
      hasSubmitted: false,

      // fields
      defaultName: "",
      defaultRoll: "",
      department: "",
      otherDepartment: "",
      batch: "",
      bloodGroup: "",
      otherBloodGroup: "",
      portfolio: "",
      percentage: "",
      selectedSkills: [],
      availableSkills: ["C",
        "JavaScript","React.js","Node.js","Python","Java","C++","CSS","HTML",
        "Django","SQL","Shell/Bash scripting","Angular","Vue.js","Spring Boot",
        "REST APIs","Git","GitHub","MySQL","MongoDB","Express.js","Next.js",
        "TypeScript","PostgreSQL","Excel","Pandas","Matplotlib","Power BI",
        "Tableau","VS Code","IntelliJ","PyCharm","Postman","Figma",
        "Data Structures and Algorithms","OOP concepts","Operating Systems Basics",
        "Computer Networks","AWS","Azure","GCP","Docker","CI/CD","Excel Automation",
        "Cybersecurity","AI & Machine Learning","Other"
      ],
      isSkillsDropdownOpen: false,
      skillsSearch: "",
      otherSkill: "",
      photoPath: "",

      // validation flags for SKILLS only
      showSkillsError: false,
      showOtherSkillError: false,
    };

    this.skillsRef = React.createRef();
  }

  /**
   * ✅ Calculate batch based on roll number:
   * - Take first 2 digits -> start year
   * - Check 5th character:
   *    - '5' => +3 years
   *    - '1' => +4 years
   *    - Default: +4 years
   */
calculateBatchFromRoll(roll) {
  if (!roll || roll.length < 5) return "";

  const startTwoDigits = roll.substring(0, 2); // e.g., "22"
  let startYear = 2000 + parseInt(startTwoDigits, 10); // 2022

  const fifthChar = roll.charAt(4); // e.g., '1' or '5'
  let endYear;

  if (fifthChar === "5") {
    startYear = startYear - 1; // decrease start year by 1
    endYear = startYear + 4;   // then add 4 years for end year
  } else if (fifthChar === "1") {
    endYear = startYear + 4; // normal case
  } else {
    endYear = startYear + 4; // default
  }

  return `${startYear}-${endYear}`;
}


  async componentDidMount() {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Session expired");
      const data = await res.json();

      const rollNumber = data.rollNumber || (data.email?.split("@")[0] || "");
      const calculatedBatch = this.calculateBatchFromRoll(rollNumber);

      this.setState({
        loading: false,
        hasSubmitted: !!data.department,
        defaultName: data.name || data.username || "",
        defaultRoll: rollNumber,
        department: data.department || "",
        batch: calculatedBatch, // ✅ prefilled batch
        bloodGroup: data.bloodGroup || "",
        portfolio: data.portfolio || "",
        percentage: data.percentage || "",
        selectedSkills: data.skills || [],
        photoPath: data.photoPath || "",
        editing: this.props.startEditing || !data.department,
      });
    } catch (err) {
      console.error("Error loading profile:", err);
      this.setState({ loading: false });
    }

    document.addEventListener("click", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  }

  toggleSkillsDropdown = () => {
    if (this.state.editing)
      this.setState((prev) => ({ isSkillsDropdownOpen: !prev.isSkillsDropdownOpen }));
  };

  handleClickOutside = (event) => {
    if (this.skillsRef && !this.skillsRef.current.contains(event.target)) {
      this.setState({ isSkillsDropdownOpen: false });
    }
  };

  handleSkillCheckboxChange = (skill) => {
    if (!this.state.editing) return;
    this.setState((prev) => {
      const exists = prev.selectedSkills.includes(skill);
      const updated = exists
        ? prev.selectedSkills.filter((s) => s !== skill)
        : [...prev.selectedSkills, skill];

      return {
        selectedSkills: updated,
        showSkillsError: updated.length === 0,
        showOtherSkillError: updated.includes("Other")
          ? prev.showOtherSkillError
          : false,
      };
    });
  };

  handleRemoveSkill = (skill) => {
    if (!this.state.editing) return;
    this.setState((prev) => {
      const updated = prev.selectedSkills.filter((s) => s !== skill);
      return {
        selectedSkills: updated,
        showSkillsError: updated.length === 0,
        showOtherSkillError: updated.includes("Other")
          ? prev.showOtherSkillError
          : false,
      };
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    // Validate skills
    const noSkills = this.state.selectedSkills.length === 0;
    const needsOther =
      this.state.selectedSkills.includes("Other") &&
      !this.state.otherSkill.trim();

    if (noSkills || needsOther) {
      this.setState({
        showSkillsError: noSkills,
        showOtherSkillError: needsOther,
        isSkillsDropdownOpen: true,
      });
      return;
    }

    const fd = new FormData(e.target);

    fd.set("name", this.state.defaultName);
    fd.set("rno", this.state.defaultRoll);
    fd.set("batch", this.state.batch); // ✅ include auto-calculated batch

    const finalBloodGroup =
      this.state.bloodGroup === "Other" ? this.state.otherBloodGroup : this.state.bloodGroup;
    const finalDepartment =
      this.state.department === "Other" ? this.state.otherDepartment : this.state.department;

    let finalSkills = [...this.state.selectedSkills];
    if (finalSkills.includes("Other") && this.state.otherSkill) {
      finalSkills.splice(finalSkills.indexOf("Other"), 1, this.state.otherSkill);
    }

    fd.set("bloodGroup", finalBloodGroup);
    fd.set("dept", finalDepartment);
    fd.set("skills", JSON.stringify(finalSkills));

    try {
      const res = await fetch("http://localhost:5000/api/students", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      alert("Profile saved successfully!");
      this.setState({
        editing: false,
        hasSubmitted: true,
        isSkillsDropdownOpen: false,
        showSkillsError: false,
        showOtherSkillError: false,
      });

      if (this.props.onSaved) this.props.onSaved();
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }
  };

  render() {
    if (this.state.loading) return <p>Loading student profile...</p>;

    const {
      defaultName,
      defaultRoll,
      department,
      batch,
      bloodGroup,
      portfolio,
      percentage,
      selectedSkills,
      availableSkills,
      isSkillsDropdownOpen,
      otherDepartment,
      otherBloodGroup,
      otherSkill,
      editing,
      hasSubmitted,
      photoPath,
      skillsSearch,
      showSkillsError,
      showOtherSkillError,
    } = this.state;

    const disabled = hasSubmitted && !editing;

    const departments = ["CIVIL","EEE","MECH","ECE","CSE","CSE-AI","CSE-DS","MBA","Other"];
    const bloodGroups = ["A+","A-","B+","B-","O+","O-","AB+","AB-","Other"];

    const filteredSkills = availableSkills.filter((skill) =>
      skill.toLowerCase().includes(skillsSearch.toLowerCase())
    );

    return (
      <div className="form-container shadow-sm" style={{ margin: "0 auto" }}>
        <h2 className="mb-3 text-center">Student Information</h2>

        {hasSubmitted && !editing && (
          <button
            className="btn btn-secondary mb-3"
            onClick={() => this.setState({ editing: true })}
          >
            Edit Profile
          </button>
        )}

        <form onSubmit={this.handleSubmit} encType="multipart/form-data">
          {/* Name & Roll */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label>Name:</label>
              <input type="text" className="form-control" value={defaultName} disabled readOnly />
              <input type="hidden" name="name" value={defaultName} />
            </div>

            <div className="col-md-6 mb-3">
              <label>Roll Number:</label>
              <input type="text" className="form-control" value={defaultRoll} disabled readOnly />
              <input type="hidden" name="rno" value={defaultRoll} />
            </div>
          </div>

          {/* Department & Batch */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label>Department:</label>
              <select
                id="dept"
                name="dept"
                className="form-select"
                required
                disabled={disabled}
                value={department}
                onChange={(e) => this.setState({ department: e.target.value })}
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {department === "Other" && (
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Enter your department"
                  value={otherDepartment}
                  onChange={(e) => this.setState({ otherDepartment: e.target.value })}
                  required={editing}
                  disabled={disabled}
                />
              )}
            </div>

            {/* ✅ Auto-filled Batch */}
            <div className="col-md-6 mb-3">
              <label>Batch:</label>
              <input
                type="text"
                id="batch"
                name="batch"
                className="form-control"
                value={batch}
                readOnly
                disabled
              />
            </div>
          </div>

          {/* Blood Group */}
          <div className="mb-3">
            <label>Blood Group:</label>
            <select
              id="BloodGroup"
              name="BloodGroup"
              className="form-select"
              required
              disabled={disabled}
              value={bloodGroup}
              onChange={(e) => this.setState({ bloodGroup: e.target.value })}
            >
              <option value="">-- Select Blood Group --</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
            {bloodGroup === "Other" && (
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Enter your blood group"
                value={otherBloodGroup}
                onChange={(e) => this.setState({ otherBloodGroup: e.target.value })}
                required={editing}
                disabled={disabled}
              />
            )}
          </div>

          {/* Portfolio */}
          <div className="mb-3">
            <label>Portfolio:</label>
            <input
              type="url"
              id="portfolio"
              name="portfolio"
              className="form-control"
              placeholder="Enter portfolio link"
              disabled={disabled}
              value={portfolio}
              onChange={(e) => this.setState({ portfolio: e.target.value })}
              required
            />
          </div>

          {/* Skills */}
      {/* Skills */}
<div className="mb-3" ref={this.skillsRef} style={{ position: "relative" }}>
  <label>
    Skills: <span style={{ color: "red" }}>*</span>
  </label>

  {/* Selected skills box */}
  <div
    className={`form-control skills-box ${editing && showSkillsError ? "is-invalid" : ""}`}
    onClick={() => this.toggleSkillsDropdown(true)} // ✅ always open on click
  >
    {selectedSkills.length === 0 && (
      <span className="text-muted">Select skills...</span>
    )}
    {selectedSkills.map((skill) => (
      <span key={skill} className="skill-tag">
        {skill}
        {!disabled && (
          <span
            className="remove-skill"
            onClick={(e) => {
              e.stopPropagation();
              this.handleRemoveSkill(skill);
            }}
          >
            ×
          </span>
        )}
      </span>
    ))}
  </div>

  {/* Show validation error */}
  {editing && showSkillsError && (
    <div className="invalid-feedback" style={{ display: "block" }}>
      Please select at least one skill.
    </div>
  )}

  {/* Dropdown */}
  {isSkillsDropdownOpen && !disabled && (
    <div className="skills-dropdown">
      <input
        type="text"
        placeholder="Search skills..."
        value={skillsSearch}
        onChange={(e) => this.setState({ skillsSearch: e.target.value })}
        onClick={(e) => e.stopPropagation()} // ✅ don’t close dropdown while typing
      />

      {(() => {
        const search = skillsSearch.trim().toLowerCase();
        const refinedSkills = availableSkills.filter((skill) => {
          if (!search) return true; // show all if no search
          if (skill.length <= 2) {
            // 🔑 exact match for very short skills like "C", "R", "Go"
            return skill.toLowerCase() === search;
          }
          return skill.toLowerCase().includes(search);
        });

        return refinedSkills.length === 0 ? (
          <p className="text-muted px-2">No skills found</p>
        ) : (
          refinedSkills.map((skill) => (
            <label key={skill} className="skill-option">
              <input
                type="checkbox"
                checked={selectedSkills.includes(skill)}
                onChange={() => this.handleSkillCheckboxChange(skill)}
              />
              <span>{skill}</span>
            </label>
          ))
        );
      })()}
    </div>
  )}

  {/* Other skill input */}
  {selectedSkills.includes("Other") && !disabled && (
    <>
      <input
        type="text"
        className={`form-control mt-2 ${editing && showOtherSkillError ? "is-invalid" : ""}`}
        placeholder="Enter other skill"
        value={otherSkill}
        onChange={(e) =>
          this.setState({
            otherSkill: e.target.value,
            showOtherSkillError: false,
          })
        }
      />
      {editing && showOtherSkillError && (
        <div className="invalid-feedback" style={{ display: "block" }}>
          Please enter the other skill.
        </div>
      )}
    </>
  )}
</div>


          {/* Percentage */}
          <div className="mb-3">
            <label>
              Percentage: <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="number"
              id="percentage"
              name="percentage"
              className="form-control"
              placeholder="Enter percentage"
              step="0.01"
              min="50"
              max="100"
              disabled={disabled}
              value={percentage}
              onChange={(e) => this.setState({ percentage: e.target.value })}
              required
            />
            <div className="form-text">Allowed range: 50 to 100.</div>
          </div>

          {/* Photo */}
          <div className="mb-4">
            <label>Photo:</label>
            {photoPath && !editing && (
              <div className="mb-2">
                <img
                  src={`http://localhost:5000/${photoPath}`}
                  alt="Profile"
                  style={{ maxWidth: "120px", borderRadius: "8px" }}
                />
              </div>
            )}
            {(!hasSubmitted || editing) && (
              <input
                type="file"
                id="photo"
                name="photo"
                accept=".jpeg,.jpg,.png"
                className="form-control"
                required={!hasSubmitted}
                disabled={disabled}
              />
            )}
          </div>

        {!disabled && (
  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
    <button type="submit" className="btn btn-primary w-50">
      Save
    </button>
   
  </div>
)}

        </form>
      </div>
    );
  }
}
