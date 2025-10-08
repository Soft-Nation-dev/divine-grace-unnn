import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
        const response = await fetch(
          "https://dgunn-dud0b0eygjfcaxfs.southafricanorth-01.azurewebsites.net/session",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`, 
            },
          }
        );

        if (!response.ok) {
          console.warn("Session check failed:", response.status);
          sessionStorage.removeItem("authToken");
          navigate("/login");
          return;
        }

        const data = await response.json();
        // console.log("Session check response:", data);

        if (!data.isAuthenticated) {
          sessionStorage.removeItem("authToken");
          navigate("/login");
        }
      } catch (err) {
        console.error("Error checking session:", err);
        sessionStorage.removeItem("authToken");
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);
}
