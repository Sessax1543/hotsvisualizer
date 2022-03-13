/*
// Get the form and file field
let form = document.querySelector('#upload');
let file = document.querySelector('#file');
*/
let form = document.querySelector('#jsonForm');

var game_data;
var dataProcessed = false;

/*
function logFile (event) {
    let str = event.target.result;
    game_data = JSON.parse(str);
}

function handleSubmit (event) {

    // Stop the form from reloading the page
    event.preventDefault();

    // If there's no file, do nothing
    if (!file.value.length) return;

    // Create a new FileReader() object
    let reader = new FileReader();

    // Setup the callback event to run when the file is read
    reader.onload = logFile;

    // Read the file
    reader.readAsText(file.files[0]);
}

// Listen for submit events
form.addEventListener('submit', handleSubmit);


function onChange(event) {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
}

//json Parse
function onReaderLoad(event){
    var obj = JSON.parse(event.target.result);
    game_data = obj
    console.log(game_data);
}

form.addEventListener('change', onChange);
*/