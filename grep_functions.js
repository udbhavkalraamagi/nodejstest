const fs = require('fs');
const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;

var hash = {}
var final_result_hash = {}

function c(a){
  console.log(a);
}

function call_help(arg){
  if(arg == 'args'){
  	c('Please check the command line options (It should be node grep_functions.js <optional -n/-i/-g> pattern_text_string fileName/folderName)');
  	process.exit(1);
  }

  if(arg == 'help'){
  	c('Execture like : node grep_functions.js <optional -n/-i/-g> pattern_text_string fileName/folderName)');
  }
}


function get_match_indexes(filename) {
  return new Promise(resolve => {
    fs.readFile(filename,(err,data)=>{
	   if(err) reject(err);
	   resolve(data);
	 });
  });
}

async function get_data_from_file(filename, pattern, flags, is_this_a_file){

  var data = await get_match_indexes(filename)

  var local_flags = "g"  
  if(flags['i'] == 1)
  	local_flags += "i"

  final_result_hash[filename] = {}
  final_result_hash[filename]['empty'] = 1

  var file_content = data.toString();
  var lines = file_content.split("\n");
  var lines_count = lines.length
  let anymatch = 0;
  
  for(var line_number=1; line_number<=lines_count; line_number++){	  	  		
    var myRegexp = new RegExp(pattern, local_flags)
    var result, last_index = -1, last_line = -1
    if ( (result = myRegexp.exec(lines[line_number-1]))) {
    	if(flags['n'] == 1){
    		if(is_this_a_file == 0)
    		  c(filename+":"+line_number+":"+lines[line_number-1].toString())
    		else
    		  c(line_number+":"+lines[line_number-1].toString())
    	}
    	else{
    		if(is_this_a_file == 0)
    		  c(filename+":"+lines[line_number-1].toString())
    		else
    		  c(lines[line_number-1].toString())
    	}
    }
  }
	 
}

function dir_read(dirname, pattern, flags){
  fs.readdir(dirname, function( err, files ) {
    if(err){
      console.error( "Could not list the directory.", err );
      process.exit( 1 );
    }
        
    files.forEach(function(file, index){
      if(! (fs.lstatSync(dirname + "/" + file).isDirectory()) ){
        get_data_from_file(dirname + "/" + file, pattern, flags, 0)
      }
    });  
  });
}

function main(){
  var commandArguments = process.argv.slice(2);
  var options = commandArguments.slice(0, -2);
  var flags = {};

  if(commandArguments.length < 2){
    call_help('args');
  }

  for(var i = 0; i < options.length; i++){

    switch(options[i]){
      case '--help':
        call_help('help');
        break;
      case '-h':
    	call_help('help');
    	break;
      case '-i':
      	flags['i'] = 1;
      	break;
      case '-n':
    	flags['n'] = 1;
    	break;
      case '-ni':
    	flags['n'] = 1;
    	flags['i'] = 1;
    	break;
      case '-in':
      	flags['n'] = 1;
      	flags['i'] = 1;
    	break;
    }
  }

  var list_of_files = [];
  var pattern = commandArguments[commandArguments.length-2].toString();

  if(fs.lstatSync(commandArguments[commandArguments.length-1]).isDirectory())
  	dir_read(commandArguments[commandArguments.length-1], pattern, flags, 0);
  else
  	get_data_from_file(commandArguments[commandArguments.length-1], pattern, flags, 1);
}

main()