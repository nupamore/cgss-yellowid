
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/secret/key.json`) )
const { FUNC, TEXT, URL } = JSON.parse( fs.readFileSync(`${__dirname}/config.json`) )

const keyboard = require('./lib/keyboard.js')
const border = require('./lib/border.js')
const gacha = require('./lib/gacha.js')
const pun = require('./lib/pun.js')

const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')


/**
 * express
 */
const app = express()
app.set( 'port', KEY.SERVER.port )
app.use( bodyParser.json() )
app.use( bodyParser.urlencoded({ extended: true }) )
app.listen( app.get('port'), () => {
  console.log( `Server running at ${app.get('port')}` )
})

let requestId = 0
app.use( (req, res, next) => {
  console.log(`${requestId++} ${req.path} / ${req.body.content||''} / ${ new Date().toString().split(' G')[0] }`)
  next()
})


/**
 * router
 */
app.get( '/keyboard', (req, res) => {
  json = keyboard.keyboard( 'border' )
  res.json(json)
})

app.post( '/message', (req, res) => {
  let json = {}
  switch( req.body.content ){
    /**
     * 현재 컷
     */
    case FUNC.border_now:
      json = keyboard.text( 'border', border.now() )
      res.json(json)
    break

    /**
     * 예상 컷
     */
    case FUNC.border_pre:
      json = keyboard.text( 'border', border.predict() )
      res.json(json)
    break

    /**
     * 인벤 컷
     */
    case FUNC.border_inven:
      json = keyboard.message_button( 'border', TEXT.inven, {
        label: '인벤계산기',
        url: URL.inven
      })
      res.json(json)
    break

    /**
     * 단챠
     */
    case FUNC.gacha_single:
      gacha(1).then( (text, img) => {
        json = img
          ? keyboard.photo( 'gacha', text, {img, width:300, height:193} )
          : keyboard.text( 'border', text )
        res.json(json)
      })
      .catch( err => console.log(err) )
    break

    /**
     * 10연챠
     */
    case FUNC.gacha_ten:
      gacha(10).then( (text, url) => {
        json = url
          ? keyboard.photo( 'gacha', text, {url, width:300, height:193} )
          : keyboard.text( 'border', text )
      })
      .catch( err => console.log(err) )
    break

    /**
     * 다쟈레
     */
    case FUNC.pun:
      pun().then( text => {
        json = keyboard.photo( 'play', text, {url:URL.kaede, width:266, height:220} )
        res.json(json)
      })
      .catch( err => console.log(err) )
    break

    /**
     * default
     */
    default:
      json = keyboard.text( 'border', TEXT.default )
      res.json(json)
    break
  }
})
