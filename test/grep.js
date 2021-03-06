#!/usr/local/bin/node

/* required modules */
const fs = require('fs');
const path = require('path');
const isValid = require('is-valid-path');
const commandLineArgs = require('command-line-args');

let hash = {};
let final_result_hash = {}; dirs_print_string = "";
let count_files = 0; all_files_printed = 0;
let inputfiles = { 'files' : [], 'dirs' : [] };

// to print the values on console
const console_print = function print_to_console(to_print){
  console.log(to_print);
}

//customized as if less arguments are given
const call_help = function printing_help_string(){
  console_print("Usage: grep [OPTION]... PATTERN [FILE]...\nTry 'grep --help' for more information.");
}

const reading_the_file = function read_the_file_async(filename) {
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
Prepare string to be printed for bnum and anum options
*/
const prepare_string_print = function(what_to_get, string_print, tab_flag, flags_values, current_line_offset, indexes_for_lines, lines, file){

  if(what_to_get == 'filename'){
    string_print['filename'].push(file+"-");
  } else if(what_to_get == 'lineno'){

      if(tab_flag){

        if(flags_values.index == true){
          string_print['lineno'].push('\t'+Number(current_line_offset).toString()+"-\t");
        } else
            string_print['lineno'].push('\t'+Number(current_line_offset).toString()+"\t-");
      } else
          string_print['lineno'].push(Number(current_line_offset).toString()+"-");
    } else if(what_to_get == 'index'){
   
        if(tab_flag){
          string_print['index'].push(indexes_for_lines[current_line_offset]+"\t-");
        } else
            string_print['index'].push(indexes_for_lines[current_line_offset]+"-");
      } else if(what_to_get == 'line'){
          string_print['line'].push(lines[current_line_offset-1]);
        }
}/*
end of function
*/

const get_details_for_adjacent_lines = function details_ABC_option(flags_values, prior_string_print, after_string_print, file,
	size_global_abnum, what_to_get, lineno, lines, indexes_for_lines){

  let tab_flag = (flags_values.tab_stop == true && (flags_values.hfilename || flags_values.index || flags_values.lineno)) ? 1 : 0;

  //global add here
  let bnum_copy=0, anum_copy=0;

  if(flags_values.bnum){

    bnum_copy = flags_values.bnum;
    prior_string_print[what_to_get] = [];

    let current_line_offset_before = Number(lineno)-Number(bnum_copy);

    while(bnum_copy > 0){

      if(current_line_offset_before > 0){
        prepare_string_print(what_to_get, prior_string_print, tab_flag, flags_values, current_line_offset_before, indexes_for_lines, lines, file);
      }
      current_line_offset_before += 1;
      bnum_copy -= 1;
    }
    size_global_abnum['global_min_bnum'] = Math.min(size_global_abnum['global_min_bnum'], prior_string_print[what_to_get].length);
  }
  //end of bnum option

  if(flags_values.anum){

    anum_copy = flags_values.anum;
    after_string_print[what_to_get] = [];

    let current_line_offset = Number(lineno)+1;

    while(anum_copy > 0){
      if(Number(current_line_offset) < lines.length){
        prepare_string_print(what_to_get, after_string_print, tab_flag, flags_values, current_line_offset, indexes_for_lines, lines, file);
      }
      current_line_offset += 1;
      anum_copy -= 1;
    }
    
    size_global_abnum['global_min_anum'] = Math.min(size_global_abnum['global_min_anum'], after_string_print[what_to_get].length);
  }
  //end of anum option
}// end of function

/*
function to loop/iterate over the available content
check some conditions and write the required output to console
*/
const loop_over_content = function iterate_over_data(structure, file, flags_values, matched_unmatched, filename_show_always,
    indexes_for_lines, lines){
  
  //if -c
  if(flags_values.count == true){
    console_print(`${file} : ${Object.keys(structure).length}`);
    return;
  }

  let total_lines = Object.keys(indexes_for_lines).length;

  // for mcount
  let line_printed_count = 0;
  let tab_flag = (flags_values.tab_stop == true && (flags_values.hfilename || flags_values.index || flags_values.lineno)) ? 1 : 0;

  //iterate over all the lines
  for(let lineno in structure){
    let size_global_abnum = { 'global_min_bnum' : 0, 'global_min_anum' : 0 };

    size_global_abnum['global_min_anum'] = (flags_values.anum) ? flags_values.anum : 0;
    size_global_abnum['global_min_bnum'] = (flags_values.bnum) ? flags_values.bnum : 0;

    let string_to_print = "", prior_string_print = {}, after_string_print = {};

    //if mcount is set and we have reached the point of lines' count
    if(
      flags_values.mcount
      && line_printed_count == flags_values.mcount
      ){
      break;
    }

    //to show the filename
    if(filename_show_always == 1){
      
      // console.log('inside file show always main file');

      get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
           size_global_abnum, "filename", lineno, lines, indexes_for_lines);
      string_to_print = file + ":";
    }

    //-n options
    if(flags_values.lineno == true){
      get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
           size_global_abnum, "lineno", lineno, lines, indexes_for_lines);

      if(tab_flag){
        string_to_print += (flags_values.index == true) ? ("\t" + lineno + ":\t") : ("\t" + lineno + "\t:");
      } else
        string_to_print += lineno + ":";
    }

    //-b option
    if(flags_values.index == true){
      get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
           size_global_abnum, "index", lineno, lines, indexes_for_lines);

      // let value = (structure[lineno]['indexes'].length + indexes_for_lines[lineno]);
      let value = (indexes_for_lines[lineno]);

      if(tab_flag){
        string_to_print += value.toString() + "\t:"
      } else
        string_to_print += value.toString() + ":";
    }
    
    if(flags_values.match_only == true){
      string_to_print += structure[lineno]['match_value'];
    } else{

      /* print the line
      if required */

      get_details_for_adjacent_lines(flags_values, prior_string_print, after_string_print, file,
           size_global_abnum, "line", lineno, lines, indexes_for_lines);
      
      string_to_print += structure[lineno]['line'];
    }

    let key_with_index_prev = {}, key_with_index_after = {};

    for(let key in prior_string_print){
      size_global_abnum['global_min_bnum'] = Math.min(size_global_abnum['global_min_bnum'], prior_string_print[key].length);
    }

    for(let key in after_string_print){
      size_global_abnum['global_min_anum'] = Math.min(size_global_abnum['global_min_anum'], after_string_print[key].length);
    }

    for(let key in prior_string_print){

      if(Number(size_global_abnum['global_min_bnum']) == 0)
        break;
      key_with_index_prev[key] = prior_string_print[key].length - size_global_abnum['global_min_bnum'];
    }

    for(let key in after_string_print){

      if(after_string_print[key].length == 0)
        break;
      key_with_index_after[key] = after_string_print[key].length - size_global_abnum['global_min_anum'];
    }

    let print_before = "", print_after = "";
    let over = 0;
    bnum_copy = flags_values.bnum;

    while(over == 0 && bnum_copy > 0){

      for(let current_key in key_with_index_prev){
        print_before += prior_string_print[current_key][key_with_index_prev[current_key]];
    	key_with_index_prev[current_key] += 1;

      if(key_with_index_prev[current_key] >= prior_string_print[current_key].length)
        over = 1;
      }
    
      print_before += "\n";

      if(over == 1)
        process.stdout.write(print_before);
      bnum_copy -= 1;
    }

    /* to print the matched pattern/string */
    console_print(string_to_print);

    over = 0;
    anum_copy = flags_values.anum;
    while(over == 0 && anum_copy > 0){

      for(let current_key in key_with_index_after){
        print_after += after_string_print[current_key][key_with_index_after[current_key]];
    	key_with_index_after[current_key] += 1;

        if(key_with_index_after[current_key] >= after_string_print[current_key].length)
          over = 1;
      }

      print_after += "\n"

      if(over == 1)
        process.stdout.write(print_after);
      anum_copy -= 1;
    }

    if(flags_values.anum || flags_values.bnum)
      console_print("--");

    line_printed_count += 1;
  }
  //end of for line
}
//end of function


/* for index option -b
   get the indexes or the byte offset of the lines which is required at a later point of time
*/
const get_indexes = function indexes_fetch(matched_content_file){
  
  let indexes_for_lines = {};

  for(let lineno in matched_content_file['matched']){
    indexes_for_lines[lineno] = matched_content_file['matched'][lineno]['line'].length;
  }

  for(let lineno in matched_content_file['unmatched']){
    indexes_for_lines[lineno] = matched_content_file['unmatched'][lineno]['line'].length;
  }

  let current_length = 0, length_till_now = 0;

  /* creating the structure to be passed and stored for reference 
     in case required for the option -b */

  for(let lineno in indexes_for_lines){

    current_length = indexes_for_lines[lineno];
    indexes_for_lines[lineno] = length_till_now;
    length_till_now = length_till_now + current_length + 1;
  }

  return indexes_for_lines;
}

/*
  prints the information
  consider the flags/options
  change the values of options if required and pass it to final rendering function
*/
const print_the_information = function show_the_information (matched_content, flags_values, count_files, lines){

  // '0' for matched
  let matched_unmatched = ((flags_values.invert == true) || (flags_values.unmatchfiles == true)) ? 1 : 0;
  let filename_only = ((flags_values.unmatchfiles == true) || (flags_values.matchfiles == true)) ? 1 : 0;
  let filename_show_always = (flags_values.hnofilename == true) ? 0 : ((count_files > 1 || flags_values.hfilename) ? 1 : 0); 
  
  // for all the files available in the database or input given
  for(let file in matched_content){

    if(filename_only == 1){
      if(matched_unmatched == 0){

        if(Object.keys(matched_content[file]['matched']).length > 0)
          console_print(file);
    } else{
      if(Object.keys(matched_content[file]['unmatched']).length > 0 && 
        Object.keys(matched_content[file]['matched']).length == 0)
          console_print(file);
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

    let indexes_for_lines = get_indexes(matched_content[file], flags_values);

    if(matched_unmatched == 0){
      loop_over_content(matched_content[file]['matched'], file, flags_values, matched_unmatched,
	                        filename_show_always, indexes_for_lines, lines);
    }  else{
      loop_over_content(matched_content[file]['unmatched'], file, flags_values, matched_unmatched,
	                        filename_show_always, indexes_for_lines, lines);
    }

  } // end of 'for' loop
} // end of function

/*
just to update the matched content according to the given conditions
*/
const update_content = function(anymatch, matched_content, filename, line_number, lines, pattern, matched_result){

  if(anymatch == 0){
    matched_content[filename]['matched'][line_number] = { 'line' : "" , 'indexes' : [], 'match_value': "" };
    matched_content[filename]['matched'][line_number]['line'] = lines[line_number-1];
    matched_content[filename]['matched'][line_number]['match_value'] = pattern;
    matched_content[filename]['matched'][line_number]['indexes'].push(matched_result);
  } else{
    matched_content[filename]['matched'][line_number]['match_value'] = pattern;
    matched_content[filename]['matched'][line_number]['indexes'].push(matched_result);
  }
}

/*
  get the data from the file 
  read it
  and store the necessary information and pass it one by one to the function to render the information
*/
async function get_data_from_file(filename, pattern, flags_values, count_files, read_from){
  
  let data = "";
  if(read_from == 'file')
    data = await reading_the_file(filename);
  else if(read_from == 'stdin')
  	data = filename;

  let matched_content = {};
  let local_flags = "g";

  local_flags = (flags_values.ignore == true || flags_values.yignore == true) ? "gi" : "g";

  matched_content[filename] = {'matched' : {  } , 'unmatched' : {  } }

  let file_content = data.toString();
  let lines = file_content.split("\n");
  let lines_count = lines.length;

  for(let line_number=1; line_number<=lines_count; line_number++){
    let myRegexp = new RegExp(pattern, local_flags);
    
    myRegexp = (flags_values.exactword == true)
               ? (new RegExp("[^a-zA-Z0-9]"+pattern+"[^a-zA-Z0-9]|[^a-zA-Z0-9]"+pattern+"$|^"+pattern+"[^a-zA-Z0-9]|^"+pattern+"$",local_flags))
               : (
               	  (flags_values.linematch == true || flags_values.fixed_match == true)
               	   ? (new RegExp("^"+pattern+"$", local_flags))
               	   : myRegexp
               	 ) ;

    let anymatch = 0, result;

    if(flags_values.fixed_match == true){
      // console_print(line_number + " line : "  +  lines[line_number-1]);
      let result_fixed = (lines[line_number-1]).indexOf(pattern);
      // console_print("fixed_match:" + flags_values.fixed_match + " result_fixed : " + result_fixed);

      if(result_fixed >= 0){
        // console.log('udb here in if result_fixed exisit s ');
        update_content(anymatch, matched_content, filename, line_number, lines, pattern, result_fixed);
        anymatch = 1;
      }
    } else{
        while (result = myRegexp.exec(lines[line_number-1])){
          update_content(anymatch, matched_content, filename, line_number, lines, result[0], result.index);
          anymatch = 1;
	    }
	}

    //unmatched
    if(anymatch == 0){
      matched_content[filename]['unmatched'][line_number] = {'line' : "" , 'indexes' : []};
      matched_content[filename]['unmatched'][line_number]['line'] = lines[line_number-1];
    }
  }

  print_the_information(matched_content, flags_values, count_files ,lines);
}

//recursively get the files' names
const walkSync = function(dir, filelist = []) {
  // console_print("inside walk");
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));

  });
  return filelist;
}

const do_processing = function(flags_values, commandArguments){
  
  let arg_index = 0;

  if(flags_values.help
    || commandArguments.length == 0){
    call_help();
    process.exit(1);
  }

  if(flags_values.exitonmatch){
    process.exit(0);
  }

  for(let i=0; i<commandArguments.length; i++){
    let this_argument = commandArguments[i];

    if(
       this_argument[0] == '-'
       || (isNaN(this_argument)==false && flags_values.mcount)
       || (isNaN(this_argument)==false && flags_values.bnum)
       || (isNaN(this_argument)==false && flags_values.cnum)
       || (isNaN(this_argument)==false && flags_values.anum)
      ){
      arg_index += 1;
    } else{
      break;
    }
  }
 
  let options_passed = commandArguments.slice(0, arg_index);
  let pattern = commandArguments[arg_index].toString();
  commandArguments = commandArguments.slice(arg_index+1,commandArguments.length);

  // console.log(commandArguments);
  // console.log(pattern);
  
  //check if no file is mentioned
  if(commandArguments.length == 0){

    let data = "", flags = "";
    process.stdin.setEncoding('utf8');

    if(flags_values.ignore == true)
      flags += "i";

    if(flags_values.stdin == true){

      process.stdin.on('data', function(chunk) {
        let myRegexp = new RegExp(pattern, flags);  
        result = myRegexp.exec(chunk);
        if(result)
          process.stdout.write(`${chunk}`)
     });

    } else{
      
        process.stdin.on('data', function(chunk) {
          data += chunk;
        });

        process.stdin.on('end', function() {
          flags_values.hnofilename = false;
          get_data_from_file(data, pattern, flags_values, 0, 'stdin');
          return;
        });
     }//end of else
  }
  //end of if (length==0)

  //check if mcount is specificied rightly or not
  if(
     flags_values.mcount
     && isNaN(flags_values.mcount)==true
    ){
    console_print("grep: invalid max count");
    // process.exit(1);
    return;
  }

  if(
     (flags_values.anum && isNaN(flags_values.anum)==true)
     ||
     (flags_values.bnum && isNaN(flags_values.bnum)==true)
    ){
    console_print(`grep: ${pattern}: invalid context length argument`);
    // process.exit(1);
    return;
  }

  //check -C, make changes to anum, bnum flag options flags
  if(flags_values.cnum){

    if(isNaN(flags_values.cnum)==true){
      console_print(`grep: ${pattern}: invalid context length argument`);
      // process.exit(1);
      return;
    }

    flags_values.bnum = (flags_values.bnum) ? (flags_values.bnum) : (flags_values.cnum);
    flags_values.anum = (flags_values.anum) ? (flags_values.anum) : (flags_values.cnum);
  }


  flags_values.bnum = (flags_values.bnum) ? (flags_values.bnum) : 0;
  flags_values.anum = (flags_values.anum) ? (flags_values.anum) : 0;

  // if no argument is specified for recursive option
  commandArguments = ((flags_values.recur == true || flags_values.rrecur == true) && commandArguments.length == 0) ? ['.'] : commandArguments;
  let files_count = commandArguments.length;
  //for all the files
  for(let ind=0; ind<commandArguments.length; ++ind){
    let file = commandArguments[ind];

    if(fs.existsSync(commandArguments[ind]) == false){
      //show file name if suppress warning is there with more than one file
      flags_values.hfilename = true;
      
      if(!flags_values.suppress_file){
        console_print(`grep: ${commandArguments[ind]}: No such file or directory`);
      }
      continue;
    }

    if((fs.lstatSync(file).isDirectory())){
      inputfiles['dirs'].push(file);

      if(flags_values.recur == true || flags_values.rrecur == true){ 
        flags_values.hfilename = true
        inputfiles['files'] = [].concat(walkSync(file, inputfiles['files']));
      }

    } else{
      inputfiles['files'].push(file);
    }

  }

  count_files = inputfiles['files'].length;

  if(count_files > 1){
    flags_values.hfilename = true;
  }

  inputfiles['files'].sort();
  for(let i=0; i<count_files; i++){
    get_data_from_file(inputfiles['files'][i], pattern, flags_values, count_files, 'file');
  }
  
  inputfiles['dirs'].sort();
  if( 
     !flags_values.recur
     && !flags_values.rrecur 
    ){
    
    for(let i=0; i<inputfiles['dirs'].length; i++){
      console_print(`grep: ${inputfiles['dirs'][i]}: Is a directory`);
    }
  }
} // end of do_processing

const main = function(){

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
    { name: 'ext', alias: 'E', type: Boolean },
    { name: 'anum', alias: 'A', type: Number },
    { name: 'bnum', alias: 'B', type: Number },
    { name: 'cnum', alias: 'C', type: Number },
    { name: 'atext', alias: 'a', type: Boolean },
    { name: 'daction', alias: 'd', type: Boolean },
    { name: 'epattern', alias: 'e', type: Boolean },
    { name: 'filepattern', alias: 'f', type: Boolean },
    { name: 'match_only', alias: 'o', type: Boolean },
    { name: 'exitonmatch', alias: 'q', type: Boolean },
    { name: 'suppress_file', alias: 's', type: Boolean },
    { name: 'tname', alias: 't', type: Boolean },
    { name: 'unixbyte', alias: 'u', type: Boolean },
    { name: 'znulldata', alias: 'z', type: Boolean },
    { name: 'version', alias: 'V', type: Boolean },
    { name: 'znull', alias: 'Z', type: Boolean },
    { name: 'basicexp', alias: 'G', type: Boolean },
    { name: 'perlexp', alias: 'P', type: Boolean },
    { name: 'tab_stop', alias: 'T', type: Boolean },
    { name: 'Daction', alias: 'D', type: Boolean },
    { name: 'Ubinary', alias: 'U', type: Boolean },
    { name: 'womatch', alias: 'I', type: Boolean },
    { name: 'fixed_match', alias: 'F', type: Boolean},
    { name: 'mcount', alias: 'm', type: Number },
    { name: 'stdin', alias: 'p', type: Boolean }
  ]

  const flags_values = commandLineArgs(optionDefinitions);
 	console_print(flags_values);
  let commandArguments = process.argv.slice(2);

  do_processing(flags_values, commandArguments);

} // end of main

//calling the main function to start the execution

module.exports =
  {
  'main' : main,
  'walkSync' : walkSync,
  'console_print' : console_print,
  'call_help' : call_help,
  'loop_over_content' : loop_over_content,
  'prepare_string_print' : prepare_string_print,
  'get_details_for_adjacent_lines' : get_details_for_adjacent_lines,
  'get_indexes' : get_indexes,
  'print_the_information' : print_the_information,
  'update_content' : update_content,
  'get_data_from_file' : get_data_from_file,
  'reading_the_file' : reading_the_file,
  'do_processing' : do_processing
  }

main();