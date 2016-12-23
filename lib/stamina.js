
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/../secret/key.json`) )

const mysql = require('mysql')

const QUERY_GET_STAMINA = `
  SELECT stamina, level, reg_dtime
  FROM stamina
  WHERE user = ?
`
const QUERY_UPDATE_STAMINA = `
  UPDATE stamina
  SET stamina = ?, level = ?, reg_dtime = now()
  WHERE user = ?
`
const QUERY_CREATE_STAMINA = `
  INSERT INTO stamina ( user, stamina, level, reg_dtime )
  VALUES ( ?, ?, ?, now() )
`

// 레벨당 최대스태미너
const MAX_LEVEL = 150
const MAX_STAMINA = [...Array(MAX_LEVEL+1).keys()]
  .map( level => {
    // 초기 스태미너
    let stamina = 40

    for(let i=0; i<level; i++){
      if( i < 20 ) stamina += 0.5
      else if( i < 50 ) stamina += 0.33334
      else if( i < 90 ) stamina += 0.25
      else if( i < 140 ) stamina += 0.2
      else stamina += 0.1
    }
    return Math.floor(stamina)
  })


/**
 * 0을 채워준다.
 * @param  {Number} time
 * @return {String}
 */
function zerofill( time ){
  return ( time < 10 )
    ? '0'+time
    : ''+time
}


module.exports = {
  /**
   * 스태미너를 계산합니다.
   * @param  {String}   user 유저키
   * @return {Promise}
   */
  get( user ){
    return new Promise( (resolve, reject) => {
      const connection = mysql.createConnection( KEY.DB )
      connection.connect()
      connection.query( QUERY_GET_STAMINA, [user], (err, rows, fields) => {
        connection.end()
        if(err || !rows[0]) reject(err)
        else if( !rows[0] ) reject(new Error('데이터를 찾을 수 없습니다'))
        else {
          // 과거
          const b = {
            stamina: rows[0].stamina,
            time: rows[0].reg_dtime
          }
          b.hour = zerofill( b.time.getHours() )
          b.minute = zerofill( b.time.getMinutes() )

          // 현재
          const n = {
            stamina: 0,
            time: new Date()
          }
          n.hour = zerofill( n.time.getHours() )
          n.minute = zerofill( n.time.getMinutes() )

          // 계산
          const dtime = n.time.getTime() - b.time.getTime()
          n.stamina = b.stamina + Math.round(dtime / (1000*60*5))

          const max = MAX_STAMINA[rows[0].level]
          if( n.stamina >= max ) n.stamina = `${max} (MAX)`

          const beforeText = `이전 (${b.hour}:${b.minute}) - ${b.stamina}`
          const nowText = `현재 (${n.hour}:${n.minute}) - ${n.stamina}`

          resolve( `${beforeText}\n${nowText}` )
        }
      })
    })
  },


  /**
   * 스태미너를 설정합니다.
   * @param  {String}   user 유저키
   * @param  {String}   text 입력값
   * @return {Promise}
   */
  set( user, text ){
    return new Promise( (resolve, reject) => {
      if( !/[0-9]+( [0-9]+)?/.test(text) ) reject(new Error('유효하지 않은 입력입니다'))
      else{
        let [ stamina, level ] = text.split(' ')
        if( level > MAX_LEVEL ) level = MAX_LEVEL

        const connection = mysql.createConnection( KEY.DB )
        connection.connect()
        connection.query( QUERY_GET_STAMINA, [user], (err, rows, fields) => {
          // level 값이 없을 때
          if(!level) level = rows[0].level || MAX_LEVEL

          // 기존에 있던 경우
          if(rows[0]){
            connection.query( QUERY_UPDATE_STAMINA, [stamina, level, user], (err, result) => {
              connection.end()
              if(err) reject(err)
              else resolve( '수정되었습니다' )
            })
          }
          // 기존에 없던 경우
          else{
            connection.query( QUERY_CREATE_STAMINA, [user, stamina, level], (err, result) => {
              connection.end()
              if(err) reject(err)
              else resolve( '등록되었습니다' )
            })
          }
        })

      }
    })
  },
}
