// =============================================
// Cloudflare Worker - Supabase Utilities
// Handles auth and metadata only
// =============================================

export const getSupabaseClient = (env) => {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;

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

        return res.json();
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
            Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
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
            Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
          }
        });

        return res.json();
      }
    }
  };
};
