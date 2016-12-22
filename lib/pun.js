
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/../secret/key.json`) )

const mysql = require('mysql')

const query_pun = `
  SELECT text
  FROM pun
  ORDER BY rand()
  LIMIT 1
`

module.exports = function pun(){
  return new Promise( (resolve, reject) => {
    const connection = mysql.createConnection( KEY.DB )
    connection.connect()
    connection.query( query_pun, (err, rows, fields) => {
      connection.end()
      if(err) reject(err)
      else resolve( rows[0].text )
    })
  })
}
