const config = require('config')
const log = require('kuali-logger')(config.get('log'))
const oneLoginRequest = require('../lib/oneLoginRequest')
const kualiRequest = require('../lib/kualiRequest')
const slack = require('../lib/slack')

const kualiOneLoginFieldId = config.kuali.oneLoginFieldId

const syncUsersGroups = async errors => {
  const req = await oneLoginRequest

  // Get all onelogin roles
  let roles = []
  let res
  try {
    res = await req.get('/api/1/roles')
  } catch (err) {
    log.error({ err, event: 'ERROR', attempted: 'GET_ONELOGIN_ROLES' })
    errors.push(err)
  }

  roles = roles.concat(res.data.data)

  while (res.data.pagination && res.data.pagination.after_cursor) {
    try {
      res = await req.get(
        `/api/1/roles?after_cursor=${res.data.pagination.after_cursor}`
      )
      roles = roles.concat(res.data.data)
    } catch (err) {
      log.error({ err, event: 'ERROR', attempted: 'GET_ONELOGIN_ROLES' })
      errors.push(err)
    }
  }

  let kualiUsers
  try {
    res = await kualiRequest.get(`/api/v1/users?fields=id,schoolId`)
    kualiUsers = res.data
  } catch (err) {
    log.error({ err, event: 'ERROR', attempted: 'GET_KUALI_USERS' })
    errors.push(err)
  }

  log.info({ event: 'SYNC' }, `Syncing users to ${roles.length} groups`)

  processRoles(roles, req, kualiUsers, errors)
}

async function processRoles (roles, req, kualiUsers, errors) {
  for (const role of roles) {
    await syncRole(role, req, kualiUsers, errors)
  }
  if (errors.length > 0) {
    slack('ERRORS: app-onelogin-sync errors occurred, check Loggly.')
  } else {
    slack('apps-onelogin-sync ran successfully')
  }
}

async function syncRole (role, req, kualiUsers, errors) {
  let oneLoginUsers = []
  let res
  try {
    res = await req.get(`/api/1/users?role_id=${role.id}&fields=id`)
    oneLoginUsers = oneLoginUsers.concat(res.data.data)
  } catch (err) {
    log.error({ err, event: 'ERROR', attempted: 'GET_ONELOGIN_USER_ROLES' })
    errors.push(err)
  }

  while (res.data.pagination && res.data.pagination.after_cursor) {
    try {
      res = await req.get(
        `/api/1/users?role_id=${role.id}&fields=id&after_cursor=${
          res.data.pagination.after_cursor
        }`
      )
      oneLoginUsers = oneLoginUsers.concat(res.data.data)
    } catch (err) {
      log.error({ err, event: 'ERROR', attempted: 'GET_ONELOGIN_USER_ROLES' })
      errors.push(err)
    }
  }

  // convert array of objects to array of string ids
  oneLoginUsers = oneLoginUsers.map(user => {
    return user.id.toString()
  })

  log.debug(
    { event: 'SYNC' },
    `Syncing ${oneLoginUsers.length} to ${role.name}`
  )

  let group
  try {
    res = await kualiRequest.get(
      `/api/v1/groups?fields(${kualiOneLoginFieldId})=${role.id}`
    )
    if (res.data && res.data[0]) {
      group = res.data[0]
    }
  } catch (err) {
    log.error({ err, event: 'ERROR', attempted: 'GET_ONELOGIN_GROUPS' })
    errors.push(err)
  }

  const memberPos = group.roles
    .map(r => {
      return r.id
    })
    .indexOf('members')
  const kualiMembers = group.roles[memberPos].value

  oneLoginUsers.forEach(async user => {
    const kualiUser = kualiUsers.find(kualiUser => {
      return kualiUser.schoolId === user
    })
    if (kualiUser) {
      if (!kualiMembers.includes(kualiUser.id)) {
        kualiMembers.push(kualiUser.id)
        log.debug(
          { event: 'USER_GROUP_CREATE' },
          `Creating ${kualiUser.displayName}`
        )
      }
    }
  })

  for (let i = 0; i < kualiMembers.length; i++) {
    const kualiUser = kualiUsers.find(kualiUser => {
      return kualiUser.id === kualiMembers[i]
    })

    if (kualiUser && !oneLoginUsers.includes(kualiUser.schoolId)) {
      log.debug(
        { event: 'USER_GROUP_DELETE' },
        `Deleting ${kualiUser.displayName}`
      )
      kualiMembers.splice(i, 1)
    }
  }

  group.roles[memberPos].value = kualiMembers
  try {
    res = await kualiRequest.put(`/api/v1/groups/${group.id}`, group)
    log.debug({ event: 'USER_GROUP_UPDATE' }, `Syncing users to ${group.name}`)
  } catch (err) {
    log.error({ err, event: 'ERROR', attempted: 'USER_GROUP_UPDATE', group })
    errors.push(err)
  }
}

module.exports = syncUsersGroups
