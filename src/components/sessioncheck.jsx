import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth, API_ENDPOINTS, removeAuthToken } from "../config/api";

export default function useSessionCheck() {
  const navigate = useNavigate();
  // console.log("useSessionCheck invoked");

  useEffect(() => {
    const checkSession = async () => {
      const skipUntilRaw = sessionStorage.getItem("authCheckSkipUntil");
      const skipUntil = skipUntilRaw ? Number(skipUntilRaw) : 0;
      if (skipUntil && Date.now() < skipUntil) {
        return;
      }

      const token = sessionStorage.getItem("authToken"); 

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetchWithAuth(API_ENDPOINTS.PROFILE, {
          skipAuthRedirect: true
        });

        if (!response.ok) {
          let message = `Session expired (${response.status})`;
          try {
            const raw = await response.text();
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                message = parsed?.error || parsed?.message || message;
              } catch {
                message = raw || message;
              }
            }
          } catch {
            // ignore parsing errors
          }

          console.warn("Session check failed:", {
            status: response.status,
            message
          });
          sessionStorage.setItem("lastAuthError", message);
          setTimeout(() => {
            removeAuthToken();
            navigate("/login", { state: { error: message } });
          }, 8000);
          return;
        }
      } catch (err) {
        const message = err?.message || "Session check failed";
        console.error("Error checking session:", message);
        sessionStorage.setItem("lastAuthError", message);
        setTimeout(() => {
          removeAuthToken();
          navigate("/login", { state: { error: message } });
        }, 8000);
      }
    };

    checkSession();
  }, [navigate]);
}
