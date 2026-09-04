const axios = require('axios');

// Cache for the access token
let cachedToken = null;
let tokenExpiry = null;

/**
 * Role to Zoho App Mapping
 * Maps each role to its authorized Zoho applications
 */
const ZOHO_APP_MAP = {
  Admin: [
    {
      name: 'Zoho People',
      serviceKey: 'people',
      url: 'https://people.zoho.com',
      apiBase: 'https://people.zoho.com/people/api',
      icon: '👥',
      description: 'Human Resource Management'
    },
    {
      name: 'Zoho CRM',
      serviceKey: 'crm',
      url: 'https://www.zohoapis.com/crm/v2',
      apiBase: 'https://www.zohoapis.com/crm/v2',
      icon: '📊',
      description: 'Customer Relationship Management'
    },
    {
      name: 'Zoho Desk',
      serviceKey: 'desk',
      url: 'https://desk.zoho.com',
      apiBase: 'https://desk.zoho.com/api/v1',
      icon: '🎧',
      description: 'Customer Support & Helpdesk'
    },
    {
      name: 'Zoho Books',
      serviceKey: 'books',
      url: 'https://www.zohoapis.com/books/v3',
      apiBase: 'https://www.zohoapis.com/books/v3',
      icon: '📚',
      description: 'Financial Accounting'
    }
  ],
  HR: [
    {
      name: 'Zoho People',
      serviceKey: 'people',
      url: 'https://people.zoho.com',
      apiBase: 'https://people.zoho.com/people/api',
      icon: '👥',
      description: 'Human Resource Management'
    }
  ],
  Sales: [
    {
      name: 'Zoho CRM',
      serviceKey: 'crm',
      url: 'https://www.zohoapis.com/crm/v2',
      apiBase: 'https://www.zohoapis.com/crm/v2',
      icon: '📊',
      description: 'Customer Relationship Management'
    }
  ],
  Support: [
    {
      name: 'Zoho Desk',
      serviceKey: 'desk',
      url: 'https://desk.zoho.com',
      apiBase: 'https://desk.zoho.com/api/v1',
      icon: '🎧',
      description: 'Customer Support & Helpdesk'
    }
  ],
  Finance: [
    {
      name: 'Zoho Books',
      serviceKey: 'books',
      url: 'https://www.zohoapis.com/books/v3',
      apiBase: 'https://www.zohoapis.com/books/v3',
      icon: '📚',
      description: 'Financial Accounting'
    }
  ]
};

/**
 * Get Zoho OAuth access token using refresh token
 * Implements token caching to minimize API calls
 */
async function getZohoAccessToken() {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  try {
    const response = await axios.post(
      `${process.env.ZOHO_ACCOUNT_DOMAIN || 'https://accounts.zoho.com'}/oauth/v2/token`,
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token'
        }
      }
    );

    cachedToken = response.data.access_token;
    // Zoho tokens typically expire in 1 hour (3600 seconds)
    tokenExpiry = Date.now() + (response.data.expires_in || 3600) * 1000;

    console.log('✅ Zoho access token refreshed successfully');
    return cachedToken;
  } catch (error) {
    console.error('❌ Failed to retrieve Zoho Access Token:', error.response?.data || error.message);
    cachedToken = null;
    tokenExpiry = null;
    throw new Error('Failed to authenticate with Zoho API');
  }
}

/**
 * Get authorized Zoho apps for given roles
 * @param {string[]} roles - Array of role names
 * @returns {Object[]} Array of authorized Zoho app objects
 */
function getAuthorizedApps(roles) {
  const apps = new Map();
  
  roles.forEach(role => {
    const roleApps = ZOHO_APP_MAP[role] || [];
    roleApps.forEach(app => {
      if (!apps.has(app.serviceKey)) {
        apps.set(app.serviceKey, app);
      }
    });
  });

  return Array.from(apps.values());
}

/**
 * Proxy a request to a Zoho service
 * @param {string} serviceKey - The Zoho service key (crm, people, desk, books)
 * @param {string} path - The API path
 * @param {string} method - HTTP method
 * @param {Object} data - Request body
 * @returns {Object} Zoho API response
 */
async function proxyToZoho(serviceKey, path, method = 'GET', data = null) {
  const serviceMap = {
    crm: 'https://www.zohoapis.com/crm/v2',
    people: 'https://people.zoho.com/people/api',
    desk: 'https://desk.zoho.com/api/v1',
    books: 'https://www.zohoapis.com/books/v3'
  };

  const baseUrl = serviceMap[serviceKey];
  if (!baseUrl) {
    throw new Error(`Unknown Zoho service: ${serviceKey}`);
  }

  const accessToken = await getZohoAccessToken();

  try {
    const response = await axios({
      method,
      url: `${baseUrl}/${path}`,
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data
    });

    return response.data;
  } catch (error) {
    console.error(`Zoho API Error (${serviceKey}):`, error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getZohoAccessToken,
  getAuthorizedApps,
  proxyToZoho,
  ZOHO_APP_MAP
};
