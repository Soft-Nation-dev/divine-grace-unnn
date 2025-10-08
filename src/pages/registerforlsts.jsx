import React, { useState } from "react";
import Header from "../components/header";
import LoadingOverlay from "../components/overlay";
import "../css/registerforlsts.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Logo from "/web-app-manifest-512x512.png";

export default function LSTSRegistrationForm() {
  const [Student, setStudentStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const departments = [
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
      return {
        ...prev,
        departmentInChurch: alreadySelected
          ? prev.departmentInChurch.filter((d) => d !== dept)
          : [...prev.departmentInChurch, dept],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.confirm) {
      alert("Please confirm that the information you entered is true.");
      return;
    }

    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setSubmissionStatus("error");
      setSubmissionText("Unauthorized — please log in.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/LstsForm/LSTSFORM",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Submission failed");
      }

      setSubmissionStatus("success");
      setSubmissionText("Form submitted successfully 🎉");
      const receipt = { ...formData, submittedAt: new Date().toLocaleString() };
      setReceiptData(receipt);
      setShowReceipt(true);

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
        Student: "",
        departmentInSchool: "",
        level: "",
        visionGoals: "",
        confirm: false,
      });
      setStudentStatus("");
    } catch (err) {
      console.error(err);
      setSubmissionStatus("error");
      setSubmissionText(err.message || "Failed to submit form");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (receiptData) => {
    setLoading(true);
    const receiptElement = document.querySelector(".receipt-card");
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
        `${receiptData.otherNames || "Student"}_LSTS_Receipt_${new Date()
          .toLocaleDateString()
          .replace(/\//g, "-")}.pdf`
      );
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  const ReceiptOverlay = () => (
    <div className="receipt-overlay">
      <div className="receipt-wrapper">
        <button
          className="close-btn"
          onClick={() => {
            setShowReceipt(false);
            setSubmissionStatus(null);
            setSubmissionText("");
          }}
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
              <p>
                <strong>Name:</strong> {formData.title} {receiptData.surname}{" "}
                {receiptData.otherNames}
              </p>
              <p>
                <strong>Phone:</strong> {receiptData.phoneNumber}
              </p>
              <p>
                <strong>Email:</strong> {receiptData.email}
              </p>
              <p>
                <strong>Address:</strong> {receiptData.residentialAddress}
              </p>
              <p>
                <strong>Gender:</strong> {receiptData.gender}
              </p>
              <p>
                <strong>Baptized:</strong> {receiptData.baptized}
              </p>
              <p>
                <strong>Departments:</strong>{" "}
                {receiptData.departmentInChurch.join(", ")}
              </p>
              <p>
                <strong>Position:</strong> {receiptData.positionInChurch}
              </p>
              <p>
                <strong>Student:</strong> {receiptData.Student}
              </p>
              {receiptData.Student === "Yes" && (
                <>
                  <p>
                    <strong>School Department:</strong>{" "}
                    {receiptData.departmentInSchool}
                  </p>
                  <p>
                    <strong>Level:</strong> {receiptData.level}
                  </p>
                </>
              )}
              <p>
                <strong>Vision/Goals:</strong> {receiptData.visionGoals}
              </p>
              <p>
                <strong>Date:</strong> {receiptData.submittedAt}
              </p>
            </div>
          </div>
        </div>

        <div className="receipt-footer">
          <button
            className="generate-btn"
            disabled={loading}
            onClick={() => generatePDF(receiptData)}
          >
            {loading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      {loading && <LoadingOverlay text="Processing..." />}

      <section className="lsts-main-content">
        {!showForm ? (
          <div className="lsts-landing">
            <h1>Leadership, Service & Training School (LSTS)</h1>
            <p>
              The Leadership, Service & Training School (LSTS) is a Divine Grace
              UNN initiative aimed at raising effective leaders in ministry and
              marketplace through structured training, mentoring, and service.
              It provides biblical, leadership, and spiritual formation for
              those who desire to serve in God’s house and excel in life.
            </p>
            <button className="proceed-btn" onClick={() => setShowForm(true)}>
              Proceed to Registration
            </button>
          </div>
        ) : showReceipt && receiptData ? (
          <ReceiptOverlay />
        ) : (
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

                <form id="membershipForm" className="form" onSubmit={handleSubmit}>
                  <label>Title</label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
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
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                  />

                  <label>Other Names</label>
                  <input
                    name="otherNames"
                    value={formData.otherNames}
                    onChange={handleChange}
                    required
                  />

                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />

                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                  <label>Residential Address</label>
                  <textarea
                    name="residentialAddress"
                    rows="3"
                    value={formData.residentialAddress}
                    onChange={handleChange}
                    required
                  />

                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
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
                    name="baptized"
                    value={formData.baptized}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Are you baptized?
                    </option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>

                  <label>Departments in the Church (Select all that apply)</label>
                  <div className="dept-checkbox-grid">
                    {departments.map((dept) => (
                      <label key={dept} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.departmentInChurch.includes(dept)}
                          onChange={() => handleDepartmentToggle(dept)}
                        />
                        {dept}
                      </label>
                    ))}
                  </div>

                  <label>Position in the Church</label>
                  <select
                    name="positionInChurch"
                    value={formData.positionInChurch}
                    onChange={handleChange}
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
                    <option value="" disabled>
                      Select option
                    </option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>

                  {Student === "Yes" && (
                    <>
                      <label>Department in School</label>
                      <input
                        name="departmentInSchool"
                        value={formData.departmentInSchool}
                        onChange={handleChange}
                      />

                      <label>Level</label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
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

                  <label>Vision / Goals</label>
                  <textarea
                    name="visionGoals"
                    rows="4"
                    placeholder="Share your vision, goals, or expectations from LSTS..."
                    value={formData.visionGoals}
                    onChange={handleChange}
                    required
                  />

                  <label className="confirm-check">
                    <input
                      type="checkbox"
                      name="confirm"
                      checked={formData.confirm}
                      onChange={handleChange}
                    />{" "}
                    I confirm the information entered above is true.
                  </label>

                  <div className="align">
                    <button
                      className="submit-button"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit"}
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
