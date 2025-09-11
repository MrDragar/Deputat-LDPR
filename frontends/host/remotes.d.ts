// This declaration allows TypeScript to recognize and type-check the remote modules.
declare module 'auth/App' {
  interface AuthAppProps {
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
  }
  const App: React.ComponentType<AuthAppProps>;
  export default App;
}

declare module 'registration_form/App' {
  const App: React.ComponentType;
  export default App;
}
