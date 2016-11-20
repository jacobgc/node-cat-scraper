var express = require('express');
var router = express.Router();
var request  =  require('request');
var r = require("rethinkdb");

var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
})


/* GET home page. */
router.get('/', function(req, res, next) {
  r.db('CC').table('images').run(connection, function(err, cursor){
    if (err) throw err;
    cursor.toArray(function(err, result){
      if (err) throw err;
      rI = Math.floor(Math.random() * result.length + 1);
      res.render('index', { title: 'CATS!', image: result[rI], amount: result.length });
    })
  });
});

router.get('/scrape', function(req, res, next) {
  getOffset(getOffset, function(result){
    request('http://api.giphy.com/v1/gifs/search?q=cute+cat&limit=100&api_key=dc6zaTOxFJmzC&offset=' + result, function(error, responce, html){
      if (error) {
        throw error;
      }else{
        html = JSON.parse(html);
        console.log(html.data.length);
        for (var i = 0; i < html.data.length; i++) {
          insertToDB(html.data[i]);
        }
        iSearch(100);
        res.redirect('/');
      }
    });
  });
});

module.exports = router;

function insertToDB(data) {
  console.log(data.id);
  r.db('CC').table('images').filter(r.row('id').eq(data.id)).
    run(connection, function(err, cursor) {
      if (err) throw err;
      cursor.toArray(function(err, result) {
          if (err) throw err;
          if (result < 1) {
            console.log(data.id + " Not found in DB. Inserting now");

            r.db('CC').table("images").insert([
              {
                "id": data.id,
                "url": data.images.original.url
              }
            ]).run(connection);
          }
      });
  });
}

function iSearch(i) {
  r.db('CC').table('meta').filter(r.row('type').eq('searchPos')).
    run(connection, function(err, cursor){
      if (err) throw err;
      cursor.toArray(function(err, result){
        if (err) throw err;
        if (result < 1){
          r.db('CC').table("meta").insert([
            {
              "type": "searchPos",
              "data": 25
            }
          ]).run(connection);
        }else{
          r.db('CC').table('meta').filter(r.row('type').eq('searchPos')).
            update({"data": result[0].data + 25}).run(connection, function(err, result1){
              if (err) throw err;
            });
        }
      });
    });
  }

  function getOffset(getOffset, callback) {
    r.db('CC').table('meta').filter(r.row('type').eq('searchPos')).
      run(connection, function(err, cursor){
        if (err) throw err;
        cursor.toArray(function(err, result){
          if (err) throw err;
            if (result < 1){
              iSearch(0);
            }else{
              callback(result[0].data);
            }
          });
        });
      }
