import { useState } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import useIsMobile from "../../hooks/useIsMobile";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SCHEDULE = [
  {
    day: 1,
    subject: "Accountancy",
    time: "10:00 AM",
    link: "https://meet.google.com/abc-def-ghi",
    type: "Google Meet",
  },
  {
    day: 3,
    subject: "Business Studies",
    time: "11:30 AM",
    link: "https://zoom.us/j/1234567890",
    type: "Zoom",
  },
  {
    day: 5,
    subject: "Accountancy",
    time: "4:00 PM",
    link: "https://meet.google.com/xyz-uvw-rst",
    type: "Google Meet",
  },
];

const ASSIGNMENTS = [
  { title: "Journal Entry Practice", due: "Feb 25", status: "pending" },
  { title: "Partnership P and L Account", due: "Mar 1", status: "submitted" },
  { title: "Trial Balance Exercise", due: "Mar 5", status: "pending" },
];

const QUIZZES = [
  { title: "Chapter 3 MCQ Quiz", date: "Feb 26", link: "#" },
  { title: "Financial Statements Test", date: "Mar 2", link: "#" },
];

export default function ClassDashboard() {
  const isMobile = useIsMobile(900);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [uploadFile, setUploadFile] = useState(null);
  const [screenLockEnabled, setScreenLockEnabled] = useState(false);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid = [];
  for (let i = 0; i < firstDay; i += 1) grid.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) grid.push(d);

  const getBadge = (d) => {
    const session = SCHEDULE.find((s) => s.day === d);
    return session ? { color: "#3B5BDB" } : null;
  };

  return (
    <DashboardLayout>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 30,
          fontWeight: 900,
          color: "#1a1a2e",
          marginBottom: 6,
        }}
      >
        Class Dashboard
      </h1>
      <p style={{ color: "#888", marginBottom: 32 }}>
        Your schedule, meeting links, assignments, and tests
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <button
              onClick={() => {
                if (month === 0) {
                  setMonth(11);
                  setYear((y) => y - 1);
                } else {
                  setMonth((m) => m - 1);
                }
              }}
              style={navBtn}
            >
              {"<"}
            </button>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>
              {MONTHS[month]} {year}
            </div>
            <button
              onClick={() => {
                if (month === 11) {
                  setMonth(0);
                  setYear((y) => y + 1);
                } else {
                  setMonth((m) => m + 1);
                }
              }}
              style={navBtn}
            >
              {">"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {DAYS.map((d) => (
              <div key={d} style={dayLabelStyle}>
                {d}
              </div>
            ))}

            {grid.map((d, i) => {
              const badge = d ? getBadge(d) : null;
              const isToday =
                d === now.getDate() &&
                month === now.getMonth() &&
                year === now.getFullYear();

              return (
                <div
                  key={`${d ?? "empty"}-${i}`}
                  style={{
                    textAlign: "center",
                    padding: "8px 2px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: d ? 600 : 400,
                    color: isToday ? "#fff" : badge ? badge.color : d ? "#1a1a2e" : "transparent",
                    background: isToday ? "#3B5BDB" : badge ? "#E8EEFF" : "transparent",
                  }}
                >
                  {d ?? ""}
                  {badge && !isToday && (
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: badge.color,
                        margin: "2px auto 0",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          <div style={cardTitleStyle}>Upcoming Classes</div>
          {SCHEDULE.map((s, i) => (
            <div
              key={`${s.subject}-${s.day}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom: i < SCHEDULE.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "#E8EEFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#3B5BDB",
                  flexShrink: 0,
                }}
              >
                {s.type === "Zoom" ? "Z" : "G"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                  {s.subject}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  Day {s.day} · {s.time} · {s.type}
                </div>
              </div>
              <a href={s.link} target="_blank" rel="noreferrer" style={actionChipBlue}>
                Join
              </a>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          <div style={cardTitleStyle}>Assignments</div>
          {ASSIGNMENTS.map((a, i) => (
            <div
              key={a.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 0",
                borderBottom: i < ASSIGNMENTS.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>Due: {a.due}</div>
              </div>

              {a.status === "submitted" ? (
                <div
                  style={{
                    padding: "5px 14px",
                    borderRadius: 20,
                    background: "#E6FCF5",
                    color: "#20C997",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Submitted
                </div>
              ) : (
                <label style={actionChipBlue}>
                  Upload
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => setUploadFile(e.target.files[0])}
                  />
                </label>
              )}
            </div>
          ))}

          {uploadFile && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#20C997", fontWeight: 700 }}>
              {uploadFile.name} ready to submit
            </div>
          )}
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          <div style={cardTitleStyle}>Tests and Quizzes</div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              fontSize: 12,
              color: "#666",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={screenLockEnabled}
              onChange={(e) => setScreenLockEnabled(e.target.checked)}
            />
            Optional screen lock during tests
          </label>
          {screenLockEnabled && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 10px",
                borderRadius: 10,
                background: "#FFF9DB",
                border: "1px solid #ffe38a",
                fontSize: 12,
                color: "#8A5A00",
                fontWeight: 600,
              }}
            >
              Screen lock is enabled for upcoming tests.
            </div>
          )}
          {QUIZZES.map((q, i) => (
            <div
              key={q.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
                borderBottom: i < QUIZZES.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                  {q.title}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>Date: {q.date}</div>
              </div>
              <a href={q.link} style={actionChipCoral}>
                Attempt
              </a>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

const navBtn = {
  background: "#f0f2ff",
  border: "none",
  borderRadius: 10,
  width: 32,
  height: 32,
  cursor: "pointer",
  fontSize: 14,
  color: "#1a1a2e",
};

const dayLabelStyle = {
  textAlign: "center",
  fontSize: 11,
  fontWeight: 700,
  color: "#aaa",
  padding: "4px 0",
  textTransform: "uppercase",
};

const cardTitleStyle = {
  fontWeight: 800,
  fontSize: 16,
  color: "#1a1a2e",
  marginBottom: 18,
};

const actionChipBlue = {
  padding: "8px 16px",
  borderRadius: 20,
  background: "#3B5BDB",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
};

const actionChipCoral = {
  padding: "8px 16px",
  borderRadius: 20,
  background: "#FF6B6B",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  textDecoration: "none",
};
