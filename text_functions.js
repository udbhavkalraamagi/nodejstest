const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const fs = require('fs')

var lineReader = require('line-reader');
const readline = require('readline');
<<<<<<< HEAD

=======
>>>>>>> eca0101ec5d1cf065496bee7067ececfd2998a28
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Electronics {
<<<<<<< HEAD
    constructor(category){
=======

	constructor(category){
>>>>>>> eca0101ec5d1cf065496bee7067ececfd2998a28
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
<<<<<<< HEAD
			console.log("files' information doesn't exists .. try with different category !")
=======
			console.log("files' information doesn't exists")
>>>>>>> eca0101ec5d1cf065496bee7067ececfd2998a28
		return files
	}
}

//Creating Objects and adding files
var camera = new Electronics("Camera")
var refrigerator = new Electronics("Refrigerator")
var television = new Electronics("Television")

camera.add_file("dslr.txt");
<<<<<<< HEAD
camera.add_file("point_and_shoot.txt");
=======
// camera.add_file("point_and_shoot.txt");
>>>>>>> eca0101ec5d1cf065496bee7067ececfd2998a28

refrigerator.add_file("single_door.txt");
refrigerator.add_file("double_door.txt");

<<<<<<< HEAD
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
=======
console.log('\nGetting files information !!!')
camera.get_files("print")
refrigerator.get_files("print")
television.get_files("print")

hash = {}

rl.question('\nDo you want to search in camera ?(y/n)', (answer) => {
  var files = []; to_search = "", file_index = 0
  if(answer == 'y'){
  	files = camera.get_files("anything")
  	// console.log('okay, let\'s search in camera files !')
  	rl.question('Please enter the text you want to search-', (text) => {
  		to_search = text.toString()

		// filename = files[0]
		// hash[filename] = {}

		// console.log('inside Searching for:' + to_search + ' in file: ' + filename)
		for(var file_index=0; file_index<files.length; file_index++){
			var filename = files[file_index].toString()
			hash[filename] = {}
			
			fs.readFile(filename, (err, data)=>{
		  		if(err){
		  			console.log("Error reading file")
		  			return;
		  		}
		  		file_content = data.toString();

		  		var lines = file_content.split("\n");
		  		var lines_count = lines.length

		  		for(var line_number=1; line_number<=lines_count; line_number++){
		  			hash[filename][line_number] = []
		  			
		  			var myRegexp = new RegExp(to_search, "gi")
					var result;
					while ( (result = myRegexp.exec(lines[line_number-1])) ) {
					    hash[filename][line_number].push(result.index);
					}
		  		}
		  		console.log(filename.toString())

		  		for(var i=1; i<=lines_count; i++){
		  			if(hash[filename][i].length > 0)
		  				process.stdout.write('line number :' + i + " and matching index: ");
		  			for(var pos in hash[filename][i])
		  				process.stdout.write(hash[filename][i][pos] + ",")
		  			if(hash[filename][i].length > 0)
		  				process.stdout.write("\n")
		  		}
	  		});
		}

  		rl.close();
  		// rl.close();
  	});			//end of text search
  	
  }				//end of 'y' if condition
  else
  	rl.close();
>>>>>>> eca0101ec5d1cf065496bee7067ececfd2998a28
});
