
const fs = require('fs')
const { FUNC, TEXT } = JSON.parse( fs.readFileSync(`${__dirname}/../config.json`) )
const parser = require('./parser')

/**
 * 버튼 배치
 */
const menu = {
  border: [FUNC.border_now, FUNC.border_pre, FUNC.border_inven],
  gacha: [FUNC.gacha_single, FUNC.gacha_ten, FUNC.gacha_update],
  play: [FUNC.stamina_get, FUNC.stamina_set, FUNC.pun],
}

/**
 * 버튼 리스트 배치
 */
const buttons = {
  border: [...menu.border, ...menu.gacha, ...menu.play],
  gacha: [...menu.gacha, ...menu.play, ...menu.border],
  play: [...menu.play, ...menu.border, ...menu.gacha],
}


module.exports = {
  // 현재 확률업 아이돌 설정
  set now(str) {
    FUNC.gacha_update = str
    console.log(`확률업 알림 텍스트: ${str}`)
  },

  keyboard( menu ){
    return {
      type : 'buttons',
      buttons : buttons[menu]
    }
  },

  text( menu, text ){
    return {
      keyboard: {
        type : 'buttons',
        buttons : buttons[menu]
      },
      message: {text}
    }
  },

  message_button( menu, text, message_button ){
    return {
      keyboard: {
        type : 'buttons',
        buttons : buttons[menu]
      },
      message: {text, message_button}
    }
  },

  photo( menu, text, photo ){
    return {
      keyboard: {
        type : 'buttons',
        buttons : buttons[menu]
      },
      message: {text, photo}
    }
  },

  input( text ){
    return {
      keyboard: {
        type : 'text'
      },
      message: {text}
    }
  },

}
