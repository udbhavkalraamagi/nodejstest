const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const fs = require('fs')

var lineReader = require('line-reader');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Electronics {
    constructor(category){
		this.category = category
		console.log('Category added-\'' + category + "'")
	}

	add_file(filename){
		if(this.files)
			this.files.push(filename)
		else
			this.files = [filename]
	}


	get_files(label){
		console.log("\nCategory- '" + this.category + "' files :")
		var files = []
		if(this.files){
			for(var i=0; i<this.files.length; ++i){
				if (label == "print")
					console.log(this.files[i])
				files.push(this.files[i])
			}
		}
		else
			console.log("files' information doesn't exists .. try with different category !")
		return files
	}
}

//Creating Objects and adding files
var camera = new Electronics("Camera")
var refrigerator = new Electronics("Refrigerator")
var television = new Electronics("Television")

camera.add_file("dslr.txt");
camera.add_file("point_and_shoot.txt");

refrigerator.add_file("single_door.txt");
refrigerator.add_file("double_door.txt");

// console.log('\nGetting files information !!!')
// camera.get_files("print")
// refrigerator.get_files("print")
// television.get_files("print")

hash = {}

rl.question('\nDo you want to search in camera/refrigerator/television ?(c/r/t)', (answer) => {
    var files = []; to_search = "", file_index = 0
    var object
  
    if(answer == 'c')
      object = camera
    else if(answer == 'r')
      object = refrigerator
    else if(answer == 't')
      object = television
    else
  	  rl.close();

  	files = object.get_files("anything")

  	if(files.length == 0){
  	  rl.close();
  	  return;
  	}

  	rl.question('Please enter the text you want to search -', (text) => {
	  to_search = text.toString()

	  rl.question('\nEnter the flags ?(gi/i/g)', (flags) => {

		for(var file_index=0; file_index<files.length; file_index++){
		  let filename = files[file_index].toString()
			
		  fs.readFile(filename, (err, data)=>{
		  hash[filename] = {}

		  if(err){
		    console.log("Error reading file")
	    	return;
		  }
			
			process.stdout.write(`\nfile_name : ${filename}:`);
			file_content = data.toString();

			var lines = file_content.split("\n");
			var lines_count = lines.length
			let anymatch = 0

			for(var line_number=1; line_number<=lines_count; line_number++){
			  hash[filename][line_number] = []
			  			
			  var myRegexp = new RegExp(to_search, flags)
			  var result, last_index = -1
			
			  while ( (result = myRegexp.exec(lines[line_number-1])) ) {
			  	anymatch = 1
		        hash[filename][line_number].push(result.index);
		        if(line_number != last_index)
		        	process.stdout.write(`\nline number:${line_number} :- "${lines[line_number-1]}" with matching index: ${result.index}`);
		        else
		        	process.stdout.write(`, ${result.index}`);
			  	last_index = line_number
			  }
			}
			if(anymatch == 0) 	
				process.stdout.write("\nNo matches !")
			console.log()
			
	  		});
		}

		rl.close();
	});

  	});			//end of text search
});
