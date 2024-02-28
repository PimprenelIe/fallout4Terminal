//Phase d'initialisation

//Premier texte avec cursor clignotant
//Le cursor clignotant est toujours là
const $ = require('../vendor/jquery-3.4.1/jquery-3.4.1');
const fs = require('fs');

var Params = {
    titre: "WELCOME TO ROBCO INDUSTRIES (TM) TERMLINK <br /><br />",
    messageErreur: "ERROR ! Commande non reconnue.",
    messageDejaMin: "Le niveau de sécurité est déjà à son minimum.",
    messageDejaMax: "Le niveau de sécurité est déjà à son maximum.",
    messageNiveauDiminue: "Le niveau de sécurité a été diminué.",
    messageNiveauAugmente: "Le niveau de sécurité a été augmenté.",
    messageNiveauDejaModifie: "Le niveau de sécurité a déjà été modifié récemment, veuillez patienter.",
    codeJoueur: '', // A donner à chaque joueur
    uuidTerminal: '', // Un différent pour chaque terminal
    minutesDifficultyBlocked: 1, // Nombre de minute pendant lequel on ne peut changer la difficulté après qu'on l'est déjà fait
    nbErrorBeforeDifficultyUp: 3,
    messageSecurite: [],
    minSecurite: 1,
    maxSecurite: 10,
    initSecurite: 5,	
    workflowArray: {},
    sound: true,
};

const paramsPath = __dirname + '/../../params/paramAccueil.json';
const paramsPathDefault = __dirname + '/../params/paramAccueil.json';

const historicPath = __dirname + '/../historique';


// Variables utiles pour la marche à suivre de code
var errorCount = 0; // Compteur d'erreur avant que la difficulté augmente
var commande = 1; // La commande en cours dans un workflow
var workflow = 1; // Le worklow qui matche
var keyOk = false; // Bloque l'écriture quand une réponse s'écrit
const nbCharacterWithoutSpaceMax = 56; // Nombre de caractère max sans espace
var nbCharacterWithoutSpace = 0; // Nombre de caractère max sans espace

var historicCmd = [];
var historicCmdNb = 0;

window.onload = function () {

    sessionStorage.clear();
    
    document.onselectstart = function () {
        return false;
    }
    
    loadConfiguration();
    
    if (Params.sound)
        document.getElementById("poweron").play();

    if (sessionStorage.getItem("difficulty") === null) {
        sessionStorage.setItem("difficulty", Params.initSecurite);
    }

    PopulateScreen();

    //SetupOutput();


    JTypeFill("info", Params.titre, 20, function () {
        JTypeFill("console", "", 20, function () {
            keyOk = true;
        });
    }, "", "");


//    console.log( Params.messageSecurite[sessionStorage.getItem("difficulty")]);
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

function logHistoricFile(data, user = true){
    
    return;
    const date = new Date();
//
//    file = 'accueil-'+date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    
    file = 'accueil';

    addPrefix = '';
    if(user){
        addPrefix = '--> ';
    }
 
    data = '['+ date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds() +'] ' + addPrefix + data.replaceAll('<br />','') + '\n';
    
    fs.appendFileSync(historicPath + '/'+file + '.txt', data, "UTF-8", {'flags': 'a+'});
}


PopulateScreen = function () {
    document.getElementById("terminal").innerHTML =  '<div id="terminal-interior"><div id="info"></div><div id="console"></div></div>';
}


JTypeFill = function (containerID, text, TypeSpeed, callback, TypeCharacter, Prefix) {
    var cont = $("#" + containerID);
    var previousCont = cont.html();

    if (typeof TypeCharacter == 'undefined' || TypeCharacter == null)
        TypeCharacter = "<blink>&#9608;</blink>";

    if (typeof Prefix == 'undefined' || Prefix == null)
        Prefix = ">";

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


function replaceParams(element){
        if (typeof element === 'undefined') {
            return '';
        }

        element = element.replaceAll('{{codeJoueur}}', Params.codeJoueur);
        element = element.replaceAll('{{uuidTerminal}}', Params.uuidTerminal);
        return element;
}

/**
 * Version où écrit tout seul
 */
document.addEventListener('keydown', (e) => {
    e.preventDefault();

    
    console.log(e.key);
    
    if (keyOk == true) {

        let html = $('#console').html();
        let pos = html.indexOf("<blink>");
        let response = "";
        let oldHistoricCmdNb = historicCmdNb;
        historicCmdNb = 0;

        if (e.key === "Backspace") {

            html = html.slice(0, pos - 1) + html.slice(pos);
            $('#console').html(html);
            
        } else if (e.key === "ArrowUp") {
            keyOk = false;
            historicCmdNb = oldHistoricCmdNb;
            
            html = html.substr(0, html.indexOf("<blink>"));
            //La commande saisie se trouve après le dernier &gt;
            let posCommande = html.lastIndexOf("&gt;") + 4;
            let commandeTxt = html.slice(posCommande);
            
            if(historicCmdNb > 0){
               commandeTxt = historicCmd[historicCmdNb - 1 ];
            }
            
        
            if(historicCmd[historicCmdNb] == undefined){
                historicCmdNb = 0;
            }
            
            if(historicCmd[historicCmdNb] !== undefined){
                let replacement = historicCmd[historicCmdNb];
                

                let replaced = html.substring(0, posCommande) +
                  replacement +
                  "<blink>&#9608;</blink>";
            
                
                console.log(html.substring(posCommande + commandeTxt.length));
                
                $('#console').html(replaced);
                 
                historicCmdNb++;
            }
            
            keyOk = true;
            
        }
        else if (e.key === "Enter") {
            keyOk = false;

            html = html.substr(0, html.indexOf("<blink>"));


            //La commande saisie se trouve après le dernier &gt;
            let posCommande = html.lastIndexOf("&gt;") + 4;
            let commandeTxt = html.slice(posCommande);
            
            logHistoricFile(commandeTxt);
            
            if(commandeTxt.length > 0){
                historicCmd.unshift(commandeTxt);
            }
            
            if ("CLEAR" === commandeTxt) {
                $('#console').html("");

                JTypeFill("console", "", 20, function () {
                    keyOk = true;
                },);

                return true;
            }


            let rightCommand = Params.workflowArray[workflow.toString()]["Command" + commande.toString()];
            rightCommand = replaceParams(rightCommand);
        
            //Gestion commande erreur ou d'un autre workflow.
            if (rightCommand !== commandeTxt) {

                // Si ici alors la commande n'est pas celle attendue dans le workflow -> on regarde si ça matche un autre workflow :
                let error = true;

                for (const [key, value] of Object.entries(Params.workflowArray)) {
                    
                    let nextCommand = value["Command1"];
                    nextCommand = replaceParams(nextCommand);
                    
                    if (nextCommand === commandeTxt) {
                        workflow = key;
                        commande = 1;
                        error = false;
                        break;
                    }
                }
                
                if (error) {

                    $('#console').html(html);
                    
                    if(commandeTxt == ''){
                        
                        JTypeFill("console", "<br/>", 20, function () {
                            JTypeFill("console", "", 20, function () {
                                keyOk = true;
                            },);
                        }, "", "");

                        var objDiv = document.getElementById("console");
                        objDiv.scrollTop = objDiv.scrollHeight;
                        return false;
                    }
                    
                    errorCount = errorCount + 1;
              
                    
                    response = "<br /> "+Params.messageErreur+" ";
                    // nbErrorBeforeDifficultyUp deprecated
//                    if(errorCount >= Params.nbErrorBeforeDifficultyUp){
//                        response = response + difficultyUp(true);
//                    }else{
                        response = response + "<br /><br />";
//                    }

                
                    logHistoricFile(response, false);
                    
                    JTypeFill("console", response, 20, function () {
                        JTypeFill("console", "", 20, function () {
                            keyOk = true;
                        },);
                    }, "", "");

                    var objDiv = document.getElementById("console");
                    objDiv.scrollTop = objDiv.scrollHeight;

                    return false;
                }
            }

            let responseCommand = Params.workflowArray[workflow.toString()]["Response" + commande.toString()];
            responseCommand = replaceParams(responseCommand);
                        
            if (responseCommand === "hack") {
                //changer de page;
                window.location = "hack.html";
            }

            if (responseCommand === "explore") {
                window.location = "explore.html";
            }
            
            if (responseCommand === "interface") {
                window.location = "interface.html";
            }
            
            $('#console').html(html);
            response = "<br />" + responseCommand;

            if (responseCommand.length > 0) {
                response = "<br />" + response + "<br /><br />";
            }

            if (responseCommand === "up") {
                response = difficultyUp();
            }

            if (responseCommand === "down") {
                response = difficultyDown();
            }

            if (responseCommand === "diff") {
                response = "<br />" + Params.messageSecurite[sessionStorage.getItem("difficulty")-1] + "<br /><br />";
            }

            logHistoricFile(response, false);
            
            JTypeFill("console", response, 20, function () {
                JTypeFill("console", "", 20, function () {
                    keyOk = true;
                    commande++;
                },);
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
                
            $('#console').html(html);
        }

        var objDiv = document.getElementById("console");
        objDiv.scrollTop = objDiv.scrollHeight;

    }

});


function difficultyUp(error = false) {
    let dateTime = parseInt(sessionStorage.getItem("difficultyDate"));
    let dateCompare = new Date();

    let response = "<br /><br />";

    if (isNaN(dateTime) || (dateTime + Params.minutesDifficultyBlocked * 60 * 1000) < dateCompare.getTime()) {
        let difficulty = parseInt(sessionStorage.getItem("difficulty"));
        if (difficulty >= Params.maxSecurite) {
            if (!error) {
                response = "<br /> "+ Params.messageDejaMax +" <br /><br />";
            }
        } else {
            sessionStorage.setItem("difficultyDate", dateCompare.getTime());
            sessionStorage.setItem("difficulty", (difficulty + 1).toString());
            response = "<br /> "+ Params.messageNiveauAugmente +" <br /><br />";
        }
    } else {
        if (!error) {
            response = "<br /> "+ Params.messageNiveauDejaModifie +" <br /><br />";
        }
    }

    return response;
}

function difficultyDown(error = false) {
    let dateTime = parseInt(sessionStorage.getItem("difficultyDate"));
    let dateCompare = new Date();
    let response = "<br /><br />";
    if (isNaN(dateTime) || (dateTime + Params.minutesDifficultyBlocked * 60 * 1000) < dateCompare.getTime()) {
        let difficulty = parseInt(sessionStorage.getItem("difficulty"));
        if (difficulty <= Params.minSecurite) {
            if (!error) {
                response = "<br /> "+Params.messageDejaMin +" <br /><br />";
            }
        } else {
            sessionStorage.setItem("difficultyDate", dateCompare.getTime());
            sessionStorage.setItem("difficulty", (difficulty - 1).toString());
            response = "<br /> "+ Params.messageNiveauDiminue +" <br /><br />";
        }
    } else {
        if (!error) {
            response = "<br /> "+ Params.messageNiveauDejaModifie +" <br /><br />";
        }
    }
    return response;

}