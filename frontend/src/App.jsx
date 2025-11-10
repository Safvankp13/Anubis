import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Download from './pages/Download';
import Scan from './pages/Scan';
import Loader from './components/scanPage/Loader';



export default function App(){
const[start,setStart]=useState(true)
useEffect(()=>{
  setTimeout(()=>{
setStart(false)
  },6000)
})
 if (start) return <Loader/>
  


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
