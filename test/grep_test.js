
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

  it('prints the help string', function(){
    
    filename.call_help();
    let string_compared = hook.captured();
    string_compared = string_compared.split('\n').join('');

    assert.equal(string_compared, "Usage: grep [OPTION]... PATTERN [FILE]...Try 'grep --help' for more information.");
  });

  it('printing to console', function(){
    filename.console_print("print this to console");
    assert.equal(hook.captured(),"print this to console\n");
  });

});

describe('preparing the content:', function(){

  let string_print = {};
  let tab_flag = 1;
  let flags_value = {}

  it('fetch file name', function(){
    string_print = { 'filename' : [] };
    let file = 'package.json';
    filename.prepare_string_print('filename', string_print, tab_flag, flags_value, 0, {}, {}, file);
    assert.equal(string_print['filename'], file +'-');

  });

  it('fetch line number', function(){
    tab_flag = 1;
    string_print = { 'lineno' : [] };
    flags_value['index'] = true;
    let current_offset = 100;
    filename.prepare_string_print('lineno', string_print, tab_flag, flags_value, current_offset, {}, {}, 'file');
    assert.equal(string_print['lineno'], '\t'+Number(current_offset).toString()+"-\t");
    

    string_print = { 'lineno' : [] };
    flags_value['index'] = false;
    filename.prepare_string_print('lineno', string_print, tab_flag, flags_value, current_offset, {}, {}, 'file');
    assert.equal(string_print['lineno'], '\t'+Number(current_offset).toString()+"\t-");

    tab_flag = 0;
    string_print = { 'lineno' : [] };
    filename.prepare_string_print('lineno', string_print, tab_flag, flags_value, current_offset, {}, {}, 'file');
    assert.equal(string_print['lineno'], Number(current_offset).toString()+"-");

  });


  it('fetch index value', function(){
    
    string_print = { 'index' : [] };
    tab_flag = 1;
    flags_value['index'] = true;
    let indexes_for_lines = {};
    current_offset = 100;
    indexes_for_lines[current_offset] = 'abcd';

    filename.prepare_string_print('index', string_print, tab_flag, flags_value, current_offset, indexes_for_lines, {}, 'file');
    assert.equal(string_print['index'], indexes_for_lines[current_offset]+"\t-");
    

    tab_flag = 0;
    string_print = { 'index' : [] };
    filename.prepare_string_print('index', string_print, tab_flag, flags_value, current_offset, indexes_for_lines, {}, 'file');
    assert.equal(string_print['index'], indexes_for_lines[current_offset]+"-");
  });


  it('fetch the line content', function(){
    let lineno = 10;
    let lines = { '10': "testing line !!" };
    string_print = { 'line': [] };

    filename.prepare_string_print('line', string_print, tab_flag, flags_value, lineno+1, {}, lines, 'file');
    assert.equal(string_print['line'], lines[lineno]);
  });  

});

describe('content iteration', function(){
  
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
  structure['1'] = { 'line' : 'testing line 1' };
  structure['2'] = { 'line' : 'testing line 2' };

  it('checking the count option (-c flag)', function(){
    
    flags_value['count'] = true;
    
    filename.loop_over_content(structure, file, flags_value, {}, 0, {}, {});
    assert.equal(hook.captured(), `${file} : ${Object.keys(structure).length}\n`);
  });

});

describe('update content', function(){
  
  let anymatch = 0;
  let file = 'anything.js';
  let line_number = 1;
  let lines = { '1': "google rocks" }
  let pattern = "google";
  let matched_result = "google";

  let matched_content = { 'file': 'anything.js' };
  matched_content[file] = { 'matched': {}, 'unmatched': {} };

  it('for first time match - updation of line:', function(){
    anymatch = 0;
    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['line'], lines[line_number] );
  });

  it('for first time match - updation of matched_value:', function(){
    anymatch = 0;
    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['match_value'], pattern);
  });

  it('for first time match - updation of indexes:', function(){
    anymatch = 0;
    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['indexes'], matched_result);
  });

  it('for already matched content- updation of indexes:', function(){
    anymatch = 1;
    matched_content[file]['matched'][line_number] = { 'indexes' : [], 'matched_value': "" };
    filename.update_content(anymatch, matched_content, file, line_number, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number]['indexes'], matched_result);
  });

  it('for already matched content - updation of match_value:', function(){
    anymatch = 1;
    matched_content[file]['matched'][line_number] = { 'match_value': "", 'indexes' : [] };
    filename.update_content(anymatch, matched_content, file, line_number, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number]['match_value'], pattern);
  });
  
});


describe("details for the adjacent lines", function(){

  let method = sinon.spy(filename, 'prepare_string_print');
  let flags_value = {  };
  let lines = ["first line", "second line", "third line", "fourth line"]
  let prior_string_print = {  }, after_string_print = {  };
  let lineno = 3;
  let file = "googleapi.js", what_to_get = 'filename';
  let size_global_abnum = { 'global_min_bnum' : 100, 'global_min_anum' : 100 };

  it("prepare string calling -B option (bnum)", function(){
    flags_value = { 'bnum': 2 };
    filename.get_details_for_adjacent_lines(flags_value, prior_string_print, after_string_print, file,
      size_global_abnum, what_to_get, lineno, lines, {  } );
    expect(Number(size_global_abnum['global_min_bnum'])).to.equal(2);
  });

  it("prepare string calling -A flag option (anum)", function(){
    flags_value = { 'anum': 2 };
    filename.get_details_for_adjacent_lines(flags_value, prior_string_print, after_string_print, file,
      size_global_abnum, what_to_get, lineno-1, lines, {  } );
    expect(Number(size_global_abnum['global_min_anum'])).to.equal(1);    
  });

});


describe("fetching the index values for -b option", function(){
  
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

  it("verify index values for matched content", function(){
    indexes_vals = filename.get_indexes(matched_content);
    expect(indexes_vals['4']).to.equal(6);
  });

  it("verify index values for unmatched content", function(){
    expect(indexes_vals['3']).to.equal(4);
  });

});


describe("result iteration:", function(){
  
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

  it("filename only for matched content:", function(){
    filename.print_the_information(matched_content, flags_values, 2, []);
    expect(hook.captured()).to.equal('first_file\n');
  });

  
  it("filename only for matched content:", function(){
    flags_values = { 'unmatchfiles' : true }
    filename.print_the_information(matched_content, flags_values, 2, []);
    expect(hook.captured()).to.equal('second_file\n');
  });

  
  it("for matched count option:", function(){

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