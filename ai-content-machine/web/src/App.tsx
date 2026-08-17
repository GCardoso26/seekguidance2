import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Thanks } from './pages/Thanks'
import { Offer } from './pages/Offer'
import { Upsell } from './pages/Upsell'
import { Kit } from './pages/Kit'
import { AutomationCenter } from './pages/AutomationCenter'
import { StudioLayout } from './pages/studio/StudioLayout'
import { StudioHome } from './pages/studio/StudioHome'
import { StudioSetup } from './pages/studio/StudioSetup'
import { StudioCreate } from './pages/studio/StudioCreate'
import { StudioProduction } from './pages/studio/StudioProduction'
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
        <Route path="/studio" element={<StudioLayout />}>
          <Route index element={<StudioHome />} />
          <Route path="setup" element={<StudioSetup />} />
          <Route path="create" element={<StudioCreate />} />
          <Route path="production/:id" element={<StudioProduction />} />
        </Route>
        <Route path="/app/automation" element={<AutomationCenter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
