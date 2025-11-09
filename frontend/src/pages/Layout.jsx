import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Left from '../components/scanPage/Left'
import { ArrowLeft } from "lucide-react";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hideMenu, setHideMenu] = useState(false);

  useEffect(() => {
    if (location.pathname === "/scan") setHideMenu(true);
    else setHideMenu(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen relative">

      <Left hide={hideMenu} />

      {hideMenu && (
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 
                     text-xs bg-[#111214] text-gray-200 border border-[#2a2b31] 
                     rounded-lg hover:bg-[#1a1b20] transition"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      )}

      <div className="flex-1 bg-[#0b0b0c] text-gray-100">
        <Outlet/>
      </div>
    </div>
  )
}

export default Layout
