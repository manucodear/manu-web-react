import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { AuthCallback } from './pages/AuthCallback';
import { RedditPosts } from './pages/RedditPosts';

function App() {
  return (
   <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/callback/:type" element={<AuthCallback />} />
      <Route path="/redditPosts" element={<RedditPosts />} />
    </Routes>
   </Router>
  )
}

export default App
