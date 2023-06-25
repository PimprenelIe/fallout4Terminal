const fs = require('fs');
const $ = require('../vendor/jquery-3.4.1/jquery-3.4.1');
const { SerialPort } = require('serialport');

var verbose = 1;

var Params = {
    titre: "WELCOME TO ROBCO INDUSTRIES (TM) TERMLINK <br /><br />",
    portInterface: "COM12"
};

const paramsPath = __dirname + '/../../params/paramInterface.json';
const paramsPathDefault = __dirname + '/../params/paramInterface.json';
const historicPath = __dirname + '/../historique';

// Variables utiles pour la marche à suivre de code
var errorCount = 0; // Compteur d'erreur avant que la difficulté augmente
var commande = 1; // La commande en cours dans un workflow
var workflow = 1; // Le worklow qui matche
var keyOk = false; // Bloque l'écriture quand une réponse s'écrit
const nbCharacterWithoutSpaceMax = 56; // Nombre de caractère max sans espace
var nbCharacterWithoutSpace = 0; // Nombre de caractère max sans espace

var portCom = "--";
var init = true;

var serialPort = null;
var exit = false;
var serialport_opened = false;


window.onload = function () {

    sessionStorage.clear();
    
    document.onselectstart = function () {
        return false;
    }
    
    loadConfiguration();

    if (Params.sound)
        document.getElementById("poweron").play();

    PopulateScreen();

    JTypeFill("info", Params.titre, 20, function () {
        JTypeFill("entry", "", 20, function () {
            listPorts();
            keyOk = true;
        });
    }, "", "");

}


function listPorts() {
    if(verbose == 1){
        console.log("listPorts !!! - exit: " + exit);
    }
    
    if(exit){
        return;
    }
  listSerialPorts();
  setTimeout(listPorts, 2000);
}

async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if (ports.length !== 0 && serialport_opened == false) {
      ports.forEach(port => {
          
          console.log(port.path + " " + Params.portInterface);
          
          if(port.path == Params.portInterface){

                if(serialPort != null && serialPort.isOpen){
                    return;
                }

                portCom = port.path;

                serialPort = new SerialPort( {
                path: portCom,
                baudRate: 9600,
                autoOpen: false,
                }); 

                serialPort.open(function (error) {
                if ( error ) {
                if(verbose == 1){
                    console.log('failed to open: ' + error);
                }
                } else {
                if(verbose == 1){
                  console.log('serial port opened');
                  console.log('serial port init: ' + init);
                }

                if(init){
                    init = false;
                    $('#entry').html("");
                    JTypeFill("entry", "", 20, function () {});
                }

                serialport_opened = true;

                // get data from connected device via serial port
                serialPort.on('data', function(data) {

                    // get buffered data and parse it to an utf-8 string
                    data = data.toString('utf-8');

                    serialRead(data);
                    if(verbose == 1){
                        console.log('Data: ' + data);
                    }

                });

                if(verbose == 1){
                   serialPort.on('error', function(data) {
                     console.log('Error: ' + data);
                  })        
                }
                }
                });

                return;

          }
      })
  }
  })
}


serialRead = function (data = "") {
    data = data.replaceAll('\n', '<br>');
    
    JTypeFill("console", data, 0, function () {

    }, "", "");
}


function loadConfiguration(){
        
    let rawdata = '';
    
    if (fs.existsSync(paramsPath)) {
        rawdata = fs.readFileSync(paramsPath);
    } else {
        rawdata = fs.readFileSync(paramsPathDefault);
    }

    let params = JSON.parse(rawdata);
    
    for (const [key, object] of Object.entries(params)) {
        Params[key] = object.value;
    }
}



PopulateScreen = function () {
    document.getElementById("terminal").innerHTML =  '<div id="terminal-interior"><div id="info"></div><div id="entry"></div><div id="console"></div></div>';
}


JTypeFill = function (containerID, text, TypeSpeed, callback, TypeCharacter, Prefix) {
    var cont = $("#" + containerID);
    var previousCont = cont.html();

    if (typeof TypeCharacter == 'undefined' || TypeCharacter == null)
        TypeCharacter = "<blink>&#9608;</blink>";

    if (typeof Prefix == 'undefined' || Prefix == null){
        
        
    if(serialPort == null || !serialPort.isOpen){
        portCom = "--";
    }
        
       Prefix = "> [" + portCom + "] ";
    }
    
    cont.html("").stop().css("fake-property", 0).animate(
        {
            "fake-property": text.length
        },
        {
            duration: TypeSpeed * text.length,
            step: function (i) {
                var insert = Prefix + text.substr(0, i);
                var i = Math.round(i);
                if (cont.text().substr(0, cont.text().length - 1) != insert) {
                    if (Params.sound)
                        $("#audiostuff").find("audio").eq(Math.floor(Math.random() * $("#audiostuff").find("audio").length))[0].play();
                }
                cont.html(previousCont + insert + TypeCharacter);


                var objDiv = document.getElementById(containerID);
                objDiv.scrollTop = objDiv.scrollHeight;
            },
            complete: callback
        }
    );
}




document.addEventListener('keydown', (e) => {
    e.preventDefault();

    if (keyOk == true) {

        let html = $('#entry').html();
        let pos = html.indexOf("<blink>");
        let stopPos = html.indexOf("]")+1;
        let response = "";

        if (e.key === "Backspace") {

            
            console.log(stopPos);
                        console.log(pos-1);

            if(stopPos === pos-1){
                return;
            }
            
            html = html.slice(0, pos - 1) + html.slice(pos);
            $('#entry').html(html);

        } else if (e.key === "Enter") {
            keyOk = false;

            html = html.substr(0, html.indexOf("<blink>"));


            //La commande saisie se trouve après le dernier &gt;
            let posCommande = html.lastIndexOf("&gt;") + 4;
            let commandeTxt = html.slice(posCommande);
            let commandeReel = commandeTxt.slice(commandeTxt.indexOf("]") + 2);
            
            logHistoricFile(commandeTxt);

            if ("CLEAR" === commandeReel) {
                $('#console').html("");
                $('#entry').html("");


                JTypeFill("entry", "", 20, function () {
                    keyOk = true;
                },);

                return true;
            }
            
            if ("EXIT" === commandeReel) {            
                exit = true;
                try{
                    if(serialPort != null && serialPort.isOpen){
                       serialPort.close(function (error) {           
                            console.log(error);
                      })
                    }
                } catch (e) {
                    console.log(e.message);
                }

                setTimeout(() => {window.location = "index.html"}, 500);
                return;
            }
            
            
            if(commandeReel.replaceAll(' ', '').includes('BADGE(')){
                
                var regExp = /\(([^)]+)\)/;
                var matches = regExp.exec(commandeReel.replaceAll(' ', ''));
                
                var array = matches[1].split(',');
                
                if(array.length === 4){
                
                    var total = convert(array);
        
                    commandeTxt = commandeTxt.replace(/BADGE\((.+?)\)/g, total);
                    commandeReel = commandeTxt.slice(commandeTxt.indexOf("]") + 2);
                }
            }
            
            

            response = '<span class="cmd">' + commandeTxt + '</span><br />';
            
            $('#entry').html("");
            
            if(serialPort != null && serialPort.isOpen){
                try {
                    serialPort.write(commandeReel, function(err) {
                      if (err) {
                        return console.log('Error on write: ', err.message)
                      }
                      console.log('message written')
                    })
                } catch (error) {
                  console.error(error);
                }
            }
         
            
            logHistoricFile(commandeReel, false);

            
            JTypeFill("console", response, 0, function () {
                JTypeFill("entry", "", 20, function () {
                    keyOk = true;
                    commande++;
                });
            }, "", "");

        } else if (e.key.includes("Shift")) {

        } else {
            var inp = e.key.toUpperCase();
            if (inp.length == 1 && /[A-Z0-9-_ ,?;.:/!§ù%*µ$£^¨&é"'(è)çà=+]/.test(inp)) {
                
               nbCharacterWithoutSpace++;
                
                if(/ /.test(inp)){
                    nbCharacterWithoutSpace = 0;
                }
                if(nbCharacterWithoutSpace > nbCharacterWithoutSpaceMax){
                    nbCharacterWithoutSpace = 1;
                    inp = " " + inp;
                }
                
                html = html.slice(0, pos) + inp + html.slice(pos);
            }
                
            $('#entry').html(html);
        }

        var objDiv = document.getElementById("console");
        objDiv.scrollTop = objDiv.scrollHeight;

    }

});


convert = function (array) {
    var numLecteur = array[0];
    var numBadge = array[1];
    var codeCommande = array[2];
    var cleConfig = array[3];
    var bitPariteCommande = '0';
    var bitPariteBadge = '0';

    // Num lecteur
    numLecteur = parseInt(numLecteur).toString(2);
    nb = numLecteur.length;
    for (let i = nb; i < 6; i++) {
      numLecteur = '0' + numLecteur;
    }
    console.log(numLecteur);

    //coeCommande
    codeCommande = parseInt(codeCommande).toString(2);
    nb = codeCommande.length;
    for (let i = nb; i < 4; i++) {
      codeCommande = '0' + codeCommande;
    }

    // bitPariteCommande
    var binaryParite = codeCommande + numLecteur;          
    var count = (binaryParite.match(/1/g) || []).length;
    if(count % 2 != 0){
        bitPariteCommande = '1';
    }



    // num Badge
    numBadge = parseInt(numBadge, 16).toString(2).slice(-10);


    // bitPariteBadge
    var count = (numBadge.match(/1/g) || []).length;
    if(count % 2 != 0){
        bitPariteBadge = '1';
    }



    // Total
    var total = '10' + bitPariteBadge + numBadge + bitPariteCommande + codeCommande + numLecteur;
    total = (cleConfig + parseInt(total, 2).toString(16)).toUpperCase();

    return total;
};


function logHistoricFile(data, user = true){
    return;
    const date = new Date();
//
//    file = 'interface-'+date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    file = 'interface';
    
    addPrefix = '';
    if(user){
        addPrefix = '--> ';
    }
 
    data = '['+ date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds() +'] ' + addPrefix + data.replaceAll('<br />','') + '\n';
    
    fs.appendFileSync(historicPath + '/'+file + '.txt', data, "UTF-8", {'flags': 'a+'});
}