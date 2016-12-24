
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/secret/key.json`) )
const { PUN } = JSON.parse( fs.readFileSync(`${__dirname}/config.json`) )

const htmlparser = require('htmlparser2')
const request = require('request')
const mysql = require('mysql')
const Twitter = require('twitter')

const QUERY_PUN = `
  INSERT INTO pun(text, reg_dtime)
  VALUES (? , ?)
`


/**
 * 다쟈레를 파싱합니다.
 */
function punParse(){

  const twitter = new Twitter( KEY.TWITTER )
  const connection = mysql.createConnection( KEY.DB )
  connection.connect()

  twitter.get( 'statuses/user_timeline', PUN, (err, tweets, res) => {

    tweets.forEach( ({text, created_at}) => {
      if( !text.match(/@.* /) ){
        text = text.replace(/https:.*/, '')
          .replace(/\(([A-Za-z0-9_]+)\)/, '(@$1)')
          .trim()

        connection.query( QUERY_PUN, [text, new Date(created_at)], (err, result) => {
          if (err) throw err
          else console.log( result.insertId )
        })
      }
    })
    connection.end()

  })
}

punParse()
