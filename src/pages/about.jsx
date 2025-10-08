import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/header";
import '../css/about.css';
import Japhat from "../images/test-background-2.jpg"
export default function About() {
    return (
        <>
            <Header />
    <div className="about-container">
      <section className="about-section leader-section glass-card">
        <h2>MEET OUR PASTOR</h2>
        <div className="leader-card">
          <img className="lead-img" src={Japhat} alt="Pastor Oluchi Japhat Aniagu" />
          <div>
            <h3>Pastor Oluchi Japhat Aniagu</h3>
            <p>
             Meet Our Host pastor and shepherd at Divine Grace UNN Campus, 
              committed to teaching God’s Word, raising leaders, and 
              ensuring that students encounter the transforming power of the Holy Spirit.
            </p>
          </div>
        </div>
      </section>
      <section className="about-hero">
        <h1>About Divine Grace UNN Campus</h1>
        <p>
          At Divine Grace UNN Campus, we are more than just a gathering, we are a vibrant family of believers,
           deeply rooted in the love of Christ and united by a common passion: to see the gospel of Jesus Christ transform
            lives on our campus and beyond. As part of the larger body of Christ, we believe that the university environment is
             not only a place of academic pursuit but also a fertile ground for spiritual awakening, discipleship, and kingdom influence.
            We are committed to being a spiritual home away from home for students of the University of Nigeria, Nsukka. In a world filled 
            with pressure, distractions, and challenges, we stand as a beacon of light and hope, providing a community where faith thrives, love abounds, 
            and purpose is discovered. Every service, gathering, and outreach we organize is centered on pointing people to Jesus, the author and finisher of our faith.
            Our vision is not just to gather crowds but to raise a generation of Spirit-filled leaders who will stand out in their fields, 
            not only as academic achievers but also as godly men and women of influence. We believe that students are not only the
             leaders of tomorrow but also the torchbearers of today, called to shape culture, define values, and impact society with the life-changing message of Christ.
            We nurture this vision through intentional discipleship, dynamic worship experiences, fervent prayer, 
            and sound teaching of God’s Word. Here, faith is not passive but alive, expressed in acts of service,
            campus evangelism, and leadership development. We encourage everyone who fellowships with us to discover
            their God-given gifts and use them to glorify Christ and serve humanity.
            Above all, we see ourselves as a family, bound together by the love of God. In our fellowship, you will 
            find brothers and sisters ready to pray with you, walk with you, and celebrate the victories of life with you.
             We are a community where burdens are lifted, joy is shared, and every individual is valued as a vital part of the body of Christ.
            At Divine Grace UNN Campus, we are passionate about one thing: Jesus. Everything we do flows out of a desire to know
             Him more, to reflect His love, and to make Him known to the world.
        </p>
      </section>

      {/* Vision & Mission */}
      <section className="about-section glass-card">
        <h2>Our Vision</h2>
        <p className="write">
          At Divine Grace UNN, our heartbeat is to raise a generation of Spirit-filled leaders, 
          men and women who are not only passionate about the gospel of Jesus Christ but are also equipped 
          to influence every sphere of society for His glory.
          We believe that true leadership flows from the presence of God. That is why we are committed to nurturing young 
          people in the Word, prayer, and the power of the Holy Spirit, so that they emerge as leaders of integrity, wisdom, and courage.
          Our vision goes beyond the walls of the church, we envision Spirit-filled students who will go on to transform their
          campuses, workplaces, families, and communities with Kingdom values. Leaders who will stand as beacons of light in politics,
          education, business, science, arts, and media, shaping culture and advancing the cause of Christ in their generation.
         This is not just about raising leaders, it’s about raising Kingdom ambassadors, vessels of revival, and agents of change who will
          carry the fire of God to the nations.
        </p>
      </section>

      <section className="about-section glass-card">
        <h2>Our Mission</h2>
        <p>
          Our mission is clear and unwavering, to win souls, disciple students, and prepare them 
          for kingdom service on campus and beyond.
          We are passionate about the Great Commission, and our first call is to reach out in love, bringing 
          students into a life changing encounter with Jesus Christ. Every soul is precious, and every life has a divine purpose.
          But we don’t stop at winning souls, we are committed to discipleship. Through teaching, mentoring, and spiritual fellowship,
          we walk with students as they grow in faith, character, and leadership. We believe that discipleship is the key to building
          strong believers who can stand firm in a world of challenges.
          Finally, we are raising men and women for kingdom service. On campus, in their future careers, and in every
          sphere of life, our students are equipped to live out their faith boldly and to influence the world for Christ.
          From lecture halls to boardrooms, from prayer meetings to national platforms, they are prepared to shine as ambassadors of God’s Kingdom.
          This is our calling. This is our mission. To win, to disciple, and to send forth leaders who will serve the King with passion and purpose.
        </p>
      </section>

      <section className="about-section">
        <h2>Our Story</h2>
        <p className="about-p">
         Divine Grace UNN Campus began humbly as a small fellowship of passionate believers with a burning desire to know God 
         and make Him known. What started as a gathering of students hungry for the presence of God has, by His abundant grace,
         blossomed into a vibrant and thriving church community.
        Over the years, this family has been a spiritual home for countless students. Lives have been transformed, destinies have been awakened,
        and many have discovered their God-given purpose. Through worship, prayer, teaching, and fellowship, students have encountered the power
        and love of Christ in life-changing ways.
        Today, Divine Grace UNN Campus continues to be a beacon of light on campus—a place where faith is nurtured, leaders are raised,
        and the gospel is proclaimed with boldness. More than just a church, it is a family, equipping students not only for excellence on 
        campus but also for impact beyond the walls of the university.
        </p>
      </section>

      <section className="about-section values-section">
        <h2>Our Core Values</h2>
        <ul className="values-ul">
          <li>Faith in Jesus Christ</li>
          <li>Love and Fellowship</li>
          <li>Prayer and the Word</li>
          <li>Discipleship and Spiritual Growth</li>
          <li>Excellence in Service</li>
        </ul>
          </section>
          
      <section className="about-cta">
        <h2>You’re Welcome Here!</h2>
        <p>
          Whether you are a student, staff, or visitor, 
          you are invited to fellowship with us and experience God’s love.
        </p>
        <Link to="/contact"className="cta-btn">Join Us</Link>
      </section>
    </div>
    </>
  );
}
