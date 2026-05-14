import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./App.css";
import App from "./App";
import { UserContextProvider } from "./context/UserContext";
import { AuthProvider } from "./context/AuthContext";
import { ContentProvider } from "./context/ContentContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserContextProvider>
          <ContentProvider>
            <App />
          </ContentProvider>
        </UserContextProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
