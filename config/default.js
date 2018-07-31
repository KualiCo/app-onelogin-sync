const defer = require('config/defer').deferConfig

module.exports = {
  environment: 'default',
  log: {
    team: 'app',
    product: 'onelogin-sync',
    environment: 'default',
    name: defer(
      cfg => `${cfg.log.team}-${cfg.log.product}-${cfg.log.environment}`
    ),
    level: 'debug',
    format: 'pretty'
  },
  oneLogin: {
    baseURL: 'https://api.us.onelogin.com'
  },
  kuali: {
    baseURL: 'https://apps.kuali.co',
    oneLoginCategoryId: '5b58f76224a1980001714a33',
    oneLoginFieldId: 'BkZuwOI4m'
  }
}
