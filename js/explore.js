const fs = require('fs');
const $ = require('../vendor/jquery-3.4.1/jquery-3.4.1');
const { SerialPort } = require('serialport');

var verbose = 0;

var Params = {
    titre: "WELCOME TO ROBCO INDUSTRIES (TM) TERMLINK <br/><br/> En route pour la joie <br/>",
    codeHide: [], //Le premier élèment du tableau affichera hide1, le deuxième hide2,.... Mettre en majuscule !
    messageFichierVide: "Fichier Vide.",
    messageAudioEnCours: "[AUDIO] En cours de lecture...",
    sound: true,
    messageSecurite: []
};

const paramsPath = __dirname + '/../../params/paramExplore.json';
const paramsPathDefault = __dirname + '/../params/paramExplore.json';

var path = __dirname + '/../../fichiers';
const pathDefault = __dirname + '/../fichiers';

var commonFolder = 'dossierCommun';
var holoFolder = 'holobande';
var hideFolder = 'hide';

var content = {};

var niveau = 1;

var accreditation = 1;
var holobande = "";
var nbHolobandeError = 0;
var holobandeAccreditation = 1;
var hide = "";

var portCom = "";
var init = true;

var serialPort = null;
var exit = false;
var serialport_opened = false;

var BreakException = {};

window.onload = function () {
    
    document.onselectstart = function () {
        return false;
    }
    
    loadConfiguration();

    if (Params.sound)
        $("#poweron")[0].play();

    PopulateScreen();

    JTypeFill("footer", "", 20, function () {
    });
    
    accreditation = sessionStorage.getItem("difficulty");


    // Si la partie ressource laissé à l'utilisateur n'existe pas, 
    // on utilise les paramètres par défaut du système.
    if (!fs.existsSync(path)) {
        path = pathDefault;
    }

    JTypeFill("info", Params.titre, 20, function () {
              listPorts();
     }, "", "");
 
}

serialRead = function (type = "normal") {
        JTypeFill("info", "", 20, function () {
            getFirstLevel();
        }, "", "");
    
}

async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
    if (ports.length !== 0 && serialport_opened == false) {
      ports.forEach(port => {
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

                serialport_opened = true;

                // get data from connected device via serial port
                serialPort.on('data', function(data) {
                    
                    if(init){
                        init = false;
                        return;
                    }
                    
                    // get buffered data and parse it to an utf-8 string
                    data = data.toString('utf-8');
                
                    
                    var previousHolobande = holobande;
                    var nextHolobande = parseInt(data);
                    
                    if(isNaN(nextHolobande) || nextHolobande == 0){
                        nextHolobande = previousHolobande;
                        nbHolobandeError++;
                        if(nbHolobandeError > 5  ){
                            nextHolobande = "";
                            nbHolobandeError = 0;
                        }
                    }else{
                         nbHolobandeError = 0;
                    }

                    holobande = nextHolobande;
                
                     if(previousHolobande !== nextHolobande){
                        serialRead();
                     }
                    
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
          
      })
    }
    
               if(init){
                   serialRead();
                        init = false;
                        return;
                    }
     
  })
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

getFirstLevel = function () {

    $("#fichiers").html("");
    
    if(verbose == 1){
        console.log("holobande " + holobande);
    }
    
        //passsing directoryPath and callback function
    fs.readdir(path + '/' + commonFolder, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
            if(file != '.' && file != '..' && file != 'Thumbs.db' && file != '.DS_Store'){
           
                var type = '';
                var name = '';
                if(file.lastIndexOf(".") == -1 ){
                    type = 'folder';
                    name = file;
                }
                else if(file.split('.').pop() == 'mp3'){
                   type = 'audio';
                   name = file.substring(0, file.lastIndexOf("."));
                }
                else{
                    type = 'file'; 
                    name = file.substring(0, file.lastIndexOf("."));
                }
                   
            
                var pathAll = path + '/' + commonFolder + '/' + file;  

                var newNode = '<span style="overflow: hidden;" class=" ' + type + '" id="' + name.replace(/ /g, '') + '" data-path="' + pathAll + '" ></span>'

                $("#fichiers").append(newNode);

                JTypeFill(name.replace(/ /g, ''), '[' + name + ']', 20, function () {
                }, "", "");
                
            }
        });
        
        SetBlinkCursor();
    });
    
    
    if (holobande > 0) {

        fs.readdir(path + '/' + holoFolder + holobande, function (err, files) {
            //handling error
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            } 
            
            // On reset le niveau d'accréditation.
            holobandeAccreditation = 1;
        
            // Le try catch permet de break le foreach
            try {
                files.forEach(function (file) {
                    if(file.includes('.accreditation')){
                       holobandeAccreditation = parseInt(file.replace('.accreditation', ''));
                        // S'il y a une erreur dans le niveau d'accréditation, on évite de pouvoir lire l'holobande sans le niveau max.
                        if(isNaN(holobandeAccreditation)){
                           holobandeAccreditation = 10;
                        }
                        throw BreakException;
                    }
                });
            } catch (e) {
              if (e !== BreakException) throw e;
            }
            
            
            //listing all files using forEach
            files.forEach(function (file) {
                if(file != '.' && file != '..' && file != 'Thumbs.db' && file != '.DS_Store' && !file.includes('.accreditation')){

                    var type = '';
                    var name = '';
                    if(file.lastIndexOf(".") == -1 ){
                        type = 'folder';
                        name = file;
                    }
                    else if(file.split('.').pop() == 'mp3'){
                       type = 'audio';
                       name = file.substring(0, file.lastIndexOf("."));
                    }
                    else{
                        type = 'file'; 
                        name = file.substring(0, file.lastIndexOf("."));
                    }

                    if(accreditation < holobandeAccreditation){
                        name = name + ' - ' + Params.messageSecurite[holobandeAccreditation - 1];
                        type = 'denied';
                    }
                

                    var pathAll = path + '/' + holoFolder + holobande + '/' + file;  

                    var newNode = '<span style="overflow: hidden;" class=" ' + type + '" id="' + name.replace(/ /g, '') + '" data-path="' + pathAll + '" ></span>'

                    $("#fichiers").append(newNode);

                    JTypeFill(name.replace(/ /g, ''), '[' + name + ']', 20, function () {
                    }, "", "");

                }
            });

            SetBlinkCursor();
        });
    
    }
    
    
    if (hide != '') {

        fs.readdir(path + '/' + hideFolder + hide, function (err, files) {
            //handling error
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            } 
            //listing all files using forEach
            files.forEach(function (file) {
                if(file != '.' && file != '..' && file != 'Thumbs.db' && file != '.DS_Store'){

                    var type = '';
                    var name = '';
                    if(file.lastIndexOf(".") == -1 ){
                        type = 'folder';
                        name = file;
                    }
                    else if(file.split('.').pop() == 'mp3'){
                       type = 'audio';
                       name = file.substring(0, file.lastIndexOf("."));
                    }
                    else{
                        type = 'file'; 
                        name = file.substring(0, file.lastIndexOf("."));
                    }


                    var pathAll = path + '/' + hideFolder + hide + '/' + file;  

                    var newNode = '<span style="overflow: hidden;" class=" ' + type + '" id="' + name.replace(/ /g, '') + '" data-path="' + pathAll + '" ></span>'

                    $("#fichiers").append(newNode);

                    JTypeFill(name.replace(/ /g, ''), '[' + name + ']', 20, function () {
                    }, "", "");

                }
            });

            SetBlinkCursor();
        });
    
    }
    
}

SetBlinkCursor = function () {
    $('#fichiers span').first().addClass('cursor');
}

PopulateScreen = function () {
    $("#terminal").html('<div id="terminal-interior"><div id="info"></div><div id="fichiers"></div><div id="footer"></div></div>');
}

JTypeFill = function (containerID, text, TypeSpeed, callback, TypeCharacter, Prefix) {
    var cont = $("#" + containerID);
    var previousCont = cont.html();


    if (typeof TypeCharacter == 'undefined' || TypeCharacter == null)
        TypeCharacter = '<span class="blink">&#9608;</span>';

    if (typeof Prefix == 'undefined' || Prefix == null)
        Prefix = ">";

    let character = "";

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

            },
            complete: callback
        }
    );
}

document.addEventListener('keydown', function (event) {
    event.preventDefault();

    if (event.ctrlKey && event.altKey && event.shiftKey && parseInt(event.key) >= 0) {
        holobande = parseInt(event.key);
        getFirstLevel();
    }

    var cursorNode;
    if ($('.cursor').length == 0) {
        cursorNode = $('#fichiers span');
    } else {
        cursorNode = $('.cursor');
    }

    nbSpan = $('#fichiers span').length;
    pos = positionCursor('cursor');

    switch (event.key) {
        case "ArrowUp":
            if (pos > 0) {
                newNode = $('#fichiers span').eq(pos - 1);
                cursorNode.each(function (index, elem) {
                    $(elem).removeClass('cursor')
                });
                newNode.addClass('cursor');
            }
            var objDiv = document.getElementById("fichiers");

            if (objDiv.scrollTop > 0) {
                objDiv.scrollTop = objDiv.scrollTop - 108;
            }
            break;
        case "ArrowDown":
            if (pos < nbSpan - 1) {
                newNode = $('#fichiers span').eq(pos + 1);
                cursorNode.each(function (index, elem) {
                    $(elem).removeClass('cursor')
                });
                newNode.addClass('cursor');
            }
            var objDiv = document.getElementById("fichiers");

            if(verbose == 1){
                console.log('arrow down');
            }
            if (objDiv.scrollTop < objDiv.scrollHeight) {
                objDiv.scrollTop = objDiv.scrollTop + 108;
            }
            break;
        case "Enter":

            var html = $('#footer').html();

            html = html.substr(0, html.indexOf("<span"));
            //La commande saisie se trouve après le dernier &gt;
            var posCommande = html.lastIndexOf("&gt;") + 4;
            var commandeTxt = html.slice(posCommande);

            if (commandeTxt.trim() !== "") {
                if (commandeTxt === "EXIT") {
           
                       exit = true;
                    if(serialPort != null && serialPort.isOpen){
                       serialPort.close(function (error) {                   
                         window.location = "index.html"; 
                      })
                    }else{
                         window.location = "index.html"; 
                    }
               
                    return;
                } else if ((pos = Params.codeHide.indexOf(commandeTxt)) > -1) {
                    hide = pos + 1;
                    niveau = 1;
                    getFirstLevel();
                }

                $('#footer').html("");
                JTypeFill("footer", "", 20, function () {
                });
            } else {
                if (cursorNode.hasClass('file')) {
                    displayFile(cursorNode);
                    niveau++;
                } else if (cursorNode.hasClass('audio')) {
                    displayAudio(cursorNode);
                    niveau++;
                } else if (cursorNode.hasClass('folder')) {
                    //dossier
                    niveau++;
                    displayFolder(cursorNode, false);
                } else {
                    //si dossier parent vide
                    //niveau --;
                    //displayFolder(cursorNode,true);
                }
            }
            break;

        case "Escape":

            $('#fichiers').children().stop();

            if (niveau > 2) {

                niveau--;
                displayFolder(cursorNode, true);

            } else if (niveau == 2) {

                niveau--;
                getFirstLevel();
            }
            break;

        case "Backspace":

            var htmlContent = $('#footer').html();

            var pos = htmlContent.indexOf('<span');

            htmlContent = htmlContent.slice(0, pos - 1) + htmlContent.slice(pos);

            $('#footer').html(htmlContent);
            break;
        default:


            var inp = String.fromCharCode(event.keyCode);
            if (/[a-zA-Z0-9-_ ]/.test(inp)) {
                var htmlContent = $('#footer').html();
                var pos = htmlContent.indexOf('<span');

                if (pos < 50) {
                    htmlContent = htmlContent.slice(0, pos) + String.fromCharCode(event.keyCode).toUpperCase() + htmlContent.slice(pos);
                    $('#footer').html(htmlContent);
                }
            }
            break;
    }

});

displayFile = function (node) {

    var filePath = node.data('path');

    $('#fichiers').html('');

    node.html('');
    node.removeClass('cursor');
    node.css('overflow', 'unset');
    $("#fichiers").append(node);

    var txt = '';


    fs.readFile(filePath, 'utf-8', (err, data) => {
        
        txt = data;
        
        if(err){
            txt = Params.messageFichierVide;
        }
        if(data.length === 0){
            txt = Params.messageFichierVide;
        }
        
        txt = txt.replaceAll("\n", "<br/>")
        txt = txt.replaceAll("  ", "&nbsp;&nbsp;")

        JTypeFill(node.attr('id'), txt, 2, function () {
        }, "", "");
    });


}

displayAudio = function (node) {

    $('#fichiers').html('');

    node.html('');
    node.removeClass('cursor');

    JTypeFill("fichiers", Params.messageAudioEnCours, 2, function () {
        $("#fichiers").append('<audio id="audiotest" src="'+node.data('path')+'"></audio>');
        $("#audiotest")[0].play();
    }, "", "");


}

displayFolder = function (node, parent) {
    
    var actualPath = node.data('path');

    if (parent == true) {
        actualPath = actualPath.substr(0, actualPath.lastIndexOf("/"));
    } 

    $('#fichiers').html('');

    fs.readdir(actualPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach
        files.forEach(function (file) {
            if(file != '.' && file != '..' && file != 'Thumbs.db' && file != '.DS_Store'){
           
                var type = '';
                var name = '';
                if(file.lastIndexOf(".") == -1 ){
                    type = 'folder';
                    name = file;
                }
                else if(file.split('.').pop() == 'mp3'){
                   type = 'audio';
                   name = file.substring(0, file.lastIndexOf("."));
                }
                else{
                    type = 'file'; 
                    name = file.substring(0, file.lastIndexOf("."));
                }
                   
            
                var pathAll = actualPath + '/' + file;  

                var newNode = '<span style="overflow: hidden;" class=" ' + type + '" id="' + name.replace(/ /g, '') + '" data-path="' + pathAll + '" ></span>'

                $("#fichiers").append(newNode);

                JTypeFill(name.replace(/ /g, ''), '[' + name + ']', 20, function () {
                }, "", "");
                
            }
        });
        
        SetBlinkCursor();
    });
    

}

positionCursor = function (className) {

    var node = $('.' + className);

    var pos = 0;

    node.parent().children('span').each(function (index, elem) {
        if ($(elem).hasClass(className) == true) {
            pos = index;

            return false;
        }
    });

    return pos;

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

