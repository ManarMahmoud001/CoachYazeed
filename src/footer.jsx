import { Instagram, Youtube, Facebook, Music2 } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/" className="brand-lockup">
              <img
                src="/brand/logo.png"
                alt="Yazeed Flifel"
                className="brand-mark"
              />
            </a>

            <p>
              Coach Yazeed Felifil is a Jordanian Classic Physique athlete
              and online fitness coach, crowned Jordan's national champion
              in 2024 and 2025. Based out of Glory Gym, he combines
              hands-on training expertise with hard-won competition
              experience to guide clients through strength, physique, and
              nutrition goals. Through his growing social media presence,
              he shares practical training tips, nutrition insights, and
              behind-the-scenes glimpses of his competitive journey.
            </p>
          </div>

          <div>
            <div className="footer-heading">QUICK LINKS</div>

            <div className="footer-links">
              <a href="/#home">Home</a>
              <a href="/#coaching">Coaching</a>
              <a href="/#nutrition">Nutrition</a>
              <a href="/#consultations">Consultations</a>
            </div>
          </div>

          <div>
            <div className="footer-heading">GET STARTED</div>

            <div className="get-started-content">
              <a href="/#coaching" className="start-training">
                Start Training
                <span>→</span>
              </a>

              <div className="social-section">
                <div className="social-title">Follow on Social Media</div>

                <div className="socials">
                  <a
                    href="https://www.instagram.com/yazeedflifel/"
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram size={20} strokeWidth={1.8} />
                  </a>

                  <a
                    href="https://www.tiktok.com/@yazeedflifel"
                    aria-label="TikTok"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Music2 size={20} strokeWidth={1.8} />
                  </a>

                  <a
                    href="https://www.youtube.com/@yazeedflifel"
                    aria-label="YouTube"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Youtube size={20} strokeWidth={1.8} />
                  </a>

                  <a
                    href="https://www.facebook.com/yazeedflifel"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook size={20} strokeWidth={1.8} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 Yazeed Flifel. All rights reserved. by{" "}
            <a
              href="https://doneofficial.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              {" "}
              Done
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
