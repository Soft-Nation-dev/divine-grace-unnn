import '../css/header.css';
import '../css/landingpage.css';
import Logo from '../images/logo.png';

import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, LogOut} from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-top">
        <div className="right-section">
          <div className="logo-div">
            <img id="logo-img" src={Logo} alt="logo"/>
            <span id="digunec-logo">DIVINE GRACE UNN</span>
          </div>
        </div>

        <div className="left-section">
          <div id="divider"></div>
          <div id="dashboard">DASHBOARD</div>
        </div>
        
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="nav"
          >
            <ul className="nav-links">
              {[
                { name: "Dashboard", path: "/dashboard" },
                { name: "Messages", path: "/messages" },
                { name: "Register for LSTS", path: "/register-for-lsts" },
                { name: "Submit a prayer request", path: "/submit-a-prayer-request" },
                { name: "Register for the leadership surmit", path: "/register-for-the-leadership-surmit" },
                { name: "Contact us", path: "/contact-us" },
                { name: "About DIGUNN", path: "/about-digunn" }
              ].map((item, i) => (
                <motion.li
                  key={item.name}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
                >
                  <a
                    href={item.path}
                    className={`nav-link ${
                      location.pathname === item.path ? "active" : ""
                    }`}
                  >
                    {item.name}
                  </a>
                </motion.li>
              ))}

              
               <motion.li
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="logout-btn"
              >
                <button className="logout">
                  <LogOut size={22} /> Logout
                </button>
              </motion.li>

              <div className="nav-section">
                <div className="nav-div">
                  <img id="nav-img" src={Logo} alt="logo"/>
                  <span id="nav-digunec-logo">
                    DIVINE GRACE UNN <span className='largest'>( the largest )</span>
                  </span>
                </div>
              </div>

            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
