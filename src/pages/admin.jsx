import React, { useEffect, useState, useRef, useMemo } from "react";
import Header from "../components/header";
import { useNavigate } from "react-router-dom";
import "../images/css/admin.css";
import LoadingOverlay from "../components/overlay";
import { fetchWithAuth, API_ENDPOINTS, getAuthToken } from "../config/api";
import API_BASE_URL from "../config/api";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("lsts-section");
  const [prayers, setPrayers] = useState([]);
  const [lsts, setLsts] = useState([]);
  const [summits, setSummits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [assignStatus, setAssignStatus] = useState("");
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [assigningAdmin, setAssigningAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Checking admin status...");
  const [exporting, setExporting] = useState(false);
  const [exportingText, setExportingText] = useState("");


  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Sunday");
  const [uploadSpeaker, setUploadSpeaker] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [showAllLsts, setShowAllLsts] = useState(false);
  const [weeklyLstsData, setWeeklyLstsData] = useState([]);

  const prayersRef = useRef(null);
  const lstsRef = useRef(null);
  const summitsRef = useRef(null);
  const navigate = useNavigate();

  const getToken = () => {
    const t = getAuthToken();
    if (!t) {
      setError("You must be logged in to view admin data.");
      return null;
    }
    return t;
  };

  useEffect(() => {
    const checkAdmin = async () => {
      setCheckingAdmin(true);
      setStatusMessage("🔍 Confirming admin status...");
      try {
        const token = getToken();
        if (!token) throw new Error("Not logged in");
        const res = await fetchWithAuth(API_ENDPOINTS.CHECK_ADMIN);
        const data = await res.json();

        if (data.isAdmin || data.is_admin) {
          setIsAdmin(true);
          setStatusMessage("✅ Admin confirmed! Loading dashboard...");
          setTimeout(() => {
            setCheckingAdmin(false);
          }, 4000);
        } else {
          setIsAdmin(false);
          setStatusMessage("❌ You are not an admin. Redirecting to dashboard...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
        setStatusMessage("❌ Admin check failed. Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const [prayersRes, lstsRes, weeklyLstsRes, summitsRes] = await Promise.all([
          fetchWithAuth(API_ENDPOINTS.GET_PRAYERS),
          fetchWithAuth(API_ENDPOINTS.GET_LSTS),
          fetchWithAuth(API_ENDPOINTS.GET_LSTS_WEEKLY),
          fetchWithAuth(API_ENDPOINTS.GET_SUMMIT),
        ]);
        
        const prayerData = await prayersRes.json();
        const lstsData = await lstsRes.json();
        const weeklyLstsDataRes = await weeklyLstsRes.json();
        const summitsData = await summitsRes.json();
        
        setPrayers(Array.isArray(prayerData.data || prayerData) ? (prayerData.data || prayerData) : []);
        setLsts(
          Array.isArray(lstsData.registrations || lstsData.data || lstsData)
            ? (lstsData.registrations || lstsData.data || lstsData).sort((a, b) => {
                const da = new Date(a.submitted_at || a.submittedAt || a.submissionDate || a.createdAt || a.date);
                const db = new Date(b.submitted_at || b.submittedAt || b.submissionDate || b.createdAt || b.date);
                return da - db;
              })
            : []
          );
        setWeeklyLstsData(
          Array.isArray(weeklyLstsDataRes.registrations || weeklyLstsDataRes.data || weeklyLstsDataRes)
            ? (weeklyLstsDataRes.registrations || weeklyLstsDataRes.data || weeklyLstsDataRes)
            : []
        );

        setSummits(Array.isArray(summitsData.data || summitsData) ? (summitsData.data || summitsData) : []);
      } catch (err) {
        console.error("Admin fetch error:", err);
        setError(err?.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin && !checkingAdmin) loadAll();
  }, [isAdmin, checkingAdmin]);

  const getWeekRangeForDate = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const day = d.getDay(); 

    const diffToMonday = (day + 6) % 7; 
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);

    if (day === 6 || day === 0) {
      monday.setDate(monday.getDate() - 7);
    }

    monday.setHours(0, 0, 0, 0);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    return { monday, friday };
  };

  const weekOrdinal = (date) => {
    const d = new Date(date);
    const weekNum = Math.ceil(d.getDate() / 7);
    const suffix = (n) => {
      if (n % 10 === 1 && n % 100 !== 11) return "st";
      if (n % 10 === 2 && n % 100 !== 12) return "nd";
      if (n % 10 === 3 && n % 100 !== 13) return "rd";
      return "th";
    };
    return `${weekNum}${suffix(weekNum)}`;
  };

  const getWeekLabel = () => {
    const { monday } = getWeekRangeForDate(new Date());
    const monthName = monday.toLocaleString("default", { month: "long" });
    const year = monday.getFullYear();
    const ordinal = weekOrdinal(monday);
    return `LSTS registrations for the ${ordinal} week of ${monthName} ${year}`;
  };

  const weeklyLsts = useMemo(() => {
  if (!Array.isArray(lsts) || lsts.length === 0) return [];
  const { monday, friday } = getWeekRangeForDate(new Date());

  return lsts
    .filter((item) => {
      const dateStr =
        item.submittedAt ||
        item.submittedOn ||
        item.date ||
        item.createdAt ||
        item.submissionDate;

      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d >= monday && d <= friday;
    })
    .sort((a, b) => new Date(a.submittedAt || a.submittedOn || a.date || a.createdAt || a.submissionDate) -
                    new Date(b.submittedAt || b.submittedOn || b.date || b.createdAt || b.submissionDate));
}, [lsts]);

  
const getWeekLabelForDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return "Unknown Week";

  const weekNum = Math.ceil(d.getDate() / 7);
  const ordinal = weekOrdinal(d);
  const monthName = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();

  return `${ordinal} week of ${monthName} ${year}`;
};

  
const lstsGroupedByWeek = useMemo(() => {
  const groups = {};

  lsts.forEach(item => {
    const dateStr =
      item.submitted_at ||
      item.submittedAt ||
      item.submittedOn ||
      item.date ||
      item.createdAt ||
      item.created_at ||
      item.submissionDate;

    if (!dateStr) return;

    const label = getWeekLabelForDate(dateStr);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  });

  Object.keys(groups).forEach(label => {
    groups[label].sort((a, b) =>
      new Date(a.submitted_at || a.submittedAt) - new Date(b.submitted_at || b.submittedAt)
    );
  });

  return groups;
}, [lsts]);


 const handleUpload = (e) => {
  e.preventDefault();
  setUploadStatus("");
  setUploadProgress(0);

  const token = getToken();
  if (!token) {
    setUploadStatus("❌ Not logged in.");
    return;
  }

  if (!uploadTitle || !uploadCategory || !uploadDate || !uploadFile) {
    setUploadStatus("❌ Please fill all fields and select a file.");
    return;
   }
   setUploadStatus("🚀 Starting upload...");

  const fd = new FormData();
  fd.append("title", uploadTitle.trim());
  fd.append("speaker", uploadSpeaker.trim());
  fd.append("category", uploadCategory);
  fd.append("date", uploadDate);
  fd.append("file", uploadFile);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_MESSAGE}`, true);
   xhr.setRequestHeader("Authorization", `Bearer ${token}`);
   
  xhr.upload.onprogress = (evt) => {
    if (evt.lengthComputable) {
      const percent = Math.round((evt.loaded / evt.total) * 100);
      setUploadProgress(percent);
      setUploadStatus(`🔄 Uploading: ${percent}%`);
    } else {
      setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      setUploadStatus("✅ Upload successful!");
      setUploadProgress(100);

      setTimeout(() => {
        setUploadTitle("");
        setUploadCategory("Sunday");
        setUploadDate("");
        setUploadFile(null);
        setUploadProgress(0);
      }, 1500);
    } else {
      setUploadStatus("❌ Upload failed.");
    }
  };

  xhr.onerror = () => setUploadStatus("❌ Upload failed. Please try again.");

  xhr.send(fd);
};

  const handleAssignAdmin = async (e) => {
  e.preventDefault();

  setAssignStatus("");
  const token = getToken();
  if (!token) {
    setAssignStatus("❌ Not logged in.");
    return;
  }

  if (!adminEmail?.trim()) {
    setAssignStatus("❌ Provide an email.");
    return;
  }

  setAssigningAdmin(true);

  try {
    const res = await fetchWithAuth(API_ENDPOINTS.ASSIGN_ADMIN, {
      method: "POST",
      body: JSON.stringify({ email: adminEmail.trim() }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(body || `Request failed (${res.status})`);
    }

    setAssignStatus("✅ Admin assigned successfully!");
    setAdminEmail("");
  } catch (err) {
    console.error("Assign admin error:", err);
    setAssignStatus("❌ " + (err?.message || "Failed"));
  } finally {
    setAssigningAdmin(false);
  }
};


  const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) return resolve(window.html2pdf);
      const existing = document.querySelector('script[data-html2pdf="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.html2pdf));
        existing.addEventListener("error", () => reject(new Error("html2pdf failed to load")));
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js";
      s.async = true;
      s.setAttribute("data-html2pdf", "true");
      s.onload = () => resolve(window.html2pdf);
      s.onerror = () => reject(new Error("html2pdf failed to load"));
      document.body.appendChild(s);
    });
  };



const sanitizeLstsForExport = (arr) => {
  return arr.map(item => ({
    Name: `${item.title || ''} ${item.surname || ''} ${item.other_names || item.otherNames || ''}`.trim(),
    Phone: item.phone_number || item.phoneNumber,
    Email: item.email,
    Address: item.residential_address || item.residentialAddress,
    Gender: item.gender,
    Department: Array.isArray(item.department_in_church) 
      ? item.department_in_church.join(", ") 
      : (item.department_in_church || item.departmentInChurch || item.department),
    Position: item.position_in_church || item.positionInChurch || item.position,
    Baptized: item.is_baptized !== undefined ? (item.is_baptized ? "Yes" : "No") : item.baptized,
    Student: item.is_student !== undefined ? (item.is_student ? "Yes" : "No") : (item.student || item.isStudent),
    School_Department: item.department_in_school || item.departmentInSchool || '',
    Level: item.level || '',
    Vision: item.vision_goals || item.vision || '',
    Submitted_At: item.submitted_at 
      ? new Date(item.submitted_at).toLocaleString() 
      : (item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "")
  }));
  };
  
const createExportHtml = (dataArray) => {
  const wrapper = document.createElement("div");
  wrapper.style.padding = "20px";
  wrapper.innerHTML = dataArray
    .map((p, i) => `
      <div class="admin-card" style="margin-bottom: 15px; text-align: center;">
        <h4>#${i + 1}</h4>

        <p><strong>Name:</strong> ${p.Name}</p>
        <p><strong>Phone:</strong> ${p.Phone}</p>
        <p><strong>Email:</strong> ${p.Email}</p>
        <p><strong>Address:</strong> ${p.Address}</p>
        <p><strong>Gender:</strong> ${p.Gender}</p>
        <p><strong>Department:</strong> ${p.Department}</p>
        <p><strong>Position:</strong> ${p.Position}</p>
        <p><strong>Baptized:</strong> ${p.Baptized}</p>
        <p><strong>Student:</strong> ${p.Student}</p>
        ${p.Student === 'Yes' ? `
          <p><strong>School Department:</strong> ${p.School_Department}</p>
          <p><strong>Level:</strong> ${p.Level}</p>
        ` : ''}
        <p><strong>Vision:</strong> ${p.Vision}</p>
        <p><strong>Submitted:</strong> ${p.Submitted_At}</p>
      </div>
    `)
    .join("");
  document.querySelectorAll("link[rel='stylesheet'], style").forEach((el) => {
    wrapper.appendChild(el.cloneNode(true));
  });

  return wrapper;
};




const downloadSectionAsPDF = async (sectionRef, defaultFilename) => {
  if (!sectionRef?.current) return alert("Nothing to export");
  setExporting(true);
  setExportingText("Generating PDF...");

  try {
    const html2pdf = await loadHtml2Pdf();

    await html2pdf()
      .from(sectionRef.current)
      .set({
        margin: 10,
        filename: `${defaultFilename}_${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .save();

  } catch (err) {
    console.warn("html2pdf failed, falling back to CSV:", err);

    setExportingText("PDF failed — exporting CSV...");

    if (sectionRef.current === prayersRef.current)
      downloadDataAsCSV(prayers, defaultFilename);
    else if (sectionRef.current === lstsRef.current)
      downloadDataAsCSV(lsts, defaultFilename);
    else if (sectionRef.current === summitsRef.current)
      downloadDataAsCSV(summits, defaultFilename);

  } finally {
    setTimeout(() => {
      setExporting(false);
      setExportingText("");
    }, 600);
  }
};


const downloadDataAsCSV = (dataArray, baseFilename = "export") => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    alert("No data to download");
    return;
  }

  setExporting(true);
  setExportingText("Exporting CSV...");

  try {
    const keys = Array.from(
      dataArray.reduce((set, item) => {
        Object.keys(item || {}).forEach((k) => set.add(k));
        return set;
      }, new Set())
    );

    const csvRows = [keys.join(",")];

    dataArray.forEach((row) => {
      const values = keys.map((k) => {
        const val = row[k] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseFilename}_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

  } finally {
    setTimeout(() => {
      setExporting(false);
      setExportingText("");
    }, 600);
  }
}; 

  const renderSection = () => {
    switch (activeTab) {
      case "prayer-section":
        return (
          <section id="prayer-section" className="admin-section">
            <h2>Prayer Requests</h2>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }}>
              <button
                className="download-btn"
                onClick={() => downloadSectionAsPDF(prayersRef, "Prayer_Requests")}
              >
                Download Prayer Requests PDF
              </button>
              <button
                className="download-btn"
                onClick={() => downloadDataAsCSV(prayers, "Prayer_Requests")}
              >
                Download CSV
              </button>
            </div>

            <div id="prayer-requests" className="admin-grid" ref={prayersRef}>
              {loading ? (
                <p>Loading...</p>
              ) : prayers.length > 0 ? (
                prayers.map((req, i) => (
                  <div className="admin-card" key={i}>
                    <h4 style={{ marginBottom: '6px' }}>#{i + 1}</h4>
                    <p><strong>Name:</strong> {req.name ?? "N/A"} </p>
                    <p><strong>Message:</strong> {req.prayerRequest ?? req.request ?? ""}</p>
                    <p><strong>Submitted At:</strong> {req.submittedAt ? new Date(req.submittedAt).toLocaleString() : "N/A"}</p>
                  </div>
                ))
              ) : (
                <p className="error">No prayer requests available.</p>
              )}
            </div>
          </section>
        );

      case "lsts-section": {
        const displayed = showAllLsts ? lsts : weeklyLstsData;
        return (
          <section id="lsts-section" className="admin-section" style={{ position: 'relative' }}>
            <h3 style={{ textTransform: 'capitalize' }}>{showAllLsts ? 'All LSTS registrations' : getWeekLabel()}</h3>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 8 }}>

              <button
                className="download-btn"
                onClick={() => {
                  const safe = sanitizeLstsForExport(showAllLsts ? lsts : weeklyLstsData);
                  const temp = createExportHtml(safe);
                  downloadSectionAsPDF({ current: temp }, showAllLsts ? "All_LSTS_Registrations" : "LSTS_Registrations");
                }}

              >
                {showAllLsts ? "Download All LSTS Registrations PDF" : "Download LSTS Registrations PDF For This Week"}
              </button>
              <button
                className="download-btn"
                onClick={() =>
                  downloadDataAsCSV(
                    sanitizeLstsForExport(showAllLsts ? lsts : weeklyLstsData),
                    showAllLsts ? "All_LSTS_Registrations" : "LSTS_Registrations"
                  )
                }
              >
          Download CSV
        </button>

             </div>
            
    {showAllLsts ? (
  Object.entries(lstsGroupedByWeek).map(([week, items], idx) => (
    <div key={idx} style={{ marginBottom: "30px" }}>
      <h3>{week}</h3>
      <div className="admin-grid">
        {items.map((person, i) => (
          <div className="admin-card" key={i}>
            <h4>#{i + 1}</h4>
            <p><strong>Title:</strong> {person.title}</p>
                    <p><strong>Surname:</strong> {person.surname}</p>
                    <p><strong>Other Names:</strong> {person.other_names ?? person.otherNames}</p>
                    <p><strong>Phone:</strong> {person.phone_number ?? person.phoneNumber}</p>
                    <p><strong>Email:</strong> {person.email}</p>
                    <p><strong>Address:</strong> {person.residential_address ?? person.residentialAddress}</p>
                    <p><strong>Gender:</strong> {person.gender}</p>
                    <p><strong>Department:</strong> {Array.isArray(person.department_in_church) ? person.department_in_church.join(", ") : (person.department_in_church ?? person.departmentInChurch ?? person.department)}</p>
                    <p><strong>Position:</strong> {person.position_in_church ?? person.positionInChurch ?? person.position}</p>
                    <p><strong>Baptized:</strong> {person.is_baptized !== undefined ? (person.is_baptized ? "Yes" : "No") : (person.baptized)}</p>
                    <p><strong>Vision:</strong> {person.vision_goals ?? person.vision}</p>
                    <p><strong>Is Student:</strong> {person.is_student !== undefined ? (person.is_student ? "Yes" : "No") : (person.student ?? person.isStudent)}</p>
                    {(person.is_student || String(person.student ?? person.isStudent ?? "").toLowerCase() === "yes") && (
                      <>
                        <p><strong>Dept. in School:</strong> {person.department_in_school ?? person.departmentInSchool}</p>
                        <p><strong>Level:</strong> {person.level}</p>
                      </>
                    )}
                    <p><strong>Submitted At:</strong> {person.submitted_at ? new Date(person.submitted_at).toLocaleString() : (person.submittedAt ? new Date(person.submittedAt).toLocaleString() : "N/A")}</p>
          </div>
        ))}
      </div>
    </div>
  ))
) : (
  <div id="lsts-registrations" className="admin-grid" ref={lstsRef}>
    {loading ? (
      <p>Loading...</p>
    ) : weeklyLstsData.length > 0 ? (
      weeklyLstsData.map((person, i) => (
        <div className="admin-card" key={i}>
          <h4>#{i + 1}</h4>
           <p><strong>Title:</strong> {person.title}</p>
                    <p><strong>Surname:</strong> {person.surname}</p>
                    <p><strong>Other Names:</strong> {person.other_names ?? person.otherNames}</p>
                    <p><strong>Phone:</strong> {person.phone_number ?? person.phoneNumber}</p>
                    <p><strong>Email:</strong> {person.email}</p>
                    <p><strong>Address:</strong> {person.residential_address ?? person.residentialAddress}</p>
                    <p><strong>Gender:</strong> {person.gender}</p>
                    <p><strong>Department:</strong> {Array.isArray(person.department_in_church) ? person.department_in_church.join(", ") : (person.department_in_church ?? person.departmentInChurch ?? person.department)}</p>
                    <p><strong>Position:</strong> {person.position_in_church ?? person.positionInChurch ?? person.position}</p>
                    <p><strong>Baptized:</strong> {person.is_baptized !== undefined ? (person.is_baptized ? "Yes" : "No") : (person.baptized)}</p>
                    <p><strong>Vision:</strong> {person.vision_goals ?? person.vision}</p>
                    <p><strong>Is Student:</strong> {person.is_student !== undefined ? (person.is_student ? "Yes" : "No") : (person.student ?? person.isStudent)}</p>
                    {(person.is_student || String(person.student ?? person.isStudent ?? "").toLowerCase() === "yes") && (
                      <>
                        <p><strong>Dept. in School:</strong> {person.department_in_school ?? person.departmentInSchool}</p>
                        <p><strong>Level:</strong> {person.level}</p>
                      </>
                    )}
                    <p><strong>Submitted At:</strong> {person.submitted_at ? new Date(person.submitted_at).toLocaleString() : (person.submittedAt ? new Date(person.submittedAt).toLocaleString() : "N/A")}</p>
                  </div>
                ))
              ) : (
                <p className="error">No weekly records available.</p>
              )}
            </div>
          )}

            <div>
               {!showAllLsts && (
                <button className="download-btn" onClick={() => {
                  setShowAllLsts(true)
                   window.scrollTo({ top: 0, behavior: "smooth" });
                }}>
                  Click to view and download all lsts registrations
                </button>
              )}

                {showAllLsts && (
              <button
                className="return-weekly-btn"
                onClick={() => {
                  setShowAllLsts(false) 
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title="Return to weekly registrations"
              >
                Return to weekly registrations
              </button>
            )}
            </div>
          </section>
        );
      }

      case "message-section":
        return (
          <section id="messages-section" className="admin-section">
            <div id="message-section">
              <h2>Upload Message</h2>
              <form id="upload-form" onSubmit={handleUpload} encType="multipart/form-data">
                <label htmlFor="title">Title:</label>
                 <input
                    type="text"
                    id="title"
                    name="title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                  />

                <label htmlFor="speaker">Speaker:</label>
                  <input
                    type="text"
                    id="speaker"
                    name="speaker"
                    value={uploadSpeaker}
                    onChange={(e) => setUploadSpeaker(e.target.value)}
                    required
                  />

                
                <label htmlFor="category">Category:</label>
                  <select
                    id="category"
                    name="category"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    required
                  >
                    <option value="Sunday">Sunday Service</option>
                    <option value="Midweek">Midweek Service</option>
                    <option value="Friday">Friday Service</option>
                  </select>

                <label htmlFor="date">Date:</label>
                 <input
                    type="date"
                    id="date"
                    name="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    required
                />
                
                  <input
                    type="file"
                    id="audioFileInput"
                    accept="audio/*"
                    onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  />

                <button id="submitBtn" type="submit">Upload</button>
              </form>

              <div id="upload-status" className={uploadStatus?.startsWith("✅") ? "status-success" : uploadStatus?.startsWith("❌") ? "status-error" : ""}>
                {uploadStatus}
              </div>
            </div>
          </section>
        );

      case "invites-section":
        return (
          <section id="invites-section" className="admin-section">
            <h2>Summit Records</h2>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }}>
              <button className="download-btn" onClick={() => downloadSectionAsPDF(summitsRef, "Summit_Records")}>Download Summits PDF</button>
              <button className="download-btn" onClick={() => downloadDataAsCSV(summits, "Summit_Records")}>Download CSV</button>
            </div>

            <div id="invites-container" className="admin-grid" ref={summitsRef}>
              {loading ? (
                <p>Loading...</p>
              ) : summits.length > 0 ? (
                summits.map((s, i) => (
                  <div className="admin-card" key={i}>
                    <h4 style={{ marginBottom: '6px' }}>#{i + 1}</h4>
                    <p><strong>Title:</strong> {s.title}</p>
                    <p><strong>Surname:</strong> {s.surname}</p>
                    <p><strong>Other Names:</strong> {s.otherNames}</p>
                    <p><strong>Phone:</strong> {s.phoneNumber}</p>
                    <p><strong>Email:</strong> {s.email}</p>
                    <p><strong>Address:</strong> {s.residentialAddress}</p>
                    <p><strong>Gender:</strong> {s.gender}</p>
                    <p><strong>Department:</strong> {s.departmentInChurch ?? s.department}</p>
                    <p><strong>Position:</strong> {s.positionInChurch ?? s.position}</p>
                    <p><strong>Baptised:</strong> {s.baptized}</p>
                    <p><strong>Vision:</strong> {s.vision}</p>
                    <p><strong>Is Student:</strong> {s.student}</p>
                    {String(s.student ?? "").toLowerCase() === "yes" && (
                      <>
                        <p><strong>Dept. in School:</strong> {s.departmentInSchool}</p>
                        <p><strong>Level:</strong> {s.level}</p>
                      </>
                    )}
                    <p><strong>Submitted At:</strong> {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "N/A"}</p>
                  </div>
                ))
              ) : (
                <p className="error">No Summit records available.</p>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      {checkingAdmin && (
        <LoadingOverlay isLoading={true} text={statusMessage} />
      )}
      {assigningAdmin && (
        <LoadingOverlay isLoading={true} text="Assigning admin..." />
      )}

      {exporting && (
        <LoadingOverlay isLoading={true} text={exportingText || "Exporting..."} />
      )}


      <main
        className="admin-main"
        style={{ opacity: checkingAdmin || loading ? 0.5 : 1 }}
      >
        {error && <p className="error">{error}</p>}
        {isAdmin && !checkingAdmin && (
          <>
            <div
              id="message-container"
              style={{ padding: "10px", color: "black", textAlign: "center" }}
            >
              <h1 className="admin-title">Welcome to admin dashboard</h1>
            </div>

            <div className="admin-button-group">
              <button
                className="admin-tab-btn"
                onClick={() => setActiveTab("lsts-section")}
              >
                LSTS
              </button>
              <button
                className="admin-tab-btn"
                onClick={() => setActiveTab("prayer-section")}
              >
                Prayers
              </button>
              <button
                className="admin-tab-btn"
                onClick={() => setActiveTab("message-section")}
              >
                Upload Messages
              </button>
              <button
                className="admin-tab-btn"
                onClick={() => setActiveTab("invites-section")}
              >
                Summit
              </button>
            </div>

            {renderSection()}

            <button
              id="assign-admin-btn"
              title="Assign Admin Email"
              onClick={() => setShowAdminModal(true)}
            >
              ✉️
            </button>
          </>
        )}

        {showAdminModal && (
          <div className="modal-overlay" style={{
            position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000,
            background: "rgba(0,0,0,0.5)"
          }}>
            <div style={{ background: "#fff", padding: 20, borderRadius: 8, width: 320 }}>
              
              <h3 style={{fontFamily:"Agu Display"}}>Assign Admin</h3>
              <form onSubmit={handleAssignAdmin}>
                <input
                  type="email"
                  placeholder="Admin email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: 8, marginBottom: 8 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" style={{ flex: 1 }} className="assign-but">
                    Assign
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1 }}
                     onClick={() => {
                      setShowAdminModal(false);
                      setAssignStatus("");
                      setAdminEmail("");

                    }}
                    className="assign-but"
                  >
                    Cancel
                  </button>
                </div>
                {assignStatus && <><p style={{ marginTop: 8 }}>{assignStatus}</p>
                    <div> <button
                      aria-label="Close"
                      className="close"
                      onClick={() => {
                        setShowAdminModal(false);
                        setAssignStatus("");
                        setAdminEmail("");

                      }}
                    >
                      Close
                        </button>
                      </div>
                      </>}
                    </form>
                  </div>
          </div>
        )}
      </main>
    </>
  );
}
