require('dotenv').config()

const oneLoginRequest = require('./oneLoginRequest')
const kualiRequest = require('./kualiRequest')

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
        const updateRes = await kualiRequest.put(
          `/api/v1/users/${kualiUser.id}`,
          updateUser
        )

        // console.log(updateRes.data)
      } catch (err) {
        console.log('=========================================')
        console.log(`OneLogin User: ${JSON.stringify(user)}`)
        console.log('-')
        console.log(`Kuali User: ${JSON.stringify(kualiUser)}`)
        console.log('-')
        console.log(`PUT ${JSON.stringify(updateUser)}`)
        console.log('-')
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
        // console.log(`POSTING: ${JSON.stringify(newUser)}`)
        const updateRes = await kualiRequest.post(`/api/v1/users`, newUser)
      } catch (err) {
        console.log('=========================================')
        console.log(`OneLogin User: ${JSON.stringify(user)}`)
        console.log('-')
        console.log(`PUT ${JSON.stringify(newUser)}`)
        console.log('-')
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
        const response = await kualiRequest.delete(
          `/api/v1/users/${kualiUser.id}`
        )
      } catch (err) {
        console.log(err.response.data)
      }
    }
  })
}

// run()

const syncGroups = async () => {
  const req = await oneLoginRequest
  let roles = []
  const res = await req.get('/api/1/roles')

  roles = roles.concat(res.data.data)

  while (res.data.pagination && res.data.pagination.after_cursor) {
    res = await req.get(
      `/api/1/roles?after_cursor=${res.data.pagination.after_cursor}`
    )
    roles = roles.concat(res.data.data)
  }

  console.log(`Syncing ${roles.length} groups`)

  roles.forEach(async role => {
    const res = await kualiRequest.get(
      `/api/v1/groups?fields(${process.env.KUALI_ONELOGIN_FIELD_ID})=${role.id}`
    )
    if (res.data && res.data[0]) {
      const kualiGroup = res.data[0]

      const updateGroup = {
        name: role.name
      }

      try {
        const updateRes = await kualiRequest.put(
          `/api/v1/groups/${kualiGroup.id}`,
          updateGroup
        )
      } catch (err) {
        console.log(err.response.data.errors)
      }
    } else {
      const newGroup = {
        name: role.name,
        categoryId: process.env.KUALI_ONELOGIN_CATEGORY_ID,
        fields: [
          {
            id: process.env.KUALI_ONELOGIN_FIELD_ID,
            value: role.id
          }
        ]
      }
      try {
        const res = await kualiRequest.post('/api/v1/groups', newGroup)
      } catch (err) {
        console.log(err)
      }
    }
  })

  const response = await kualiRequest.get(
    `/api/v1/groups?categoryId=${process.env.KUALI_ONELOGIN_CATEGORY_ID}`
  )
  const kualiGroups = response.data
  kualiGroups.forEach(async kualiGroup => {
    let i = kualiGroup.fields.findIndex(
      f => f.id === process.env.KUALI_ONELOGIN_FIELD_ID
    )
    const oneLoginId = kualiGroup.fields[i].value
    let index = roles.findIndex(r => r.id.toString() === oneLoginId)
    if (index === -1) {
      console.log(`DELETING: ${kualiGroup.name}`)
      try {
        const response = await kualiRequest.delete(
          `/api/v1/groups/${kualiGroup.id}`
        )
      } catch (err) {
        console.log(err.response.data)
      }
    }
  })
}

const sync = async () => {
  await syncUsers()
  await syncGroups()
}

sync()
