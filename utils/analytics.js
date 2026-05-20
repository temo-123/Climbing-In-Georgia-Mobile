import axios from 'axios';

// GA4 Measurement Protocol credentials
// 1. Go to analytics.google.com → Admin → Data Streams → your stream
// 2. Copy the Measurement ID (G-XXXXXXXXXX) into MEASUREMENT_ID
// 3. Under "Measurement Protocol API secrets", create a secret and paste it into API_SECRET
const MEASUREMENT_ID = 'G-XXXXXXXXXX';
const API_SECRET = 'YOUR_API_SECRET';

// Session-scoped client ID — stable for the lifetime of the app process
const clientId = `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;

export const logEvent = (name, params = {}) => {
  if (MEASUREMENT_ID === 'G-XXXXXXXXXX') return; // skip if not configured

  axios
    .post(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      { client_id: clientId, events: [{ name, params }] }
    )
    .catch(() => {}); // analytics failures must never crash the app
};

export const logScreenView = (screenName) =>
  logEvent('screen_view', { screen_name: screenName, screen_class: screenName });
