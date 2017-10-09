let chai = require('chai')
  , spies = require('chai-spies');
let assert = require('assert');
chai.use(spies);

let fs = require('fs')
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

  it('-c count option', function(){
    
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

  it('for matched - updation of line, index, matched_value:', function(){
    anymatch = 0;
    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['line'], lines[line_number] );
  });

  it('for matched - updation of matched_value:', function(){
    anymatch = 0;
    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['match_value'], pattern);
  });

  it('for matched - updation of index:', function(){
    anymatch = 0;
    filename.update_content(anymatch, matched_content, file, line_number+1, lines, pattern, matched_result);
    assert.equal(matched_content[file]['matched'][line_number+1]['indexes'], matched_result);
  });

});