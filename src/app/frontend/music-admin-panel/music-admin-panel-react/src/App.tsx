import { AppleMusicProvider } from './contexts/AppleMusicContext';
import { AdminPanel } from './components/AdminPanel';
import './App.css';

function App() {
  return (
    <AppleMusicProvider>
      <AdminPanel />
    </AppleMusicProvider>
  );
}

export default App;
