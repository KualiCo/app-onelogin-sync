const oneLoginRequest = require('../lib/oneLoginRequest')
const kualiRequest = require('../lib/kualiRequest')

const syncUsers = async () => {
  const req = await oneLoginRequest

  let users = []
  let res = await req.get(
    '/api/1/users?fields=id,email,username,firstname,lastname'
  )
  users = users.concat(res.data.data)

  while (res.data.pagination && res.data.pagination.after_cursor) {
    res = await req.get(
      `/api/1/users?fields=id,email,username,firstname,lastname&after_cursor=${
        res.data.pagination.after_cursor
      }`
    )
    users = users.concat(res.data.data)
  }
  console.log(`Syncing ${users.length} users`)

  users.forEach(async user => {
    const res = await kualiRequest.get(`/api/v1/users?schoolId=${user.id}`)
    if (res.data && res.data[0]) {
      const kualiUser = res.data[0]

      const updateUser = {
        username: user.username === '' ? null : user.username,
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        schoolId: user.id
      }

      try {
        await kualiRequest.put(`/api/v1/users/${kualiUser.id}`, updateUser)
      } catch (err) {
        console.log(err.response.data.errors)
      }
    } else {
      const newUser = {
        username: user.username === '' ? null : user.username,
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        schoolId: user.id
      }
      try {
        await kualiRequest.post(`/api/v1/users`, newUser)
      } catch (err) {
        console.log(err.response.data.errors)
      }
    }
  })

  const response = await kualiRequest.get(`/api/v1/users`)
  const kualiUsers = response.data
  kualiUsers.forEach(async kualiUser => {
    let index = users.findIndex(u => u.id.toString() === kualiUser.schoolId)
    // console.log(index, kualiUser.displayName, kualiUser.schoolId)
    if (index === -1) {
      console.log(`DELETING: ${kualiUser.displayName}`)
      try {
        await kualiRequest.delete(`/api/v1/users/${kualiUser.id}`)
      } catch (err) {
        console.log(err.response.data)
      }
    }
  })
}

module.exports = syncUsers
