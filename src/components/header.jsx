import '../css/header.css';
import '../css/landingpage.css';
import Logo from '../images/logo.png';
import FacebookLogo from "../images/facebook-logo-2428.png";
import InstagramLogo from "../images/instagram-logo-8869.png";
import TwitterLogo from "../images/twitter-x-blue-logo-round-20859.png";
import useSessionCheck from './sessioncheck';
import React, { useState } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, LogOut } from "lucide-react";

export default function Header() {
  useSessionCheck();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitles = {
    "/dashboard": "DASHBOARD",
    "/messages": "MESSAGES",
    "/registerforlsts": "LSTS",
    "/submitaprayerrequest": "PRAYERS",
    "/leadershipsurmit": "SUMMIT",
    "/contact": "CONTACT US",
    "/about": "ABOUT DIGUNN",
    "/admin": "ADMIN",
    "/": "HOME"
  };

  const currentPage = pageTitles[location.pathname] || "DASHBOARD";

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="right-section">
          <div className="logo-div">
            <img id="logo-img" src={Logo} alt="logo" />
            <span id="digunec-logo">DIVINE GRACE UNN</span>
          </div>
        </div>

        <div className="left-section">
          <div id="divider"></div>
          <div id="dashboard">{currentPage}</div>
        </div>

        {/* Menu toggle button */}
        <motion.button
          key={menuOpen ? "close" : "open"}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => setMenuOpen(!menuOpen)}
          className="menu-toggle"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            key="menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="nav"
          >
            <ul className="nav-links">
              {[
                { name: "DASHBOARD", path: "/dashboard" },
                { name: "MESSAGES", path: "/messages" },
                { name: "REGISTER FOR LSTS", path: "/registerforlsts" },
                { name: "SUBMIT PRAYER REQUEST", path: "/submitaprayerrequest" },
                { name: "LEADERSHIP SUMMIT", path: "/leadershipsurmit" },
                { name: "CONTACT US", path: "/contact" },
                { name: "ADMIN", path: "/admin" },
                { name: "ABOUT DIGUNN", path: "/about" },
                { name: "HOME", path: "/", clearToken: true }
              ].map((item, i) => (
                <motion.li
                  key={item.name}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: i * 0.1,
                    duration: 0.4,
                    ease: "easeOut"
                  }}
                >
                  <div className="di">
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        if (item.clearToken) {
                          sessionStorage.removeItem("authToken");
                        }
                        setMenuOpen(false);
                      }}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                    >
                      {item.name}
                    </NavLink>
                  </div>
                </motion.li>
              ))}

              <motion.li
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="logout-btn"
                onClick={handleLogout}
              >
                <button className="logout">
                  <LogOut size={22} /> Logout
                </button>
              </motion.li>

              <div className="footer nav-section">
                <div className="foot">
                  <div>
                    <img className="logo-img" src={Logo} alt="DIGUNEC Logo" />
                    <span className="digunec">DIGUNN</span>
                  </div>

                  <div className="social-div">
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://web.facebook.com/p/Divine-Grace-UNN-Campus-61551659589725/?_rdc=1&_rdr#"
                    >
                      <img src={FacebookLogo} alt="Facebook" />
                    </a>
                    <img src={InstagramLogo} alt="Instagram" />
                    <img src={TwitterLogo} alt="Twitter" />
                  </div>
                </div>
              </div>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
