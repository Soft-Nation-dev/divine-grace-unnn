import React, { useState } from "react";
import Header from "../components/header";
import LoadingOverlay from "../components/overlay";
import "../css/surmit.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Logo from "/web-app-manifest-512x512.png";
import HeroImg from "../images/word1.jpg";
import First from "../images/lsts-training-lsta1.jpg";
import Second from "../images/third image.jpg";
import { FaCalendarAlt, FaBookOpen, FaUsers } from "react-icons/fa";
import { LuLightbulb } from "react-icons/lu";

export default function SummitRegistrationForm() {
  const [summitStudent, setSummitStudentStatus] = useState("");
  const [summitLoading, setSummitLoading] = useState(false);
  const [summitSubmissionStatus, setSummitSubmissionStatus] = useState(null);
  const [summitSubmissionText, setSummitSubmissionText] = useState("");
  const [summitReceiptData, setSummitReceiptData] = useState(null);
  const [summitShowReceipt, setSummitShowReceipt] = useState(false);
  const [summitShowForm, setSummitShowForm] = useState(false);

  const summitDepartments = [
    "Choir/Instrumentalist",
    "O.G.S",
    "Publicity and Information",
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

  const [summitFormData, setSummitFormData] = useState({
    summitTitle: "",
    summitSurname: "",
    summitOtherNames: "",
    summitPhoneNumber: "",
    summitEmail: "",
    summitResidentialAddress: "",
    summitGender: "",
    summitBaptized: "",
    summitDepartmentInChurch: [],
    summitPositionInChurch: "",
    summitStudent: "",
    summitDepartmentInSchool: "",
    summitLevel: "",
    summitVisionGoals: "",
    summitConfirm: false,
  });

  const handleSummitChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "summitConfirm") {
      setSummitFormData((prev) => ({ ...prev, summitConfirm: checked }));
    } else {
      setSummitFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSummitDeptToggle = (dept) => {
    setSummitFormData((prev) => {
      const alreadySelected = prev.summitDepartmentInChurch.includes(dept);
      return {
        ...prev,
        summitDepartmentInChurch: alreadySelected
          ? prev.summitDepartmentInChurch.filter((d) => d !== dept)
          : [...prev.summitDepartmentInChurch, dept],
      };
    });
  };

  const handleSummitSubmit = async (e) => {
    e.preventDefault();
    if (!summitFormData.summitConfirm) {
      alert("Please confirm that the information you entered is true.");
      return;
    }

    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setSummitSubmissionStatus("error");
      setSummitSubmissionText("Unauthorized — please log in.");
      return;
    }

    setSummitLoading(true);
    try {
      const payload = {
        Title: summitFormData.summitTitle,
        Surname: summitFormData.summitSurname,
        OtherNames: summitFormData.summitOtherNames,
        PhoneNumber: summitFormData.summitPhoneNumber,
        Email: summitFormData.summitEmail,
        ResidentialAddress: summitFormData.summitResidentialAddress,
        Gender: summitFormData.summitGender,
        Baptized: summitFormData.summitBaptized,
        DepartmentInChurch: summitFormData.summitDepartmentInChurch.join(", "),
        PositionInChurch: summitFormData.summitPositionInChurch,
        Student: summitFormData.summitStudent,
        VisionGoals: summitFormData.summitVisionGoals,
        ...(summitFormData.summitStudent === "Yes"
          ? {
              DepartmentInSchool: summitFormData.summitDepartmentInSchool,
              Level: parseInt(summitFormData.summitLevel) || 0,
            }
          : {
              DepartmentInSchool: "",
              Level: 0,
            }),
      };

      const res = await fetch(
        "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/Summit/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Submission failed");
      }

      setSummitSubmissionStatus("success");
      setSummitSubmissionText("Form submitted successfully 🎉");
      const receipt = { ...summitFormData, submittedAt: new Date().toLocaleString() };
      setSummitReceiptData(receipt);
      setSummitShowReceipt(true);

      setSummitFormData({
        summitTitle: "",
        summitSurname: "",
        summitOtherNames: "",
        summitPhoneNumber: "",
        summitEmail: "",
        summitResidentialAddress: "",
        summitGender: "",
        summitBaptized: "",
        summitDepartmentInChurch: [],
        summitPositionInChurch: "",
        summitVisionGoals: "",
        summitStudent: "",
        summitDepartmentInSchool: "",
        summitLevel: "",
        summitConfirm: false,
      });
      setSummitStudentStatus("");
    } catch (err) {
      console.error(err);
      setSummitSubmissionStatus("error");
      setSummitSubmissionText(err.message || "Failed to submit form");
    } finally {
      setSummitLoading(false);
    }
  };

  const generateSummitPDF = async (receiptData) => {
    setSummitLoading(true);
    const receiptElement = document.querySelector(".summit-receipt-card");
    if (!receiptElement) return;
    try {
      const canvas = await html2canvas(receiptElement, {
        useCORS: true,
        backgroundColor: "#fff",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(
        `${receiptData.summitOtherNames || "Student"}_Summit_Receipt_${new Date()
          .toLocaleDateString()
          .replace(/\//g, "-")}.pdf`
      );
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setSummitLoading(false);
    }
  };

  const SummitReceiptOverlay = () => (
    <div className="summit-receipt-overlay">
      <div className="summit-receipt-wrapper">
        <button
          className="summit-close-btn"
          onClick={() => {
            setSummitShowForm(false);
            setSummitShowReceipt(false);
            setSummitSubmissionStatus(null);
            setSummitSubmissionText("");
          }}
        >
          ❌
        </button>
        <div className="summit-receipt-card">
          <img src={Logo} alt="Background" className="summit-receipt-bg" />
          <div className="summit-receipt-content">
            <div className="summit-receipt-header">
              <img src={Logo} alt="Church Logo" className="summit-receipt-logo" />
              <div>
                <h3>DIVINE GRACE UNN CAMPUS</h3>
                <p className="summit-receipt-subtitle">Summit Registration Receipt</p>
              </div>
            </div>
            <div className="summit-receipt-body">
              <p>
                <strong>Name:</strong> {summitReceiptData.summitTitle} {summitReceiptData.summitSurname}{" "}
                {summitReceiptData.summitOtherNames}
              </p>
              <p>
                <strong>Phone:</strong> {summitReceiptData.summitPhoneNumber}
              </p>
              <p>
                <strong>Email:</strong> {summitReceiptData.summitEmail}
              </p>
              <p>
                <strong>Address:</strong> {summitReceiptData.summitResidentialAddress}
              </p>
              <p>
                <strong>Gender:</strong> {summitReceiptData.summitGender}
              </p>
              <p>
                <strong>Departments:</strong>{" "}
                {summitReceiptData.summitDepartmentInChurch.join(", ")}
              </p>
              <p>
                <strong>Position:</strong> {summitReceiptData.summitPositionInChurch}
              </p>
              <p>
                <strong>Student:</strong> {summitReceiptData.summitStudent}
              </p>
              {summitReceiptData.summitStudent === "Yes" && (
                <>
                  <p>
                    <strong>School Department:</strong>{" "}
                    {summitReceiptData.summitDepartmentInSchool}
                  </p>
                  <p>
                    <strong>Level:</strong> {summitReceiptData.summitLevel}
                  </p>
                </>
              )}
              <p>
                <strong>Date:</strong> {summitReceiptData.submittedAt}
              </p>
            </div>
          </div>
        </div>

        <div className="summit-receipt-footer">
          <button
            className="summit-generate-btn"
            disabled={summitLoading}
            onClick={() => generateSummitPDF(summitReceiptData)}
          >
            {summitLoading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      {summitLoading && <LoadingOverlay text="Processing..." />}

      <section className="summit-main-content">
        {!summitShowForm ? (
          <section className="summit-landing-section">
            <div className="summit-landing">
              <div>
                <h1 className="summit-h1">Leadership Summit</h1>
              </div>
              <div className="summit-hero-image">
                <img className="imgg" src={HeroImg} alt="" />
              </div>
              <p className="summit-intro">
             The Leadership Summit is a Divine Grace UNN annual program, held every year end,
              dedicated to empowering believers with deep spiritual insight, leadership excellence,
               and personal development skills. It is more than just a program, it’s a divine encounter
               where leaders are revived, refined, and realigned for greater impact.
              Each year, We gather to encounter the Lord in a fresh way, receive strategic
                impartation, and build lasting relationships with like-minded leaders. No one comes and
                leaves the same , visions are birthed, hearts are set ablaze, and destinies are propelled forward in God’s purpose.
              </p>
              <p className="italic">Registration is free, click the button below to register</p>
              <button
                className="summit-proceed-btn"
                onClick={() => {
                  setSummitShowForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Click to Register
              </button>

            </div>
          </section>
        ) : summitShowReceipt && summitReceiptData ? (
          <SummitReceiptOverlay />
        ) : (
          <>
            {summitSubmissionStatus === "error" && (
              <div className="summit-result-screen error">
                <div className="summit-icon">❌</div>
                <h2>{summitSubmissionText}</h2>
              </div>
            )}

            {!summitSubmissionStatus && (
              <>
                <div id="summit-h1">
                  <h1>Summit Registration Form</h1>
                </div>

                <form className="summit-form" onSubmit={handleSummitSubmit}>
                  <label>Title</label>
                  <select
                    name="summitTitle"
                    value={summitFormData.summitTitle}
                    onChange={handleSummitChange}
                    required
                  >
                    <option value="" disabled>
                      Select title
                    </option>
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Miss</option>
                    <option>Master</option>
                    <option>Dr</option>
                    <option>Prof</option>
                  </select>

                  <label>Surname</label>
                  <input
                    name="summitSurname"
                    value={summitFormData.summitSurname}
                    onChange={handleSummitChange}
                    required
                  />

                  <label>Other Names</label>
                  <input
                    name="summitOtherNames"
                    value={summitFormData.summitOtherNames}
                    onChange={handleSummitChange}
                    required
                  />

                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="summitPhoneNumber"
                    value={summitFormData.summitPhoneNumber}
                    onChange={handleSummitChange}
                    required
                  />

                  <label>Email</label>
                  <input
                    type="email"
                    name="summitEmail"
                    value={summitFormData.summitEmail}
                    onChange={handleSummitChange}
                    required
                  />

                  <label>Residential Address</label>
                  <textarea
                    name="summitResidentialAddress"
                    rows="3"
                    value={summitFormData.summitResidentialAddress}
                    onChange={handleSummitChange}
                    required
                  />

                  <label>Gender</label>
                  <select
                    name="summitGender"
                    value={summitFormData.summitGender}
                    onChange={handleSummitChange}
                    required
                  >
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>

                  <label>Baptized</label>
                  <select
                    name="summitBaptized"
                    value={summitFormData.summitBaptized}
                    onChange={handleSummitChange}
                    required
                  >
                    <option value="" disabled>
                      Are you baptized?
                    </option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>

                  <label>Departments in the Church (Select all that apply)</label>
                  <div className="summit-dept-button-grid">
                    {summitDepartments.map((dept) => {
                      const selected = summitFormData.summitDepartmentInChurch.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          className={`summit-dept-button ${
                            selected ? "summit-selected" : ""
                          }`}
                          onClick={() => handleSummitDeptToggle(dept)}
                        >
                          {dept}
                        </button>
                      );
                    })}
                  </div>

                  <label>Position in the Church</label>
                  <select
                    name="summitPositionInChurch"
                    value={summitFormData.summitPositionInChurch}
                    onChange={handleSummitChange}
                    required
                  >
                    <option value="" disabled>
                      Select position
                    </option>
                    <option>Pastor</option>
                    <option>Leader</option>
                    <option>Worker</option>
                    <option>Minister</option>
                    <option>Member</option>
                  </select>

                  <label>Vision / Goals</label>
                  <textarea
                    name="summitVisionGoals"
                    rows="4"
                    placeholder="Share your vision, goals, or expectations..."
                    value={summitFormData.summitVisionGoals}
                    onChange={handleSummitChange}
                    required
                  />

                  <label>Are you a student?</label>
                  <select
                    name="summitStudent"
                    value={summitFormData.summitStudent}
                    onChange={(e) => {
                      handleSummitChange(e);
                      setSummitStudentStatus(e.target.value);
                    }}
                    required
                  >
                    <option value="" disabled>
                      Select option
                    </option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>

                  {summitFormData.summitStudent === "Yes" && (
                    <>
                      <label>Department in School</label>
                      <input
                        name="summitDepartmentInSchool"
                        value={summitFormData.summitDepartmentInSchool}
                        onChange={handleSummitChange}
                      />

                      <label>Level</label>
                      <select
                        name="summitLevel"
                        value={summitFormData.summitLevel}
                        onChange={handleSummitChange}
                      >
                        <option value="" disabled>
                          Select your level
                        </option>
                        <option>100</option>
                        <option>200</option>
                        <option>300</option>
                        <option>400</option>
                        <option>500</option>
                        <option>600</option>
                      </select>
                    </>
                  )}

                  <label className="summit-confirm-check">
                    <input
                      type="checkbox"
                      name="summitConfirm"
                      checked={summitFormData.summitConfirm}
                      onChange={handleSummitChange}
                    />{" "}
                    I confirm the information entered above is true.
                  </label>

                  <div className="align">
                    <button
                      className="summit-submit-button"
                      type="submit"
                      disabled={summitLoading}
                    >
                      {summitLoading ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
