import React, { StrictMode } from 'react'
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import App from './App.tsx'
import StudyApp from "./components/StudyApp";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudyApp />} />
        <Route path="/room/:roomName" element={<StudyApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
