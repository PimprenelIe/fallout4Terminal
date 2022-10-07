import * as Cursor from "../tools/cursor";
const fs = require('fs');


const INFO_TEXT = "BIENVENUE DANS L'INTERFACE ADMINISTRATEUR<br /><br />";
const TITLE = "Paramétres du hack<br /><br />";


window.onload = function () {

    document.onselectstart = function () {
        return false;
    };

    PopulateScreen();
    loadConfiguration();
};



/**
 * Fonction d'initialisation de l'écran
 */
function PopulateScreen() {
    document.getElementById("terminal").innerHTML =  '<div id="terminal-interior"><div id="info"></div><form id="fichiers"></form><div id="footer"></div></div>';

    Cursor.setTypeFill("info", INFO_TEXT, 20, function () {}, "", "");
    Cursor.setTypeFill("info", TITLE, 20, function () {}, "", "");
}

function loadConfiguration(){


    let rawdata = fs.readFileSync('../../save/paramHack.json');
    let paramHack = JSON.parse(rawdata);


    for (const [key, object] of Object.entries(paramHack)) {

        const value = object.value;
        const type = object.type;
        const title = object.title;
        let disabled = '';

        if (typeof object.disabled != 'undefined' && object.disabled)
            disabled = 'disabled="disabled"';

        const newNode = '                <div class="form-row">\n' +
            '                    <label for="'+key+'">'+title+'</label>\n' +
            '                    <input id="'+key+'" type="'+type+'" value="'+value+'" '+disabled+'/>\n' +
            '                </div>';


        $("#fichiers").append(newNode);

    }


}