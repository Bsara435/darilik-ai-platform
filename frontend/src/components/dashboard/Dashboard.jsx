import { Routes, Route } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import DashboardOverview from './DashboardOverview'
import PropertiesPage from './PropertiesPage'
import LegalAdvisorPage from './LegalAdvisorPage'
import ProfileMatchingPage from './ProfileMatchingPage'

export default function Dashboard({ onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout onLogout={onLogout} />}>
        <Route index element={<DashboardOverview />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="profile-matching" element={<ProfileMatchingPage />} />
        <Route path="legal-advisor" element={<LegalAdvisorPage />} />
      </Route>
    </Routes>
  )
}
