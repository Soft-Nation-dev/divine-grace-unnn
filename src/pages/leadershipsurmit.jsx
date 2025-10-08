// src/pages/leadershipsummit.jsx
import React, { useState } from "react";
import Header from "../components/header";
import LoadingOverlay from "../components/overlay"; 
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Logo from "/web-app-manifest-512x512.png";
import "../css/surmit.css";

export default function LeadershipSummit() {
  const [Student, setStudentStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [formData, setFormData] = useState({
    surname: "",
    otherNames: "",
    phoneNumber: "",
    email: "",
    residentialAddress: "",
    gender: "",
    departmentInChurch: "",
    positionInChurch: "",
    Student: "",
     ...(Student && { departmentInSchool: "", level: "" })
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus(null);

    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setSubmissionStatus("error");
      setSubmissionText("Unauthorized — please log in.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/Summit/submit",
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
        const errData = await res.json().catch(() => ({}));
        let message;

        if (typeof errData === "string") {
          message = errData;
        } else if (typeof errData?.message === "string") {
          message = errData.message;
        } else if (typeof errData?.errors === "string") {
          message = errData.errors;
        } else {
          message = JSON.stringify(errData); // fallback to string
        }

        setSubmissionStatus("error");
        setSubmissionText(message);
        return;
      }

      await res.json().catch(() => ({}));
      setSubmissionStatus("success");
      setSubmissionText("Form submitted successfully 🎉");
      const receipt = { ...formData, submittedAt: new Date().toLocaleString() };
      setReceiptData(receipt);
      setShowReceipt(true);

      setFormData({
        surname: "",
        otherNames: "",
        phoneNumber: "",
        residentialAddress: "",
        gender: "",
        departmentInChurch: "",
        positionInChurch: "",
        Student: "",
        departmentInSchool: "",
        level: "",
      });
    //   setStudentStatus("");
    //   setTimeout(() => {
    //   setSubmissionStatus(null);
    //   setSubmissionText("");
    // }, 3000);


    } catch (err) {
      const msg = err?.message || "Failed to submit form";
      setSubmissionStatus("error");
      setSubmissionText(msg);
    } finally {
      setLoading(false);
    }
  };
const generatePDF = async (receiptData) => {
    setLoading(true);

    const receiptElement = document.querySelector(".summit-receipt-card");
    if (!receiptElement) {
      console.error("❌ No .summit-receipt-card element found");
      setLoading(false);
      return;
    }

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
        `${receiptData.otherNames || "Student"}_Summit_Receipt_${new Date()
          .toLocaleDateString()
          .replace(/\//g, "-")}.pdf`
      );
    } catch (error) {
      console.error("❌ Error generating receipt PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const SummitReceiptOverlay = () => (
    <div className="summit-receipt-overlay">
      <div className="summit-receipt-wrapper">
        <button
          className="summit-close-btn"
          onClick={() => {
            setShowReceipt(false);
            setSubmissionStatus(null);
            setSubmissionText("");
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
                <p className="summit-receipt-subtitle">Leadership Summit Registration Receipt</p>
              </div>
            </div>
            <div className="summit-receipt-body">
              <p><strong>Name:</strong> {receiptData.surname} {receiptData.otherNames}</p>
              <p><strong>Phone:</strong> {receiptData.phoneNumber}</p>
              <p><strong>Email:</strong> {receiptData.email}</p>
              <p><strong>Address:</strong> {receiptData.residentialAddress}</p>
              <p><strong>Gender:</strong> {receiptData.gender}</p>
              <p><strong>Department:</strong> {receiptData.departmentInChurch}</p>
              <p><strong>Position:</strong> {receiptData.positionInChurch}</p>
              <p><strong>Student:</strong> {receiptData.Student}</p>
              {receiptData.Student === "Yes" && (
                <>
                  <p><strong>School Department:</strong> {receiptData.departmentInSchool}</p>
                  <p><strong>Level:</strong> {receiptData.level}</p>
                </>
              )}
               <p><strong>Date:</strong> {receiptData.submittedAt}</p>
            </div>
          </div>
        </div>
        <div className="summit-receipt-footer">
          <button
            className="summit-generate-btn"
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
      {loading && <LoadingOverlay status="loading" text="loading" />}

      <section className="lsummit-main-content">
        {showReceipt && receiptData && <SummitReceiptOverlay />}

        {submissionStatus === "error" && (
          <div className="result-screen error">
            <div className="icon">❌</div>
            <h2>{submissionText}</h2>
          </div>
        )}

        {!submissionStatus && (
          <>
            <div id="lsummit-title">
              <h1>Leadership Summit Registration Form</h1>
            </div>

            <form
              id="lsummit-form"
              className="lsummit-form"
              onSubmit={handleSubmit}
            >
              <label htmlFor="lsummit-surname">Surname</label>
              <input
                type="text"
                id="lsummit-surname"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                required
              />

              <label htmlFor="lsummit-otherNames">Other Names</label>
              <input
                type="text"
                id="lsummit-otherNames"
                name="otherNames"
                value={formData.otherNames}
                onChange={handleChange}
                required
              />

              <label htmlFor="lsummit-phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="lsummit-phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                pattern="[0-9]+"
                title="Enter a valid phone number"
              />

              <label htmlFor="lsummit-email">Email</label>
              <input
                type="email"
                id="lsummit-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label htmlFor="lsummit-residentialAddress">
                Residential Address
              </label>
              <textarea
                id="lsummit-residentialAddress"
                name="residentialAddress"
                rows="3"
                value={formData.residentialAddress}
                onChange={handleChange}
                required
              />

              <label htmlFor="lsummit-gender">Gender</label>
              <select
                id="lsummit-gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select your gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <label htmlFor="lsummit-departmentInChurch">Department in the Church</label>
              <select
                id="lsummit-departmentInChurch"
                name="departmentInChurch"
                value={formData.departmentInChurch}
                onChange={handleChange}
                required
              >
              <option value="" disabled>
                Select a departmentInChurch
                  </option>
                  <option value="Choir/Instrumentalist Department">Choir/Instrumentalist</option>
                  <option value="O.G.S Department">O.G.S</option>
                  <option value="Publicity and Information Department">Publicity and Information</option>
                  <option value="Media Department">Media</option>
                  <option value="Traffic controll Department">Traffic controll</option>
                  <option value="Security Department">Security</option>
                  <option value="Stock Keepers Department">Stock Keepers</option>
                  <option value="Protocol Deparment">Protocol</option>
                  <option value="Ushering Department">Ushering</option>
                  <option value="Evangelism Department">Evangelism</option>
                  <option value="Follow-Up/Visitaion Department">Follow up/Visitation</option>
                  <option value="Prayer Department">Prayer</option>
                  <option value="SPI Department">SPI</option>
                  <option value="Sanctuary Department">Sanctuary</option>
                  <option value="Decoration Department">Decorations</option>
               </select>

              <label htmlFor="lsummit-positionInChurch">Position in the Church</label>
              <select
                id="lsummit-positionInChurch"
                name="positionInChurch"
                value={formData.positionInChurch}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select a positionInChurch
                </option>
                <option value="Pastor">Pastor</option>
                <option value="Leader">Leader</option>
                <option value="Worker">Worker</option>
                <option value="Minister">Minister</option>
                <option value="Member">Member</option>
              </select>

              <label htmlFor="lsummit-Student">Are you a student?</label>
              <select
                id="lsummit-Student"
                name="Student"
                value={formData.Student}
                onChange={(e) => {
                  handleChange(e);
                  setStudentStatus(e.target.value);
                }}
                required
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>

              {Student === "Yes" && (
                <div id="lsummit-schoolDetails">
                  <label htmlFor="lsummit-departmentInSchool">
                    Department in School
                  </label>
                  <input
                    type="text"
                    id="lsummit-departmentInSchool"
                    name="departmentInSchool"
                    value={formData.departmentInSchool}
                    onChange={handleChange}
                  />

                  <label htmlFor="lsummit-level">Level</label>
                  <select
                    id="lsummit-level"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                  >
                    <option value="" disabled>
                      Select your level
                    </option>
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                    <option value="500">500 Level</option>
                    <option value="600">600 Level</option>
                  </select>
                </div>
              )}

              <div className="align">
                <button className="lsummit-submit-button" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </>
  );
}
