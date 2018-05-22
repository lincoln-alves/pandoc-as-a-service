var express = require('express'),
  helpers = require('./helpers'),
  pdc = require('pdc');
docx4js = require("docx4js");
bodyParser = require('body-parser');
var fs = require("fs");
var extend = require('util')._extend;

this.server = express();
this.server.set('views', './views');
this.server.set('view engine', 'ejs');
this.server.use(express.static('public'));
this.server.use(bodyParser.urlencoded({ extended: true }));
this.server.use(bodyParser.json());
this.server.get('/', function (req, res) {
  res.render('index');
});

this.server.get('/convert', function (req, res) {
  res.render('index');
});

this.server.post('/convert', function (req, res) {
  // var contentType = req.get('Content-Type');
  console.log("From -> \n" + req.body.inputFormat);
  console.log("To -> \n" + req.body.outputFormat);
  var buf = new Buffer(req.body.content, 'base64')
  // console.log("content -> \n"+ buf );
  var fileName = "/tmp/test" + Math.random();
  if (req.body.inputFormat == "docx") {
    fs.writeFile(fileName + "." + req.body.inputFormat, buf, function (err) {
      if (err) {
        res.send(err);
      }
      processDocx(fileName,req,res);    
    });
  }else{
    convertData(buf,req,res);
  }
  
 
  
});

function convertData(data,req,res){
  var fileName = "/tmp/test" + Math.random();
  fs.writeFile(fileName + "."+req.body.inputFormat,data,function (err){
    if(err){
      res.send(err);
    }else{
      convertFile(fileName,req,res);
    }
  });

}

function convertFile(fileName,req,res){
  const { exec } = require('child_process');
  var outFormat = req.body.outputFormat=='pdf'?'html':req.body.outputFormat;
  exec('pandoc '+fileName + '.'+req.body.inputFormat+' --to='+outFormat+' --output='+fileName+"."+req.body.outputFormat, (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      res.send(err);
    }
    fs.writeRead(fileName + "." + req.body.outputFormat, buf, function (err,data) {
      var convertDoc = new Object();
      convertDoc.content = Buffer.from(Buffer.from("Hello World").toString('base64')).toString('base64');
      convertDoc.docType = req.outputFormat;
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
