const axios = require('axios')
axios.defaults.baseURL = 'https://api.us.onelogin.com'

const getRequest = async () => {
  const accessToken = await getAccessToken()
  const request = axios.create({
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  return request
}

const getAccessToken = async () => {
  const options = {
    url: '/auth/oauth2/v2/token',
    method: 'post',
    auth: {
      username: process.env.ONELOGIN_CLIENT_ID,
      password: process.env.ONELOGIN_CLIENT_SECRET
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
