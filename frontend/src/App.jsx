import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Roadmap from "./Pages/Roadmap";
import LessonPage from "./Pages/LessonPage";
import LandingPage from "./Pages/LandingPage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import PlacementTest from "./Pages/PlacementTest";
import UnitTest from "./Pages/UnitTest";
import RequireAuth from "./auth/RequireAuth";
import RequirePlacement from "./auth/RequirePlacement";
import Dashboard from './Pages/Dashboard';
import Analytics from './Pages/Analytics';
import Leaderboard from './Pages/LeaderBoard';
import Notepad from './Pages/Notepad';
import Community from './Pages/Community';
import HelpCenter from './Pages/HelpCenter';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/analytics" element={
          <RequireAuth>
            <Analytics />
          </RequireAuth>
        } />
        <Route path="/dashboard" element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } />
        <Route path="/leaderboard" element={
          <RequireAuth>
            <Leaderboard />
          </RequireAuth>
        } />
        <Route path="/notepad" element={
          <RequireAuth>
            <Notepad />
          </RequireAuth>
        } />
        <Route path="/community" element={
          <RequireAuth>
            <Community />
          </RequireAuth>
        } />
        <Route path="/placement-test" element={
          <RequireAuth>
            <PlacementTest />
          </RequireAuth>
        } />
        <Route path="/roadmap" element={
          <RequireAuth>
            <RequirePlacement>
              <Roadmap />
            </RequirePlacement>
          </RequireAuth>
        } />
        <Route path="/lesson/:lessonId" element={
          <RequireAuth>
            <RequirePlacement>
              <LessonPage />
            </RequirePlacement>
          </RequireAuth>
        } />
        <Route path="/unit/:unitId/test" element={
          <RequireAuth>
            <RequirePlacement>
              <UnitTest />
            </RequirePlacement>
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
