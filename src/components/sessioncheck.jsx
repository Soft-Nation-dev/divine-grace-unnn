import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth, API_ENDPOINTS, removeAuthToken } from "../config/api";

export default function useSessionCheck() {
  const navigate = useNavigate();
  // console.log("useSessionCheck invoked");

  useEffect(() => {
    const checkSession = async () => {
      const token = sessionStorage.getItem("authToken"); 

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetchWithAuth(API_ENDPOINTS.PROFILE);

        if (!response.ok) {
          console.warn("Session check failed:", response.status);
          removeAuthToken();
          navigate("/login");
          return;
        }
      } catch (err) {
        console.error("Error checking session:", err);
        removeAuthToken();
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);
}
