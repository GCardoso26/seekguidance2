import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Thanks } from './pages/Thanks'
import { Offer } from './pages/Offer'
import { Upsell } from './pages/Upsell'
import { Kit } from './pages/Kit'
import { AutomationCenter } from './pages/AutomationCenter'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/obrigado" element={<Thanks />} />
        <Route path="/oferta" element={<Offer />} />
        <Route path="/upsell" element={<Upsell />} />
        <Route path="/kit" element={<Kit />} />
        <Route path="/app/automation" element={<AutomationCenter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
