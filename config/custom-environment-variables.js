module.exports = {
  oneLogin: {
    baseURL: 'ONELOGIN_BASE_URL',
    clientId: 'ONELOGIN_CLIENT_ID',
    clientSecret: 'ONELOGIN_CLIENT_SECRET'
  },
  kuali: {
    apiKey: 'APPS_KUALI_API_KEY',
    baseURL: 'APPS_KUALI_BASE_URL',
    oneLoginCategoryId: 'APPS_KUALI_ONELOGIN_CATEGORY_ID',
    oneLoginFieldId: 'APPS_KUALI_ONELOGIN_FIELD_ID',
    appsSlackWebhook: 'APPS_SLACK_WEBHOOK'
  },
  log: {
    stream: {
      level: 'LOG_LEVEL'
    }
  }
}
