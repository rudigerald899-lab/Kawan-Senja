import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import QRGenerator from './pages/QRGenerator.jsx'
import './index.css'

const path = window.location.pathname

let Component = App
if (path === '/admin' || path === '/admin/') Component = AdminDashboard
else if (path === '/admin/qr' || path === '/admin/qr/') Component = QRGenerator

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
)
