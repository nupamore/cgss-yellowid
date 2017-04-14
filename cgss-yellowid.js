
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/secret/key.json`) )
const { FUNC, TEXT, URL } = JSON.parse( fs.readFileSync(`${__dirname}/config.json`) )

const keyboard = require('./lib/keyboard')
const border = require('./lib/border')
const gacha = require('./lib/gacha')
const pun = require('./lib/pun')
const stamina = require('./lib/stamina')
const parser = require('./lib/parser')
const worker = require('./lib/worker')(border, keyboard)

const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')

const session = {}


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
  const { path, body:{content} } = req
  const dateStr = new Date().toString().split(' G')[0]
  console.log(`${requestId++} ${path} / ${content||''} / ${dateStr}`)
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
  const { content, user_key: key } = req.body
  let json = {}

  switch( content ){
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
        url: URL.inven.border
      })
      res.json(json)
    break

    /**
     * 단챠
     */
    case FUNC.gacha_single:
      gacha(1).then( ({text, url}) => {
        json = url
          ? keyboard.photo( 'gacha', text, {url, width:300, height:193} )
          : keyboard.text( 'gacha', text )
        res.json(json)
      })
      .catch( err => console.log(err) )
    break

    /**
     * 10연챠
     */
    case FUNC.gacha_ten:
      gacha(10).then( ({text, url}) => {
        json = url
          ? keyboard.photo( 'gacha', text, {url, width:300, height:193} )
          : keyboard.text( 'gacha', text )
        res.json(json)
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
     * 스태미나 확인
     */
    case FUNC.stamina_get:
      stamina.get( key ).then( text => {
        json = keyboard.text( 'play', text )
        res.json(json)
      })
      .catch( err => {
        json = keyboard.text( 'play', TEXT.stamina_error )
        res.json(json)
      })
    break

    /**
     * 스태미나 설정 --> 텍스트 입력
     */
    case FUNC.stamina_set:
      session[key] = 'stamina'

      json = keyboard.input( TEXT.stamina_help )
      res.json(json)
    break


    /**
     * 텍스트를 받았을 때
     */
    default:
      // 스태미나 설정
      if( session[key] == 'stamina' ){
        stamina.set( key, content ).then( text => {
          json = keyboard.text( 'play', text )
          res.json(json)
        })
        .catch( err => console.log(err) )
      }

      // default
      else{
        json = keyboard.text( 'border', TEXT.default )
        res.json(json)
      }

      delete session[key]
    break
  }
})
