import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Download from './pages/Download';
import Scan from './pages/Scan';



export default function App(){
  return (
    <div>
    
      
      <main>
        <Routes>
          <Route path="/" element={<Layout/>} >
          <Route index element={<Dashboard/>}/>
          <Route path="scan" element={<Scan/>} />
          <Route path="Download" element={<Download/>} />
          </Route>

      
        </Routes>
      </main>
    </div>
  );
}
