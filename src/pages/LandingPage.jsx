import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Logo from '../images/logo.png';
import '../css/landingpage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    AOS.init({ duration: 2000 });
  }, []);

  const handleLoginClick = () => {
    navigate('/login'); 
  };

  return (
    <>
      <section className="header-section">
        <div className="header-div">
            <div className="add">
                <img className="logo-img" src={Logo} alt="" />
                <span className="digunec">
                    DIVINE GRACE UNN
                </span>
            </div>
              <button className="login-button js-login-button"  onClick={handleLoginClick}>LOG IN</button>
      </div>
      </section>
          <div data-aos="fade-up" className="hero-container">
      <video className="hero-video" autoPlay muted loop playsInline>
        <source src="/media/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="hero-overlay">
        <img className='overlay-img' src="/logo.png" alt="" />
      </div>
      </div>
      <section data-aos="slide-up" className='welcome-section'>
        <h1 className='welcome'>WELCOME TO DIVINE GRACE UNN CAMPUS <span className='largest'>( the largest )</span></h1>
        <h4 className='motto'>Motto: I can do all things through christ that strengthens me</h4>
        <div className='about-flex'>
           <div className='about-div'>
              <p className='about'>
              At Divine Grace UNN, you're not just attending a service—you’re joining a family. Anchored in Christ, we are a Christ-centered church where prayer is vibrant,
              teaching is clear, and every soul matters. With a heart for soul-winning, we lovingly carry the mission of
              reconciliation and grace into every campus corner. We commit to accuracy in our teaching, striving to reflect God’s
              intent in every sermon. Our church is a place of bold prayer, deep fellowship, and strategic leadership development.
              We believe in leading with integrity and rising as agents of transformation in our world.

                </p>
          </div>

          <div data-aos="slide-right" className='/first-image-div'>
            <img  className='first-image' src="/first image.jpg" alt="" />
          </div>
       </div>
      </section>

         <div data-aos="fade-up" className="who">WHO WE ARE</div>
        <p data-aos="fade-up" className="about">
            Divine Grace UNEC is a Christ-centered church situated in the heart of UNEC.
             We are a family of believers dedicated to worshiping God in spirit and truth, 
             growing in His Word, and impacting our community with the Gospel. 
             Our doors are always open to anyone seeking hope, healing, and a deeper connection with God.
            </p>
    <section>
        <div>
            <p data-aos="fade-up" className="value-p">OUR VALUE&hellip;</p>
            <p data-aos="fade-up" className="knownfor-p">Divine Grace UNN Campus is Known for&hellip;</p>
        </div>
        <div data-aos="fade-up" className="ourvalue-grid">
            <div className="colour-grid">
                <div className="snappic1-div" >
                    <img src="/first image.jpg" alt="" className="snappic1"/>
                </div>
                <div>
                    <p className="soul-p">Soul Winning</p>
                    <p className="soulwriteup-p">Here, soul winning is a command, and the very essence of our existence&hellip; Daily&#44; with fervent zeal and dedication&#44; we embark on the ministry of 
                        reconciling lost souls to the Father&#44; through the expression of love and grace&#33; <span className='italic'> — Philippians 4:6</span></p>
                </div>
            </div>
            <div className="colour-grid">
                <div className="snappic1-div">
                    <img src="/first image.jpg" alt="" className="snappic2"/>
                </div>
                <div>
                    <p className="vision-p">Vision </p>
                    <p className="visionwriteup-p">Develop and deploy transformational leaders as agents of change to the world&#46; <span className='italic'> — Philippians 4:6</span></p>
                </div>
            </div>
        </div>
        <div data-aos="fade-up" className="ourvalue-grid">
            <div className="colour-grid">
                <div className="snappic1-div" >
                    <img src="/first image.jpg" alt="" className="snappic1"/>
                </div>
                <div>
                    <p className="soul-p">Prayer</p>
                    <p className="soulwriteup-p">Prayer is our way of connecting with God, expressing worship,
                         gratitude, and seeking His guidance.It invites His presence and power into our lives.
                         In Divine Grace Unec, we breath prayer for the bible says
                        "Do not be anxious about anything, but in every situation, by prayer and petition, 
                        with thanksgiving, present your requests to God."<span className='italic'> — Philippians 4:6</span></p>
                </div>
            </div>
            <div className="colour-grid">
                <div className="snappic1-div">
                    <img src="/first image.jpg" alt="" className="snappic2"/>
                </div>
                <div>
                    <p className="vision-p">Rightfully dividing the word of God</p>
                    <p className="visionwriteup-p">We rightly divide the Word of God, interpret and apply the Scriptures with care and accuracy,
                         ensuring God's truth is shared as He intended.
                        "Be diligent to present yourself approved to God, 
                        a worker who does not need to be ashamed, rightly dividing the word of truth." <span className='italic'> — Philippians 4:6</span></p>
                </div>
            </div>
        </div>
    </section>
    <section data-aos="fade-up" className="service-sections">
   <div className="service-section">
    <div className="Service">SERVICES</div>
    <div className="Service-time">
        Tuesday (Mid-week Service) <br/> Time <img src="/pngaaa.com-473864.png" alt="" className="time-image"/>: 5:00pm
    </div>
    <div className="Service-time">
        Friday (LSTS)
        <a className="lsts-anchor" href="registerlogin/">Click To Register</a> <br/>Time <img src="/pngaaa.com-473864.png" alt="" className="time-image"/>: 5:00pm
    </div>
    <div className="Service-time">
        Sunday Service <br/> Time <img src="/pngaaa.com-473864.png" alt="" className="time-image"/>: 8:00am
    </div>
    <div>
        <div className="Service-time">
            Venue<img src="/Location_icon_from_Noun_Project.png" alt="" className="time-image"/>: Grace Nation ( Benima )
        </div>
    </div>
    <div className="Service-time">
        <p className="callus">For more enquires call us <img src="/kisspng-computer-icons-telephone-call-5af1f6d96f06b6.4041455015258068094548.png" alt="" className="time-image"/></p>
       <p className="callus">+2348126640203 <br/>+2349060697685 
           <br/>+2349153215320 <br/>+2347041629192 <br/> Email: info@divinegraceunec.comng</p>
    </div>
</div>
</section>
    <footer data-aos="fade-up" className="footer">
        <div className="footer-logo">
            <img className="logo-img" src="/logo.png" alt=""/>
            <span className="digunec">
                DIGUNEC
            </span>
        </div>
        <div className="social-div">
            <a target='blanc' href="https://web.facebook.com/p/Divine-Grace-UNN-Campus-61551659589725/?_rdc=1&_rdr#"><img src="/facebook-logo-2428.png" alt=""/></a>
            <img src="/instagram-logo-8869.png" alt=""/>
            <img src="/twitter-x-blue-logo-round-20859.png" alt=""/>
        </div>
        <div className="copyright-div">
            <p className="copyright">&copy;copyright <b>DIGUNEC</b>&#46; All right reserved</p>
            <p className="design"><i>Designed by Soft Nation ft Smart</i></p>
        </div>
    </footer>

    </>
    
  );
}