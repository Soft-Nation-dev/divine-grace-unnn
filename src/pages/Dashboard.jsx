import React, { useEffect, useState } from "react";
import "../images/css/homepage.css";
import Header from "../components/header";
import announcementImg from "../images/annocement_image-removebg-preview.png";
import Typewriter from "typewriter-effect";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth, API_ENDPOINTS } from "../config/api";

export default function Dashboard() {
  
  const navigate = useNavigate();

  const [userDisplay, setUserDisplay] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(API_ENDPOINTS.PROFILE);

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();

        const profile = data.user || data;
        const fullName =
          profile.full_name ||
          profile.display_name ||
          profile["Display name "] ||
          profile.fullName ||
          "";
        const title = profile.title || "";
        
        const nameParts = fullName.trim().split(" ");
        let middleName = fullName;
        if (nameParts.length >= 3) {
          middleName = nameParts.slice(1, -1).join(" ");
        } else if (nameParts.length === 2) {
          middleName = nameParts[0];
        }
        
        const displayName = title ? `${title} ${middleName}`.trim() : middleName;
        setUserDisplay(displayName);
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <>
      <Header />
      <main className="hero-section">
        <div className="welcome-div font-fam">
          <section className="welcome-sectionn">
            <h2>
              <span className="user">
                <Typewriter
                  options={{
                    strings: [
                      `Welcome back ${userDisplay}`,
                      "We are delighted to have you back",
                      "Remember to register for LSTS",
                    ],
                    autoStart: true,
                    loop: true,
                  }}
                />
              </span>
            </h2>
          </section>
        </div>

        <div className="cards-grid">
          <Card
            title="Click the button below to register for lsts, Registration is free. Come along with your registartion recept"
            action="Register for LSTS"
            onClick={() => navigate("/registerforlsts")}
          />
          <Card
            title="Do you have a prayer request? Click the button below to submit a prayer request"
            action="Submit a prayer request"
            onClick={() => navigate("/submitaprayerrequest")}
          />
          <Card
            title="Click the button below to register for the leadership summit coming up on the 22nd to 25th of October"
            action="Register for the leadership summit"
            onClick={() => navigate("/leadershipsurmit")}
          />
          <Card
            title="Do you need someone to talk to? Click the button below to connect with the leadership of the church"
            action="Click to connect"
            onClick={() =>
              (window.location.href = "https://wa.me/2348141787294")
            }
          />
        </div>

        <section className="announcement-section">
          <h3>Announcements</h3>
          <div className="announcement-card">
            <img
              className="anouncement-img"
              src={announcementImg}
              alt="Announcements"
            />
            <p className="font-fam">All updates will appear here</p>
          </div>
        </section>

        <footer className="footer">
          <div className="foot">
            <div className="footer-logo">
              <img
                className="logo-img"
                src="/logo.png"
                alt=""
              />
              <span className="digunec">DIGUNN</span>
            </div>
            <div className="social-div">
              <a
                target="blanc"
                href="https://web.facebook.com/p/Divine-Grace-UNN-Campus-61551659589725/?_rdc=1&_rdr#"
              >
                <img
                  src="/facebook-logo-2428.png"
                  alt=""
                />
              </a>
              <img src="/instagram-logo-8869.png" alt="" />
              <img
                src="/twitter-x-blue-logo-round-20859.png"
                alt=""
              />
            </div>
            <div className="copyright-div">
              <p className="copyright">
                &copy;copyright <b>DIGUNN</b>&#46; All right reserved
              </p>
              <p className="design">
                <i>Designed by Soft Nation & Smart</i>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

function Card({ title, action, onClick }) {
  return (
    <div className="action-card">
      <p className="title">{title}</p>
      <button className="butt" onClick={onClick}>
        {action}
      </button>
    </div>
  );
}
