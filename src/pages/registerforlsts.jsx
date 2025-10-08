import React, { useState } from "react";
import Header from "../components/header";
import LoadingOverlay from "../components/overlay";
import "../css/registerforlsts.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Logo from "/web-app-manifest-512x512.png";
import HeroImg from "../images/lsts-training-lsta1.jpg";
import First from "../images/lsts-training-lsta1.jpg";
import Second from "../images/vision-image-lsts.jpg";
import { FaCalendarAlt, FaBookOpen, FaUsers, FaInvision } from "react-icons/fa";
import {LuLightbulb} from "react-icons/lu";
import Typewriter from "typewriter-effect";

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
    
     const payload = {
        Title: formData.title,
        Surname: formData.surname,
        OtherNames: formData.otherNames,
        PhoneNumber: formData.phoneNumber,
        Email: formData.email,
        ResidentialAddress: formData.residentialAddress,
        Gender: formData.gender,
        Baptized: formData.baptized,
        DepartmentInChurch: formData.departmentInChurch.join(", "),
        PositionInChurch: formData.positionInChurch,
        Student: formData.Student,
        VisionGoals: formData.visionGoals,
        ...(formData.Student === "Yes"
          ? {
              DepartmentInSchool: formData.departmentInSchool,
              Level: parseInt(formData.level) || 0,
            }
          : {
              DepartmentInSchool: "",
              Level: 0,
            }),
      };

    const body = payload
    console.log("Submitting form data:", body);


    const res = await fetch(
      "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/api/LstsForm/LSTSFORM",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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
            setShowForm(false);
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
                <strong>Name:</strong> {receiptData.title} {receiptData.surname}{" "}
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
          <section className="lsts-landing-section">
            <div className="lsts-landing">
              <div>
                <h1 className="lstsf-h1">Leadership, Service & Training Servce (LSTS)</h1>
              </div>
              <div className="lstss-hero-image">
                <img src={ HeroImg } alt="" />
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
              
              <button className="proceed-btn" onClick={() => {
                setShowForm(true) 
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}>
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
                    <img src={ First } alt="" />
                     </div>
                      <div className="lsts-info">
                        <div>
                            <div className="lsts-item">
                            <FaCalendarAlt className="lsts-icon" />
                               
                              <p>
                                <span className="lsts-title">When & Where?</span> <br />
                                Every Friday by 5pm at Grace Nation, Benima Hall.</p>
                          
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
                                All believers seeking to grow in leadership and stewardship.</p>
                            
                          </div>
                           </div>
                        </div>
                  </div>


              </div>

              <div className="our-vision-div">
                <h1 className="our-vision">
                  <LuLightbulb className="lsts-icon"  /> Our Vision
                </h1>
                <div>
                  <p className="lsts-intro">
                    God, through His servant OLUCHI JAPHAT ANIAGWU, raises, empowers, and equips transformational
                    leaders to become visionary agents of change. These are people who embody integrity and courage,
                    challenge the status quo, inspire others, and bring innovative, value-driven solutions to the world’s pressing issues.
                  </p>
                  <div className="lstss-hero-image">
                    <img src={ Second } alt="" />
                  </div>
                </div>
              </div>

              <div>
                <h1>
                  Ready to Begin Your Leadership Journey?
                </h1>
                <h4>
                  Register now for our upcoming LSTS session —
                  it's free and your first step toward impactful leadership!
                </h4>

                <div>
                  <button className="proceed-btn" onClick={() => {
                    setShowForm(true)
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}>
                      Register For LSTS
                    </button>
                </div>
              </div>


                 <footer className="footer">
                    <div className='foot'>
                        <div className="footer-logo">
                  <img className="logo-img" src="/logo.png" alt=""/>
                  <span className="digunec">
                      DIGUNN
                  </span>
                     </div>
                    <div className="social-div">
                        <a target='blanc' href="https://web.facebook.com/p/Divine-Grace-UNN-Campus-61551659589725/?_rdc=1&_rdr#"><img src="/facebook-logo-2428.png" alt=""/></a>
                        <img src="/instagram-logo-8869.png" alt=""/>
                        <img src="/twitter-x-blue-logo-round-20859.png" alt=""/>
                    </div>
                    <div className="copyright-div">
                        <p className="copyright">&copy;copyright <b>DIGUNN</b>&#46; All right reserved</p>
                        <p className="design"><i>Designed by Soft Nation & Smart</i></p>
                    </div>
                    </div>
            </footer>

          </div>
          
          </section>
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
                    <option value="" disabled>
                      Select option
                    </option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                  

                  {formData.Student === "Yes" && (
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
