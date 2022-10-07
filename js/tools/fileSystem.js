export function getFirstLevel(files) {

    $("#fichiers").html("");

    var nodes = [];

    //listing all files using forEach
    files.forEach(function (file) {

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


        var pathAll = '/' + file;

        var newNode = '<span style="overflow: hidden;" class=" ' + type + '" id="' + name.replace(/ /g, '') + '" data-path="' + pathAll + '" ></span>';


        let object = {
            node: newNode,
            name: name,
            type: type
        };

        nodes.push(object);
    });


    return nodes;



}