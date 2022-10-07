import * as Cursor from "../tools/cursor";

const INFO_TEXT = "BIENVENUE DANS L'INTERFACE ADMINISTRATEUR<br /><br />";
const MENUS = [
    {
        title: 'Paramètres application',
        link: 'admin/paramApp.html'
    },
    {
        title: 'Routine accueil',
        link: 'admin/routineAccueil.html'
    },
    {
        title: 'Paramètres hack',
        link: 'admin/paramHack.html'
    },
    {
        title: 'Fichiers exploration',
        link: 'admin/exploreFiles.html'
    },
    {
        title: 'Fichiers cachés',
        link: 'admin/exploreHiddenFiles.html'
    },
    {
        title: 'Paramètres administration',
        link:  'admin/param.html'
    },
    {
        title: 'Quitter',
        link:  'index.html'
    },
    'Routine accueil',
    'Paramètres hack',
    'Fichiers exploration',
    'Fichiers cachés',
    'Paramètres administration',
    'Quitter'
];

window.onload = function () {

    document.onselectstart = function () {
        return false;
    };

    PopulateScreen();
};

document.addEventListener('keydown', function (event) {
    event.preventDefault();

    var cursorNode;
    if ($('.cursor').length === 0) {
        cursorNode = $('#fichiers span');
    } else {
        cursorNode = $('.cursor');
    }

    nbSpan = $('#fichiers span').length;
    pos = Cursor.positionCursor('cursor');

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

            console.log('arrow down');

            if (objDiv.scrollTop < objDiv.scrollHeight) {
                objDiv.scrollTop = objDiv.scrollTop + 108;

                console.log( objDiv);
                console.log('scroll');
            }
            break;
        case "Enter":
            const link = cursorNode.data('path');
            window.location = link;
    }

});






/**
 * Fonction d'initialisation de l'écran
 */
function PopulateScreen() {
    document.getElementById("terminal").innerHTML =  '<div id="terminal-interior"><div id="info"></div><div id="fichiers"></div><div id="footer"></div></div>';

    Cursor.setTypeFill("info", INFO_TEXT, 20, function () {}, "", "");

    setFirstLevel();
}

/**
 * Fonction qui affiche le premier niveau des menus
 */
function setFirstLevel() {

    $("#fichiers").html("");

    var nodes = getFirstLevel(MENUS);

    nodes.forEach(function (node) {

        $("#fichiers").append(node.node);

        Cursor.setTypeFill(node.name.replace(/ /g, ''), '[' + node.name + ']', 20, function () {
        }, "", "");

    });

    Cursor.setBlinkCursor();


}


function getFirstLevel(files) {

    $("#fichiers").html("");

    var nodes = [];

    //listing all files using forEach
    files.forEach(function (file) {

        const type = 'folder';
        const name = file.name;
        const pathAll = file.link;

        const newNode = '<span style="overflow: hidden;" class=" ' + type + '" id="' + name.replace(/ /g, '') + '" data-path="' + pathAll + '" ></span>';
        let object = {
            node: newNode,
            name: name,
            type: type
        };

        nodes.push(object);
    });


    return nodes;



}