#!/usr/local/bin/node
const fs = require('fs');
// var options = require('options');
var options = require('options-parser');
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
  	c('Execute like : node grep_functions.js <optional -n/-i/-g> pattern_text_string fileName/folderName)');
  	process.exit(1);
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

async function get_data_from_file(filename, pattern, flags, files_count){
  
  var data = await get_match_indexes(filename);

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
    		if(files_count > 1)
    		  c(filename+":"+line_number+":"+lines[line_number-1].toString())
    		else
    		  c(line_number+":"+lines[line_number-1].toString())
    	}
    	else{
    		if(files_count > 1)
    		  c(filename+":"+lines[line_number-1].toString())
    		else
    		  c(lines[line_number-1].toString())
    	}
    }
  }
	 
}

function main(){

  var result = options.parse({
    help:   { short: 'h', flag: true},
	line:   { short: 'n', flag: true},
	ignore: { short: 'i', flag: true },
  });
 
  if(result.args.length < 2){
    call_help('args');
  }

  var pattern = result.args[0].toString();

  var flags = {'n':0, 'i':0};

  if(result.opt.help == true)
    call_help('help')
  if(result.opt.ignore == true)
    flags['i'] = 1;
  if(result.opt.line == true)
    flags['n'] = 1;

  var files_count = result.args.length-1;

  for(var ind=1; ind<result.args.length; ++ind){
    var file = result.args[ind]
    if((fs.lstatSync(file).isDirectory()))
      c(`grep: ${file}: Is a directory`);
    else
      get_data_from_file(file, pattern, flags, files_count);
  }

}

main()