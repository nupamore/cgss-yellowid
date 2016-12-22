
const fs = require('fs')
const KEY = JSON.parse( fs.readFileSync(`${__dirname}/../secret/key.json`) )
const { BORDER, INTERVAL, TEXT } = JSON.parse( fs.readFileSync(`${__dirname}/../config.json`) )

const Twitter = require('twitter')
const twitter = new Twitter( KEY.TWITTER )

const cache = {
  now: {},
  predict: {},
}


/**
 * 현재 이벤트 컷을 가져옵니다.
 */
function getNowBorder(){
  twitter.get( 'statuses/user_timeline', BORDER.now, (err, tweets, res) => {
    if(err) console.log(err)
    else{
      cache.now = tweets.find( tweet => tweet.text.match('2千位') ).text
      cache.now = cache.now
      .replace(/RT @.*: /, '')
      .replace('最終結果', '최종결과')
      .replace(/千/g, '천')
      .replace(/万/g, '만')
      .replace(/位/g, '위')
      .replace(/https:.*/g, '')
      .replace(/#デレステ.*/, '')
      .trim()
    }
  })
}


/**
 * 예상 이벤트 컷을 가져옵니다.
 */
function getPredictBorder(){
  twitter.get('statuses/user_timeline', BORDER.predict, (err, tweets, res) => {
    if(err) console.log(err)
    else{
      cache.predict = tweets.find( tweet => tweet.text.match('予想') ).text
      cache.predict = cache.predict
      .replace('現在のボーダー予想', '최종컷 예상')
      .replace(/千/g, '천')
      .replace(/万/g, '만')
      .replace(/位/g, '위')
      .replace(/위:/g, '위:   ')
      .replace(/pts/g, '')
      .replace(/#デレステ.*/, '')
      .trim()
    }
  })
}


/**
 * 스케줄링
 */
getNowBorder()
getPredictBorder()
setInterval( getNowBorder, INTERVAL.now )
setInterval( getPredictBorder, INTERVAL.predict )

module.exports = {
  now(){
    if( cache.now ) return cache.now
    else return TEXT.error
  },

  predict(){
    if( cache.predict ) return cache.predict
    else return TEXT.error
  }
}
