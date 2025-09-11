import React, { useState, useEffect } from "react";
import "./Cardspagination.css";

export default function CardsPagination({ filters }) {
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cardsPerPage = 12;

  // ✅ Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const queryParams = { page: currentPage, limit: cardsPerPage };

        if (filters.rollNumber) queryParams.rollNumber = filters.rollNumber;
        if (filters.percentage && Number(filters.percentage) >= 50)
          queryParams.percentage = Number(filters.percentage);
        if (filters.department) queryParams.department = filters.department;
        if (filters.year) queryParams.year = filters.year;

        // ✅ Merge normal + other skills into one "skills" param
        let allSkills = [];
        if (filters.skills && filters.skills.length > 0) {
          allSkills = [...filters.skills];
        }
        if (filters.otherSkill && filters.otherSkill.trim() !== "") {
          allSkills.push(filters.otherSkill.trim());
        }
        if (allSkills.length > 0) {
          queryParams.skills = allSkills.join(",");
        }

        const query = new URLSearchParams(queryParams).toString();
        const res = await fetch(`http://localhost:5000/api/students?${query}`);
        const data = await res.json();

        setStudents(data.students || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchStudents();
  }, [filters, currentPage]);

  return (
    <div className="container">
      {/* Cards Grid */}
      <div className="cards-list">
        {students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          students.map(
            ({ _id, photoPath, name, percentage, portfolio, department }) => (
              <div key={_id} className="card">
                {/* Avatar */}
                <div className="card-avatar">
                  {photoPath ? (
                    <img
                      src={`http://localhost:5000/${photoPath.replace("\\", "/")}`}
                      alt={name}
                      className="card-photo"
                    />
                  ) : (
                    <span className="avatar-text">
                      {name?.split(" ").map((n) => n[0]).join("")}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="card-info">
                  <h3 className="student-name">{name}</h3>
                  <p className="student-dept">Department: {department}</p>
                  <p className="student-percentage">Percentage: {percentage}%</p>
                </div>

                {/* Footer */}
                <div className="card-footer">
                  {portfolio && (
                    <a
                      href={portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="card-link"
                    >
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
