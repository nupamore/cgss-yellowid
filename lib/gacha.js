
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/../secret/key.json`) )
const { PROB, PROB_UP } = JSON.parse( fs.readFileSync(`${__dirname}/../config.json`) )

const mysql = require('mysql')

const QUERY_GACHA = `
  SELECT name, grade, img_url
  FROM idol
  WHERE grade LIKE ?
    AND limited = 0
    AND now = ?
  ORDER BY rand()
  LIMIT 1
`

/**
 * 랜덤함수
 * @param  {Number} int 최대치
 * @return {Number}
 */
function rand( int ){
  return Math.floor( Math.random()*int )
}


/**
 * 아이돌을 랜덤으로 뽑습니다.
 * @param  {Number}   number 아이돌 수
 * @return {Promise}
 */
module.exports = function gacha( number ){
  const connection = mysql.createConnection( KEY.DB )
  connection.connect()
  /**
   * 확률 계산
   */
  let sr = false    // SR이상 당첨 여부
  const grades = [...Array(number).keys()]    // range()
  .map( index => {
    // 레어도
    let grade = rand(1000)
    if( grade > PROB.SR+PROB.SSR ) grade = 'R'
    else if( grade > PROB.SSR ){
      grade = 'SR'
      sr = true
    }
    else{
      grade = 'SSR'
      sr = true
    }

    // SR이상 1장 확정
    if( !sr && index==9 ){
      if( rand(100) > PROB.SSR ) grade = 'SR'
      else grade = 'SSR'
    }

    // 확률업
    let now = rand(1000)
    if( now > PROB_UP[grade] ) now = false
    else now = true

    // 프로미스에 담기
    return new Promise( (resolve, reject) => {
      connection.query( QUERY_GACHA, [grade, now], (err, rows, fields) => {
        if(err) reject(err)
        else if(!rows[0]) reject(new Error('not found'))
        else resolve(rows[0])
      })
    })
  })

  // 프로미스 전달
  return new Promise( (resolve, reject) => {
    Promise.all( grades )
    .then( idols => {
      connection.end()

      let img = ''
      const text = idols.map( idol => {
        if( idol.grade == 'SSR' ) img = idol.img_url
        return `${idol.name}【${idol.grade}】\n`
      })
      .reduce( (p,n) => p+n )
      .trim()

      resolve( {text, url:img} )
    })
    .catch( err => {
      connection.end()
      reject(err)
    })
  })
}
