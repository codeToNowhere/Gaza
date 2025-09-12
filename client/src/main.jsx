import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { MessageProvider } from "./context/MessageContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import "./index.css";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faFlag as regularFaFlag } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBan,
  faBars,
  faCheckCircle,
  faClone,
  faExclamationTriangle,
  faFlag,
  faFlagCheckered,
  faFileAlt,
  faHouse,
  faInfoCircle,
  faTimes,
  faTimesCircle,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBan,
  faBars,
  faCheckCircle,
  faClone,
  faExclamationTriangle,
  faFlag,
  faFlagCheckered,
  faFileAlt,
  faHouse,
  faInfoCircle,
  faTimes,
  faTimesCircle,
  faTrash,
  regularFaFlag
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <MessageProvider>
          <App />
        </MessageProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);
