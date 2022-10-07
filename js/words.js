var nbLetterMin = 2;
var nbLetterMax = 12;

//Use en or fr (words file)
var langage = "fr";

var nbLetter;

var words = [];

var accents    = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";


var gchars =
    [
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
        "/",
        " ",
        "‚",
        "˚",
        "‡",
        "‰",
        "�"
    ];

var allWords = {};


window.onload = function()
{

    importWords();

}


firstUpperCase = function(str){
    return str[0].toUpperCase() + str.slice(1); 
}

//Lire le fichier words.txt
importWords = function(){

    var xobj = new XMLHttpRequest();
    xobj.open('GET', 'content/words'+firstUpperCase(langage)+'.txt', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            for(let i= nbLetterMin; i<=nbLetterMax; i++){
                nbLetter = i;
                words = [];
                tri(xobj.responseText);    
                addWords();
            }
            write();
        }
    };
    xobj.send(null);      



}

//Récupérer tous les mots de nbLettre
tri = function(Response){



    datas = Response.split(/\r?\n/);

    datas.forEach(function(data){

        let special = false;
        var i;
        if(data.length == nbLetter){
            
            for (i = 0; i < gchars.length; i++) {
                if (data.indexOf(gchars[i])>= 0) {
                    special = true;                
                }
            }

            if(special == false){
                data = removeAccents(data);
                words.push(data.toUpperCase());
            }
        }
    });  


}

//Enlever tous les caractères spéciaux
removeAccents = function(str){

    str = str.split('');
    var strLen = str.length;
    var i, x;
    for (i = 0; i < strLen; i++) {
        if ((x = accents.indexOf(str[i])) != -1) {
            str[i] = accentsOut[x];
        }
    }
    return str.join('');




}

addWords = function(){

    allWords[nbLetter.toString()] = words;

}

//Remettre dans chaine de caractère avec guillements et virgules
write = function(){

toSend = JSON.stringify(allWords);
        toSend = toSend.replace(/,"/g, ', "');


    var http = new XMLHttpRequest();
    var url = 'write.php';
    var params = 'fileName=content/words'+firstUpperCase(langage)+'.json&text='+toSend;


    http.open('POST', url, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function() {//Call a function when the state changes.
        if(http.readyState == 4 && http.status == 200) {
            alert("Success");
        }
    }
    http.send(params); 
}






