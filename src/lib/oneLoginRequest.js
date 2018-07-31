const config = require('config')
const axios = require('axios')

const baseURL = config.oneLogin.baseURL
const username = config.oneLogin.clientId
const password = config.oneLogin.clientSecret

const getRequest = async () => {
  const accessToken = await getAccessToken()
  const request = axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  return request
}

const getAccessToken = async () => {
  const options = {
    baseURL,
    url: '/auth/oauth2/v2/token',
    method: 'post',
    auth: {
      username,
      password
    },
    data: {
      grant_type: 'client_credentials'
    },
    headers: { 'Content-Type': 'application/json' }
  }

  try {
    const res = await axios.request(options)
    return res.data.access_token
  } catch (err) {
    console.log(err)
    console.log(err.response.data)
  }
}

module.exports = getRequest()
