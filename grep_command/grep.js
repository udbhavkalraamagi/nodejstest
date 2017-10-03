#!/usr/local/bin/node

/* required modules */
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
function call_help(){
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


function get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
	size_global_abnum, what_to_get, lineno, lines, indexes_for_lines){

  var tab_flag = 0;

  if (flags_values.tab_stop == true && (flags_values.hfilename || flags_values.index || flags_values.lineno))
    tab_flag = 1;

  //global add here
  var bnum_copy=0, anum_copy=0;

  if(flags_values.bnum){

    bnum_copy = flags_values.bnum;
    prior_string_print[what_to_get] = []

    var current_line_offset_before = Number(lineno)-Number(bnum_copy)

    while(bnum_copy > 0){

      if(current_line_offset_before > 0){	

        if(what_to_get == 'filename')
          prior_string_print[what_to_get].push(file+'-')

        else if(what_to_get == 'lineno'){

          if(tab_flag){

            if(flags_values.index == true)
              prior_string_print['lineno'].push('\t'+current_line_offset_before.toString()+"-\t")
            else
              prior_string_print['lineno'].push('\t'+current_line_offset_before.toString()+"\t-")
          }
          else
            prior_string_print['lineno'].push(current_line_offset_before.toString()+"-")
        }

        else if(what_to_get == 'index'){

          if(tab_flag)
            prior_string_print['index'].push(indexes_for_lines[current_line_offset_before]+"\t-")
          else
            prior_string_print['index'].push(indexes_for_lines[current_line_offset_before]+"-")
        }

        else if(what_to_get == 'line'){
          prior_string_print['line'].push(lines[current_line_offset_before-1])
        }
        
      }
      current_line_offset_before++;
      bnum_copy--;
    }

    size_global_abnum['global_min_bnum'] = Math.min(size_global_abnum['global_min_bnum'], prior_string_print[what_to_get].length)
  }
  //end of bnum option

  if(flags_values.anum){

    anum_copy = flags_values.anum;
    after_string_print[what_to_get] = []

    var current_line_offset = Number(lineno)+1

    while(anum_copy > 0){
  	  	
      if(Number(current_line_offset) < lines.length){

        if(what_to_get == 'filename')
          after_string_print['filename'].push(file+"-")

        else if(what_to_get == 'lineno'){

          if(tab_flag){

            if(flags_values.index == true)
              after_string_print['lineno'].push('\t'+Number(current_line_offset).toString()+"-\t")
            else
              after_string_print['lineno'].push('\t'+Number(current_line_offset).toString()+"\t-")
          }
          else
            after_string_print['lineno'].push(Number(current_line_offset).toString()+"-")
        }

        else if(what_to_get == 'index'){

          if(tab_flag){
            after_string_print['index'].push(indexes_for_lines[current_line_offset]+"\t-")
          }
          else
            after_string_print['index'].push(indexes_for_lines[current_line_offset]+"-")
        }

        else if(what_to_get == 'line'){
          after_string_print['line'].push(lines[current_line_offset-1])
        }

      }

      current_line_offset++;
      anum_copy--;
    }
    
    size_global_abnum['global_min_anum'] = Math.min(size_global_abnum['global_min_anum'], after_string_print[what_to_get].length)
  }
  //end of anum option

}// end of function


/*
function to loop/iterate over the available content
check some conditions and write the required output to console
*/

function loop_over_content(structure, file, flags_values, matched_unmatched, filename_show_always,
    indexes_for_lines, lines){

  //if -c
  if(flags_values.count == true){
    console_print(file+":"+Object.keys(structure).length)
    return;
  }

  var total_lines = Object.keys(indexes_for_lines).length

  // for mcount
  var line_printed_count = 0;
  var tab_flag = 0;
  if (flags_values.tab_stop == true && (flags_values.hfilename || flags_values.index || flags_values.lineno))
    tab_flag = 1;

  //iterate over all the lines
  for(var lineno in structure){

    var size_global_abnum = { 'global_min_bnum' : 0, 'global_min_anum' : 0 }
    if(flags_values.anum)
      size_global_abnum['global_min_anum'] = flags_values.anum;
    if(flags_values.bnum)
      size_global_abnum['global_min_bnum'] = flags_values.bnum

    var string_to_print = "", prior_string_print = {}, after_string_print = {};

    //if mcount is set and we have reached the point of lines' count
    if(flags_values.mcount && line_printed_count == flags_values.mcount){
      break;
    }

    //to show the filename
    if(filename_show_always == 1){
      get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
           size_global_abnum, "filename", lineno, lines, indexes_for_lines)
      string_to_print = file+":";
    }

    //-c option
    if(flags_values.count == true){
      console_print(string_to_print + Object.keys(structure).length)
      return;
    }

    //-n options
    if(flags_values.lineno == true){
      get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
           size_global_abnum, "lineno", lineno, lines, indexes_for_lines)

      if(tab_flag){

        if(flags_values.index == true)
          string_to_print += '\t'+lineno+":\t";
        else
          string_to_print += '\t'+lineno+"\t:";
      }
      else
        string_to_print += lineno+":"
    }

    //-b option
    if(flags_values.index == true){
      get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
           size_global_abnum, "index", lineno, lines, indexes_for_lines)

      // var value = (structure[lineno]['indexes'].length + indexes_for_lines[lineno]);
      var value = (indexes_for_lines[lineno]);

      if(tab_flag)
        string_to_print += value.toString()+"\t:"
      else
        string_to_print += value.toString()+":"
    }
    
    if(flags_values.match_only == true){
      string_to_print += structure[lineno]['match_value']
    }


    /* print the line
    if required */
    else{
      get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
           size_global_abnum, "line", lineno, lines, indexes_for_lines)
      
      string_to_print += structure[lineno]['line']
    }

    var key_with_index_prev = {}, key_with_index_after = {}

    for(var key in prior_string_print){
      size_global_abnum['global_min_bnum'] = Math.min(size_global_abnum['global_min_bnum'], prior_string_print[key].length)
    }

    for(var key in after_string_print){
      size_global_abnum['global_min_anum'] = Math.min(size_global_abnum['global_min_anum'], after_string_print[key].length)
    }

    for(var key in prior_string_print){

      if(Number(size_global_abnum['global_min_bnum']) == 0)
        break;
      key_with_index_prev[key] = prior_string_print[key].length - size_global_abnum['global_min_bnum'];
    }

    for(var key in after_string_print){

      if(after_string_print[key].length == 0)
        break;
      key_with_index_after[key] = after_string_print[key].length - size_global_abnum['global_min_anum'];
    }

    var print_before = "", print_after = "";
    var over = 0;
    bnum_copy = flags_values.bnum

    while(over == 0 && bnum_copy > 0){
      for(var current_key in key_with_index_prev){
        print_before += prior_string_print[current_key][key_with_index_prev[current_key]]
    	key_with_index_prev[current_key]++;

      if(key_with_index_prev[current_key] >= prior_string_print[current_key].length)
        over = 1;
      }
    
      print_before += '\n'
      if(over == 1)
        process.stdout.write(print_before)
      bnum_copy--;
    }

    /* to print the matched pattern/string */
    console_print(string_to_print)

    over = 0;
    anum_copy = flags_values.anum
    while(over == 0 && anum_copy > 0){

      for(var current_key in key_with_index_after){
        print_after += after_string_print[current_key][key_with_index_after[current_key]]
    	key_with_index_after[current_key]++;

        if(key_with_index_after[current_key] >= after_string_print[current_key].length)
          over = 1;
      }

      print_after += '\n'

      if(over == 1)
        process.stdout.write(print_after)
      anum_copy--;
    }

    if(flags_values.anum || flags_values.bnum)
      console_print("--")

    line_printed_count++;
  }
  //end of for line
}
//end of function


/* for index option -b
   get the indexes or the byte offset of the lines which is required at a later point of time
*/

function get_indexes(matched_content_file){
  
  var indexes_for_lines = {};

  for(var lineno in matched_content_file['matched']){
    indexes_for_lines[lineno] = matched_content_file['matched'][lineno]['line'].length
  }

  for(var lineno in matched_content_file['unmatched']){
    indexes_for_lines[lineno] = matched_content_file['unmatched'][lineno]['line'].length
  }

  var current_length = 0, length_till_now = 0

  /* creating the structure to be passed and stored for reference 
     in case required for the option -b */

  for(var lineno in indexes_for_lines){

    current_length = indexes_for_lines[lineno]
    indexes_for_lines[lineno] = length_till_now
    length_till_now = length_till_now + current_length + 1
  }

  return indexes_for_lines;
}

/*
  prints the information
  consider the flags/options
  change the values of options if required and pass it to final rendering function
*/
function print_the_information(matched_content, flags_values, count_files, lines){

  // '0' for matched
  var matched_unmatched = 0
  var filename_only = 0
  var filename_show_always = 0
  
  if(count_files > 0 || flags_values.hfilename){
    filename_show_always = 1;
  }

  if(flags_values.hnofilename == true){
    filename_show_always = 0;
  }

	
  if(flags_values.matchfiles == true){
    matched_unmatched = 0;
    filename_only = 1
  }

  if(flags_values.unmatchfiles == true){
    matched_unmatched = 1;
    filename_only = 1
  }

  if(flags_values.invert == true){
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
	                        filename_show_always, lines);
      continue;
    }

    var indexes_for_lines = get_indexes(matched_content[file], flags_values)

    if(matched_unmatched == 0){
      loop_over_content(matched_content[file]['matched'], file, flags_values, matched_unmatched,
	                        filename_show_always, indexes_for_lines, lines);
    }

    else{
      loop_over_content(matched_content[file]['unmatched'], file, flags_values, matched_unmatched,
	                        filename_show_always, indexes_for_lines, lines);
    }

  } // end of 'for' loop
} // end of function

/*
  get the data from the file 
  read it
  and store the necessary information and pass it one by one to the function to render the information
*/
async function get_data_from_file(filename, pattern, flags_values, matched_content, count_files){
  var data = await reading_the_file(filename);

  var matched_content = {}

  var local_flags = "g"  
  if(flags_values.ignore == true || flags_values.yignore == true){
    local_flags += "i"
  }

  matched_content[filename] = {'matched' : {}, 'unmatched' : {}}

  var file_content = data.toString();
  var lines = file_content.split("\n");
  var lines_count = lines.length

  for(var line_number=1; line_number<=lines_count; line_number++){
    var myRegexp = new RegExp(pattern, local_flags)

    if(flags_values.exactword == true){
      myRegexp = new RegExp("[^a-zA-Z0-9]"+pattern+"[^a-zA-Z0-9]|[^a-zA-Z0-9]"+pattern+"$|^"+pattern+"[^a-zA-Z0-9]|^"+pattern+"$",local_flags)
    }

    if(flags_values.linematch == true || flags_values.fixed_match == true)
      myRegexp = new RegExp("^"+pattern+"$", local_flags)

    var anymatch = 0, result;

    if(flags_values.fixed_match == true){
      var result_fixed = lines[line_number-1].indexOf(pattern)

      if(result_fixed >= 0){

        if(anymatch == 0){
          matched_content[filename]['matched'][line_number] = {'line' : "" , 'indexes' : [], 'match_value': ""}
          matched_content[filename]['matched'][line_number]['line'] = lines[line_number-1]
          matched_content[filename]['matched'][line_number]['match_value'] = pattern
          matched_content[filename]['matched'][line_number]['indexes'].push(result_fixed)
        }

        else{
          matched_content[filename]['matched'][line_number]['match_value'] = pattern    
          matched_content[filename]['matched'][line_number]['indexes'].push(result_fixed)
        }

      anymatch = 1
      }
    }

    else{
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
      
      anymatch = 1;
	  }
	}

    //unmatched
    if(anymatch == 0){
      matched_content[filename]['unmatched'][line_number] = {'line' : "" , 'indexes' : []}
      matched_content[filename]['unmatched'][line_number]['line'] = lines[line_number-1]

    }
  }

  print_the_information(matched_content, flags_values, count_files ,lines)
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
    { name: 'exitonmatch', alias: 'q', type: Boolean },
    { name: 'suppress_file', alias: 's', type: Boolean },
    { name: 't', alias: 't', type: Boolean },
    { name: 'u', alias: 'u', type: Boolean },
    { name: 'z', alias: 'z', type: Boolean },
    { name: 'V', alias: 'V', type: Boolean },
    { name: 'Z', alias: 'Z', type: Boolean },
    { name: 'E', alias: 'E', type: Boolean },
    { name: 'G', alias: 'G', type: Boolean },
    { name: 'P', alias: 'P', type: Boolean },
    { name: 'tab_stop', alias: 'T', type: Boolean },
    { name: 'D', alias: 'D', type: Boolean },
    { name: 'U', alias: 'U', type: Boolean },
    { name: 'I', alias: 'I', type: Boolean },
    { name: 'fixed_match', alias: 'F', type: Boolean},
    { name: 'mcount', alias: 'm', type: Number }
  ]

  const flags_values = commandLineArgs(optionDefinitions)

  if(flags_values.help){
    call_help();
  }
 	
  var commandArguments = process.argv.slice(2);
  var arg_index = 0;

  if(commandArguments.length < 2){
    var inp = "";
  	process.stdin(inp);
  	console_print(inp);

    // call_help();
  }

  if(flags_values.exitonmatch){
    process.exit(0)
  }

  for(var i=0; i<commandArguments.length; i++){
    var this_argument = commandArguments[i];

    if(this_argument[0] == '-' ||
      (isNaN(this_argument[0])==false && flags_values.mcount) ||
      (isNaN(this_argument[0])==false && flags_values.bnum) ||
      (isNaN(this_argument[0])==false && flags_values.cnum) ||
      (isNaN(this_argument[0])==false && flags_values.anum) ){

      arg_index++;
    }

    else
      break;
  }

  var options_passed = commandArguments.slice(0, arg_index);
  var pattern = commandArguments[arg_index].toString();
  commandArguments = commandArguments.slice(arg_index+1,commandArguments.length)

  //check if mcount is specificied rightly or not
  if(flags_values.mcount && isNaN(flags_values.mcount)==true){
    console_print("grep: invalid max count");
    process.exit(1);
  }

  if(flags_values.anum && isNaN(flags_values.anum)==true){
    console_print("grep: google: invalid context length argument");
    process.exit(1);
  }

  if(flags_values.bnum && isNaN(flags_values.bnum)==true){
    console_print("grep: google: invalid context length argument");
    process.exit(1);
  }

  //check -C, make changes to anum, bnum flag options flags
  if(flags_values.cnum){

    if(isNaN(flags_values.cnum)==true){
      console_print("grep: google: invalid context length argument");
      process.exit(1);
    }

    flags_values.bnum = (flags_values.bnum) ? (flags_values.bnum) : (flags_values.cnum);
    flags_values.anum = (flags_values.anum) ? (flags_values.anum) : (flags_values.cnum);
  }


  flags_values.bnum = (flags_values.bnum) ? (flags_values.bnum) : 0;
  flags_values.anum = (flags_values.anum) ? (flags_values.anum) : 0;

  // if no argument is specified for recursive option
  if( (flags_values.recur == true || flags_values.rrecur == true) && 
    commandArguments.length == 0){
    commandArguments = ['.']
  }

  var files_count = commandArguments.length

  //for all the files
  for(var ind=0; ind<commandArguments.length; ++ind){
    var file = commandArguments[ind]

    if(fs.existsSync(commandArguments[ind]) == false){
      //show file name if suppress warning is there with more than one file
      flags_values.hfilename = true;
  	  
      if(!flags_values.suppress_file){
        console_print("grep: "+ commandArguments[ind] +": No such file or directory")
      }
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

  inputfiles['files'].sort()

  for(var i=0; i<count_files; i++){
    get_data_from_file(inputfiles['files'][i], pattern, flags_values, count_files)
  }

  inputfiles['dirs'].sort()

  if(!flags_values.recur && !flags_values.rrecur){

    for(var i=0; i<inputfiles['dirs'].length; i++){
      console_print('grep: ' + inputfiles['dirs'][i] + ": Is a directory")
    }
  }
}

//calling the main function to start the execution
main()  