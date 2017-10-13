
let chai = require('chai')
  , spies = require('chai-spies');
let assert = require('assert');
chai.use(spies);

let equals = require('array-equal')
let fs = require('fs');
let sinon = require("sinon");

let should = chai.should()
  , expect = chai.expect;
let hook;
let filename = require('./grep');

const file_read = function (filename) {  
  fs.readFile('test/package.json',(err,data)=>{

      if(err){
        console.log(err);
      }
      return (data);
    });

}


function captureStream(stream){
  let oldWrite = stream.write;
  let buf = '';

  stream.write = function(chunk, encoding, callback){
    buf += chunk.toString(); // chunk is a String or Buffer
    oldWrite.apply(stream, arguments);
  }

  return {
    unhook: function unhook(){
     stream.write = oldWrite;
    },
    captured: function(){
      return buf;
    }
  };
}

describe('console functions', function(){

  let hook;

  beforeEach(function(){
    hook = captureStream(process.stdout);
  });

  afterEach(function(){
    hook.unhook(); 
  });

  it('should print the exact string of grep --help', function(){
    
    filename.call_help();
    let string_compared = hook.captured();
    string_compared = string_compared.split('\n').join('');

    assert.equal(string_compared, "Usage: grep [OPTION]... PATTERN [FILE]...Try 'grep --help' for more information.");
  });

  it('should print the test string to console using console_print method', function(){

    filename.console_print("print this to console");
    assert.equal(hook.captured(),"print this to console\n");
  });

});

describe('prepare the content to be used by -A, -B option', function(){

  let string_print = {};
  let tab_flag = 1;
  let flags_value = {}

  it('should fetch the correct file-name passed by the test', function(){
    string_print = { 'filename' : [] };
    let file = 'package.json';

    filename.prepare_string_print('filename', string_print, tab_flag, flags_value, 0, {}, {}, file);
    assert.equal(string_print['filename'], file +'-');

  });

  it('should fetch the correct line number passed by the test', function(){

    tab_flag = 1;
    string_print = { 'lineno' : [] };
    flags_value['index'] = true;
    let current_offset = 100;

    //condition 1
    filename.prepare_string_print('lineno', string_print, tab_flag, flags_value, current_offset, {}, {}, 'file');
    assert.equal(string_print['lineno'], '\t'+Number(current_offset).toString()+"-\t");
    
    string_print = { 'lineno' : [] };
    flags_value['index'] = false;

    //condition 2
    filename.prepare_string_print('lineno', string_print, tab_flag, flags_value, current_offset, {}, {}, 'file');
    assert.equal(string_print['lineno'], '\t'+Number(current_offset).toString()+"\t-");

    tab_flag = 0;
    string_print = { 'lineno' : [] };

    //condition 3
    filename.prepare_string_print('lineno', string_print, tab_flag, flags_value, current_offset, {}, {}, 'file');
    assert.equal(string_print['lineno'], Number(current_offset).toString()+"-");

  });


  it('should fetch the correct index value passed by the test', function(){
    
    string_print = { 'index' : [] };
    tab_flag = 1;
    flags_value['index'] = true;
    let indexes_for_lines = {};
    current_offset = 100;
    indexes_for_lines[current_offset] = 'abcd';

    //condition 1
    filename.prepare_string_print('index', string_print, tab_flag, flags_value, current_offset, indexes_for_lines, {}, 'file');
    assert.equal(string_print['index'], indexes_for_lines[current_offset]+"\t-");
    
    tab_flag = 0;
    string_print = { 'index' : [] };

    //condition 2
    filename.prepare_string_print('index', string_print, tab_flag, flags_value, current_offset, indexes_for_lines, {}, 'file');
    assert.equal(string_print['index'], indexes_for_lines[current_offset]+"-");
  });


  it('should fetch the correct \'line\' string passed by the test', function(){
    let lineno = 10;
    let lines = { '10': "testing line !!" };
    string_print = { 'line': [] };

    //condition 1
    filename.prepare_string_print('line', string_print, tab_flag, flags_value, lineno+1, {}, lines, 'file');
    assert.equal(string_print['line'], lines[lineno]);
  });  

});

describe("get details for the adjacent lines", function(){

  let method = sinon.spy(filename, 'prepare_string_print');
  let flags_value = {  };
  let lines = ["first line", "second line", "third line", "fourth line"]

  let prior_string_print = {  }, after_string_print = {  };
  let lineno = 3;
  let file = "googleapi.js", what_to_get = 'filename';
  let size_global_abnum = { 'global_min_bnum' : 100, 'global_min_anum' : 100 };

  it("should check whether it is fetching the required number of lines before the current line", function(){
    flags_value = { 'bnum': 2 };

    filename.get_details_for_adjacent_lines(flags_value, prior_string_print, after_string_print, file,
      size_global_abnum, what_to_get, lineno, lines, {  } );
    expect(Number(size_global_abnum['global_min_bnum'])).to.equal(2);
  });

  it("should check whether it is fetching the required number of lines after the current line", function(){
    flags_value = { 'anum': 2 };

    filename.get_details_for_adjacent_lines(flags_value, prior_string_print, after_string_print, file,
      size_global_abnum, what_to_get, lineno-1, lines, {  } );
    expect(Number(size_global_abnum['global_min_anum'])).to.equal(1);    
  });
  
});

describe('loop over the content', function(){
  
  let hook;

  beforeEach(function(){
    hook = captureStream(process.stdout);
  });

  afterEach(function(){
    hook.unhook(); 
  });

  let flags_value = {};
  let file = 'anything.js';
  let structure = {};

  structure['1'] = { 'line' : 'first line' , 'match_value' : 'line' };
  structure['2'] = { 'line' : 'second line' , 'match_value' : 'line'};
  let indexes_vals = { 1 : 0, 2 : 15 };
  let lines = ['first line', 'second line', 'third line', '4th fourth line'];

  it('should show the matched content only', function(){
    flags_values = { match_only : true};

    filename.loop_over_content( structure, file, flags_values, {}, 0, indexes_vals, {  } );
    assert.equal(hook.captured(), structure['1']['match_value']+'\n'+structure['2']['match_value']+'\n');
  });

  it('should print the correct format for -c option', function(){
    flags_value['count'] = true;
    
    filename.loop_over_content(structure, file, flags_value, {}, 0, {}, {});
    assert.equal(hook.captured(), `${file} : ${Object.keys(structure).length}\n`);
  });

  it('should show file name always even if there is only 1 file', function(){
    flags_value['count'] = false;

    filename.loop_over_content(structure, file, flags_value, {}, 1, {}, {});
    assert.equal(hook.captured(), `${file}:${structure['1']['line']}\n${file}:${structure['2']['line']}\n`);
  });

  it('should print the lineno for the \'lineno\' option', function(){
    flags_value['lineno'] = true;

    filename.loop_over_content(structure, file, flags_value, {}, 0, {}, {});
    assert.equal(hook.captured(), `1:${structure['1']['line']}\n2:${structure['2']['line']}\n`);
  });

  it('should print the index for the \'index\' option', function(){
    flags_value['index'] = true;

    filename.loop_over_content( structure, file, flags_value, {}, 0, indexes_vals, {  } );
    assert.equal(hook.captured(), `1:0:${structure['1']['line']}\n2:15:${structure['2']['line']}\n`);
  });

  it('should print only \'m\' number of matched lines', function(){
    flags_value = { mcount : 1 };

    filename.loop_over_content(structure, file, flags_value, {}, 0, indexes_vals, {});
    assert.equal(hook.captured(), `${structure['1']['line']}\n`);
  });

  it('should print correct lines if -A -B option is provided', function(){
    flags_value = { lineno : true , anum : 2 , bnum : 1};

    filename.loop_over_content(structure, file, flags_value, {}, 0, indexes_vals, lines);
    assert.equal(hook.captured(), `1:${lines[0]}\n2-${lines[1]}\n3-${lines[2]}\n--\n1-${lines[0]}\n2:${lines[1]}\n3-${lines[2]}\n--\n`);
  });
 
});

describe('updating structure content got from the file', function(){
  
  let anymatch = 0;
  let file = 'anything.js';
  let line_number = 1;
  let lines = { '1': "google rocks" }
  let pattern = "google";
  let matched_result = "google";

  let matched_content = { 'file': 'anything.js' };
  matched_content[file] = { 'matched': {}, 'unmatched': {} };

  it('should match structure values after calling for the first time for key \'line\' with local testing values', function(){
    anymatch = 0;

    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['line'], lines[line_number] );
  });

  it('should match structure values after calling for the first time for key \'match_value\' with local testing values', function(){
    anymatch = 0;

    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['match_value'], pattern);
  });

  it('should match structure values after calling for the first time for key \'indexes\' with local testing values', function(){
    anymatch = 0;

    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['indexes'], matched_result);
  });

  it('should match structure values after calling for key \'indexes\' with local testing values', function(){
    anymatch = 1;
    matched_content[file]['matched'][line_number] = { 'indexes' : [], 'matched_value': "" };

    filename.update_content(anymatch, matched_content, file, line_number, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number]['indexes'], matched_result);
  });

  it('should match structure values after calling for key \'match_value\' with local testing values', function(){
    anymatch = 1;
    matched_content[file]['matched'][line_number] = { 'match_value': "", 'indexes' : [] };

    filename.update_content(anymatch, matched_content, file, line_number, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number]['match_value'], pattern);
  });
  
});

describe("fetching the byte index values for -b option", function(){
  
  let matched_content = {  };
  let indexes_vals = {  };
  
  matched_content = { 'matched': {
                         '1' : { 'line' : "a" },
                         '2' : { 'line' : "b" },
                         '4' : { 'line' : "d" } 
                        },

                        'unmatched': {
                         '3' : { 'line' : "c" },
                         '5' : { 'line' : "e" },
                        }
                      };

  it("should verify index values for matched content with locally passed content", function(){
    indexes_vals = filename.get_indexes(matched_content);

    expect(indexes_vals['4']).to.equal(6);
  });

  it("should verify index values for unmatched content with locally passed content", function(){

    expect(indexes_vals['3']).to.equal(4);
  });

});


describe("iterating over the result:", function(){
  
  let files = ['first_file', 'second_file'];
  let hook;

  beforeEach(function(){
    hook = captureStream(process.stdout);
  });

  afterEach(function(){
    hook.unhook(); 
  });

  let flags_values = { 'matchfiles' : true };
  let matched_content = { 'first_file' : {
                             'matched' :  {
                               '1' : { 'line' : "a" },
                               '2' : { 'line' : "b" },
                               '4' : { 'line' : "d" }
                             },
                             'unmatched' : {
                               '3' : { 'line' : "c" },
                               '5' : { 'line' : "e" },
                             }
                           },

                           'second_file' : {
                             'matched' :  {

                             },
                              
                             'unmatched' : {
                               '1' : { 'line' : "u" },
                               '2' : { 'line' : "d" },
                             }
                           } 
                        };

  it("should print the correct filename when -l option is passed", function(){
    filename.print_the_information(matched_content, flags_values, 2, []);

    expect(hook.captured()).to.equal('first_file\n');
  });

  
  it("should print the correct filename when -L option is passed", function(){
    flags_values = { 'unmatchfiles' : true };

    filename.print_the_information(matched_content, flags_values, 2, []);
    expect(hook.captured()).to.equal('second_file\n');
  });

  
  it("should pass the correct output to rendering method for -c option", function(){
    flags_values = { 'count' : true };

    filename.print_the_information(matched_content, flags_values, 2, []);

    let string_console = hook.captured().split('\n');

    for(var index=0; index<string_console.length-1; index++){
      let this_line = string_console[index].split(' ');
      let this_structure = [ files[index], ':', Object.keys(matched_content[files[index]]['matched']).length.toString()];

      assert(equals(this_structure, this_line));
    }
  });

});

describe("matching the file content", function(){
  
  it("match the file content got from the async function with the locally called readFileSync", async function(){

    let called_data = await filename.reading_the_file('/home/udbhav/testing/mocha_testing/test/package.json');   
    let local_data = fs.readFileSync('/home/udbhav/testing/mocha_testing/test/package.json','utf8');

    assert.equal(called_data.toString(), local_data);
  });

});

describe("read the content from file or stdin", function(){

  let hook;

  beforeEach(function(){
    hook = captureStream(process.stdout);
  });

  afterEach(function(){
    hook.unhook(); 
  });

  let content = "scripts";
  let pattern = "script";
  let flags_values = {  };
  let count_files = 1;
  let read_from = 'stdin';

  it("should show the passed content if -F (fixed match pattern is given)", async function(){
    let flags_values = { 'fixed_match' : true };

    filename.get_data_from_file(content, pattern, flags_values, count_files, read_from);
    assert.equal(hook.captured(), content+'\n');
  });

});

describe("initial check and creating files structure", function(){
  
  let hook;

  beforeEach(function(){
    hook = captureStream(process.stdout);
  });

  afterEach(function(){
    hook.unhook(); 
  });

  let flags_values = {  };
  
  it("should print error message if -m option is invalid", function(){
    flags_values = { mcount : 'this is invalid' };
    let command_line_arguments = [ '-m', 'a', 'abc', '/home/udbhav/testing/mocha_testing/test/package.json' ];
    
    filename.do_processing(flags_values, command_line_arguments);
    assert.equal(hook.captured(), 'grep: invalid max count\n');
  });

  it("should print error message if -A option is invalid", function(){
    flags_values = { anum : 'this is invalid' };
    let command_line_arguments = [ '-m', 'a', 'abc', '/home/udbhav/testing/mocha_testing/test/package.json' ];
    
    filename.do_processing(flags_values, command_line_arguments);
    assert.equal(hook.captured(), 'grep: a: invalid context length argument\n');
  });

  it("should print error message if -B option is invalid", function(){
    flags_values = { bnum : 'this is invalid' };
    let command_line_arguments = [ '-m', 'a', 'abc', '/home/udbhav/testing/mocha_testing/test/package.json' ];
    
    filename.do_processing(flags_values, command_line_arguments);
    assert.equal(hook.captured(), 'grep: a: invalid context length argument\n');
  });

  it("should print error message if -C option is invalid", function(){
    flags_values = { cnum : 'this is invalid' };
    let command_line_arguments = [ '-m', 'a', 'abc', '/home/udbhav/testing/mocha_testing/test/package.json' ];
    
    filename.do_processing(flags_values, command_line_arguments);
    assert.equal(hook.captured(), 'grep: a: invalid context length argument\n');
  });
  
  it("should print the 'Is a directory' message if directory name is given", function(){
    flags_values = {  };
    let command_line_arguments = [ 'pattern', '/home/udbhav/testing/mocha_testing/test/node_modules' ];
    
    filename.do_processing(flags_values, command_line_arguments);
    assert.equal(hook.captured(), 'grep: /home/udbhav/testing/mocha_testing/test/node_modules: Is a directory\n');
  });

  it("should suppress file name for -s option when invalid file name is given", function(){
    flags_values = { suppress_file : true };
    let command_line_arguments = [ 'pattern', 'no_such_file_name' ];
    
    filename.do_processing(flags_values, command_line_arguments);
    assert.equal(hook.captured(), '');
  });

});