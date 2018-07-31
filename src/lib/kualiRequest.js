const axios = require('axios')
const config = require('config')

const apiKey = config.kuali.apiKey
const baseURL = config.kuali.baseURL

const request = axios.create({
  baseURL,
  headers: { Authorization: `Bearer ${apiKey}` }
})

module.exports = request
