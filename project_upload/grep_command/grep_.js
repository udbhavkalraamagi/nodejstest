#!/usr/local/bin/node

//require modules
const fs = require('fs');
const path = require('path')
var isValid = require('is-valid-path');
// var options = require('options-parser');
const commandLineArgs = require('command-line-args')

var hash = {}
var final_result_hash = {}
let count_files = 0

var inputfiles = {'files' : [], 'dirs' : [] }

// to print the values on console
function console_print(to_print){
  console.log(to_print);
}

//customized as if less arguments are given
function call_help(arg){

  // if(arg == 'args'){
  // 	console_print('Please check the command line options (It should be node grep_functions.js <optional -n/-i/-g> pattern_text_string fileName/folderName)');
  // 	process.exit(1);
  // }

  // if(arg == 'help'){
  // 	c('Execute like : node grep_functions.js <optional -n/-i/-g> pattern_text_string fileName/folderName)');
  // 	process.exit(1);
  // }

  console_print("Usage: grep [OPTION]... PATTERN [FILE]...\nTry 'grep --help' for more information.")
  process.exit(1);
}


function reading_the_file(filename) {

  //returns a promise
  return new Promise(resolve => {
    fs.readFile(filename,(err,data)=>{
      //either reject or resolve
      if(err){
        reject(err);
      }

      resolve(data);
	 
    });

  });
}


/*
function to loop/iterate over the available content
check some conditions and write the required output to console
*/

function loop_over_content(structure, file, flags_values, matched_unmatched, filename_show_always,
                            indexes_for_lines){
    
  //if -c
  if(flags_values.count == true){
    console_print(file+":"+Object.keys(structure).length)
    return;
  }

  var total_lines = Object.keys(indexes_for_lines).length
  
  // for mcount
  var line_printed_count = 0

  //iterate over all the lines
  for(var lineno in structure){

  	//if mcount is set and we have reached the point of lines' count
  	if(flags_values.mcount && line_printed_count == flags_values.mcount){
  		break;
  	}

    //to show the filename
    if(filename_show_always == 1){
      process.stdout.write(file+":");
    }

    //-c
    if(flags_values.count == true){
      console_print(Object.keys(structure).length)
      return;
    }

    //-n
    if(flags_values.lineno == true){
      process.stdout.write(lineno+":");
    }

    //-b
    if(flags_values.index == true){
      var value = (structure[lineno]['indexes'].length+indexes_for_lines[lineno]);
      process.stdout.write(value.toString());
    }
    
    if(flags_values.match_only == true){
      // console_print('inside match only')
      console_print(structure[lineno]['match_value'])
    }

    // print the line
    // if required
    else
      console_print(structure[lineno]['line'])
    

  	line_printed_count++;
  }
  //end of for

}
//end of function


/* for index option -b
   get the indexes or the byte offset of the lines which is required at a later point of time
*/

function get_indexes(matched_content_file){
  
  var indexes_for_lines = {}

  for(var lineno in matched_content_file['matched']){
    indexes_for_lines[lineno] = matched_content_file['matched'][lineno]['line'].length
  }

  for(var lineno in matched_content_file['unmatched']){
    indexes_for_lines[lineno] = matched_content_file['unmatched'][lineno]['line'].length
  }

  var current_length = 0, length_till_now = -1

  //creating the structure to be passed and stored for reference 
  //in case required for the option -b

  for(var lineno in indexes_for_lines){
    current_length = indexes_for_lines[lineno]
    indexes_for_lines[lineno] = length_till_now
    length_till_now = length_till_now + current_length + 1
  }


  return indexes_for_lines

}

/*
  prints the information
  consider the flags/options
  change the values of options if required and pass it to final rendering function
*/

function print_the_information(matched_content, flags_values, count_files){

	// '0' for matched
	var matched_unmatched = 0
	var filename_only = 0
	var filename_show_always = 0

  // console_print(count_files)

	if(count_files > 0 || flags_values.hfilename){
		filename_show_always = 1;
	}

	if(flags_values.hnofilename == true){
		filename_show_always = 0;
	}

	
	if(flags_values.matchfiles == true){
		// c('here 3')
		matched_unmatched = 0;
		filename_only = 1
	}

	if(flags_values.unmatchfiles == true){
		// c('here 4')
		matched_unmatched = 1;
		filename_only = 1
	}

	//show file name "matched"
	if(flags_values.invert == true){
		// c('here 5')
		matched_unmatched = 1;
	}

  // for all the files available in the database or input given
	for(var file in matched_content){

		if(filename_only == 1){
			if(matched_unmatched == 0){

				if(Object.keys(matched_content[file]['matched']).length > 0)
					console_print(file)
			}
			else{

				if(Object.keys(matched_content[file]['unmatched']).length > 0 && 
					Object.keys(matched_content[file]['matched']).length == 0)
					console_print(file)
			}
			continue;
		}

	    if(flags_values.count == true){
	      flags_values.lineno = false;
	      filename_show_always = 1;
	      loop_over_content(matched_content[file]['matched'], file, flags_values, matched_unmatched,
	                        filename_show_always);
	      continue;
	    }

	    var indexes_for_lines = get_indexes(matched_content[file], flags_values)

		if(matched_unmatched == 0){
	      loop_over_content(matched_content[file]['matched'], file, flags_values, matched_unmatched,
	                        filename_show_always, indexes_for_lines);
		}

	    else{
	      loop_over_content(matched_content[file]['unmatched'], file, flags_values, matched_unmatched,
	                        filename_show_always, indexes_for_lines);
	    }

	}

}

/*
  get the data from the file 
  read it
  and store the necessary information and pass it one by one to the function to render the information
*/

async function get_data_from_file(filename, pattern, flags_values, matched_content, count_files){
  
  // console_print(count_files)

  var data = await reading_the_file(filename);

  var matched_content = {}

  var local_flags = "g"  
  if(flags_values.ignore == true || flags_values.yignore == true){
    local_flags += "i"
  }

  matched_content[filename] = {'matched' : {}, 'unmatched' : {}}

  // console_print('inside get_data_from_file: ' + count_files)

  var file_content = data.toString();
  var lines = file_content.split("\n");
  var lines_count = lines.length

  for(var line_number=1; line_number<=lines_count; line_number++){
    var myRegexp = new RegExp(pattern, local_flags)

	if(flags_values.exactword == true){
		// myRegexp = new RegExp("[ ]"+pattern+"[ ]|[ ]"+pattern+"$|^"+pattern+"[ ]|^"+pattern+"$|[,./<>?~`!@#$%^&*()_+=-]"+pattern+"[,./<>?~`!@#$%^&*()_+=-]|[,./<>?~`!@#$%^&*()_+=-]"+pattern+"|"+pattern+"[,./<>?~`!@#$%^&*()_+=-]", 
		// 						local_flags)
		// myRegexp = new RegExp("[ ]"+pattern+"[ ]|[ ]"+pattern+"$|^"+pattern+"[ ]|^"+pattern+"$|[^a-zA-Z0-9]"+pattern+"[^a-zA-Z0-9]|^[^a-zA-Z0-9]"+pattern+"$", 
		// 						local_flags)
		myRegexp = new RegExp("[^a-zA-Z0-9]"+pattern+"[^a-zA-Z0-9]|[^a-zA-Z0-9]"+pattern+"$|^"+pattern+"[^a-zA-Z0-9]|^"+pattern+"$",local_flags)
	}

	if(flags_values.linematch == true || flags_values.files == true)
		myRegexp = new RegExp("^"+pattern+"$", local_flags)

    var anymatch = 0, result 


    while ( (result = myRegexp.exec(lines[line_number-1]))){

      if(anymatch == 0){
        matched_content[filename]['matched'][line_number] = {'line' : "" , 'indexes' : [], 'match_value': ""}
        matched_content[filename]['matched'][line_number]['line'] = lines[line_number-1]
        matched_content[filename]['matched'][line_number]['match_value'] = result[0]
        matched_content[filename]['matched'][line_number]['indexes'].push(result.index)
      }

      else{
        matched_content[filename]['matched'][line_number]['match_value'] = result[0]
        matched_content[filename]['matched'][line_number]['indexes'].push(result.index)
      }

      anymatch = 1

    }

    //unmatched
    if(anymatch == 0){

      matched_content[filename]['unmatched'][line_number] = {'line' : "" , 'indexes' : []}
      matched_content[filename]['unmatched'][line_number]['line'] = lines[line_number-1]

    }
  }

  print_the_information(matched_content, flags_values, count_files)
}


//recursively get the files' names
const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));

  });
return filelist;
}

function main(){


  const optionDefinitions = [
  // { name: 'help', alias: '-help', type: Boolean },
  { name: 'help' , type: Boolean},
  { name: 'lineno', alias: 'n', type: Boolean },
  { name: 'ignore', alias: 'i', type: Boolean },
  { name: 'yignore', alias: 'y', type: Boolean },
  { name: 'count', alias: 'c', type: Boolean },
  { name: 'linematch', alias: 'x', type: Boolean },
  { name: 'invert', alias: 'v', type: Boolean },
  { name: 'recur', alias: 'r', type: Boolean },
  { name: 'exactword', alias: 'w', type: Boolean },
  { name: 'matchfiles', alias: 'l', type: Boolean },
  { name: 'unmatchfiles', alias: 'L', type: Boolean },
  { name: 'index', alias: 'b', type: Boolean },
  { name: 'hnofilename', alias: 'h', type: Boolean },
  { name: 'hfilename', alias: 'H', type: Boolean },
  { name: 'rrecur', alias: 'R', type: Boolean },
  { name: 'anum', alias: 'A', type: Number },
  { name: 'bnum', alias: 'B', type: Number },
  { name: 'cnum', alias: 'C', type: Number },
  { name: 'a', alias: 'a', type: Boolean },
  { name: 'd', alias: 'd', type: Boolean },
  { name: 'e', alias: 'e', type: Boolean },
  { name: 'f', alias: 'f', type: Boolean },
  { name: 'match_only', alias: 'o', type: Boolean },
  { name: 'q', alias: 'q', type: Boolean },
  { name: 's', alias: 's', type: Boolean },
  { name: 't', alias: 't', type: Boolean },
  { name: 'u', alias: 'u', type: Boolean },
  { name: 'z', alias: 'z', type: Boolean },
  { name: 'V', alias: 'V', type: Boolean },
  { name: 'Z', alias: 'Z', type: Boolean },
  { name: 'E', alias: 'E', type: Boolean },
  { name: 'G', alias: 'G', type: Boolean },
  { name: 'P', alias: 'P', type: Boolean },
  { name: 'T', alias: 'T', type: Boolean },
  { name: 'D', alias: 'D', type: Boolean },
  { name: 'U', alias: 'U', type: Boolean },
  { name: 'I', alias: 'I', type: Boolean },
  { name: 'files', alias: 'F', type: Boolean},
  { name: 'mcount', alias: 'm', type: Number }
]
  const flags_values = commandLineArgs(optionDefinitions)
  // console_print(flags_values)

  if(flags_values.help){
    call_help('args');
  }
 
  var commandArguments = process.argv.slice(2);
  var arg_index = 0;

  if(commandArguments.length < 2){
    call_help('args');
  }

  //for reference
  // console_print(flags_values)

  for(var i=0; i<commandArguments.length; i++){
  	var this_argument = commandArguments[i];
  	
  	if(this_argument[0] == '-' ||
  		(isNaN(this_argument[0])==false && flags_values.mcount) ){
  	  arg_index++;
  	}
  	else
  		break;
  }

  // so as to extract the pattern correctly
  // if(flags_values.mcount){
  // 	arg_index++;
  // }

  var options_passed = commandArguments.slice(0, arg_index);
  var pattern = commandArguments[arg_index].toString();
  commandArguments = commandArguments.slice(arg_index+1,commandArguments.length)


  // console_print(flags_values.mcount)

  //check if mcount is specificied rightly or not
  if(isNaN(flags_values.mcount)){
  	console_print("grep: invalid max count");
  	process.exit(1);
  }

  // console_print(commandArguments)
  // console_print(' pattern : ' +pattern)

  // if no argument is specified for recursive option
  if( (flags_values.recur == true || flags_values.rrecur == true) && 
    commandArguments.length == 0){
    commandArguments = ['.']
  }

  var files_count = commandArguments.length

  //for all the files
  for(var ind=0; ind<commandArguments.length; ++ind){
  	var file = commandArguments[ind]

  	// check if it is a valid file
  	// console_print(commandArguments[ind])
  	// console_print(isValid(commandArguments[ind]))
  	if(fs.existsSync(commandArguments[ind]) == false){
  		console_print("grep: "+ commandArguments[ind] +": No such file or directory")
  		continue;
  	}

  	if((fs.lstatSync(file).isDirectory())){
      inputfiles['dirs'].push(file)

      if(flags_values.recur == true || flags_values.rrecur == true){
        flags_values.hfilename = true
        inputfiles['files'] = [].concat(walkSync(file,inputfiles['files']))
      }

    }

    else{
      inputfiles['files'].push(file)
    }
  }

  count_files = inputfiles['files'].length

  if(count_files > 1){
    flags_values.hfilename = true
  }

  // console_print('before going into for loop !' + count_files)

  inputfiles['files'].sort()

  for(var i=0; i<count_files; i++){
    get_data_from_file(inputfiles['files'][i], pattern, flags_values, count_files)
  }

  inputfiles['dirs'].sort()

  //for recursive
  if(!flags_values.recur && !flags_values.rrecur){

    for(var i=0; i<inputfiles['dirs'].length; i++){
      console_print('grep: ' + inputfiles['dirs'][i] + ": Is a directory")
    }
  }
}

//calling the main function to start the execution
main()  