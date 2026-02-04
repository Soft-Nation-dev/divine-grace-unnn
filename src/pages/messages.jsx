import React, { useState, useRef, useEffect } from "react";
import Header from "../components/header";
import "../images/css/messages.css";
import LoadingOverlay from "../components/overlay";
import { fetchWithAuth, API_ENDPOINTS, getAuthToken } from "../config/api";
import API_BASE_URL from "../config/api";
// import { fetchWithAuth, API_ENDPOINTS, getAuthToken } from "../config/api";
// import API_BASE_URL from "../config/api";

export default function MessagesSection() {
  const [activeCategory, setActiveCategory] = useState("sunday");
  const [fetchedMessages, setFetchedMessages] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  const sundayRef = useRef(null);
  const midweekRef = useRef(null);
  const lstsRef = useRef(null);

  const audioSrcFor = (msg) => {
    if (!msg) return "";
    if (msg.file_url?.startsWith("http")) return msg.file_url;
    if (msg.filePath?.startsWith("http")) return msg.filePath;
    if (msg.audioUrl?.startsWith("http")) return msg.audioUrl;
    return `${API_BASE_URL}/${msg.file_url || msg.filePath}`.replace(
      /([^:]\/)\/+/g,
      "$1"
    );
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setFetchError("");

      try {
        const res = await fetchWithAuth(API_ENDPOINTS.GET_PUBLIC_MESSAGES);

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let message = text || `Failed to fetch messages (${res.status})`;
          if (res.status === 401) message = "Unauthorized — please log in again.";
          if (res.status === 404) message = "No messages found on the server.";
          throw new Error(message);
        }

        const data = await res.json();
        console.log("Fetched messages:", data);

        const sorted = Array.isArray(data.data || data)
          ? (data.data || data).sort(
              (a, b) =>
                new Date(b.date || b.created_at || b.createdAt) -
                new Date(a.date || a.created_at || a.createdAt)
            )
          : [];

        setFetchedMessages(sorted);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setFetchError(err.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchMessages();
    }
  }, []);

  const categorizeFetchedMessages = () => {
    const categories = { sunday: [], midweek: [], lsts: [] };

    fetchedMessages.forEach((msg) => {
      const cat = msg.category?.toLowerCase() || "";

      const category = cat.includes("sunday")
        ? "sunday"
        : cat.includes("midweek")
        ? "midweek"
        : cat.includes("friday") || cat.includes("lsts")
        ? "lsts"
        : null;

      if (category) {
        categories[category].push({
          id: msg.id,
          title: msg.title ?? msg.name ?? "Untitled",
          preacher: msg.preacher ?? msg.speaker ?? msg.uploadedBy ?? "Unknown",
          date:
            msg.date ??
            msg.uploadedAt ??
            msg.createdAt ??
            new Date().toLocaleDateString(),
          audio: audioSrcFor(msg),
        });
      }
    });

    Object.keys(categories).forEach((key) => {
      categories[key].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
    });

    return categories;
  };

  const categorized = categorizeFetchedMessages();

  const handleCategoryClick = (category, ref) => {
    setActiveCategory(category);
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildLatestList = () => {
    if (!Array.isArray(fetchedMessages) || fetchedMessages.length === 0)
      return [];
    return fetchedMessages.slice(0, 20).map((m) => ({
      id: m.id,
      title: m.title ?? m.name ?? "Untitled",
      preacher: m.preacher ?? m.speaker ?? m.uploadedBy ?? "",
      date:
        m.date ??
        m.uploadedAt ??
        m.submittedAt ??
        (m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ""),
      audio: audioSrcFor(m),
    }));
  };

  const handleFetchedDownload = async (id, filename) => {
  const token = getAuthToken();
  if (!token) {
    setFetchError("Please log in first to download messages.");
    return;
  }

  setLoading(true);
  setFetchError("");

  try {
    const res = await fetchWithAuth(`${API_ENDPOINTS.DELETE_MESSAGE(id).replace('/messages/', '/messages/download/')}`);

    if (!res.ok) {
      let msg = `Download failed (${res.status})`;
      if (res.status === 404) msg = "Message file not found on the server.";
      if (res.status === 401) msg = "Unauthorized — please log in again.";
      throw new Error(msg);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "audio.mp3";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download error:", err);
    setFetchError(err.message || "An error occurred during download.");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <Header />
      <div className="main-content" id="main">
        <section className="messages-section">
          <div className="laalign">
            <div className="latest-messages-container">
              <h2>Latest Messages </h2>

              <div className="latest-messages" id="latest-messages">
                {loading && <p>Loading messages...</p>}
                {fetchError && <p className="error">Error: {fetchError}</p>}

                {buildLatestList().map((msg, index) => (
                  <div key={msg.id} className="message-card">
                    <div className="message-number">#{index + 1}</div>
                    <p className="message-title">
                      <strong>{msg.title}</strong>
                    </p>
                    {msg.preacher && <p className="preacher">By {msg.preacher}</p>}
                    <p className="date">{msg.date}</p>

                    {msg.audio ? (
                      <audio controls>
                        <source src={msg.audio} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    ) : (
                      <p className="error">No audio available</p>
                    )}

                    <button
                      className="download-btn"
                      onClick={() =>
                        handleFetchedDownload(msg.id, msg.title + ".mp3")
                      }
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ✅ Category Buttons */}
          <div className="category-buttons">
            <button
              className={`category-btn ${
                activeCategory === "sunday" ? "active" : ""
              }`}
              onClick={() => handleCategoryClick("sunday", sundayRef)}
            >
              Sunday Service Messages
            </button>
            <button
              className={`category-btn ${
                activeCategory === "midweek" ? "active" : ""
              }`}
              onClick={() => handleCategoryClick("midweek", midweekRef)}
            >
              Midweek Service Messages
            </button>
            <button
              className={`category-btn ${
                activeCategory === "lsts" ? "active" : ""
              }`}
              onClick={() => handleCategoryClick("lsts", lstsRef)}
            >
              LSTS Messages
            </button>
          </div>

          {/* ✅ Categories Display */}
          <div className="message-categories">
            {["sunday", "midweek", "lsts"].map((cat) => (
              <div
                key={cat}
                id={`${cat}-messages`}
                ref={
                  cat === "sunday"
                    ? sundayRef
                    : cat === "midweek"
                    ? midweekRef
                    : lstsRef
                }
                className="message-category"
                style={{ display: activeCategory === cat ? "block" : "none" }}
              >
                <h2>{cat.toUpperCase()} Messages</h2>

                {categorized[cat].length > 0 ? (
                  categorized[cat].map((msg, index) => (
                    <div key={msg.id} className="audio-card">
                      <div className="message-number">#{index + 1}</div>
                      <h4 className="message-title">{msg.title}</h4>
                      <p>
                        <strong>Speaker:</strong> {msg.preacher}
                      </p>
                      <p className="date">
                        <strong>Date:</strong> {msg.date}
                      </p>
                      <audio controls>
                        <source src={msg.audio} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                      <button
                        className="download-btn"
                        onClick={() =>
                          handleFetchedDownload(msg.id, msg.title + ".mp3")
                        }
                      >
                        Download
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="error">No {cat} messages available yet.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {loading && <LoadingOverlay text="Downloading message..." />}
        {fetchError && (
          <div className="error-banner">
            <p>{fetchError}</p>
          </div>
        )}

    </>
  );
}
