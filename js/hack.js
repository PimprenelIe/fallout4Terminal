/*
	Fallout 3 Terminal Hacking Clone
	Written by Mitchell Thompson (mitchellthompson.net, palladium-studios.com)
	Design and concept inspired by (read: ripped off from) Fallout 3
	All copyrights and trademarks inc. Fallout property of Bethesda, Zenimax, possibly Interplay

    Modify by Nicolas Vincent

*/
const $ = require('../vendor/jquery-3.4.1/jquery-3.4.1');
const fs = require('fs');


//Create cursor on first character -> blink
//On movement, deplace cursos on other character
//      Effets de bord + hover mots/chaine de caractère
//      Inscrit le hover directement dans la console
//A l'appui sur entrée sur un hover : vérifier si mdp
//Si on écrit directement, on écrit dans la console -> à l'appui sur entrée, il ne se passe rien sauf si mdp admin
//       Si quelque chose écrit dans la console et mouvement fleche : vide le mot précédent


const paramHackPath = __dirname + '/../../params/paramHack.json';
const paramHackPathDefault = __dirname + '/../params/paramHack.json';
const historicPath = __dirname + '/../historique';

var Params = {
    titre: "ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL<br />ENTER PASSWORD NOW",
    messageAttempsLeft: "ATTEMPT(S) LEFT",
    messageCorrect: "correct",
    messageTerminalLocked: "TERMINAL LOCKED<br />PLEASE CONTACT AN ADMINISTRATOR",
    messageBlocageEnCours: "Lockout in progress !",
    messageVieRegagne: "Allowance replenished.",
    messageMotSupprime: "Dud removed.",      
    messageMotDePasseCorrect: "Exact match! Please wait while system is accessed.",
    accessDenied: "Entry denied",
    columnHeight: 17,
    wordColumnWidth: 12,
    count: 12, //Number of words in the game (even number)
    difficulty: 6, //Number of letters of words (4,6 or 8)
    letterInCommonMin: 3,
    letterInCommonMax: 4,
    langage: 'fr', //Use en or fr (words file)
    dudLength: 8,
    blockTime: 5,
    sound: true,
    attemptsRemaining: 4,
    lineMax: 13
};

var Correct = "";
var Words = [];
var OutputLines = [];
var _gaq = [];

var BracketSets = [
    "<>",
    "[]",
    "{}",
    "()"
];

var gchars = [
        "'",
        "|",
        "\"",
        "!",
        "@",
        "#",
        "$",
        "%",
        "^",
        "&",
        "*",
        "-",
        "_",
        "+",
        "=",
        ".",
        ";",
        ":",
        "?",
        ",",
        "/"
    ];



window.onload = function()
{

    document.onselectstart = function() { return false; }

   loadConfiguration();
    
    if (Params.sound)
        $("#poweron")[0].play();


    PopulateScreen();

    WordColumnsWithDots();
    FillPointerColumns();
    SetupOutput();

    JTypeFill("info", Params.titre, 20, function()
              {
        UpdateAttempts();
    }, "", "");
    
    initializeWords();

    logHistoricFile('[Init] attempts : ' + Params.attemptsRemaining, false);
    logHistoricFile('[Init] difficulty : ' + Params.difficulty, false);
    logHistoricFile('[Init] correct word : '+ Correct, false);
}


function initializeWords(){
    if(sessionStorage.getItem("difficulty") !== null){
        let diff = parseInt(sessionStorage.getItem("difficulty"));
        if(diff > 5){
            for (let i = 6; i <= diff ; i++) {
                upDifficulty();
            }
        }else if(diff < 5){
            for (let i = diff; i < 5 ; i++) {
                downDifficulty();
            }
        }
    }

    console.log("Diffculty = " + Params.difficulty);
    console.log("Attempts = " + Params.attemptsRemaining);
    console.log("Count = " + Params.count);

    WordCallback(words);
}

upDifficulty = function(){
    if(Params.difficulty < 8){
        Params.difficulty = Params.difficulty + 2 ;
    }
    else if(Params.attemptsRemaining === 4){
        Params.attemptsRemaining = 3;
    }
    else{
        Params.count = Params.count + 2;
    }
}

downDifficulty = function(){
    if(Params.difficulty > 4 ){
        Params.difficulty = Params.difficulty - 2 ;
    }
    else if(Params.attemptsRemaining === 3){
        Params.attemptsRemaining = 4;
    }
    else{
        Params.count = Params.count - 2;
    }
}

firstUpperCase = function(str){
    return str[0].toUpperCase() + str.slice(1);
}

WordCallback = function(Response){
    jsonWords = Response[Params.difficulty];

    relatedWords(jsonWords);
    Correct = Words[0];
    Words = Shuffle(Words);
    FillWordColumns();


    //Ready to Play here


}

relatedWords = function(allWords){
    //allWords est un tableau de mots ayant [Params.difficulty] lettres
    length = allWords.length;
    firstWord = allWords[Math.floor(Math.random() * length)];
    Words.push(firstWord);

    var word, likeness;
    for(var i=0;i<Params.count-1;i++) {
        var compteur = 0;
        do {
            word = allWords[Math.floor(Math.random() * length)];
            likeness = getLikeness(word, firstWord);
            compteur ++;
            if(Words.indexOf(word) < 0 && compteur > 100) {
                break;
            } else if(Words.indexOf(word) < 0 && compteur > 50 && likeness > 1) {
                break;
            }
        } while(Words.indexOf(word) >=0 || likeness < Params.letterInCommonMin || likeness > Params.letterInCommonMax);
        Words.push(word);
    }

}

getLikeness = function(word1,word2){
    var likeness = 0;
    for(var i=0;i<word1.length;i++) {
        if(word1[i] === word2[i]) {
            likeness ++;
        }
    }
    return likeness;
}

WordColumnsWithDots = function(){
    var column2 = $("#column2");
    var column4 = $("#column4");

    var dots = GenerateDotColumn();
    column2.html( dots );
    column4.html( dots );
}

PopulateScreen = function(){
    $("#terminal").html('<div id="terminal-interior"><div id="info"></div><div id="attempts"></div><div id="column1" class="column pointers"></div><div id="column2" class="column words"></div><div id="column3" class="column pointers"></div><div id="column4" class="column words"></div><div id="output"></div><div id="console">></div></div>');
}

UpdateAttempts = function(){
    var AttemptString = Params.attemptsRemaining + " "+ Params.messageAttempsLeft+": ";
    JTypeFill("attempts", AttemptString, 20, function(){
        var i = 0;
        while (i < Params.attemptsRemaining)
        {
            AttemptString += " &#9608;";
            i++;
        }
        $("#attempts").html( AttemptString);
    }, "", "");
}

JTypeFill = function(containerID, text, TypeSpeed, callback, TypeCharacter, Prefix){
    var cont = $("#" + containerID);

    if (typeof TypeCharacter == 'undefined' || TypeCharacter == null)
        TypeCharacter = "&#9608;";

    if (typeof Prefix == 'undefined' || Prefix == null)
        Prefix = ">";

    cont.html("").stop().css("fake-property", 0).animate(
        {
            "fake-property" : text.length
        },
        {
            duration: TypeSpeed * text.length,
            step: function(i)
            {
                var insert = Prefix + text.substr(0, i);
                var i = Math.round(i);
                if (cont.text().substr(0, cont.text().length - 1 ) != insert)
                {
                    if (Params.sound)
                        $("#audiostuff").find("audio").eq( Math.floor(Math.random() * $("#audiostuff").find("audio").length) )[0].play();
                }
                cont.html(insert + TypeCharacter);
            },
            complete: callback
        }
    );
}

SetupInteractions = function(column){
    column = $(column);

    column.find(".character").hover(function()
                                    {
        if (Params.attemptsRemaining == 0)
            return false;

        $(this).addClass("character-hover");


        if ( !$(this).hasClass("word") && !$(this).hasClass("dudcap") )
        {
            UpdateConsole($(this).text());
            return true;
        }

        if ($(this).hasClass("word"))
            UpdateConsole($(this).attr("data-word"));
        else if ($(this).hasClass("dudcap"))
            UpdateConsole($(this).text());

        var cur = $(this).prev();
        if (cur.is("br"))
            cur = cur.prev();
        while (cur.hasClass("word") || cur.hasClass("dud"))
        {
            cur.addClass("character-hover");
            cur = cur.prev();
            if (cur.is("br"))
                cur = cur.prev();
        }

        var cur = $(this).next();
        if (cur.is("br"))
            cur = cur.next();
        while (cur.hasClass("word") || cur.hasClass("dud"))
        {
            cur.addClass("character-hover");
            cur = cur.next();
            if (cur.is("br"))
                cur = cur.next();
        }

    },
    function()
                                    {

        $(this).removeClass("character-hover");

        if ( !$(this).hasClass("word") && !$(this).hasClass("dudcap") )
            return true;

        var cur = $(this).prev();
        if (cur.is("br"))
            cur = cur.prev();
        while (cur.hasClass("word") || cur.hasClass("dud"))
        {

            cur.removeClass("character-hover");
            cur = cur.prev();
            if (cur.is("br"))
                cur = cur.prev();
        }

        var cur = $(this).next();
        if (cur.is("br"))
            cur = cur.next();
        while (cur.hasClass("word") || cur.hasClass("dud"))
        {
            cur.removeClass("character-hover");
            cur = cur.next();
            if (cur.is("br"))
                cur = cur.next();
        }
    });

    column.find(".character").click(function()
                                    {
        if (Params.attemptsRemaining == 0)
            return false;

        var word;
        if ($(this).hasClass("word"))
        {
            if (Params.sound)
                $("#enter")[0].play();
            word = $(this).attr("data-word");
            UpdateOutput(word);

            if (word.toLowerCase() == Correct.toLowerCase())
            {
                if (Params.sound)
                    $("#passgood")[0].play();
                UpdateOutput("");            
                writeWithLineMax(Params.messageMotDePasseCorrect);
                UpdateOutput("");
                Params.attemptsRemaining = 0;
                Success();
            }
            else
            {
                _gaq.push(['_trackEvent', 'Terminal', 'Words', 'Incorrect']);
                if (Params.sound)
                    $("#passbad")[0].play();
                UpdateOutput(Params.accessDenied);
                UpdateOutput( CompareWords(word, Correct) + "/" + Correct.length + " "+Params.messageCorrect+"." );
                Params.attemptsRemaining = Params.attemptsRemaining - 1;
                UpdateAttempts();
                if (Params.attemptsRemaining == 0)
                    Failure();
            }
        }
        else if ($(this).hasClass("dudcap"))
        {
            if (Params.sound)
                $("#enter")[0].play();
            HandleBraces( $(this) );
        }
        else
        {
            return false;
        }
    });

    SetBlinkCursor();

}

document.addEventListener('keydown', function(event) {
    event.preventDefault();

    if (Params.attemptsRemaining == 0)
        return false;


    cursorNode = $('.cursor');
    column = cursorNode.first().parent().attr("id");

    pos = positionCursor('cursor'); //pos["1"]=>cursor:first //pos["2"]=>cursor:last

    switch (event.key) {
        case "ArrowLeft":
            // Left pressed
            //Si column2 et début de ligne, se passe rien
            //Si column4 et début de ligne, passe à l'élèment en même pos + largeur colonne de la column 2
            //Sinon on remonte d'un cran dans le DOM
            if(cursorNode.first().prev().length ==0 || cursorNode.first().prev().is('br') == true){
                if(column == 'column2'){
                    //Rien ne se passe

                }
                else{
                    newPos = pos["1"]+Params.wordColumnWidth-1;
                    newNode = $('#column2').children('span').eq(newPos);


                    cursorNode.each(function(index,elem){$(elem).removeClass('cursor')});
                    addCursor(newNode);
                }
            }
            else{
                newNode = $('#'+column).children('span').eq(pos["1"]-1);
                cursorNode.each(function(index,elem){$(elem).removeClass('cursor')});
                addCursor(newNode);
            }

            break;
        case "ArrowRight":
            // Right pressed
            //Si column4 et fin de ligne, se passe rien
            //Si column2 et fin de ligne, passe à l'élèment en même pos - largeur colonne de la column 4
            //Sinon on descend d'un cran dans le DOM
            if(cursorNode.last().next().length == 0 ||cursorNode.last().next().is('br') == true){
                if(column == 'column4'){
                    //Rien ne se passe
                }
                else{
                    newPos = pos["2"]-Params.wordColumnWidth+1;
                    newNode = $('#column4').children('span').eq(newPos);


                    cursorNode.each(function(index,elem){$(elem).removeClass('cursor')});
                    addCursor(newNode);
                }
            }
            else{
                newNode = $('#'+column).children('span').eq(pos["2"]+1);
                cursorNode.each(function(index,elem){$(elem).removeClass('cursor')});
                addCursor(newNode);
            }
            break;
        case "ArrowUp":
            // Up pressed
            //Si pos inférieur largeur colonne, ne se passe rien
            //Sinon on remonte de [largeur colonne] crans dans le DOM
            if(pos["1"]<Params.wordColumnWidth){
                //Rien ne se passe
            }
            else{
                newPos = pos["1"]-Params.wordColumnWidth;
                newNode = $('#'+column).children('span').eq(newPos);

                cursorNode.each(function(index,elem){$(elem).removeClass('cursor')});
                addCursor(newNode);
            }

            break;
        case "ArrowDown":

            // Down pressed
            //Si pos supérieur [largeur colonne]*[hauteur colonne], ne se passe rien
            //Sinon on descend de [largeur colonne] crans dans le DOM
            if(pos["2"]>=(Params.wordColumnWidth*(Params.columnHeight-1))){
                //Rien ne se passe
            }
            else{
                newPos = pos["2"]+Params.wordColumnWidth;
                newNode = $('#'+column).children('span').eq(newPos);

                cursorNode.each(function(index,elem){$(elem).removeClass('cursor')});
                addCursor(newNode);
            }
            break;
        case "Enter":
            var word;
            if (cursorNode.first().hasClass("word"))
            {
               
                if (Params.sound)
                    $("#enter")[0].play();
                word = cursorNode.first().attr("data-word");
                UpdateOutput(word);
                logHistoricFile('[Action] try word : '+ word, false);
                
                if (word.toLowerCase() == Correct.toLowerCase())
                {
                    if (Params.sound)
                        $("#passgood")[0].play();
                    UpdateOutput("");
                    writeWithLineMax(Params.messageMotDePasseCorrect);
                    UpdateOutput("");
                    Params.attemptsRemaining = 0;
                    Success();
                }
                else
                {
                    _gaq.push(['_trackEvent', 'Terminal', 'Words', 'Incorrect']);
                    if (Params.sound)
                        $("#passbad")[0].play();
                    UpdateOutput(Params.accessDenied);
                    UpdateOutput( CompareWords(word, Correct) + "/" + Correct.length + " "+Params.messageCorrect+"." );
                    Params.attemptsRemaining = Params.attemptsRemaining - 1;
                    UpdateAttempts();
                    if (Params.attemptsRemaining == 0)
                        Failure();
                }
            }
            else if (cursorNode.first().hasClass("dudcap"))
            {
                if (Params.sound)
                    $("#enter")[0].play();
                HandleBraces( cursorNode.first() );
            }
            else
            {
                return false;
            }
            break;
    }

});

addCursor = function(node){

    if(node.hasClass('word')){
        dataWord = node.data('word');
        $('[data-word='+dataWord+']').addClass('cursor');
        UpdateConsole(node.attr("data-word"));
    }
    else if(node.hasClass('dudcap')){
        UpdateConsole(node.text());

        dud = node.next();

        if(dud.is('br')) dud = dud.next();

        if(dud.length == 0 || dud.hasClass('dud')==false){

            dud = node.prevUntil('span.dudcap').last().prev();
        }
        else{


            dud = node;
        }


        while(dud.hasClass('dud') || dud.is('br')){
            dud.addClass('cursor');
            dud=dud.next();
        }

    }
    else{
        UpdateConsole(node.text());

        node.addClass('cursor');
    }
}

positionCursor = function(className){

    cursorNode = $('.'+className);
    column = cursorNode.first().parent().attr("id");
    pos = [];
    var i = 0;

    cursorNode.first().parent().children('span').each(function(index, elem){
        if($(elem).hasClass(className) == true){
            pos["1"]=i;
            pos["2"]=i+cursorNode.length -1;
            return false;
        }
        i++;
    });

    return pos;

}

SetBlinkCursor = function(){
    $('#column2').children('span').first().addClass('cursor');
    UpdateConsole($('#column2').children('span').first().text());

}

RemoveDud = function(){
    
    logHistoricFile('[Action] remove dud', false);
    
    var LiveWords = $(".word").not("[data-word='" + Correct.toUpperCase() + "']");

    var WordToRemove = $( LiveWords[ Math.floor( Math.random() * LiveWords.length) ] ).attr("data-word");

    $("[data-word='" + WordToRemove + "']").each(function(index, elem)
                                                 {
        $(this).text(".").removeClass("word").removeAttr("data-word");
    });
}

HandleBraces = function(DudCap){
    _gaq.push(['_trackEvent', 'Terminal', 'Duds', 'Yes']);
    if ( Math.round( Math.random() - .3 ) )
    {
        Params.attemptsRemaining = 4;
        UpdateOutput("");
        writeWithLineMax(Params.messageVieRegagne);
        UpdateAttempts();
    }
    else
    {
        UpdateOutput("");
        writeWithLineMax(Params.messageMotSupprime);
        RemoveDud();
    }

    $(DudCap).text(".").unbind("click");
    var cur = $(DudCap).next();
    if (cur.is("br"))
        cur = cur.next();
    while ( cur.hasClass("dud") )
    {
        if ( cur.hasClass("dudcap") )
        {
            cur.text(".").removeClass("dudcap").unbind("click");
        }
        else
        {
            cur.text(".").unbind("click");
        }
        cur = cur.next();
        if (cur.is("br"))
            cur = cur.next();
    }

    var cur = $(DudCap).prev();
    if (cur.is("br"))
        cur = cur.prev();
    while ( cur.hasClass("dud") )
    {
        if ( cur.hasClass("dudcap") )
        {
            cur.text(".").removeClass("dudcap").unbind("click");
        }
        else
        {
            cur.text(".").unbind("click");
        }
        cur = cur.prev();
        if (cur.is("br"))
            cur = cur.prev();
    }
}

Failure = function(){
    _gaq.push(['_trackEvent', 'Terminal', 'EndGame', 'Failure']);
    
    writeWithLineMax(Params.accessDenied);
    writeWithLineMax(Params.messageBlocageEnCours);

    
    logHistoricFile('[Failure] attempts : ' + Params.attemptsRemaining, false);
    
    $("#terminal-interior").animate({
        top: -1 * $("#terminal-interior").height()
    },
                                    {
        duration: 1000,
        complete : function()
        {
            $("#terminal").html("<div id='adminalert'>"+ Params.messageTerminalLocked +"</div>");
            setTimeout(function(){window.location = "index.html"}, Params.blockTime * 1000);
        }
    });
}

Success = function(){
    
    logHistoricFile('[Success] attempts : ' + Params.attemptsRemaining, false);

    
    _gaq.push(['_trackEvent', 'Terminal', 'EndGame', 'Success']);
    $("#terminal-interior").animate({
        top: -1 * $("#terminal-interior").height()
    },
                                    {
        duration: 1000,
        complete : function()
        {
            window.location = "explore.html";
        }
    });
}

CompareWords = function(first, second){
    if (first.length !== second.length)
    {
        return 0;
    }

    first = first.toLowerCase();
    second = second.toLowerCase();

    var correct = 0;
    var i = 0;
    while (i < first.length)
    {
        if (first[i] == second[i])
            correct++;
        i++;
    }
    return correct;
}

UpdateConsole = function(word){
    var cont = $("#console");
    var curName = cont.text();
    var TypeSpeed = 80;

    cont.html("").stop().css("fake-property", 0).animate(
        {
            "fake-property" : word.length
        },
        {
            duration: TypeSpeed * word.length,
            step: function(i)
            {
                var insert = ">" + word.substr(0, i);
                var i = Math.round(i);
                if (cont.text().substr(0, cont.text().length - 1 ) != insert)
                {
                    if (Params.sound)
                        $("#audiostuff").find("audio").eq( Math.floor(Math.random() * $("#audiostuff").find("audio").length) )[0].play();
                }
                cont.html(insert + "&#9608;");
            }
        }
    );
}

UpdateOutput = function(text){
    OutputLines.push(">" + text);

    var output = "";

    var i = Params.columnHeight - 2;
    while (i > 0)
    {
        output += OutputLines[ OutputLines.length - i ] + "<br />";
        i--;
    }

    $("#output").html(output);
}

PopulateInfo = function(){
    var cont = $("#info");

    var curHtml = "";

    var TypeSpeed = 20;

    cont.stop().css("fake-property", 0).animate(
        {
            "fake-property" : Params.titre.length
        },
        {
            duration: TypeSpeed * Params.titre.length,
            step: function(delta)
            {
                var insert = Params.titre.substr(0, delta);
                delta = Math.round(delta);
                if (cont.html().substr(0, cont.html().length - 1 ) != insert)
                {
                    $("#audiostuff").find("audio").eq( Math.floor(Math.random() * $("#audiostuff").find("audio").length) )[0].play();
                }
                cont.html(insert);
            }
        }
    );
}

SetupOutput = function(){
    var i = 0;
    while (i < Params.columnHeight)
    {
        OutputLines.push("");
        i++;
    }
}

FillPointerColumns = function(){
    var column1 = document.getElementById("column1");
    var column3 = document.getElementById("column3");

    var pointers = "";

    var i = 0;
    while ( i < Params.columnHeight )
    {
        pointers += RandomPointer() + "<br />";
        i++;
    }

    column1.innerHTML = pointers;

    pointers = "";

    var i = 0;
    while ( i < Params.columnHeight )
    {
        pointers += RandomPointer() + "<br />";
        i++;
    }

    column3.innerHTML = pointers;
}

FillWordColumns = function(){
    var column2 = document.getElementById("column2");
    var column4 = document.getElementById("column4");

    var column2Content = $(GenerateGarbageCharacters());
    var column4Content = $(GenerateGarbageCharacters());

    var WordsPerColumn = Words.length;

    // Fill the first column

    var AllChars = column2Content;

    var start = Math.floor(Math.random() * Params.wordColumnWidth);
    var i = 0;
    while (i < Words.length / 2)
    {
        var pos = start + i * Math.floor(AllChars.length / (Words.length / 2));
        for (var s = 0; s < Params.difficulty; s++)
        {
            var word = Words[i].toUpperCase();
            $(AllChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
        }
        i++;
    }

    AllChars = AddDudBrackets(AllChars);

    PrintWordsAndShit( column2, AllChars );

    // Fill the second, we'll work this into a loop later

    AllChars = column4Content;

    start = Math.floor(Math.random() * Params.wordColumnWidth);
    i = 0;
    while (i < Words.length / 2)
    {
        var pos = start + i * Math.floor(AllChars.length / (Words.length / 2));
        for (var s = 0; s < Params.difficulty; s++)
        {
            var word = Words[i + Words.length / 2].toUpperCase();
            $(AllChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
        }
        i++;
    }
    AllChars = AddDudBrackets(AllChars);
    PrintWordsAndShit( column4, AllChars );
}

AddDudBrackets = function(Nodes){
    var AllBlankIndices = GetContinuousBlanks(Nodes);


    var i = 1;
    while (i < AllBlankIndices.length)
    {
        if (Math.round( Math.random() + .25 ) )
        {
            var Brackets = BracketSets[ Math.floor( Math.random() * BracketSets.length ) ];
            var ChunkCenter = Math.floor( AllBlankIndices[i].length / 2 );
            var j = ChunkCenter - Params.dudLength / 2;
            while (j < ChunkCenter + Params.dudLength / 2)
            {
                if (j == ChunkCenter - Params.dudLength / 2)
                    $( Nodes[ AllBlankIndices[i][ j ] ] ).text( Brackets[0] ).addClass("dudcap");
                else if (j == ChunkCenter + Params.dudLength / 2 - 1)
                    $( Nodes[ AllBlankIndices[i][ j ] ] ).text( Brackets[1] ).addClass("dudcap");

                $( Nodes[ AllBlankIndices[i][ j ] ] ).addClass("dud");

                j++;
            }
        }
        i++;
    }

    return Nodes;
}

GetContinuousBlanks = function(Nodes){
    var AllNodes = $( Nodes );
    var ContinuousBlanks = [[]];
    var cur = 0;
    $.each(AllNodes, function(index, elem)
           {
        if ( !$(elem).hasClass("word") )
        {
            ContinuousBlanks[cur].push( index );

            if (index + 1 != AllNodes.length)
            {
                if ( $(AllNodes[index + 1]).hasClass("word") )
                {
                    ContinuousBlanks.push([]);
                    cur++;
                }
            }
        }
    });
    return ContinuousBlanks;
}

PrintWordsAndShit = function(container, words){
    Nodes = $(container).find(".character");
    Nodes.each(function(index, elem)
               {
        $(elem).delay(5 * index).queue(function()
                                       {
            $(elem).replaceWith( words[index] );
            if (index == Nodes.length - 1)
            {
                SetupInteractions(container);
            }
        });
    });
}

Shuffle = function(array){
    var tmp, current, top = array.length;
    if(top) while(--top)
    {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }
    return array;
}

GenerateDotColumn = function(){
    var dots = "";

    var x = 0;
    var y = 0;
    while (y < Params.columnHeight)
    {
        while (x < Params.wordColumnWidth)
        {
            dots += "<span class='character'>.</span>";
            x++;
        }
        dots += "<br />";
        x = 0;
        y++;
    }

    return dots;
}

GenerateGarbageCharacters = function(){
    var garbage = "";

    var x = 0;
    var y = 0;
    while (y < Params.columnHeight)
    {
        while (x < Params.wordColumnWidth)
        {
            garbage += "<span class='character'>" + gchars[ Math.floor( Math.random() * gchars.length ) ] + "</span>";
            x++;
        }
        //garbage += "<br />";
        x = 0;
        y++;
    }

    return garbage;
}

RandomPointer = function(){
    if (Params.sound)
        return "0x" + (("0000" + Math.floor( Math.random() * 35535 ).toString(16).toUpperCase()).substr(-4));
    else
    {
        var butt = (("0000" + Math.floor( Math.random() * 35535 ).toString(16).toUpperCase()));
        return "0x" + butt.slice(butt.length - 4, butt.length);
    }
}

function writeWithLineMax(message){

    let escapePositions = [];
    
    for (var j = 0; j < message.length; j++) {
        if(message.charAt(j) == ' '){
            escapePositions.push(j);
        }
        
        if(j == (message.length-1)){
            escapePositions.push(j);
        }
    }
    
    let delta = 0;
    for (var i = 0; i < escapePositions.length; i++) {
            
        if(i != 0 && escapePositions[i] > (Params.lineMax + delta)){
            UpdateOutput(message.substring(delta, escapePositions[i-1]));
            delta = escapePositions[i-1];
        }
        
        if( i == (escapePositions.length-1)
          && escapePositions[i] <= (Params.lineMax + delta)){            
            UpdateOutput(message.substring(delta, escapePositions[i]));
        }
        
    }
}

function loadConfiguration(){
        
    let rawdata = '';
    
    if (fs.existsSync(paramHackPath)) {
        rawdata = fs.readFileSync(paramHackPath);
    } else {
        rawdata = fs.readFileSync(paramHackPathDefault);
    }
    
    let paramHack = JSON.parse(rawdata);
    for (const [key, object] of Object.entries(paramHack)) {
        Params[key] = object.value;
    }
}

function logHistoricFile(data, user = true){
      return;
    const date = new Date();
//
//    file = 'hack-'+date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    file = 'hack';
    
    addPrefix = '';
    if(user){
        addPrefix = '--> ';
    }
 
    data = '['+ date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds() +'] ' + addPrefix + data.replaceAll('<br />','') + '\n';
    
    fs.appendFileSync(historicPath + '/'+file + '.txt', data, "UTF-8", {'flags': 'a+'});
}