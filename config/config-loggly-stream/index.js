// Creates direct to loggly stream for kuali-logger
if (!process.env.LOGGLY_AUTH) {
  console.log(
    'LOGGLY CONFIGURATION ERROR',
    'Missing LOGGLY_AUTH environment variable'
  )
}

const LogglyStream = require('bunyan-loggly')
const logglyConfig = {
  token: process.env.LOGGLY_AUTH,
  subdomain: 'kualidev',
  tags: [
    'Kuali-App',
    process.env.NODE_ENV || '',
    process.env.SERVICE || '',
    process.env.REGION || ''
  ]
}

const bufferLength = process.env.LOGGLY_BUFFER_LENGTH || 500
const bufferTimeout = process.env.LOGGLY_BUFFER_TIMEOUT || 5 * 1000

function logglyCallback (error, result, content) {
  if (error) {
    // Write to standard out because loggly logging is throwing errors
    console.log('LOGGLY ERROR', error, result, content)
  }
}

const configLogglyStream = new LogglyStream(
  logglyConfig,
  bufferLength,
  bufferTimeout,
  logglyCallback
)

console.log('CONFIGURED LOGGLY STREAM', configLogglyStream)

module.exports = configLogglyStream
