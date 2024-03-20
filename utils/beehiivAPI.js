const axios = require("axios");

const beehiivClient = axios.create({
  baseURL: `${process.env.BEEHIIV_URL}/publications/${process.env.BEEHIIV_PUBLICATION_ID}`,
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
  },
});

const findSubscriptionByEmail = async (email) => {
  try {
      let subscriber = await beehiivClient.get(`/subscriptions/by_email/${email}?expand=custom_fields`);

      return subscriber.data.data;
    } catch (error) {
      return error.response.data;
  }
};

const createSubscription = async (email) => {
  try {
    let subscriber = await beehiivClient.post(`subscriptions`, {
      email: email,
      reactivate_existing: false,
      send_welcome_email: false,
      utm_source: "direct",
      utm_campaign: "",
      utm_medium: "import",
      referring_site: "",
      custom_fields: [
        {
          name: "artistSignedUp",
          value: "true",
        }
      ],
    });
    return subscriber.data;
  } catch (error) {
    return error.response.data;
  }
};

const updateSubscription = async (subscriptionId) => {
    try {
      let subscriber = await beehiivClient.patch(`subscriptions/${subscriptionId}`, {
        custom_fields: [
          {
            name: "artistSignedUp",
            value: "true",
          }
        ],
      });
      return subscriber.data;
    } catch (error) {
      return error.response.data;
    }
  };

module.exports = {
  findSubscriptionByEmail,
  createSubscription,
  updateSubscription
};
