import { AppleMusicProvider } from './contexts/AppleMusicContext';
import { AdminPanel } from './components/AdminPanel';
import { Amplify } from 'aws-amplify';

// Configure Amplify with Cognito settings
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      signUpVerificationMethod: 'code',
      loginWith: {
        username: true
      }
    }
  }
});

function App() {
  return (
    <AppleMusicProvider>
      <AdminPanel />
    </AppleMusicProvider>
  );
}

export default App;
