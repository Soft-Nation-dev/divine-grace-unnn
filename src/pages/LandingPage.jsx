import React from 'react';
import { useNavigate, Link} from 'react-router-dom';
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
                    DIVINE GRACE UNN CAMPUS
                </span>
            </div>
              <button className="login-button js-login-button"  onClick={handleLoginClick}>LOG IN</button>
      </div>
          </section>
          <div data-aos="fade-up" className='divv'>
              <h1 className='welcome'>WELCOME TO DIVINE GRACE UNN CAMPUS <span className='largest'> the largest </span></h1>
        <p id='motto'>Motto: I can do all things through christ that strengthens me</p>
      <section data-aos="slide-up" className='welcome-section'>
        <div>
           <div className="welcome-about">
              <p className='about'>
                Welcome to Divine Grace UNN Campus&#44; a vibrant community of faith and fellowship located within the University of Nigeria&#44; Nsukka.
              We are delighted to have you in our online space where faith, 
              fellowship, and love converge. At Divine Grace UNN Campus,
               you're not just attending a service, you’re joining a family which is bound by faith in Christ and a shared
               commitment to live out His teachings. Whether you are a first-time visitor,
               a returning friend, or a long-time member of our congregation, we extend to you a warm and heartfelt welcome.

                </p>
          </div>

          <div data-aos="fade-up" className="hero-container">
      <video className="hero-video" autoPlay muted loop playsInline>
        <source src="/divine-grace-unnn/media/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="hero-overlay">
        <img className='overlay-img' src="/divine-grace-unnn/logo.png" alt="" />
      </div>
      </div>
       </div>
      </section>
          </div>

         <div data-aos="fade-up" className="who">WHO WE ARE</div>
        <p data-aos="fade-up" className="about pad">
           Divine Grace UNN Campus is more than just a gathering ,
           it is a family of believers passionately committed to the word of our Lord. 
           We are a Word-based church, devoted to worshiping God in spirit and in truth,
            while being rooted and built up through the power of His Word.
           Our mission is to raise men and women who are grounded in sound doctrine,
            equipped to live victorious Christian lives, and inspired to share the 
            love of Christ wherever they go. We believe that true transformation begins with the Word of God,
             and that is why teaching, studying, and living by the Scriptures remain at the very center of all we do.
            </p>
          <div data-aos="slide-right" className='first-image-div'>
            <img  className='first-image' src="/divine-grace-unnn/first image.jpg" alt="" />
          </div>
    <section>
        <div>
            <p data-aos="fade-up" className="value-p">OUR VALUE&hellip;</p>
            <p data-aos="fade-up" className="knownfor-p">Divine Grace UNN Campus is Known for&hellip;</p>
        </div>
        <div data-aos="fade-up" className="ourvalue-grid">
            <div className="colour-grid">
                <div className="snappic1-div" >
                    <img src="/divine-grace-unnn/soul.jpg" alt="" className="snappic1"/>
                </div>
                <div>
                    <p className="soul-p">Soul Winning</p>
                    <p className="soulwriteup-p">Here, soul winning is a command, and the very essence of our existence&hellip; Daily&#44; with fervent zeal and dedication&#44; we embark on the ministry of 
                        reconciling lost souls to the Father&#44; through the expression of love and grace&#33; <span className='italic'> — 2 Corinthians 5:18-20 (NIV)
                        "All this is from God, who reconciled us to himself through Christ and gave us the ministry of reconciliation… We are therefore Christ’s ambassadors, as though God were making his appeal through us."</span></p>
                </div>
                  </div>
                    <div className="colour-grid">
                <div className="snappic1-div">
                    <img src="/divine-grace-unnn/word1.jpg" alt="" className="snappic2"/>
                </div>
                <div>
                    <p className="vision-p">Rightfully dividing the word of God</p>
                    <p className="visionwriteup-p">We rightly divide the Word of God, interpret and apply the Scriptures with care and accuracy,
                         ensuring God's truth is shared as He intended.<span className='italic'> — 2 Timothy 2:15 (NKJV)
                        "Be diligent to present yourself approved to God, a worker who does not need to be ashamed, rightly dividing the word of truth."</span></p>
                </div>
            </div>

        </div>
        <div data-aos="fade-up" className="ourvalue-grid">
            <div className="colour-grid">
                <div className="snappic1-div" >
                    <img src="/divine-grace-unnn/prayer.jpg" alt="" className="snappic1"/>
                </div>
                <div>
                    <p className="soul-p">Prayer</p>
                    <p className="soulwriteup-p">Prayer is our way of connecting with God, expressing worship,
                         gratitude, and seeking His guidance.It invites His presence and power into our lives.
                         In Divine Grace Unn, we breath prayer for the bible says<span className='italic'> — Philippians 4:6 (NIV)
"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."</span></p>
                </div>
            </div>
          <div className="colour-grid">
                <div className="snappic1-div">
                    <img src="/divine-grace-unnn/leaders.jpg" alt="" className="snappic2"/>
                </div>
                <div>
                    <p className="vision-p">Vision </p>
                    <p className="visionwriteup-p">Develop and deploy transformational leaders as agents of change to the world&#46; <span className='italic'> — 2 Timothy 2:2 (NIV)
"And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others."</span></p>
                </div>
            </div>
        </div>
    </section>
    <section data-aos="fade-up" className="service-sections">
   <div className="service-section">
    <div className="Service">SERVICES</div>
    <div className="Service-time">
        Tuesday (Mid-week Service) <br/> Time <img src="/divine-grace-unnn/pngaaa.com-473864.png" alt="" className="time-image"/>: 5:00pm
        </div>
                  
     <div className="Service-time">
            Venue<img src="/divine-grace-unnn/Location_icon_from_Noun_Project.png" alt="" className="time-image"/>: Grace Nation ( Marlima Upstairs )
        </div>
    <div className="Service-time">
        Friday (LSTS)
        <Link className="lsts-anchor"  to="/login">Click To Register</Link> <br/>Time <img src="/divine-grace-unnn/pngaaa.com-473864.png" alt="" className="time-image"/>: 5:00pm
    </div>
    
      <div className="Service-time">
            Venue<img src="/divine-grace-unnn/Location_icon_from_Noun_Project.png" alt="" className="time-image"/>: Grace Nation ( Benima )
        </div>

    <div className="Service-time">
                      Sunday Service- <br /> Time: <br />
                      <img src="/divine-grace-unnn/pngaaa.com-473864.png" alt="" className="time-image" />: 8:00am - 9am ( First Service )<br/>
                      <img src="/divine-grace-unnn/pngaaa.com-473864.png" alt="" className="time-image" />: 9:00am - 11am ( Second Service )
        
    </div>
    <div>
        <div className="Service-time">
            Venue<img src="/divine-grace-unnn/Location_icon_from_Noun_Project.png" alt="" className="time-image"/>: Grace Nation (Marlima Upstairs)
        </div>
    </div>
    <div className="Service-time">
        <p className="callus">For more enquires call us <img src="/divine-grace-unnn/kisspng-computer-icons-telephone-call-5af1f6d96f06b6.4041455015258068094548.png" alt="" className="time-image"/></p>
       <p className="callus">+2347065274878 <br/>+2348162650708 
           <br/>+2347041629192 <br/>+2347034207220 <br/> Email: info@divinegraceunn.com.ng</p>
    </div>
</div>
</section>
    <footer className="footer">
              <div className='foot'>
                  <div className="footer-logo">
            <img className="logo-img" src="/divine-grace-unnn/logo.png" alt=""/>
            <span className="digunec">
                DIGUNN
            </span>
        </div>
        <div className="social-div">
            <a target='blanc' href="https://web.facebook.com/p/Divine-Grace-UNN-Campus-61551659589725/?_rdc=1&_rdr#"><img src="/divine-grace-unnn/facebook-logo-2428.png" alt=""/></a>
            <img src="/divine-grace-unnn/instagram-logo-8869.png" alt=""/>
            <img src="/divine-grace-unnn/twitter-x-blue-logo-round-20859.png" alt=""/>
        </div>
        <div className="copyright-div">
            <p className="copyright">&copy;copyright <b>DIGUNN</b>&#46; All right reserved</p>
            <p className="design"><i>Designed by Soft Nation & Smart</i></p>
        </div>
        </div>
    </footer>

    </>
    
  );
}