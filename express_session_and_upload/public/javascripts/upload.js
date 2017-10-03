
function uploadnow(){
  let files = $('#upload-input').get(0).files;

  if (files.length >= 1){
    let formData = new FormData();

    for(let i = 0; i < files.length; i++) {
      let file = files[i];
      formData.append('uploads[]', file, file.name);
    }

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      
      success: function(data){
        console.log('upload successful!\n' + data);
      },
      xhr: function() {
        let xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', function(evt) {
          if (evt.lengthComputable) {
            let percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);
            $('.progress-bar').text(percentComplete + '%');
            $('.progress-bar').width(percentComplete + '%');

            if (percentComplete === 100) {
              $('.progress-bar').html('Following files are uploaded !');
            }

          }
        }, false);

        return xhr;
        }
      });
    }//end of 'if'
} // end of function