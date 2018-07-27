const oneLoginRequest = require('./oneLoginRequest')
const kualiRequest = require('./kualiRequest')

const syncGroups = async () => {
  const req = await oneLoginRequest
  let roles = []
  let res = await req.get('/api/1/roles')

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
        await kualiRequest.put(`/api/v1/groups/${kualiGroup.id}`, updateGroup)
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
        await kualiRequest.post('/api/v1/groups', newGroup)
      } catch (err) {
        console.log(err.response.data.errors)
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
      console.log(`Deleting ${kualiGroup.name}`)
      try {
        await kualiRequest.delete(`/api/v1/groups/${kualiGroup.id}`)
      } catch (err) {
        console.log(err.response.data.errors)
      }
    }
  })
}

module.exports = syncGroups
