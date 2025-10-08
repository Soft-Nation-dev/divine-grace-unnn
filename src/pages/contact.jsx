import React, { useState } from "react";
import Header from "../components/header";
import LoadingOverlay from "../components/overlay";
import "../css/contact.css";
import { motion } from "framer-motion";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaWhatsapp,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overlayText, setOverlayText] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setLoading(true);
    setOverlayText("Sending...");
    console.log(formData);

    setTimeout(() => {
      setOverlayText("Loading...");
    }, 2000);

    setTimeout(() => {
      setOverlayText(
        `✅ Message sent successfully! We will get back to you via the email you provided, ${formData.email}`
      );
      setSubmitted(true);

      setTimeout(() => {
        setLoading(false);
        setSubmitted(false);
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      }, 3000);
    }, 4000);
  };

  return (
    <>
      <Header />
      {loading && <LoadingOverlay text={overlayText} />}
      <div className="contact-page">
        <motion.h1
          className="contact-h1"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Contact Us
        </motion.h1>
        <p className="contact-p">
          We’d love to hear from you! Whether you have a prayer request, a
          question, or just want to say hello, we’re here for you.
        </p>

        <div>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="send">Send us a Message</h2>
            <form className="formm" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Select a Subject</option>
                <option value="Prayer Request">Prayer Request</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Leadership Connect">Leadership Connect</option>
                <option value="Event Info">Event Info</option>
              </select>
              <textarea
                name="message"
                placeholder="Your Message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              />
              <div className="align">
                <button type="submit" className="send-butt">
                  Send Message
                </button>
              </div>
              {submitted && <p>✅ Message Sent Successfully!</p>}
            </form>
          </motion.div>

    
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="contact-section">
              <div className="contact-card">
                <h2 className="contact-title">Get in Touch</h2>
                <p className="contact-subtitle">
                  You can also reach us directly through the following channels.
                </p>

                <div className="contact-info">
                  <div className="contact-item glass-tile">
                    <FaPhone className="contact-icon" />
                    <a href="tel:+2348141787294">+234 814 178 7294</a>
                  </div>

                  <div className="contact-item glass-tile">
                    <FaEnvelope className="contact-icon" />
                    <a href="mailto:divinegraceunn@gmail.com">
                      divinegraceunn@gmail.com
                    </a>
                  </div>

                  <div className="contact-item glass-tile">
                    <FaMapMarkerAlt className="contact-icon" />
                    <span>University of Nigeria Nsukka, Enugu, Nigeria</span>
                  </div>
                </div>
              </div>

              <div className="contact-card">
                <h2 className="contact-title">Connect with us</h2>
                <div className="social-links">
                  <a href="https://www.facebook.com/groups/2059856247615557/?ref=share&mibextid=NSMWBT" className="glass-social">
                    <FaFacebookF className="fa-icon" />
                  </a>
                  <a href="https://www.instagram.com/divinegraceunncampus?igsh=ZHI5ejkwN3J4cWtm" className="glass-social">
                    <FaInstagram className="fa-icon" />
                  </a>
                  <a href="#" className="glass-social">
                    <FaTwitter className="fa-icon" />
                  </a>
                  <a
                    href="https://wa.me/2348141787294"
                    className="glass-social"
                  >
                    <FaWhatsapp className="fa-icon" />
                  </a>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="map-container">
            <iframe
              title="church-map"
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d12668.123456!2d7.39577!3d6.85783!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsukka!5e0!3m2!1sen!2sng!4v1699999999999!5m2!1sen!2sng"
              width="100%"
              height="250"
              allowFullScreen=""
              loading="eager"
              className="border-0"
            ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
