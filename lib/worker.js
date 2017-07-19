
const fs = require('fs')
const mysql = require('mysql')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/../secret/key.json`) )
const { INTERVAL } = JSON.parse( fs.readFileSync(`${__dirname}/../config.json`) )
const parser = require('./parser')

const state = {
  idols: [],
  endDate: 0,
  valid: false
}

const QUERY_TEST = `
  SELECT name
  FROM idol
  WHERE name = ?
`


function start(func, time) {
  func()
  setInterval(func, time)
}

/**
 * 신규 아이돌 가져오기
 */
function detectNewIdols(keyboard) {
  return parser.gachaParse()
  .then(({type, idols, ssrNames, endDate}) => {
    const ssr = ssrNames.reduce((p, n) => `${p}, ${n}`)
    const date = '~' + endDate
      .replace(/월\s/, '/')
      .replace(/일.*/, '')
    const str = `${ssr} ${type} ${date}`

    state.endDate = new Date(endDate.replace(/월\s/, '/').replace('일', ''))
    state.endDate.setYear(new Date().getFullYear())

    if (keyboard.now != str) {
      keyboard.now = str
      parser.idolParse(idols)
      state.idols = idols
    }
  })
}

/**
 * 신규 아이돌 수동설정
 */
function setNewIdols(keyboard) {
  return new Promise((resolve, reject) => {
    state.endDate = new Date('7/24 14:59')
    state.endDate.setYear(new Date().getFullYear())
    state.endDate.setMilliseconds(INTERVAL.parse)
    state.valid = true
    state.idols = [
      '[비비드★에고이스트] 마토바 리사',
      '[스테이지 디바] 코무로 치나미',
    ]
    keyboard.now = '리사 통상 ~7/24'

    parser.idolParse(state.idols)
    resolve()
  })
}

/**
 * DB에 확률업 아이돌 추가됐는지 확인
 */
function DBcheck() {
  const connection = mysql.createConnection(KEY.DB)
  connection.connect()

  const promises = state.idols.map(idol => new Promise((resolve, reject) => {
    connection.query(QUERY_TEST, idol, (err, result) => {
      if (err) reject(err)
      else if (!result.length) reject(err)
      else resolve(result)
    })
  }))

  Promise.all(promises)
  .then(() => state.valid = true)
  .catch(() => state.valid = false)
  .then(() => connection.end())
}


module.exports = function(border, keyboard) {
  start(() => {
    if (!state.valid || new Date() > state.endDate) {
      // detectNewIdols(keyboard)
      setNewIdols(keyboard)
      .then(DBcheck)
    }
  }, INTERVAL.parse)
  start(border.getNowBorder, INTERVAL.now)
  start(border.getPredictBorder, INTERVAL.predict)
}
