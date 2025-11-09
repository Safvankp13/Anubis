import React from "react";
import { NavLink } from "react-router-dom";
import { Home, ScanLine, Download, Plus } from "lucide-react";
import { motion } from "framer-motion";

const Left = ({ hide = false }) => {
  return (
    <motion.div
      animate={ hide ? { width: 0, opacity:0 } : { width: 240, opacity:1 } }
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`bg-[#0e0f13] ${hide ? "border-r-0" : "border-r border-[#1f1f22]"} flex flex-col text-gray-200 select-none overflow-hidden w-full md:w-[240px] h-screen`}
    >
      <div className="gap-4 flex flex-col py-6 px-4 text-gray-200 select-none">

        <div className="mb-8 flex items-center justify-between">
          <span className="text-lg tracking-wide font-semibold text-gray-300 ">
            Anubis
          </span>
        </div>

        <NavLink
          to="/"
          end
          className={({isActive}) => `
            flex items-center gap-3 px-3 py-3 rounded-lg border transition
            ${isActive ? "border-[#03a48c] bg-[#03a48c]/15 text-[#ffffff]" : "border-transparent hover:border-[#2a2b31] hover:bg-[#1a1b20]"}
          `}
        >
          <Home size={18}/>
          <span className="text-sm">Dashboard</span>
        </NavLink>

        <NavLink
          to="/scan"
          className={({isActive}) => `
            flex items-center justify-between px-3 py-3 rounded-lg border transition
            ${isActive ? "border-[#03a48c] bg-[#03a48c]/15 text-[#ffffff]" : "bg-[#26282e] border-transparent hover:border-[#2b2c32] hover:bg-[#2b2c32]"}
          `}
        >
          <div className="flex items-center gap-3">
            <ScanLine size={18} />
            <span className="text-sm">Scan</span>
          </div>

          <div className="bg-[#26282e] border border-[#fcfdff] rounded-full p-[3px] hover:bg-[#1a1b20] transition">
            <Plus size={18} className="text-[#ffffff]" />
          </div>
        </NavLink>

        <NavLink
          to="/download"
          className={({isActive}) => `
            flex items-center gap-3 px-3 py-3 rounded-lg border transition
            ${isActive ? "border-[#03a48c] bg-[#03a48c]/15 text-[#ffffff]" : "border-transparent hover:border-[#2a2b31] hover:bg-[#1a1b20]"}
          `}
        >
          <Download size={18}/>
          <span className="text-sm">Download</span>
        </NavLink>

      </div>
    </motion.div>
  );
};

export default Left;
