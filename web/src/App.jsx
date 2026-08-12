import { Navigate, Route, Routes } from "react-router";
import { useEffect } from "react";
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import PageLoader from "./components/PageLoader";
import { MessageToastContainer } from "./components/MessageToast";
import { useAuthStore } from "./lib/auth";

function App() {
  const { status, restoreSession } = useAuthStore();

  // Restore JWT session from localStorage on first load
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Still checking stored session
  if (status === "loading") return <PageLoader />;

  const isAuthenticated = status === "authenticated";

  return (
    <>
      {/* Global notification toasts — rendered above all routes */}
      <MessageToastContainer />

      <Routes>
        {/* Landing page — visible to all */}
        <Route path="/" element={<HomePage />} />

        {/* Auth page — redirect to chat if already signed in */}
        <Route
          path="/auth"
          element={!isAuthenticated ? <AuthPage /> : <Navigate to="/chat" replace />}
        />

        {/* Protected chat — redirect to auth if not signed in */}
        <Route
          path="/chat"
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/auth" replace />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
