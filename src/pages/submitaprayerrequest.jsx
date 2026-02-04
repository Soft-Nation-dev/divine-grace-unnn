import React, { useState } from "react";
import Header from "../components/header";
import LoadingOverlay from "../components/overlay";
import "../images/css/prayer.css";
import { fetchWithAuth, API_ENDPOINTS, getAuthToken } from "../config/api";

export default function SubmitPrayerRequest() {
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); 
  const [submissionText, setSubmissionText] = useState("");
  const [prayerText, setPrayerText] = useState("");

  const handleSubmit = async () => {
    setSubmissionStatus(null);

    const token = getAuthToken();
    if (!token) {
      setSubmissionStatus("error");
      setSubmissionText("Unauthorized — please log in.");
      return;
    }

    if (!prayerText.trim()) {
      setSubmissionStatus("error");
      setSubmissionText("Prayer request cannot be empty.");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.POST_PRAYER, {
        method: "POST",
        body: JSON.stringify({ 
          name: "User", 
          email: "user@example.com",
          prayer_request: prayerText 
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const message =
          typeof errData === "string"
            ? errData
            : errData?.message ||
              errData?.error ||
              `Failed to submit prayer (status ${res.status})`;

        setSubmissionStatus("error");
        setSubmissionText(message);
        return;
      }

      await res.json().catch(() => ({}));
      setSubmissionStatus("success");
      setSubmissionText("Your prayer request has been submitted 🙏");

      setPrayerText("");

      setTimeout(() => {
        setSubmissionStatus(null);
        setSubmissionText("");
      }, 3000);
    } catch (err) {
      const msg = err?.message || "Failed to submit prayer";
      setSubmissionStatus("error");
      setSubmissionText(msg);
      
    } finally {
        setLoading(false);
         setTimeout(() => {
        setSubmissionStatus(null);
        setSubmissionText("");
      }, 3000);
    }
  };

  return (
    <>
      <Header />
      {loading && <LoadingOverlay status="loading" text="Submitting prayer..." />}

      <section className="main-content">
        {submissionStatus === "success" && (
          <div className="result-screen success">
            <div className="checkmark">
              <svg
                className="checkmark__circle"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 52 52"
              >
                <circle cx="26" cy="26" r="25" fill="none" />
              </svg>
              <svg
                className="checkmark__check"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 52 52"
              >
                <path fill="none" d="M14 27l7 7 17-17" />
              </svg>
            </div>
            <h2>{submissionText}</h2>
          </div>
        )}

        {submissionStatus === "error" && (
          <div className="result-screen error">
            <div className="icon">❌</div>
            <h2>{submissionText}</h2>
          </div>
        )}

        {!submissionStatus && (
          <div className="mains-prayer-div">
            <h2 className="prayer-h2">
              Write your prayer request in the field below
            </h2>
            <div className="container">
              <textarea
                className="big-textarea"
                placeholder="Start typing here..."
                value={prayerText}
                onChange={(e) => setPrayerText(e.target.value)}
              ></textarea>
            </div>
            <div className="submit-button-div">
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "SUBMIT"}
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
