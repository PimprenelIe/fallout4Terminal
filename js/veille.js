const $ = require('../vendor/jquery-3.4.1/jquery-3.4.1');

var inactiveTimeLimit = 10 //minutes
var idleTime = 0;
$(document).ready(function () {
    // Increment the idle time counter every minute.
    var idleInterval = setInterval(timerIncrement, 60000); // 1 minute

    // Zero the idle timer on mouse movement.
    $(this).mousemove(function (e) {
        idleTime = 0;
    });
    $(this).keypress(function (e) {
        idleTime = 0;
    });
});

function timerIncrement() {
    idleTime = idleTime + 1;
    if (idleTime >= inactiveTimeLimit) {
        window.location = "index.html";
    }
}