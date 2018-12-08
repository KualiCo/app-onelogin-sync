require('dotenv').config()

const syncUsers = require('./logic/syncUsers')
const syncGroups = require('./logic/syncGroups')
const syncUsersGroups = require('./logic/syncUsersGroups')

const sync = async () => {
  await syncUsers()
  await syncGroups()
  await syncUsersGroups()
}

sync()
