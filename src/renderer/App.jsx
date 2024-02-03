import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React, { useState, useMemo, useRef, useEffect } from 'react';

function Main() {
  return <div className="min-h-screen w-full min-w-full prose flex"></div>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
