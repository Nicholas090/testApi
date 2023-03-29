import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'https://app.orderdesk.me/api/v2/';
const apiKey = process.env.API;
const storeId = process.env.STORE_ID;

const $api = axios.create({
  baseURL: API_URL,
  headers: {
    'ORDERDESK-STORE-ID': storeId,
    'ORDERDESK-API-KEY': apiKey,
    'Content-Type': 'application/json',
  },
});

const testConnection = async () => {
  try {
    const testResponse = await $api.get(`test`);
    const status = testResponse.data.status;
    if (status === 'success') {
      console.log(`Test connection successful`);
    }
  } catch (err) {
    console.log(`Error connecting to API: ${err.message}`);
  }
};

const fetchNewOrders = async () => {
  const ordersId = [];

  cron.schedule('* 1 * * * *', async () => {
    try {
      const searchStartDate = new Date(new Date(Date.now()).toUTCString()).toISOString().slice(0, 10);

      const response = await $api.get('orders', {
        params: { search_start_date: searchStartDate },
      });

      const newOrders = response.data.orders;

      newOrders.forEach((order) => {
        const {
          id,
          source_id,
          customer: { address1, address2 },
        } = order;
        if (ordersId.includes(id)) return;
        console.log(`Found ${newOrders.length} new orders:`);
        console.log(
          `Order ID: ${source_id}, Shipping Address1: ${address1} ${address2 ? `, Address2: ${address2} ` : ''}`,
        );
        ordersId.push(id);
      });
    } catch (err) {
      console.log(`Error fetching new order: ${err.message}`);
    }
  });
};

const start = async () => {
  try {
    await testConnection();
    await fetchNewOrders();
  } catch (err) {
    console.log(err);
  }
};

await start();
