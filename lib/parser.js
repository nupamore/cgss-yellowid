
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/../secret/key.json`) )
const { URL, PUN } = JSON.parse( fs.readFileSync(`${__dirname}/../config.json`) )

const request = require('request')
const mysql = require('mysql')
const Twitter = require('twitter')
const cheerio = require('cheerio')


class Idol {
  constructor(tr) {
    this.id = tr.find('td.name > a').attr('href')
      .match(/c=([0-9]+)/)[1] * 1

    this.name = tr.find('td.name > a').text()
      .replace(/\[[0-9]+\]/, '')
      .replace(/【.*】/, '')
      .trim()

    // 등급
    this.grade = tr.find('td.field1').text().replace(/[0-9]/, '')
    // 속성
    this.type = tr.find('td.field2').text().replace(/[0-9]/, '')
    // 한정
    this.limited = tr.attr('field7') * 1

    this.img = this.grade.match('SR')
      ? URL.inven.img_src_style.replace('{id}', this.id)
      : null
  }
}


/**
 * 아이돌을 파싱합니다.
 */
function idolParse() {
  request(URL.inven.idol, (err, res, body) => {
    if (err) throw err

    const $ = cheerio.load(body)
    const idols = $('tr[field7]')

    idols.each((i, el) => {
      const idol = new Idol($(el))
      console.log(idol)
    })
  })
}


/**
 * 뉴스 리스트를 파싱합니다.
 */
function listParse() {
  return new Promise((resolve, reject) => {
    request(URL.inven.news, (err, res, body) => {

      const $ = cheerio.load(body)
      const list = $('td.bbsSubject')
        .filter((i, el) => $(el).text().match('신규 아이돌'))

      resolve({
        title: $(list[0]).text(),
        src: $(list[0]).find('a').attr('href')
      })
    })
  })
}


/**
 * 뉴스를 파싱합니다.
 */
function newsParse(src) {
  return new Promise((resolve, reject) => {
    request(src, (err, res, body) => {

      const $ = cheerio.load(body)
      const content = $('#powerbbsContent').text()

      const idols = content.match(/\[.*?\].*?\(SS.*?\)/g)
        .map(idol => {
          const name = idol.replace(/\[.*\] /, '')
          .replace(/ \(.*\)/, '')
          .split(' ')

          return name[1] || name[0]
        })
        .reduce((p, n) => `${p}, ${n}`)

      const endDate = content.match(/ [0-9]+월 [0-9]+일 [0-9]+:59/)[0]
        .replace(' ', '~')
        .replace('월 ', '/')
        .replace(/일.*/, '')

      const str = `${idols} 통상 ${endDate}`
      resolve(str)
    })
  })
}


/**
 * 다쟈레를 파싱합니다.
 */
function punParse() {
  const QUERY_PUN = `
    INSERT INTO pun(text, reg_dtime)
    VALUES (? , ?)
  `

  const twitter = new Twitter( KEY.TWITTER )
  const connection = mysql.createConnection( KEY.DB )
  connection.connect()

  twitter.get('statuses/user_timeline', PUN, (err, tweets, res) => {

    tweets.forEach(({text, created_at}) => {
      if( !text.match(/@.* /) ){
        text = text.replace(/https:.*/, '')
          .replace(/\(([A-Za-z0-9_]+)\)/, '(@$1)')
          .trim()

        connection.query(QUERY_PUN, [text, new Date(created_at)], (err, result) => {
          if (err) throw err
          else console.log( result.insertId )
        })
      }
    })
    connection.end()

  })
}


module.exports = {
  punParse,
  idolParse,
  gachaParse() {
    return listParse()
    .then(bbs => newsParse(bbs.src))
  }
}
