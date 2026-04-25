import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => (
  <footer className="bg-gradient-dark text-secondary-foreground">
    <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
      <div>
        <h3 className="font-display text-xl font-bold text-primary">Mangalore Sports Meet</h3>
        <p className="mt-3 text-sm text-secondary-foreground/70">
          The grand inter-college sports & games festival of 2026 — celebrating speed, strength and spirit.
        </p>
      </div>

      <div>
        <h4 className="mb-4 font-display font-semibold">Quick Links</h4>
        <ul className="space-y-2 text-sm text-secondary-foreground/70">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <li><Link to="/intercollege" className="hover:text-primary">Intercollege Fest</Link></li>
          <li><Link to="/bgmi" className="hover:text-primary">BGMI Championship</Link></li>
          <li><Link to="/marathon" className="hover:text-primary">Marathon</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="mb-4 font-display font-semibold">Contact</h4>
        <ul className="space-y-3 text-sm text-secondary-foreground/70">
          <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 text-primary" /> enquiry@ssccmangalore.co.in</li>
          <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-primary" /> +91 7618783300</li>
          <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary" /> 6th floor Paradign Plaza, Pandeshwar, Mangalore</li>
        </ul>
      </div>

      <div>
        <h4 className="mb-4 font-display font-semibold">Follow</h4>
        <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-smooth hover:scale-110">
          <Instagram className="h-5 w-5" />
        </a>
      </div>
    </div>
    <div className="border-t border-white/10 py-5 text-center text-xs text-secondary-foreground/60">
      © 2026 Mangalore Sports Meet. All rights reserved.
    </div>
  </footer>
);
