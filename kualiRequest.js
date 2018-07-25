const axios = require('axios')
const apiKey = process.env.KUALI_API_KEY
const baseURL = process.env.KUALI_BASE_URL

const request = axios.create({
  baseURL,
  headers: { Authorization: `Bearer ${apiKey}` }
})

module.exports = request
