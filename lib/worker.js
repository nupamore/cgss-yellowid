
const fs = require('fs')
const { INTERVAL } = JSON.parse( fs.readFileSync(`${__dirname}/../config.json`) )
const parser = require('./parser')

const state = {
  endDate: 0
}


function start(func, time) {
  func()
  setInterval(func, time)
}

/**
 * 신규 아이돌 가져오기
 */
function detectNewIdols(keyboard) {
  parser.gachaParse()
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
    }
  })
}


module.exports = function(border, keyboard) {
  start(() => {
    if (new Date() > state.endDate) {
      detectNewIdols(keyboard)
    }
  }, INTERVAL.parse)
  start(border.getNowBorder, INTERVAL.now)
  start(border.getPredictBorder, INTERVAL.predict)
}
