const configLogglyStream = require('./config-loggly-stream')

module.exports = {
  environment: 'production',
  log: {
    environment: 'production',
    format: 'json',
    stream: {
      type: 'raw',
      stream: configLogglyStream
    }
  }
}
