
var mysql = require('mysql');
var express = require('express'),
    app = express();
var bodyParser = require('body-parser');
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
var exec = require('child_process').exec;



var Twitter = require('twitter');
var client = new Twitter({
  consumer_key: 'consumer_key',
  consumer_secret: 'consumer_secret',
  access_token_key: 'access_token_key',
  access_token_secret: 'access_token_secret',
});

var borderCache = {};
var preCache = {};
var BORDER_ID = 3697513573;
var PRE_ID = 3730738512;
var BORDER_INTERVAL = 30000;
var PRE_INTERVAL = 300000;

var PROB = {
  'SSR': 15,
  'SR': 100,
  'NOW': 250,
  'SSR_NOW': 270,
  'SR_NOW': 272,
  'R_NOW': 271
}
var rand1000 = function(){
  return Math.floor(Math.random()*1000);
};


var playKeyboard = {
  "type" : "buttons",
  "buttons" : ["10연챠", "다쟈레", "@갤", "현재 컷", "예상 컷", "인벤"]
};
var eventKeyboard = {
  "type" : "buttons",
  "buttons" : ["현재 컷", "예상 컷", "인벤", "10연챠", "다쟈레", "@갤"]
};

app.get('/', function (req, res) {
  exec("./yellowStart.sh", function (error, stdout, stderr) {
     res.send(stdout);
  });
});

app.get('/keyboard', function (req, res) {
  res.json(eventKeyboard);
});


var getBorder = function(callback){
  client.get('statuses/user_timeline', {user_id: BORDER_ID, count:5}, function(error, tweets, response){
    // check
    for(var i=0; i<tweets.length; i++){
      borderCache = tweets[i];
      if( tweets[i].text.match('千位') ){
        break;
      }
    }
    var text = borderCache.text;
    text = text.replace(/RT @.*: /,'')
                .replace('最終結果','최종결과')
                .replace(/千/g,'천')
                .replace(/万/g,'만')
                .replace(/位/g,'위')
                .replace(/#デレステ.*/,'');
    borderCache.text = text;
    if(callback) callback();
  });
};
var getPre = function(callback){
  client.get('statuses/user_timeline', {user_id: PRE_ID, count:5}, function(error, tweets, response){
    // check
    for(var i=0; i<tweets.length; i++){
      preCache = tweets[i];
      if( tweets[i].text.match('予想') ){
        break;
      }
    }
    var text = preCache.text;
    text = text.replace(/RT @.*: /,'')
                .replace('現在のボーダー予想','최종컷 예상')
                .replace(/千/g,'천')
                .replace(/万/g,'만')
                .replace(/位/g,'위')
                .replace(/#デレステ.*/,'');
    preCache.text = text;
    if(callback) callback();
  });
};
setInterval( getBorder, BORDER_INTERVAL );
setInterval( getPre, PRE_INTERVAL );

app.post('/message', function (req, res) {
  var json = {};

  switch( req.body.content ){
    // event
    case '현재 컷':
      if( borderCache.text ){
        json.keyboard = eventKeyboard;
        json.message = {
          "text": borderCache.text.trim()
        };
        log(json);
        res.json( json );
      }
      else{
        getBorder(function(){
          json.keyboard = eventKeyboard;
          json.message = {
            "text": borderCache.text.trim()
          };
          log(json);
          res.json( json );
        });
      }
    break;

    case '예상 컷':
      if( preCache.text ){
        json.keyboard = eventKeyboard;
        json.message = {
          "text": preCache.text.trim()
        };
        log(json);
        res.json( json );
      }
      else{
        getPre(function(){
          json.keyboard = eventKeyboard;
          json.message = {
            "text": preCache.text.trim()
          };
          log(json);
          res.json( json );
        });
      }
    break;

    case '인벤':
      json.keyboard = eventKeyboard;
      json.message = {
        "message_button": {
          "label": "아이돌마스터 인벤",
          "url": "http://m.inven.co.kr/imas"
        }
      };
      log(json);
      res.json( json );
    break;

    // play

    case '10연챠':
      var connection = mysql.createConnection({
        host     : 'host',
        port     : 'port',
        user     : 'user',
        password : 'password',
        database : 'database'
      });
      connection.connect();

      var idols = '';
      var images = [];
      var num = 1;
      var endQuery = function(name, grade, img_url){
        if(grade=='SSR'){
          images.push(img_url);
        }
        if(num<10){
          idols += name+'【'+grade+'】'+'\n';
        }
        else{
          idols += name+'【'+grade+'】';
          json.keyboard = playKeyboard;
          json.message = {
            "text": idols,
          };
          if(images.length){
            json.message.photo = {
              "url": images[0],
              "width": 300,
              "height": 193
            };
          }
          log(json);
          res.json( json );
        }
      };

      var query = 'SELECT name, grade, img_url'
                +' FROM idol'
                +' WHERE grade LIKE ?'
                +' AND no LIKE ?'
                +' AND limited = 0'
                +' ORDER BY rand() limit 1';
      var noSR = true;
      for(var i=0; i<10; i++){
        var rand = rand1000();
        var grade = 'R';
        var no = '%';
        if( PROB.SSR>rand ){
          if( PROB.NOW>rand1000() ){
            no = PROB.SSR_NOW;
          }
          grade = 'SSR';
          noSR = false;
        }
        else if( PROB.SR>rand ){
          if( PROB.NOW>rand1000() ){
            no = PROB.SR_NOW;
          }
          grade = 'SR';
          noSR = false;
        }
        else{
          if( PROB.NOW>rand1000() ){
            no = PROB.R_NOW;
          }
          grade = 'R';
        }
        // no SR
        if( i==9 && noSR){
          no = '%';
          if( PROB.SSR>rand ){
            if( PROB.NOW>rand1000() ){
              no = PROB.SSR_NOW;
            }
            grade = 'SSR';
          }
          else{
            if( PROB.NOW>rand1000() ){
              no = PROB.SR_NOW;
            }
            grade = 'SR';
          }
        }

        connection.query(query, [grade, no], function(err, rows, fields) {
          if(err) console.log(err);
          endQuery(rows[0].name, rows[0].grade, rows[0].img_url);
          num++;
        });
      }
      connection.end();
    break;

    case '다쟈레':
      var connection = mysql.createConnection({
        host     : 'host',
        port     : 'port',
        user     : 'user',
        password : 'password',
        database : 'database'
      });
      connection.connect();

      connection.query('SELECT text FROM pun ORDER BY rand() limit 1', function(err, rows, fields) {
        if (err) throw err;

        json.keyboard = playKeyboard;
        json.message = {
          "text": rows[0].text,
          "photo": {
            "url": "http://cfile3.uf.tistory.com/image/225E3E3E57308E6B176E88",
            "width": 266,
            "height": 220
          }
        };
        connection.end();
        log(json);
        res.json( json );
      });
    break;

    case '@갤':
      json.keyboard = playKeyboard;
      json.message = {
        "message_button": {
          "label": "아이돌마스터 갤러리",
          "url": "http://m.dcinside.com/list.php?id=idolmaster"
        }
      };
      log(json);
      res.json( json );
    break;

    default:
      json.keyboard = eventKeyboard;
      json.message = {
        "text": '버튼을 클릭해주세요',
      };
      log(json);
      res.json( json );
    break;
  }
});

var log = function(content){
  console.log(content);
};


app.listen(3003);
console.log( 'server start' );
