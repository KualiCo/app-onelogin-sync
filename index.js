require('dotenv').config()

const syncUsers = require('./syncUsers')
const syncGroups = require('./syncGroups')
const syncUsersGroups = require('./syncUsersGroups')

const sync = async () => {
  await syncUsers()
  await syncGroups()
  await syncUsersGroups()
}

sync()
