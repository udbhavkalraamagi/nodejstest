
function myFunction(){
  $('.progress-bar').html('');

  document.getElementById("demo").innerHTML = "";
  let x = document.getElementById("upload-input");
  let txt = "";

  if ('files' in x) {
    if (x.files.length == 0) {
      txt = "Select one or more files.";
    }

    else{
      for (let i = 0; i < x.files.length; i++){
        txt += "<br><strong>" + (i+1) + ". file</strong><br>";
        let file = x.files[i];

        if ('name' in file) {
          txt += "name: " + file.name + "<br>";
        }

        if ('size' in file){
          txt += "size: " + file.size + " bytes <br>";
        }
      }
    }
  } 

  else{
    if (x.value == "") {
      txt += "Select one or more files. ....";
    }

    else{
      txt += "The files property is not supported by your browser!";
      txt  += "<br>The path of the selected file: " + x.value; // If the browser does not support the files property, it will return the path of the selected file instead. 
    }
  }
    
  return txt;
}
