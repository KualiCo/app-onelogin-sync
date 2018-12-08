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
    level: 'info',
    format: 'pretty'
  }
}
