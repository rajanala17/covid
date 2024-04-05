const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()
const stateDbToResponse = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
const districtDbtoResponse = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
//GET ALL DETAILS FROM STATE
app.get('/states/', async (request, response) => {
  const api1 = `
  SELECT 
  *
  FROM 
  state;`
  const a = await db.all(api1)
  response.send(a.map(i => stateDbToResponse(i)))
})
//GET ONLY THE REQUIRED ITEM
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const api2 = `
  SELECT 
  *
  FROM
  state
  WHERE 
  state_id=${stateId};`
  const b = await db.get(api2)
  response.send(stateDbToResponse(b))
})
//POST
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const api3 = `
  INSERT INTO 
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES
  ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`
  await db.run(api3)
  response.send('District Successfully Added')
})
//GET ONE ITEM
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const api4 = `
  SELECT 
  *
  FROM 
  WHERE
  district_id=${districtId};`
  const z = await db.get(api4)
  response.send(districtDbtoResponse(z))
})
//DELETE
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const api5 = `
    DELETE
    FROM 
    district
    WHERE
    district_id=${districtId};`
  await db.run(api5)
  response.send('District Removed')
})
//PUT
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const api6 = `
  UPDATE 
  district
  SET 
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}
  WHERE 
  district_id = ${districtId};`
  await db.run(api6)
  response.send('District Details Updated')
})
//GET COUNT
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const api7 = `
  SELECT 
  SUM(cases) AS totalCases,
  SUM(cured) AS totalCured,
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths
  
  FROM 
  district 
  WHERE 
  state_id = ${stateId};`
  const y = await db.get(api7)
  response.send(y)
})
//GET STATE
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateid = `
  SELECT 
  state_id 
  FROM 
  district
  WHERE
  district_id = ${districtId};`
  const getState = await db.get(stateid)
  const api8 = `
  SELECT
  state_name AS stateName FROM state
  WHERE 
  state_id = ${getState.state_id};`
  const result = await db.get(api8)
  response.send(result)
})
module.exports = app
