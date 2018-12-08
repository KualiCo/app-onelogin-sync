require('dotenv').config()

const syncUsers = require('./logic/syncUsers')
const syncGroups = require('./logic/syncGroups')
const syncUsersGroups = require('./logic/syncUsersGroups')

const sync = async () => {
  let errors = []
  await syncUsers(errors)
  await syncGroups(errors)
  await syncUsersGroups(errors)
}

sync()
