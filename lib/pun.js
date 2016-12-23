
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/../secret/key.json`) )

const mysql = require('mysql')

const QUERY_PUN = `
  SELECT text
  FROM pun
  ORDER BY rand()
  LIMIT 1
`


/**
 * 랜덤으로 다쟈레를 하나 뽑습니다.
 * @return {Promise}
 */
module.exports = function pun(){
  return new Promise( (resolve, reject) => {
    const connection = mysql.createConnection( KEY.DB )
    connection.connect()
    connection.query( QUERY_PUN, (err, rows, fields) => {
      connection.end()
      if(err) reject(err)
      else resolve( rows[0].text )
    })
  })
}
