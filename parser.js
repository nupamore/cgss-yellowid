
var htmlparser = require("htmlparser2");
var request = require('request');
var mysql = require('mysql');
var Twitter = require('twitter');

var idolParse = function(){
  var idols = [];
  var grade = '';
  var name = '';

  var scan = {
    grade: false,
    name: false
  }

  var parser = new htmlparser.Parser({
  	onopentag: function(tagname, attribs){
  		if(tagname === "td"){
        if(attribs.class === "field1"){
          scan.grade = true;
        }
  		}
      if(tagname === "a" && scan.idol){
        scan.name = true;
      }
      if(tagname === "span"){
        scan.name = false;
      }
  	},
  	ontext: function(text){
      if(scan.grade){
        if(!text.match(/[^SRN]/)){
          scan.idol = true;
          grade = text;
        }
      }
      if(scan.name){
        name = text.trim();
        idols.push({
          grade: grade,
          name: name
        });
      }
  	},
  	onclosetag: function(tagname){
  		if(tagname === "tr"){
  			scan.idol = false;
  		}
      if(tagname === "td"){
  			scan.grade = false;
  		}
      if(tagname === "html"){
        // parse complete
        inputDB(idols);
  		}
  	}
  }, {decodeEntities: true});

  request('http://imas.inven.co.kr/dataninfo/card/sl_list.php', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      parser.write(body);
    }
  })
  parser.end();



  var inputDB = function(idols){
    var connection = mysql.createConnection({
      host     : 'host',
      port     : 'port',
      user     : 'user',
      password : 'password',
      database : 'database'
    });
    connection.connect();

    for(var i=0; i<idols.length; i++){
      connection.query('INSERT INTO idol(NAME, GRADE) VALUES (? ,?)', [idols[i].name, idols[i].grade], function(err, result) {
        if (err) throw err;

        console.log(result.insertId);
      });
    }
    connection.end();
  };
};



var punParse = function(){

  var client = new Twitter({
    consumer_key: 'consumer_key',
    consumer_secret: 'consumer_secret',
    access_token_key: 'access_token_key',
    access_token_secret: 'access_token_secret',
  });
  var connection = mysql.createConnection({
    host     : 'host',
    port     : 'port',
    user     : 'user',
    password : 'password',
    database : 'database'
  });
  connection.connect();

  var searchDB = function(text, time){
    connection.query('SELECT reg_dtime FROM pun WHERE reg_dtime = ?', [time], function(err, rows, fields) {
      if (err) throw err;
      if( !rows[0] ){
        insertDB(text, time);
      }
    });
  };
  var insertDB = function(text, time){
    connection.query('INSERT INTO pun(text, reg_dtime) VALUES (? , ?)', [text, time], function(err, result) {
      if (err) throw err;

      console.log(result.insertId);
    });
  };

  client.get('search/tweets', {q: 'dajare_kaedesan', count: 100}, function(error, tweets, response){
    // check
    for(i=0; i<tweets.statuses.length; i++){
      var text = tweets.statuses[i].text;
      var time = new Date(tweets.statuses[i].created_at);
      if( !text.match(/@.* /) ){
        text = text.replace(/https:.*/, '').replace(/\(([A-Za-z0-9_]+)\)/,'(@$1)').trim();

        searchDB(text, time);
      }
    }
  });
};
