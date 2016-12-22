
const fs = require('fs')
const { FUNC, TEXT } = JSON.parse( fs.readFileSync(`${__dirname}/../config.json`) )

const menu = {
  border: [FUNC.border_now, FUNC.border_pre, FUNC.border_inven],
  gacha: [FUNC.gacha_single, FUNC.gacha_ten, FUNC.gacha_update],
  play: [FUNC.pun, FUNC.pun, FUNC.gacha_update],
}

const buttons = {
  border: [...menu.border, ...menu.gacha, ...menu.play],
  gacha: [...menu.gacha, ...menu.play, ...menu.border],
  play: [...menu.play, ...menu.border, ...menu.gacha],
}

module.exports = {

  keyboard( menu ){
    return {
      keyboard: {
        type : 'buttons',
        buttons : buttons[menu]
      }
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

}
