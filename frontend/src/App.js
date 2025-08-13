import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import io from 'socket.io-client';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Detections from './pages/Detections';
import MonitoredPlates from './pages/MonitoredPlates';
import Cameras from './pages/Cameras';
import Upload from './pages/Upload';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Conectado ao servidor');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Desconectado do servidor');
    });

    newSocket.on('plate_alert', (data) => {
      const { detection, monitoredPlate } = data;
      
      setAlerts(prev => [data, ...prev.slice(0, 9)]);
      
      const statusEmoji = {
        'stolen': '🚨',
        'suspicious': '⚠️',
        'vip': '⭐',
        'blocked': '🚫'
      };
      
      toast.error(
        `${statusEmoji[monitoredPlate.status]} Placa ${detection.plate_number} detectada!`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    });

    newSocket.on('plate_detected', (data) => {
      toast.success(`Placa ${data.detection.plate_number} detectada`, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
      });
    });

    return () => newSocket.close();
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            isConnected={isConnected}
            alertsCount={alerts.length}
          />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={<Dashboard socket={socket} alerts={alerts} />} 
              />
              <Route 
                path="/detections" 
                element={<Detections socket={socket} />} 
              />
              <Route 
                path="/monitored-plates" 
                element={<MonitoredPlates socket={socket} />} 
              />
              <Route 
                path="/cameras" 
                element={<Cameras socket={socket} />} 
              />
              <Route 
                path="/upload" 
                element={<Upload socket={socket} />} 
              />
            </Routes>
          </main>
        </div>
        
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
