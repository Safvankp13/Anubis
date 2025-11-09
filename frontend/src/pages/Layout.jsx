import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Left from '../components/scanPage/Left'
import { ArrowLeft } from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hideMenu, setHideMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (location.pathname === "/scan") setHideMenu(true);
    else setHideMenu(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      <div className="hidden md:block">
        <Left hide={hideMenu} />
      </div>

      {mobileMenuOpen && (
        <>
          <div className="fixed top-0 left-0 z-50 w-64 h-screen bg-[#0b0b0c] md:hidden">
            <Left hide={false} />
          </div>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        </>
      )}

      {!mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden absolute top-4 left-2 z-50 text-gray-200 p-2 bg-[#111214] border border-[#2a2b31] rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {hideMenu && (
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-14 md:left-4 flex items-center gap-2 px-3 py-1.5 text-xs bg-[#111214] text-gray-200 border border-[#2a2b31] rounded-lg hover:bg-[#1a1b20] transition"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      )}

      <div className="flex-1 bg-[#0b0b0c] text-gray-100 w-full">
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
