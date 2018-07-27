const oneLoginRequest = require('./oneLoginRequest')
const kualiRequest = require('./kualiRequest')

const syncUsersGroups = async () => {
  const req = await oneLoginRequest

  // Get all onelogin users
  let users = []
  let res = await req.get('/api/1/users?fields=id,role_id')
  users = users.concat(res.data.data)

  while (res.data.pagination && res.data.pagination.after_cursor) {
    res = await req.get(
      `/api/1/users?fields=id,role_id&after_cursor=${
        res.data.pagination.after_cursor
      }`
    )
    users = users.concat(res.data.data)
  }
  console.log(`Syncing ${users.length} users`)

  // Sync users into groups
  // foreach user
  users.forEach(async user => {
    let res = await kualiRequest.get(`/api/v1/users?schoolId=${user.id}`)
    if (res.data || res.data[0]) {
      const kualiUserId = res.data[0].id

      if (Array.isArray(user.role_id)) {
        user.role_id.forEach(async roleId => {
          res = await kualiRequest.get(
            `/api/v1/groups?fields(${
              process.env.KUALI_ONELOGIN_FIELD_ID
            })=${roleId}`
          )

          if (res.data && res.data[0]) {
            const category = res.data[0]
            console.log(category.roles)
          }
        })
      }
    }
  })
  // get kuali id for the user
  // foreach role
  // find group
  // check if kuali id is in members role
  // if not there
  // add kuali id to members role

  // Delete users from groups they are no longer in
  // ?????
}

module.exports = syncUsersGroups
