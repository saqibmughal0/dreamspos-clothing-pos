import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import store from "./core/redux/store.jsx";
import AllRoutes from "./Router/router.jsx";

// Import Styles and Icons from licensed template
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "./style/css/feather.css";
import "./style/css/line-awesome.min.css";
import "./style/icons/tabler-icons/webfont/tabler-icons.css";
import "./style/scss/main.scss";
import "./customStyle.scss";
import "./style/icons/fontawesome/css/fontawesome.min.css";
import "./style/icons/fontawesome/css/all.min.css";
import "./style/fonts/feather/css/iconfont.css";
import "./i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1
    }
  }
});

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <BrowserRouter>
            <AllRoutes />
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    </React.StrictMode>
  );
} else {
  console.error("Root DOM container '#root' was not found.");
}
