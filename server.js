var express = require('express'),
  helpers = require('./helpers'),
  pdc = require('pdc');
var docx4js = require("docx4js");
var bodyParser = require('body-parser');
var fs = require("fs");
var extend = require('util')._extend;
var rimraf = require('rimraf')

this.server = express();
this.server.set('views', './views');
this.server.set('view engine', 'ejs');
this.server.use(express.static('public'));
this.server.use(bodyParser.urlencoded({ extended: true }));
this.server.use(bodyParser.json());

this.server.get('/', function (req, res) {
  res.render('index');
});

this.server.post('/api/convert', function (req, res) {
  // var contentType = req.get('Content-Type');
  console.log("From -> \n" + req.body.inputFormat);
  console.log("To -> \n" + req.body.outputFormat);
  var buf = new Buffer(req.body.content, 'base64')
  // console.log("content -> \n"+ buf );
  var tmpDir = "/tmp/"+ Math.random();
  fs.mkdirSync(tmpDir);
  req.body.tmpDir = tmpDir;
  var fileName = req.body.tmpDir+"/tmp" ;
  if (req.body.inputFormat == "docx") {
    fs.writeFile(fileName + "." + req.body.inputFormat, buf, function (err) {
      if (err) {
        errorResponse(err,req,res)
      }
      processDocx(fileName,req,res);    
    });
  }else{
    convertData(buf,req,res);
  }
  
 
  
});

this.server.post('/api/upload/:format', function(req, res) {
  var contentType = req.get('Content-Type');
  
  if (contentType) {
    var from = contentType.split("/")[1];
    var to = req.params.format;
  
    helpers.getBody(req, function(body) {
      pdc(body, from, to, function(err, result) {
        if (err) res.sendStatus(400)
          else res.append('Content-Type', 'text/' + to).send(result);
      });
    });  
  } else res.sendStatus(400) 
});

function errorResponse(err,req,res){
  console.error(`Error: ${err}`);
  rimraf.sync(req.body.tmpDir);
  res.send(err);
}

function convertData(data,req,res){
  var fileName = req.body.tmpDir+"/tmp";
  fs.writeFile(fileName + "."+req.body.inputFormat,data,function (err){
    if(err){
      errorResponse(err,req,res);
    }else{
      convertFile(fileName,req,res);
    }
  });

}

function convertFile(fileName,req,res){
  const { exec } = require('child_process');
  var outFormat = req.body.outputFormat=='pdf'?'html':req.body.outputFormat;
  var xtraParams = " ";
  var home = process.env.HOME;
  if(outFormat=='html'){
    var filter = home+'/.pandoc/pandoc-html-out-filter';
    if (fs.existsSync(filter)) {
      xtraParams = xtraParams+" --filter "+filter+" ";
    }
    filter = home+'/.pandoc/pandoc.css';
    if (fs.existsSync(filter)) {
      xtraParams = xtraParams+" --css "+filter+"  ";
    }
  }
  if(outFormat=='docx'){
    var filter = home+'/.pandoc/pandoc-docx-out-filter';
    if (fs.existsSync(filter)) {
      xtraParams = xtraParams+" --filter "+filter+" ";
    }
  }
  exec('pandoc '+fileName + '.'+req.body.inputFormat+' --to='+outFormat+' --output='+fileName+"."+req.body.outputFormat+xtraParams, (err, stdout, stderr) => {
    if (err) {
      errorResponse(err,req,res);
    }
    fs.readFile(fileName + "." + req.body.outputFormat, function (err,data) {
      if (err) {
        errorResponse(err,req,res)
      }
      var convertDoc = new Object();
      convertDoc.content = Buffer.from(data).toString('base64');
      convertDoc.docType = req.body.outputFormat;
      rimraf.sync(req.body.tmpDir);      
      res.json(convertDoc);
    });
  });
 

  
}

function processDocx(fileName,req,res){
  const ModelHandler = require("docx4js/lib/openxml/docx/model-handler").default
  docx4js.load(fileName + ".docx").then(docx => {
   
    var breaks = docx.officeDocument.content("w\\:br");
    var lines = docx.officeDocument.content("w\\:t");
    if(breaks&&breaks.length>0&&lines&&lines.length>0&&lines[0].children&&lines[0].children.length>0){
      for (var i=0;i<breaks.length ;i++) {
        if (breaks[i]&&breaks[i]['attribs']) {
          if (breaks[i]['attribs']['w:type'] &&breaks[i]['attribs']['w:type'] == 'page') {
          
            var text = extend({},lines[0].children[0]);
            text['data'] = "{{pagebreak}}";
            var line = extend({},lines[0]);
            line.children = new Array();
            line.children.push(text)
            if(breaks[i].parent&&breaks[i].parent.prev){
              var oldParent = breaks[i].parent;
              oldParent.children = new Array();
              oldParent.children.push(line);
              oldParent.children.push(breaks[i]);
             
            }
          }
        }
      }
    }
    fileName = fileName + "2";
    docx.save(fileName+'.docx');
    convertFile(fileName,req,res);
   
}); 

}

exports.listen = function (port) {
  this.server.listen(port);
  console.log("Express server listening on port %d", port);
};
