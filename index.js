#!/usr/bin/env node
'use strict';

/*
  News+ example webserver
*/

var path = require('path')
  , express = require('express')
  , request = require('request-promise')
  , app = express()
  ;

const METADOC_API = "http://localhost:6060/article"

function convertMetaToJsonLd(result) {
  const persons = result.entities.names
      , encodedPersons = []
      , enclosingJs = `(function(w) {w.__json_ld = %json%})(window)`;

  for (var i = persons.length - 1; i >= 0; i--) {
    let person = {
      "@context": "http://schema.org",
      "@type":"Person",
      "name": persons[i],
    }
    encodedPersons.push(person)
  }
  return enclosingJs.replace("%json%", JSON.stringify(encodedPersons))
}

app.get("/json-ld.js", (req, res) => {
  let referer = req.headers.referer
    , contextUrl = req.params.context
    ;

  if (!referer && !contextUrl) {
    res.send("no valid URL found.");
  }

  if (contextUrl) {
    contextUrl = decodeURIComponent(contextUrl);
  } else if (referer) {
    contextUrl = referer // contextUrl takes precedence
  }

  request.post({ url: METADOC_API, json: true })
    .form({ url: contextUrl })
    .then(result => {
      let response = convertMetaToJsonLd(result)
      res.send(response)
    })

    .catch(err => console.log);
})

app.get('/test-article', function(req, res) {
  res.sendFile(path.join(__dirname + '/test-article.html'));
});

// Start Serving
var server = app.listen(3007, function() {
  var host = server.address().address,
      port = server.address().port;

  console.log('listening at http://%s:%s', host, port)
})