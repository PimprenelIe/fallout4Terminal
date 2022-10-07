export function setBlinkCursor() {
    $('#fichiers span').first().addClass('cursor');
}


export function setTypeFill(containerID, text, TypeSpeed, callback, TypeCharacter, Prefix) {
    const cont = $("#" + containerID);
    const previousCont = cont.html();

    if (typeof TypeCharacter == 'undefined' || TypeCharacter == null)
        TypeCharacter = '<span class="blink">&#9608;</span>';

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

                if (cont.text().substr(0, cont.text().length - 1) !== insert) {
                    if (typeof Sound !== 'undefined' && Sound)
                        $("#audiostuff").find("audio").eq(Math.floor(Math.random() * $("#audiostuff").find("audio").length))[0].play();
                }
                cont.html(previousCont + insert + TypeCharacter);

            },
            complete: callback
        }
    );
}


export function positionCursor(className) {

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