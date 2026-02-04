import React, { useState, useEffect, useRef } from "react";
import ReactDOMServer from "react-dom/server";
import Header from "../components/header";
import LoadingOverlay from "../components/overlay";
import "../images/css/registerforlsts.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Logo from "/web-app-manifest-512x512.png";
import HeroImg from "../images/lsts-training-lsta1.jpg";
import First from "../images/lsts-training-lsta1.jpg";
import Second from "../images/vision-image-lsts.jpg";
import { FaCalendarAlt, FaBookOpen, FaUsers, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaVenusMars, FaWater, FaChurch, FaBriefcase, FaGraduationCap, FaLightbulb, FaCheckCircle } from "react-icons/fa";
import QRCode from "qrcode";
import  { useToast } from "../components/Toast";
import autoTable from "jspdf-autotable";
import { fetchWithAuth as fetchWithAuthHelper, API_ENDPOINTS, getAuthToken } from "../config/api";

export default function LSTSRegistrationForm() {
  const [Student, setStudentStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [view, setView] = useState("landing");
  const [receiptVerifying, setReceiptVerifying] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);

  const toast = useToast();
  const receiptRef = useRef(null);
  const MAX_DEPTS = 5;

  const fetchWithAuth = fetchWithAuthHelper;
  
function normalizeString(v) {
  if (v == null) return "";
  return String(v).trim().toLowerCase();
}

function matchesUser(item = {}, identity = { id: null, email: null }) {
  if (!item || (!identity.id && !identity.email)) return false;

  const idCandidates = new Set();
  const emailCandidates = new Set();

  [
    item.userId,
    item.user?.id,
    item.user?.userId,
    item.user?.sub,
    item.createdBy,
    item.creatorId,
    item.creator,
    item.id, 
    item.ownerId,
  ].forEach((v) => {
    if (v != null) idCandidates.add(String(v));
  });

  [
    item.email,
    item.user?.email,
    item.createdByEmail,
    item.creatorEmail,
    item.userEmail,
    item.contactEmail,
  ].forEach((v) => {
    if (v != null) emailCandidates.add(normalizeString(v));
  });
  if (identity.id && idCandidates.has(String(identity.id))) return true;
  for (const c of idCandidates) {
    if (identity.id && normalizeString(c) === normalizeString(identity.id)) return true;
  }

  if (identity.email) {
    for (const e of emailCandidates) {
      if (e === identity.email) return true;
    }
  }

  return false;
}

function parseSubmittedDate(item) {
  const candidates = [item.submittedAt, item.submittedDate, item.createdAt, item.createdOn, item.date];
  for (const v of candidates) {
    if (!v) continue;
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}



  function getWeekRangeForDate(date = new Date()) {
     const d = new Date(date);
     d.setHours(0,0,0,0);
     const day = d.getDay();
     const diffToMonday = (day + 6) % 7;
 
     const monday = new Date(d);
     monday.setDate(d.getDate() - diffToMonday);
     monday.setHours(0,0,0,0);
 
     const friday = new Date(monday);
     friday.setDate(monday.getDate() + 4);
     friday.setHours(23, 59, 59, 999);
 
     return { monday, friday };
  }

function normalizeReceipt(data = {}) {
  // Handle boolean to string conversion
  const isStudent = data.Student ?? data.student ?? data.is_student;
  const isBaptized = data.Baptized ?? data.baptized ?? data.is_baptized;
  
  return {
    Title: data.Title ?? data.title ?? "",
    Surname: data.Surname ?? data.surname ?? "",
    OtherNames: data.OtherNames ?? data.otherNames ?? data.other_names ?? "",
    PhoneNumber: data.PhoneNumber ?? data.phoneNumber ?? data.phone_number ?? "",
    Email: data.Email ?? data.email ?? "",
    ResidentialAddress:
      data.ResidentialAddress ?? data.residentialAddress ?? data.residential_address ?? "",
    Gender: data.Gender ?? data.gender ?? "",
    Baptized: typeof isBaptized === "boolean" ? (isBaptized ? "Yes" : "No") : (isBaptized ?? ""),
    DepartmentInChurch:
      data.DepartmentInChurch ?? data.departmentInChurch ?? data.department_in_church ?? "",
    PositionInChurch:
      data.PositionInChurch ?? data.positionInChurch ?? data.position_in_church ?? "",
    Student: typeof isStudent === "boolean" ? (isStudent ? "Yes" : "No") : (isStudent ?? ""),
    DepartmentInSchool:
      data.DepartmentInSchool ?? data.departmentInSchool ?? data.department_in_school ?? "",
    Level: data.Level ?? data.level ?? "",
    Vision: data.Vision ?? data.vision ?? data.vision_goals ?? "",
    submittedAt:
      data.submittedAt ??
      data.submitted_at ??
      data.createdAt ??
      data.created_at ??
      new Date().toISOString(),
  };
}




async function checkUserLsts() {
  setLoading(true);
  try {
    const token = getAuthToken();
    if (!token) {
      console.info("No auth token in sessionStorage, skipping auto-check.");
      setLoading(false);
      return;
    }

    // Use optimized backend endpoint - already filtered by current week
    let lstsRes = await fetchWithAuth(API_ENDPOINTS.GET_USER_LSTS_WEEK);
    if (lstsRes.status === 403) {
      console.warn("LSTS read forbidden (403). Skipping auto-check.");
      return { exists: false, forbidden: true };
    }

    if (!lstsRes.ok) {
      throw new Error(`LSTS fetch failed with ${lstsRes.status}`);
    }

    let response = {};
    try {
      const text = await lstsRes.text();
      if (text) {
        response = JSON.parse(text);
      }
    } catch (e) {
      response = {};
    }

    // Backend already filtered to current week, so just check if any exist
    if (response.has_registered_this_week && response.registrations && response.registrations.length > 0) {
      return { exists: true, data: response.registrations[0] };
    }

    return { exists: false };

  } catch (err) {
    if (err?.message?.includes("403")) {
      return { exists: false };
    }

    console.error("LSTS check failed:", err);
    toast?.error?.("Could not verify existing registration.");
  } finally {
    setLoading(false);
  }
}




  useEffect(() => {
    const checkFormAvailability = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();

      if ((day === 5 && hours >= 12) || day === 6 || day === 0) {
        setIsFormOpen(false);
      } else {
        setIsFormOpen(true);
      }
    };

    checkFormAvailability();



    const interval = setInterval(checkFormAvailability, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const departments = [
    "Choir/Instrumentalist",
    "O.G.S",
    "Publicity and Information",
    "Medical Department",
    "Media",
    "Traffic Control",
    "Security",
    "Stock Keepers",
    "Protocol",
    "Ushering",
    "Evangelism",
    "Follow-up/Visitation",
    "Prayer",
    "SPI",
    "Sanctuary",
    "Decoration",
  ];

  const [formData, setFormData] = useState({
    title: "",
    surname: "",
    otherNames: "",
    phoneNumber: "",
    email: "",
    residentialAddress: "",
    gender: "",
    baptized: "",
    departmentInChurch: [],
    positionInChurch: "",
    Student: "",
    departmentInSchool: "",
    level: "",
    visionGoals: "",
    confirm: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "confirm") {
      setFormData((prev) => ({ ...prev, confirm: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDepartmentToggle = (dept) => {
  setFormData((prev) => {
    const alreadySelected = prev.departmentInChurch.includes(dept);
    if (!alreadySelected && prev.departmentInChurch.length >= MAX_DEPTS) {
      toast.warning(`You can select up to ${MAX_DEPTS} departments.`);
      return prev;
    }
    return {
      ...prev,
      departmentInChurch: alreadySelected
        ? prev.departmentInChurch.filter((d) => d !== dept)
        : [...prev.departmentInChurch, dept],
    };
  });
};

  const handleProceedToRegistration = async () => {
  if (!isFormOpen) {
    toast.info(
      "LSTS for the week is over; registration resumes Monday and ends Friday by 12 PM."
    );
    return;
  }

  const token = sessionStorage.getItem("authToken");
  if (!token) {
    toast.info("Please log in to continue.");
    return;
  }

  setLoading(true);
  try {
    const res = await checkUserLsts();

    if (res?.exists) {
       setReceiptData(normalizeReceipt(res.data));
       setView("receipt");
    } else {
      setView("form");
    }
  } catch (err) {
    console.error(err);
    toast.error("Could not verify registration. Try again.");
    setView("form");
  } finally {
    setLoading(false);
  }
};



 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.confirm) {
    toast.error("Please confirm the information entered is true.");
    return;
  }

  const token = getAuthToken();
  if (!token) {
    setSubmissionStatus("error");
    setSubmissionText("Unauthorized — please log in.");
    toast.error("You must be logged in to register.");
    return;
  }

  setLoading(true);
  try {
    // pre-check: fetch profile, then fetch LSTS list and match by email or phone
    let profile = null;
    try {
      const profileRes = await fetchWithAuth(API_ENDPOINTS.PROFILE);
      if (profileRes.ok) profile = await profileRes.json().catch(() => null);
    } catch (e) {
      profile = null;
    }

    const profileEmail = normalizeString(profile?.email || profile?.user_email || profile?.emailAddress || "");
    const profilePhone = normalizeString(profile?.phone || profile?.phone_number || profile?.mobile || profile?.telephone || "");

    // fetch existing registrations
    const resCheck = await fetchWithAuth(API_ENDPOINTS.GET_USER_LSTS);

    let existing = [];
    try {
      const text = await resCheck.text();
      if (text) {
        const parsed = JSON.parse(text);
        existing = parsed.data || parsed;
      }
    } catch (e) {
      existing = [];
    }

    if (Array.isArray(existing)) {
      const { monday, friday } = getWeekRangeForDate();
      const found = existing.find((item) => {
        const d = new Date(item.submittedAt || item.submittedDate || item.createdAt || item.date);
        if (!(d >= monday && d <= friday)) return false;
        const itemEmail = normalizeString(item.Email || item.email || item.user?.email || item.createdByEmail || "");
        const itemPhone = normalizeString(item.PhoneNumber || item.phone || item.mobile || item.contactPhone || "");
        if (profileEmail && itemEmail && profileEmail === itemEmail) return true;
        if (profilePhone && itemPhone && profilePhone === itemPhone) return true;
        return false;
      });

      if (found) {
        setReceiptData(normalizeReceipt(found));
        setView("receipt");
        toast.info("You already registered this week — receipt shown.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      title: formData.title,
      surname: formData.surname,
      other_names: formData.otherNames,
      phone_number: formData.phoneNumber,
      email: formData.email,
      residential_address: formData.residentialAddress,
      gender: formData.gender,
      is_baptized: formData.baptized === "Yes",
      department_in_church: formData.departmentInChurch,
      position_in_church: formData.positionInChurch,
      is_student: formData.Student === "Yes",
      vision_goals: formData.visionGoals,
      ...(formData.Student === "Yes"
        ? {
            department_in_school: formData.departmentInSchool,
            level: formData.level,
          }
        : {
            department_in_school: "",
            level: "",
          }),
    };

    const res = await fetchWithAuth(API_ENDPOINTS.POST_LSTS, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || "Submission failed");
    }

  
const optimisticReceipt = normalizeReceipt({
  ...payload,
  submittedAt: new Date().toISOString(),
    });

    setReceiptData(optimisticReceipt);
    setView("receipt");

    toast.success("Registration successful! Receipt ready.");

    setReceiptVerifying(true);

try {
  const verify = await checkUserLsts();
  if (verify?.exists && verify.data) {
    setReceiptData(normalizeReceipt(verify.data));
    toast.success("Receipt verified with server.");
  }
} catch (err) {
  console.warn("Receipt verification failed", err);
} finally {
  setReceiptVerifying(false);
}

    setFormData({
      title: "",
      surname: "",
      otherNames: "",
      phoneNumber: "",
      email: "",
      residentialAddress: "",
      gender: "",
      baptized: "",
      departmentInChurch: [],
      positionInChurch: "",
      visionGoals: "",
      Student: "",
      departmentInSchool: "",
      level: "",
      confirm: false,
    });
    setStudentStatus("");


  } catch (err) {
    console.error(err);
    setSubmissionStatus("error");
    setSubmissionText(err.message || "Failed to submit form");
    toast.error("Submission failed: " + (err.message || "network error"));
  } finally {
    setLoading(false);
  }
};



const iconToPNG = async (IconComponent, { size = 20, color = "black" } = {}) => {
  const svgString = ReactDOMServer.renderToStaticMarkup(
    IconComponent({ size, color })
  );
  const hasXmlns = svgString.includes("xmlns=");
  const svg = hasXmlns
    ? svgString
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgString}</svg>`;
  return await new Promise((resolve, reject) => {
    try {
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 2;
        canvas.width = size * scale;
        canvas.height = size * scale;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG image"));
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
};

const iconMap = {
  "Full Name": FaUser,
  "Phone Number": FaPhone,
  "Email": FaEnvelope,
  "Residential Address": FaMapMarkerAlt,
  "Gender": FaVenusMars,
  "Baptized": FaWater,
  "Departments": FaChurch,
  "Position": FaBriefcase,
  "Vision/Goals": FaLightbulb,
  "School Department": FaGraduationCap,
  "Level": FaGraduationCap,
};

const generatePDF = async (payload) => {
  if (!payload) return;
  setLoading(true);

  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 20;

    const HEADER_COLOR = "#012970";

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = Logo;

    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 2480;
    canvas.height = 3508;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (logoImg?.width) {
      ctx.globalAlpha = 0.06;
      ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }

    const bgData = canvas.toDataURL("image/png");
    pdf.addImage(bgData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.setFillColor(1, 41, 112);
    pdf.rect(0, 0, pageWidth, 36, "F");
    pdf.setTextColor(255, 255, 255);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("DIVINE GRACE UNN CAMPUS", pageWidth / 2, 12, { align: "center" });

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("Leadership, Service & Training School (LSTS)", pageWidth / 2, 20, { align: "center" });

    pdf.setFontSize(9);
    pdf.text("Registration Receipt", pageWidth / 2, 28, { align: "center" });

    if (payload._qr) {
      pdf.addImage(payload._qr, "PNG", pageWidth - 40, 5, 35, 30);
    }

    y = 48;
    const get = (a, b) => payload[a] ?? payload[b] ?? "";

    const fullName = `${get("Title", "title")} ${get("Surname", "surname")} ${get("OtherNames", "otherNames")}`.trim();
    const dept = get("DepartmentInChurch", "departmentInChurch");
    const deptText = Array.isArray(dept) ? dept.join(", ") : dept;

    const submitted = payload.submittedAt
      ? new Date(payload.submittedAt).toLocaleString()
      : new Date().toLocaleString();

    const section = (title) => {
      y += 10;

      pdf.setTextColor(1, 41, 112);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);

      pdf.text(title, pageWidth / 2, y, { align: "center" });

      y += 4;
      pdf.setDrawColor(1, 41, 112);
      pdf.line(15, y, pageWidth - 15, y);

      y += 14;
    };

    const printField = async (label, value) => {
      const iconSize = 6;
      const textX = 25;

      const text = `${label}: ${value || ""}`;

      let iconData = null;
      const IconComponent = iconMap[label];

      if (IconComponent) {
        iconData = await iconToPNG(IconComponent, {
          size: 22,
          color: HEADER_COLOR,
        });
      }

      if (iconData) {
        pdf.addImage(iconData, "PNG", 15, y - 4, iconSize, iconSize);
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(text, textX, y);

      y += 8;
    };

    section("PERSONAL INFORMATION");
    await printField("Full Name", fullName);
    await printField("Phone Number", get("PhoneNumber", "phoneNumber"));
    await printField("Email", get("Email", "email"));
    await printField("Residential Address", get("ResidentialAddress", "residentialAddress"));
    await printField("Gender", get("Gender", "gender"));

    section("CHURCH INFORMATION");
    await printField("Baptized", get("Baptized", "baptized"));
    await printField("Departments", deptText);
    await printField("Position", get("PositionInChurch", "positionInChurch"));
    await printField("Vision/Goals", get("Vision", "vision"));

    if (String(get("Student", "student")).toLowerCase() === "yes") {
      section("STUDENT INFORMATION");
      await printField("School Department", get("DepartmentInSchool", "departmentInSchool"));
      await printField("Level", get("Level", "level"));
    }
    y += 10;
    pdf.setTextColor(1, 41, 112);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("SUBMISSION DATE", pageWidth / 2, y, { align: "center" });
    y += 6;
    pdf.setDrawColor(1, 41, 112);
    pdf.line(15, y, pageWidth - 15, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const submittedLines = pdf.splitTextToSize(String(submitted || ""), pageWidth - 40);
    pdf.text(submittedLines, pageWidth / 2, y, { align: "center" });
    y += submittedLines.length * 6 + 8;

    let footerY = pageHeight - 22;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, footerY, pageWidth - 15, footerY);

    footerY += 6;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text("This is a system-generated receipt. Please keep it for your records.", pageWidth / 2, footerY, { align: "center" });

    footerY += 6;
    pdf.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: "center" });

    const fileName =
      `${fullName.replace(/\s+/g, "_") || "Receipt"}_LSTS_Receipt_${new Date().toISOString().slice(0, 10)}.pdf`;

    pdf.save(fileName);
    toast.success("PDF downloaded successfully!");
  } catch (err) {
    console.error("Error generating PDF:", err);
    toast.error("Failed to generate PDF.");
  } finally {
    setLoading(false);
  }
};




function buildPrintableHTML(payload) {
  const qrSvg = payload._qr ? `<img src="${payload._qr}" style="width:120px;height:120px;border-radius:8px;" />` : "";

  const dept = payload.DepartmentInChurch || payload.departmentInChurch || "";
  const deptText = Array.isArray(dept) ? dept.join(", ") : dept;

  const name = `${payload.Title || payload.title || ""} ${payload.Surname || payload.surname || ""} ${payload.OtherNames || payload.otherNames || ""}`.trim();

  const submitted = payload.submittedAt ? new Date(payload.submittedAt).toLocaleString() : new Date().toLocaleString();

  return `
    <div style="max-width:100%; padding:10px; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:12px; margin-bottom:12px;">
        <div style="display:flex; gap:12px; align-items:center;">
          <img src="${Logo}" style="width:56px;height:56px;border-radius:8px;" />
          <div>
            <div style="font-weight:700; color:#012970; font-size:18px;">DIVINE GRACE UNN CAMPUS</div>
            <div style="font-size:12px; color:#666;">LSTS Registration Receipt</div>
          </div>
        </div>
        <div style="text-align:right;">
          ${qrSvg}
          <div style="font-size:11px;color:#999;margin-top:8px;">Scan to verify</div>
        </div>
      </div>

      <div style="display:flex; gap:24px; margin-bottom:10px;">
        <div style="flex:1;">
          <div style="margin-bottom:6px;"><strong>Name:</strong> ${escapeHtml(name)}</div>
          <div style="margin-bottom:6px;"><strong>Phone:</strong> ${escapeHtml(payload.PhoneNumber || payload.phoneNumber || "")}</div>
          <div style="margin-bottom:6px;"><strong>Email:</strong> ${escapeHtml(payload.Email || payload.email || "")}</div>
          <div style="margin-bottom:6px;"><strong>Address:</strong> ${escapeHtml(payload.ResidentialAddress || payload.residentialAddress || "")}</div>
          <div style="margin-bottom:6px;"><strong>Gender:</strong> ${escapeHtml(payload.Gender || payload.gender || "")}</div>
        </div>

        <div style="flex:1;">
          <div style="margin-bottom:6px;"><strong>Departments:</strong> ${escapeHtml(deptText)}</div>
          <div style="margin-bottom:6px;"><strong>Position:</strong> ${escapeHtml(payload.PositionInChurch || payload.positionInChurch || "")}</div>
          <div style="margin-bottom:6px;"><strong>Student:</strong> ${escapeHtml(payload.Student || payload.student || "")}</div>
          <div style="margin-bottom:6px;"><strong>School Dept:</strong> ${escapeHtml(payload.DepartmentInSchool || payload.departmentInSchool || "")}</div>
          <div style="margin-bottom:6px;"><strong>Level:</strong> ${escapeHtml(payload.Level ?? payload.level ?? "")}</div>
        </div>
      </div>

      <div style="border-top:1px dashed #ddd; padding-top:12px; font-size:12px; color:#666;">
        <div><strong>Submitted:</strong> ${escapeHtml(submitted)}</div>
        <div style="margin-top:8px; font-size:11px;">Thank you for registering. Please keep this receipt for record and re-download if necessary.</div>
      </div>
    </div>
  `;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const handleDownloadReceipt = async (payload) => {
  setLoading(true);
  const safePayload = normalizeReceipt(payload);
  try {
    const minimalData = {
      title: payload.title || payload.Title,
      surname: payload.surname || payload.Surname,
      otherNames: payload.otherNames || payload.OtherNames,
      phoneNumber: payload.phoneNumber || payload.PhoneNumber,
      email: payload.email || payload.Email,
      submittedAt: payload.submittedAt,
    };

    const qrData = JSON.stringify(minimalData);
    const qrUrl = await QRCode.toDataURL(qrData, { width: 200 });

    const printable = { ...payload, _qr: qrUrl };

    await generatePDF(printable);
  } catch (err) {
    console.error(err);
    toast.error("Could not generate PDF.");
  } finally {
    setLoading(false);
  }
};


  function ReceiptOverlay({ data, onClose, onDownload, verifying = false }) {
  const dept = data?.DepartmentInChurch || data?.departmentInChurch || "";
  const deptArr = Array.isArray(dept)
    ? dept
    : typeof dept === "string" && dept.length
    ? dept.split(",").map((s) => s.trim())
    : [];

  const submittedAt = data?.submittedAt
    ? new Date(data.submittedAt).toLocaleString()
    : new Date().toLocaleString();

  const fullName = `${data.Title} ${data.Surname} ${data.OtherNames}`.trim();;

  return (
    <div className="receipt-overlay">
      <div className="receipt-wrapper" ref={receiptRef}>
        <button
          className="close-btn"
          onClick={() => {
            onClose();
          }}
          aria-label="Close receipt"
        >
          ❌
        </button>
        <div className="receipt-card">
          <img src={Logo} alt="Background" className="receipt-bg" />
          <div className="receipt-content">
            <div className="receipt-header">
              <img src={Logo} alt="Church Logo" className="receipt-logo" />
              <div>
                <h3>DIVINE GRACE UNN CAMPUS</h3>
                <p className="receipt-subtitle">LSTS Registration Receipt</p>
              </div>
            </div>
              <div className="receipt-body">
              <p><strong>Name:</strong> {fullName}</p>
              <p><strong>Phone:</strong> {data?.phoneNumber || data?.PhoneNumber || "—"}</p>
              <p><strong>Email:</strong> {data?.email || data?.Email || "—"}</p>
              <p><strong>Address:</strong> {data?.residentialAddress || data?.ResidentialAddress || "—"}</p>
              <p><strong>Gender:</strong> {data?.gender || data?.Gender || "—"}</p>
              <p><strong>Departments:</strong> {deptArr.join(", ") || "—"}</p>
              <p><strong>Position:</strong> {data?.positionInChurch || data?.PositionInChurch || "—"}</p>
              <p><strong>Student:</strong> {data?.student || data?.Student || "—"}</p>
              {String(data.student || data.Student).toLowerCase() === "yes" && (
                <>
                  <p><strong>School Department:</strong> {data.departmentInSchool || data.DepartmentInSchool}</p>
                  <p><strong>Level:</strong> {data.level || data.Level}</p>
                </>
              )}
              <p><strong>Date:</strong> {submittedAt}</p>
              {verifying && <p className="verifying-badge">🔄 Verifying...</p>}
            </div>
          </div>
        </div>

        <div className="receipt-footer">
          <button
            className="generate-btn"
            disabled={loading || verifying}
            onClick={() => onDownload(data)}
          >
            {verifying ? "Verifying..." : loading ? "Generating..." : "Download PDF"}
          </button>

        </div>
      </div>
    </div>
  );
}

  return (
    <>
      <Header />
      {loading && <LoadingOverlay text="Processing..." />}

      <section className="lsts-main-content">
        {view === "landing" && (
          <section className="lsts-landing-section">
            <div className="lsts-landing">
              <div>
                <h1 className="lstsf-h1">Leadership, Service & Training Servce (LSTS)</h1>
              </div>
              <div className="lstss-hero-image">
                <img src={HeroImg} alt="" />
              </div>
              <p className="lsts-intro">
                The Leadership, Service & Training School (LSTS) is a Divine Grace
                UNN initiative born out of revelation through our father in the Lord Oluchi Japhat Aniagwu,  aimed at raising effective leaders in ministry and
                marketplace through structured training, mentoring, and service.
                It provides biblical, leadership, and spiritual formation for
                those who desire to serve in God’s house and excel in life.
                Join us every Friday for transformative training in Christian
                leadership and faithful stewardship. Develop your God-given
                potentials and learn to serve with excellence.
              </p>

              <button className="proceed-btn" onClick={handleProceedToRegistration}>
                Proceed to Registration
              </button>

              <div className="about-lsts-section">
                <h1>About The LSTS</h1>
                <div className="about-lsts-sec">
                  <h4 className="about-lsts">
                    Leadership and Stewardship Training Service (LSTS) is a structure
                    established by God through His servant, Oluchi Japhat Aniagwu, to build leaders
                    through biblical precepts and principles.
                  </h4>
                </div>
                <div>
                  <div className="lstss-hero-image">
                    <img src={First} alt="" />
                  </div>
                  <div className="lsts-info">
                    <div>
                      <div className="lsts-item">
                        <FaCalendarAlt className="lsts-icon" />

                        <p>
                          <span className="lsts-title">When & Where?</span> <br />
                          Every Friday by 5pm at Grace Nation, Benima Hall.
                        </p>
                      </div>

                      <div className="lsts-item">
                        <FaBookOpen className="lsts-icon" />
                        <p>
                          <span className="lsts-title">What You'll Learn?</span> <br />
                          Biblical leadership principles, stewardship practices, and practical
                          ministry skills.
                        </p>
                      </div>

                      <div className="lsts-item">
                        <FaUsers className="lsts-icon" />
                        <p>
                          <span className="lsts-title">Who Should Attend?</span> <br />
                          All believers seeking to grow in leadership and stewardship.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="our-vision-div">
                <h1 className="our-vision">
                  <FaLightbulb className="lsts-icon" /> Our Vision
                </h1>
                <div>
                  <p className="lsts-intro">
                    God, through His servant OLUCHI JAPHAT ANIAGWU, raises, empowers, and equips transformational
                    leaders to become visionary agents of change. These are people who embody integrity and courage,
                    challenge the status quo, inspire others, and bring innovative, value-driven solutions to the world’s pressing issues.
                  </p>
                  <div className="lstss-hero-image">
                    <img src={Second} alt="" />
                  </div>
                </div>
              </div>

              <div>
                <h1 className="ready">Ready to Begin Your Leadership Journey?</h1>
                <h4>Register now for our upcoming LSTS session, it's free and your first step toward impactful leadership!</h4>

                <div>
                  <button className="proceed-btn" onClick={handleProceedToRegistration}>
                    Register For LSTS
                  </button>
                </div>
              </div>

              <footer className="footer">
                <div className="foot">
                  <div className="footer-logo">
                    <img className="logo-img" src="/logo.png" alt="" />
                    <span className="digunec">DIGUNN</span>
                  </div>
                  <div className="social-div">
                    <a target="blank" href="https://web.facebook.com/p/Divine-Grace-UNN-Campus-61551659589725/?_rdc=1&_rdr#"><img src="/facebook-logo-2428.png" alt="" /></a>
                    <img src="/instagram-logo-8869.png" alt="" />
                    <img src="/twitter-x-blue-logo-round-20859.png" alt="" />
                  </div>
                  <div className="copyright-div">
                    <p className="copyright">&copy;copyright <b>DIGUNN</b>&#46; All right reserved</p>
                    <p className="design"><i>Designed by Soft Nation & Smart</i></p>
                  </div>
                </div>
              </footer>
            </div>
          </section>
        )}
        
        {view === "receipt" && receiptData && receiptData.Email  && (
          <ReceiptOverlay
            data={receiptData}
            verifying={receiptVerifying}
            onClose={async () => {
              // go back to landing on close and refresh check
              setView("landing");
              try {
                await checkUserLsts();
              } catch (e) {
                console.warn("checkUserLsts error on close", e);
              }
            }}
            onDownload={() => handleDownloadReceipt(receiptData)}
          />

        )} 

        {view === "form" && (
          <>
            {submissionStatus === "error" && (
              <div className="result-screen error">
                <div className="icon">❌</div>
                <h2>{submissionText}</h2>
              </div>
            )}

            {!submissionStatus && (
              <>
                <div id="lstsh1">
                  <h1>LSTS Registration Form</h1>
                </div>

                {!isFormOpen ? (
                  <div className="form-closed-message">
                      <h2>🚫 LSTS for the week is over</h2>
                      <p>
                        LSTS for the week is over; registration for the new week starts on <strong>Monday</strong> and ends on <strong>Friday by 12 PM</strong>.
                      </p>
                  </div>
                ) : (
                  <form id="membershipForm" className="form" onSubmit={handleSubmit}>
                    <label>Title</label>
                    <select name="title" value={formData.title} onChange={handleChange} required>
                      <option value="" disabled>Select title</option>
                      <option>Mr</option>
                      <option>Mrs</option>
                      <option>Miss</option>
                      <option>Master</option>
                      <option>Dr</option>
                      <option>Prof</option>
                    </select>

                    <label>Surname</label>
                    <input name="surname" value={formData.surname} onChange={handleChange} required />

                    <label>Other Names</label>
                    <input name="otherNames" value={formData.otherNames} onChange={handleChange} required />

                    <label>Phone Number</label>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />

                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />

                    <label>Residential Address</label>
                    <textarea name="residentialAddress" rows="3" value={formData.residentialAddress} onChange={handleChange} required />

                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} required>
                      <option value="" disabled>Select gender</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>

                    <label>Baptized</label>
                    <select name="baptized" value={formData.baptized} onChange={handleChange} required>
                      <option value="" disabled>Are you baptized?</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>

                    <label>Departments in the Church (Select all that apply)</label>
                    <div className="dept-button-grid">
                      {departments.map((dept) => {
                        const selected = formData.departmentInChurch.includes(dept);
                        return (
                          <button
                            key={dept}
                            type="button"
                            className={`dept-button ${selected ? "selected" : ""}`}
                            onClick={() => handleDepartmentToggle(dept)}
                          >
                            {dept}
                          </button>
                        );
                      })}
                    </div>

                    <label>Position in the Church</label>
                    <select name="positionInChurch" value={formData.positionInChurch} onChange={handleChange} required>
                      <option value="" disabled>Select position</option>
                      <option>Pastor</option>
                      <option>Leader</option>
                      <option>Worker</option>
                      <option>Minister</option>
                      <option>Member</option>
                    </select>

                    <label>Vision / Goals</label>
                    <textarea
                      name="visionGoals"
                      rows="4"
                      placeholder="Share your vision, goals, or expectations from LSTS..."
                      value={formData.visionGoals}
                      onChange={handleChange}
                      required
                    />

                    <label>Are you a student?</label>
                    <select
                      name="Student"
                      value={formData.Student}
                      onChange={(e) => {
                        handleChange(e);
                        setStudentStatus(e.target.value);
                      }}
                      required
                    >
                      <option value="" disabled>Select option</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>

                    {formData.Student === "Yes" && (
                      <>
                        <label>Department in School</label>
                        <input name="departmentInSchool" value={formData.departmentInSchool} onChange={handleChange} />

                        <label>Level</label>
                        <select name="level" value={formData.level} onChange={handleChange}>
                          <option value="" disabled>Select your level</option>
                          <option>100</option>
                          <option>200</option>
                          <option>300</option>
                          <option>400</option>
                          <option>500</option>
                          <option>600</option>
                        </select>
                      </>
                    )}

                    <label className="confirm-check">
                      <input type="checkbox" name="confirm" checked={formData.confirm} onChange={handleChange} /> I confirm the information entered above is true.
                    </label>

                    <div className="align">
                      <button className="submit-button" type="submit" disabled={loading}>
                        {loading ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
