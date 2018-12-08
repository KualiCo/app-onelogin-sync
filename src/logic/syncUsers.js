const config = require('config')
const log = require('kuali-logger')(config.get('log'))
const oneLoginRequest = require('../lib/oneLoginRequest')
const kualiRequest = require('../lib/kualiRequest')

const syncUsers = async errors => {
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

  log.info({ event: 'SYNC' }, `Syncing ${users.length} users`)

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
        log.debug({ event: 'USER_UPDATE', updateUser })
      } catch (err) {
        log.error({ err, event: 'ERROR', attempted: 'USER_UPDATE', updateUser })
        errors.push(err)
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
        log.info({ event: 'USER_CREATE', newUser })
      } catch (err) {
        log.error({
          err,
          event: 'ERROR',
          attempted: 'USER_CREATE',
          newUser
        })
        errors.push(err)
      }
    }
  })

  const response = await kualiRequest.get(`/api/v1/users`)
  const kualiUsers = response.data
  kualiUsers.forEach(async kualiUser => {
    let index = users.findIndex(u => u.id.toString() === kualiUser.schoolId)
    if (index === -1) {
      try {
        await kualiRequest.delete(`/api/v1/users/${kualiUser.id}`)
        log.info(
          { event: 'USER_DELETE' },
          `DELETING: ${kualiUser.displayName}`,
          kualiUser
        )
      } catch (err) {
        log.error({ err, event: 'ERROR', attempted: 'USER_DELETE', kualiUser })
        errors.push(err)
      }
    }
  })
}

module.exports = syncUsers
