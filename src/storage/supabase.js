// =============================================
// Cloudflare Worker - Supabase Utilities
// Handles auth and metadata only
// =============================================

export const getSupabaseClient = (env) => {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_KEY;

  const extractErrorMessage = (data, fallback) => {
    if (!data) return fallback;
    if (typeof data.error === 'string') return data.error;
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
    if (data.msg) return data.msg;
    if (data.error_description) return data.error_description;
    return fallback;
  };

  return {
    auth: {
      signUp: async (email, password, metadata) => {
        const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey
          },
          body: JSON.stringify({
            email,
            password,
            data: metadata
          })
        });

        return res.json();
      },

      signIn: async (email, password) => {
        const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey
          },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        // If response is not OK, Supabase returns error in data
        if (!res.ok) {
          // Extract error message from various Supabase error formats
          let errorMessage = 'Invalid email or password';
          
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error_description) {
            errorMessage = data.error_description;
          } else if (data.msg) {
            errorMessage = data.msg;
          } else if (data.message) {
            errorMessage = data.message;
          }

          return {
            error: errorMessage,
            statusCode: res.status
          };
        }

        return data;
      },

      updateUserMetadata: async (userId, metadata, key = serviceKey) => {
        const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            user_metadata: metadata
          })
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            error: { message: extractErrorMessage(data, 'Failed to update user metadata') },
            statusCode: res.status
          };
        }

        return data;
      },

      getUserByEmail: async (email, key = serviceKey) => {
        const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`
          }
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            error: { message: extractErrorMessage(data, 'Failed to fetch user') },
            statusCode: res.status
          };
        }

        return data;
      },

      updateUserPassword: async (userId, password, key = serviceKey) => {
        const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            password
          })
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            error: { message: extractErrorMessage(data, 'Failed to update password') },
            statusCode: res.status
          };
        }

        return data;
      }
    },

    database: {
      update: async (table, data, filters) => {
        const query = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          query.append(`${key}=eq.${value}`, '');
        });

        const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${serviceKey}`
          },
          body: JSON.stringify(data)
        });

        return res.json();
      },

      query: async (table, filters = {}) => {
        const query = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          query.append(`${key}=eq.${value}`, '');
        });

        const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
          method: 'GET',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${serviceKey}`
          }
        });

        return res.json();
      }
    }
  };
};
