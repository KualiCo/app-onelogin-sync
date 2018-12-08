const config = require('config')
const log = require('kuali-logger')(config.get('log'))
const url = config.kuali.appsSlackWebhook
const { IncomingWebhook } = require('@slack/client')
const webhook = new IncomingWebhook(url)

const slack = message => {
  webhook.send(message, (err, res) => {
    if (err) {
      log.error({ err, event: 'SLACK_MESSAGE_ERROR', message })
    }
  })
}

module.exports = slack
