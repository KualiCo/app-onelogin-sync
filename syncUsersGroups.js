const oneLoginRequest = require('./oneLoginRequest')
const kualiRequest = require('./kualiRequest')

const syncUsersGroups = async () => {
  const req = await oneLoginRequest

  // Get all onelogin roles
  let roles = []
  let res
  try {
    res = await req.get('/api/1/roles')
  } catch (err) {
    console.log(err)
  }

  roles = roles.concat(res.data.data)

  while (res.data.pagination && res.data.pagination.after_cursor) {
    try {
      res = await req.get(
        `/api/1/roles?after_cursor=${res.data.pagination.after_cursor}`
      )
      roles = roles.concat(res.data.data)
    } catch (err) {
      console.log(err)
    }
  }

  let kualiUsers
  try {
    res = await kualiRequest.get(`/api/v1/users?fields=id,schoolId`)
    kualiUsers = res.data
  } catch (err) {
    console.log(err)
  }

  console.log(`Syncing users to ${roles.length} groups`)

  processRoles(roles, req, kualiUsers)
}

async function processRoles (roles, req, kualiUsers) {
  for (const role of roles) {
    await syncRole(role, req, kualiUsers)
  }
}

async function syncRole (role, req, kualiUsers) {
  let oneLoginUsers = []
  let res
  try {
    res = await req.get(`/api/1/users?role_id=${role.id}&fields=id`)
    oneLoginUsers = oneLoginUsers.concat(res.data.data)
  } catch (err) {
    console.log('THIS', role, err.response.status, err.response.statusText)
    throw err
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
      console.log('THAT', err.response.status, err.response.statusText)
    }
  }

  // convert array of object to array of string ids
  oneLoginUsers = oneLoginUsers.map(user => {
    return user.id.toString()
  })

  console.log(`Syncing ${oneLoginUsers.length} to ${role.name}`)

  let group
  try {
    res = await kualiRequest.get(
      `/api/v1/groups?fields(${process.env.KUALI_ONELOGIN_FIELD_ID})=${role.id}`
    )
    if (res.data && res.data[0]) {
      group = res.data[0]
    }
  } catch (err) {
    console.log(err)
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
      }
    }
    // try {
    //   res = await kualiRequest.get(`/api/v1/users?schoolId=${user}`)
    //   if (res.data && res.data[0]) {
    //     const userId = res.data[0].id
    //     if (kualiMembers.includes(userId)) {
    //       return
    //     }
    //     kualiMembers.push(userId)
    //   }
    // } catch (err) {
    //   console.log(err)
    // }
  })

  for (let i = 0; i < kualiMembers.length; i++) {
    const kualiUser = kualiUsers.find(kualiUser => {
      return kualiUser.id === kualiMembers[i]
    })

    // try {
    // res = await kualiRequest.get(`/api/v1/users/${kualiMembers[i]}`)
    // if (res.data) {
    // const kualiUser = res.data
    if (kualiUser && !oneLoginUsers.includes(kualiUser.schoolId)) {
      console.log('removing', kualiUser.displayName)
      kualiMembers.splice(i, 1)
    }
    // } catch (err) {
    // console.log(err)
    // }
  }

  group.roles[memberPos].value = kualiMembers
  try {
    res = await kualiRequest.put(`/api/v1/groups/${group.id}`, group)
  } catch (err) {
    console.log(err)
  }
}

module.exports = syncUsersGroups
