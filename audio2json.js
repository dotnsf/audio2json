//. audio2json.js
var s2t = require( 'watson-developer-cloud/speech-to-text/v1' ),
    fs = require( 'fs' ),
    settings = require( './settings' );

var speech_to_text = null;
if( settings.s2t_apikey ){
  //speech_to_text = new s2t({ iam_apikey: settings.s2t_apikey, url: 'https://gateway.watsonplatform.net/speech-to-text/api/' } );
  speech_to_text = new s2t({ username: 'apikey', password: settings.s2t_apikey, url: settings.s2t_url } );
}else if( settings.s2t_username && settings.s2t_password ){
  speech_to_text = new s2t({ username: settings.s2t_username, password: settings.s2t_password });
}

//. オーディオファイルの一覧取得
var filenames = fs.readdirSync( './audio/' );
//console.log( filenames );

var idx = 0;
var model = ( settings.model ? settings.model : 'ja-JP_BroadbandModel' );

function processSingleFile(){
  if( idx < filenames.length ){
    var filepath = './audio/' + filenames[idx];
    console.log( 'file: ' + filepath );

    var tmp = filepath.split( '.' );
    var ext = tmp[tmp.length-1];

    var params = {
      objectMode: true,
      content_type: 'audio/' + ext,
      model: model,
      //max_alternatives: 3,
      timestamps: true
    };
    if( settings.max_alternatives ){
      params.max_alternatives = settings.max_alternatives;
    }

    var recognizeStream = speech_to_text.recognizeUsingWebSocket( params );
    fs.createReadStream( filepath ).pipe( recognizeStream );

    recognizeStream.on( 'data', function( evt ){ onData( evt ); } );
    recognizeStream.on( 'error', function( evt ){ onError( evt ); } );
    recognizeStream.on( 'close', function( evt ){ onClose( evt ); } );
  }else{
    console.log( 'done.' );
  }
}

function onData( evt ){
  //. 成功した結果
  var text = JSON.stringify( evt, null, 2 );
  console.log( text );
  var outfile = './output/' + filenames[idx] + '.json';
  fs.writeFileSync( outfile, text );
}

function onError( evt ){
  //. エラー原因
  console.log( evt );
  var outfile = './output/' + filenames[idx] + '.error.txt';
  fs.writeFileSync( outfile, evt );
}

function onClose( evt ){
  //. 次の曲へ
  idx ++;
  processSingleFile();
}

processSingleFile();
