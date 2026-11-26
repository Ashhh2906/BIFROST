import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import AiHelperDrawer from './components/AiHelperDrawer.jsx';
import Navbar from './components/Navbar.jsx';
import Toast from './components/Toast.jsx';
import Compare from './pages/Compare.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import Importance from './pages/Importance.jsx';
import Landing from './pages/Landing.jsx';
import NotFound from './pages/NotFound.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import Quiz from './pages/Quiz.jsx';
import RequestReview from './pages/RequestReview.jsx';
import Results from './pages/Results.jsx';
import Shortlist from './pages/Shortlist.jsx';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/profile" element={<ProfileSetup />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/importance" element={<Importance />} />
              <Route path="/results" element={<Results />} />
              <Route path="/compare/:id" element={<Compare />} />
              <Route path="/shortlist" element={<Shortlist />} />
              <Route path="/request" element={<RequestReview />} />
              <Route path="/request/:id" element={<RequestReview />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="no-print border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Roommate Finder · Built for harmonious hostel &amp; PG living · Saved locally in your
            browser
          </footer>
          <AiHelperDrawer />
          <Toast />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
