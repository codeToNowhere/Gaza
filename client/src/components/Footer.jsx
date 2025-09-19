// Footer.jsx
import "../styles/components/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>&copy; {currentYear} AID GAZA. All rights reserverd.</p>
    </footer>
  );
};

export default Footer;
