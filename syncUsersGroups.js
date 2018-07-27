const oneLoginRequest = require('./oneLoginRequest')
const kualiRequest = require('./kualiRequest')

const syncUsersGroups = async () => {
  const req = await oneLoginRequest

  // Get all onelogin roles
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

  roles.some(async (role, index, roles) => {
    // get users for this role
    let users = []
    let res
    try {
      res = await req.get(`/api/1/users?role_id=${role.id}&fields=id`)
      users = users.concat(res.data.data)
    } catch (err) {
      console.log(err)
      return false
    }

    while (res.data.pagination && res.data.pagination.after_cursor) {
      try {
        res = await req.get(
          `/api/1/users?role_id=${role.id}&fields=id&after_cursor=${
            res.data.pagination.after_cursor
          }`
        )
        users = users.concat(res.data.data)
      } catch (err) {
        console.log(err)
      }
    }

    console.log(role.name)
    console.log(users.length)

    let group
    try {
      res = await kualiRequest.get(
        `/api/v1/groups?fields(${process.env.KUALI_ONELOGIN_FIELD_ID})=${
          role.id
        }`
      )
      if (res.data && res.data[0]) {
        group = res.data[0]
      }
    } catch (err) {
      console.log(err)
    }

    console.log(role, group, users)

    // loop users
    // get kualiUserId
    // check if kualiUserId is in group
    // if not add it

    // loop group members
    // lookup onelogin id
    // check if in onelogin users
    // if not, remove

    return true
    // const pos = group.roles
    //   .map(r => {
    //     return r.id
    //   })
    //   .indexOf('members')
    // const members = group.roles[pos].value

    // // if included skip
    // if (members.includes(kualiUserId)) {
    //   return
    // }
    // members.push(kualiUserId)
    // group.roles[pos].value = members
    // // console.log(group.roles)
    // try {
    //   res = await kualiRequest.put(`/api/v1/groups/${group.id}`, group)
    //   console.log(res.data)
    // } catch (err) {
    //   console.log(err.data)
    // }

    // get kuali group for this role
    // add onelogin users not present
    // remove kuali users not present in onelogin
  })

  //         if (res.data && res.data[0]) {
  //           const group = res.data[0]
  //           // const roles = group.roles
  //           // console.log(roles)

  //           const pos = group.roles
  //             .map(r => {
  //               return r.id
  //             })
  //             .indexOf('members')
  //           const members = group.roles[pos].value

  //           // if included skip
  //           if (members.includes(kualiUserId)) {
  //             return
  //           }
  //           members.push(kualiUserId)
  //           group.roles[pos].value = members
  //           // console.log(group.roles)
  //           try {
  //             res = await kualiRequest.put(`/api/v1/groups/${group.id}`, group)
  //             console.log(res.data)
  //           } catch (err) {
  //             console.log(err.data)
  //           }
  //         }
  //       })
  //     }
  //   }
  // })
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
