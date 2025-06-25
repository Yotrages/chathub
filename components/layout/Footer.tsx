// src/components/layout/Footer.tsx
import Link from 'next/link';
import { FaFutbol, FaTwitter, FaFacebook, FaInstagram } from 'react-icons/fa';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-l from-gray-500 w-full to-black text-gray-300">
      <div className="container mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Brand and description */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <FaFutbol className="text-2xl text-yellow-400" />
              <span className="text-xl font-bold text-white">Football LiveScore</span>
            </Link>
            <p className="text-sm">
              Get the latest football scores, match results, fixtures, league tables, and statistics from all major leagues around the world.
            </p>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-yellow-300 transition duration-150 ease-in-out">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/matches" className="hover:text-yellow-300 transition duration-150 ease-in-out">
                  Live Scores
                </Link>
              </li>
              <li>
                <Link href="/leagues" className="hover:text-yellow-300 transition duration-150 ease-in-out">
                  Leagues & Cups
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-yellow-300 transition duration-150 ease-in-out">
                  News & Transfers
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Connect */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition duration-150 ease-in-out">
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-150 ease-in-out">
                <FaFacebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-150 ease-in-out">
                <FaInstagram size={24} />
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-center">
          <p>© {currentYear} Football LiveScore. All rights reserved.</p>
          <p className="mt-2 text-gray-500">
            This site is for educational purposes only and is not affiliated with any sports organization.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;