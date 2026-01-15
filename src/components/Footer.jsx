import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer p-mt-4">
      <div className="container">
        <div className="left"></div>
        <div className="center">© {year} COONALTRAGAS. Todos los derechos reservados.</div>
        <div className="right">
        </div>
      </div>
    </footer>
  );
};

export default Footer;
