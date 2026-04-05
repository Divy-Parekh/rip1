/**
 * Centralized API Client for making authenticated requests
 * automatically handles token injection and 401-unauthorized redirection.
 */

const getAuthHeaders = () => {
    const token = localStorage.getItem("rip_token");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
    };
};

export const apiClient = async (url: string, options: RequestInit = {}) => {
    const authHeaders = getAuthHeaders();
    
    // If the body is FormData, we MUST NOT set Content-Type so the browser can set it with the boundary
    const headers: Record<string, string> = {
        ...authHeaders,
        ...(options.headers as Record<string, string>),
    };

    if (options.body instanceof FormData) {
        delete headers["Content-Type"];
    }

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            console.warn("Token expired or unauthorized. Redirecting to login...");
            
            // Clear current user/token to avoid infinite loops
            localStorage.removeItem("rip_user");
            localStorage.removeItem("rip_token");

            // Redirect to login page using window.location for global scope
            // We use #/login because the app uses HashRouter
            window.location.hash = "/login";
            
            // Throw error to stop further processing in the service
            throw new Error("Unauthorized - Session expired");
        }

        return response;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
