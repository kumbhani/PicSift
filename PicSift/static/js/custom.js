var opts = {
  lines: 17 // The number of lines to draw
, length: 0 // The length of each line
, width: 14 // The line thickness
, radius: 43 // The radius of the inner circle
, scale: 1.25 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: '#000' // #rgb or #rrggbb or array of colors
, opacity: 0 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 70 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: 'spinner' // The CSS class to assign to the spinner
, top: '50%' // Top position relative to parent
, left: '50%' // Left position relative to parent
, shadow: true // Whether to render a shadow
, hwaccel: true // Whether to use hardware acceleration
, position: 'absolute' // Element positioning
}


$(function() { Dropzone.options.drop = {
  paramName: "file", 
  maxFilesize: 10, // MB
  uploadMultiple: false,
  addRemoveLinks: false,
  maxThumbnailFilesize: 10,
  thumbnailWidth: 600,
  thumbnailHeight: 600,
  acceptedFiles: ".jpg,.png",
  previewTemplate: "<div class=\"dz-preview dz-file-preview\">\n <div class=\"dz-progress\"></div> <img data-dz-thumbnail class=\"dz-image\"/></div>\n </div>\">",
  init: function() {
    this.on("success", function(file, responseText) {
      $('.dz-progress').circleProgress('value', 1.0);
      process_image($.parseJSON(responseText));	
      $(".dz-progress").remove();
    });
    this.on("addedfile", function(file) { 
      added_file();
    });
    this.on("uploadprogress", function(file,progress,bytesSent) {
      if ( progress > 5 ) {
        $('.dz-progress').circleProgress('value', Math.min(1.0, progress/100.));
    }
    });
    this.on("sending", function(file) {
        $(".dz-progress").circleProgress({
            value: 0.05,
            size: 140,
            lineCap: 'round',
            fill: { color: '#ffa500' },
            animation: { duration: 4000 }

        }).on('circle-animation-progress', function(event, progress) {
            if ( progress > 0.5 ) {
                $(this).find('strong').html('<span style=\"color: white\"><i>Classifying</i></span>');
            }
        });
    });
  },
  resize: function(file) {
    var scale = 600./Math.max(file.width, file.height)
    var resizeInfo = {
          srcX: 0,
          srcY: 0,
          trgX: 0,
          trgY: 0,
          srcWidth: file.width,
          srcHeight: file.height,
          trgWidth: scale*file.width,
          trgHeight: scale*file.height 
    };

    return resizeInfo;
  }
}});

// $(".random-button").click(function(e) {
//     $.getJSON("/random", function( data ) {
//       /* manually create image element (mimicking drag'n'drop uploader) */
//       var child = document.createElement("div");
//       child.classList.add("dz-preview");
//       var img = new Image();
//       img.classList.add("dz-image");
//       img.onload = function() {
//         if ( img.height > img.width ) {
//           img.height = 260;
//         } else {
//           img.width = 260;
//         }
//         document.getElementById("drop").appendChild(child);
//         added_file();
//         process_image(data);
//       };
//       child.appendChild(img);
//       img.src = data.image_url;
//     });
//     e.stopPropagation();
// });

// function showthumbs(in_val){
//   out_html = ""
//   if (in_val>=1){
//     for (jj=0;jj<in_val;jj++){
//       out_html += "<img src=\"\\static\\thumbsup.png\" width=25 height=25>" 
//     }
//   }
//   if (in_val<=-1){
//     for (jj=0;jj<-in_val;jj++){
//       out_html += "<img src=\"\\static\\thumbsdown.png\" width=25 height=25>" 
//     }
//   }
//   if ((in_val>-1)&&(in_val<1)){
//     out_html += "Nothing Special" 
//   }
//   return out_html
// }

function showthumbs(in_val){
  out_html = ""
  if (in_val>=1){
    for (jj=0;jj<in_val;jj++){
      out_html += "<img src=\"\\static\\face-happy.png\" width=25 height=25>" 
    }
  }
  if (in_val<=-1){
    for (jj=0;jj<-in_val;jj++){
      out_html += "<img src=\"\\static\\face-sad.png\" width=25 height=25>" 
    }
  }
  if ((in_val>-1)&&(in_val<1)){
      out_html += "<img src=\"\\static\\face-neutral.png\" width=25 height=25>" 
  }
  return out_html
}


function process_image(response) {
    /* record classification vector for later searching */
    window.classification = response.classification;
    // var tag_html = "<div class=\"container-fluid tag-form\"><select id=\"tags\" class=\"tag-select form-control input-large\" multiple=\"multiple\">"; 

    var tag_html = "<div class=\"tag-form\">";
    // tag_html += "<div class=\"input-group input-group select2-bootstrap-append\" style=\"vertical-align:middle\">"
    tag_html += "<div class=\"resultbox\">";
    if (response.classification==0) {
      tag_html += "<img src=\"\\static\\thumbsdown.png\" width=50 height=50>" 
      tag_html += "<span style=\"font-size: 45px; color: #FF4545; text-shadow: 2px 2px #000000; vertical-align: middle;\">  " + Math.round(response.classification_score*1000)/10 + "%</span>"
    }else if (response.classification==1) {
      tag_html += "<img src=\"\\static\\thumbsup.png\" width=50 height=50>"
      tag_html += "<span style=\"font-size: 45px; color: #45FF45; text-shadow: 2px 2px #000000; vertical-align: middle;\">  " + Math.round(response.classification_score*1000)/10 + "%</span>"
    }else if (response.classification==-1){
      tag_html += "<span style=\"font-size: 20px; color: #45FF45; text-shadow: 2px 2px #000000; vertical-align: middle;\">Sorry, only color photos can be analyzed.</span>"
      $(".dz-progress").remove();
    }else {
      tag_html += "<span style=\"font-size: 20px; color: #45FF45; text-shadow: 2px 2px #000000; vertical-align: middle;\">Sorry, could not process this photo.</span>"
      $(".dz-progress").remove();
    }
    tag_html += "</div>";

    tagElement = document.createElement("div");
    tagElement.classList.add("row");
    tagElement.classList.add("results");
    tagElement.innerHTML = tag_html;
    document.body.appendChild(tagElement);

    $("#tags").select2({
      theme: "bootstrap",
      tags: true,
      tokenSeparators: [',']
    });
    
    var keyarray = response.feature_keys //.split(",")
    var valarray = response.feature_vals // .split(",")
    // style=\"width: 300px\"
    var tag_html = "<table class=\"table table-striped picinfo\" ><tr class=\"picinfo-header\"><th>Characteristic</th><th>Value</th></tr>"
    var importancelist = [31 , 35 , 19 , 29 , 12 , 34 , 21 , 20 , 2 , 30 , 26 , 13 , 27 , 15 , 25 , 24 , 1 , 14 , 33 , 8 , 11 , 0 , 10 , 28 , 16 , 6 , 44 , 32 , 39 , 40 , 43 , 48 , 17 , 47 , 38 , 37 , 46 , 3 , 45 , 5 , 42 , 41 , 4 , 9 , 7 , 18 , 22 , 36 , 23]                          
    var ii, jj
    for (jj = 0; jj < 10; jj++){
      ii = importancelist[jj]
    //for (ii = 0; ii < keyarray.length; ii++){
      switch (keyarray[ii]) {
        // case "Sym_Horizontal_Value":
        //   tmp_val = Math.round((valarray[ii]-0.814106023814)/0.129996394706)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Horizontal Symmetry - Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
        //   break;
        // case "Value_mu":
        //   tmp_val = Math.round((valarray[ii]-0.475898252898)/0.156487658601)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;
        // case "Salience_med":
        //   tmp_val = Math.round((valarray[ii]-0.132491418952)/0.056523982654)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Salience</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;
        // case "Rule_of_Thirds_Saturation":
        //   tmp_val = Math.round((valarray[ii]-0.355840393534)/0.229816175355)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Rule of Thirds - Saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;
        // case "Sym_Horizontal_Hue":          
        //   tmp_val = Math.round((valarray[ii]-0.628236109714)/0.246752728096)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Horizontal Symmetry - Hue</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;
        // case "Sym_Vertical_Value":          
        //   tmp_val = Math.round((valarray[ii]-0.857869625628)/0.115367061811)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Vertical Symmetry - Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;
        // case "LapVar_Value":
        //   tmp_val = Math.round((valarray[ii]+4.396102433679)/1.362184955891)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Blurriness</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;
        // case "Rule_of_Thirds_Value":
        //   tmp_val = Math.round((valarray[ii]-0.514305272043)/0.167767547503)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Rule of Thirds - Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;
        // case "ComplementaryColorIndex":
        //   tmp_val = Math.round((valarray[ii]-0.674549545231)/0.363466692752)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Complementary Colors</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;
        // case "SubjLighting_Hue":
        //   tmp_val = Math.round((valarray[ii]-0.048517722742)/0.318669384201)
        //   tag_html += "<tr class=\"picinfo-data\"><td>Avg Color in Salient Regions</td><td>" + showthumbs(tmp_val) + "</td></tr>"          
        //   break;

        case "Sym_Horizontal_Value":
          tmp_val = Math.round((valarray[ii]-0.814106023814)/0.129996394706)
          tag_html += "<tr class=\"picinfo-data\"><td>Horiz. Symmetry - Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Value_mu":
          tmp_val = Math.round((valarray[ii]-0.475898252898)/0.156487658601)
          tag_html += "<tr class=\"picinfo-data\"><td>Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Salience_med":
          tmp_val = Math.round((valarray[ii]-0.132491418952)/0.056523982654)
          tag_html += "<tr class=\"picinfo-data\"><td>Salience</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Rule_of_Thirds_Saturation":
          tmp_val = Math.round((valarray[ii]-0.355840393534)/0.229816175355)
          tag_html += "<tr class=\"picinfo-data\"><td>Rule of Thirds - Saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Sym_Horizontal_Hue":
          tmp_val = Math.round((valarray[ii]-0.628236109714)/0.246752728096)
          tag_html += "<tr class=\"picinfo-data\"><td>Horiz. Symmetry - Color</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "LapVar_Value":
          tmp_val = Math.round((valarray[ii]+4.396102433679)/1.362184955891)
          tag_html += "<tr class=\"picinfo-data\"><td>Variablity of Sharpness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Sym_Vertical_Value":
          tmp_val = Math.round((valarray[ii]-0.857869625628)/0.115367061811)
          tag_html += "<tr class=\"picinfo-data\"><td>Symmetry - Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Rule_of_Thirds_Value":
          tmp_val = Math.round((valarray[ii]-0.514305272043)/0.167767547503)
          tag_html += "<tr class=\"picinfo-data\"><td>Rule of Thirds - Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "ComplementaryColorIndex":
          tmp_val = Math.round((valarray[ii]-0.674549545231)/0.363466692752)
          tag_html += "<tr class=\"picinfo-data\"><td>Complementary Colors</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Sym_Horizontal_Saturation":
          tmp_val = Math.round((valarray[ii]-0.727833642298)/0.187098551893)
          tag_html += "<tr class=\"picinfo-data\"><td>Horizontal Symmetry - Saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Saturation_var":
          tmp_val = Math.round((valarray[ii]-0.048773966868)/0.036881551341)
          tag_html += "<tr class=\"picinfo-data\"><td>Variability in Saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "SubjLighting_Hue":
          tmp_val = Math.round((valarray[ii]-0.048517722742)/0.318669384201)
          tag_html += "<tr class=\"picinfo-data\"><td>Average Color of Salient Pixels</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "ProbAngles_Hue":
          tmp_val = Math.round((valarray[ii]-0.385897678142)/0.533821208554)
          tag_html += "<tr class=\"picinfo-data\"><td>Agreement of Persective Angles - Color</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "ProbAngles_Value":
          tmp_val = Math.round((valarray[ii]-0.560255876840)/0.492447497191)
          tag_html += "<tr class=\"picinfo-data\"><td>Agreement of Persective Angles - Brightness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "SubjLighting_Saturation":
          tmp_val = Math.round((valarray[ii]-0.056484221381)/0.285847936890)
          tag_html += "<tr class=\"picinfo-data\"><td>Average Saturation of Salient Pixels</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Colorfulness":
          tmp_val = Math.round((valarray[ii]-3.163152694702)/0.380606188255)
          tag_html += "<tr class=\"picinfo-data\"><td>Colorfulness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Saturation_mu":
          tmp_val = Math.round((valarray[ii]-0.346790572590)/0.192562086150)
          tag_html += "<tr class=\"picinfo-data\"><td>Average Saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Img_ratio":
          tmp_val = Math.round((valarray[ii]-1.333333333333)/0.489588252139)
          tag_html += "<tr class=\"picinfo-data\"><td>Aspect Ratio</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "ProbAngles_Saturation":
          tmp_val = Math.round((valarray[ii]-0.502876422845)/0.508328189322)
          tag_html += "<tr class=\"picinfo-data\"><td>Agreement of Persective Angles - Saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Sym_Vertical_Saturation":
          tmp_val = Math.round((valarray[ii]-0.780639650821)/0.168776073767)
          tag_html += "<tr class=\"picinfo-data\"><td>Sym_Vertical_Saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "LapVar_Saturation":
          tmp_val = Math.round((valarray[ii]+3.293135864752)/1.529560634467)
          tag_html += "<tr class=\"picinfo-data\"><td>LapVar_Saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Blurriness":
          tmp_val = Math.round((valarray[ii]-23.946182885550)/13.659870118082)
          tag_html += "<tr class=\"picinfo-data\"><td>Blurriness</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "LapVar_Hue":
          tmp_val = Math.round((valarray[ii]+3.246952523888)/1.217530674142)
          tag_html += "<tr class=\"picinfo-data\"><td>LapVar_Hue</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "SubjLighting_Value":
          tmp_val = Math.round((valarray[ii]+0.010622630776)/0.250793254922)
          tag_html += "<tr class=\"picinfo-data\"><td>SubjLighting_Value</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Hue_mu":
          tmp_val = Math.round((valarray[ii]-42.425095943181)/36.153724744298)
          tag_html += "<tr class=\"picinfo-data\"><td>Hue_mu</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_saturation_2":
          tmp_val = Math.round((valarray[ii]-0.688995633945)/9.557836191302)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_saturation_2</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_hue_1":
          tmp_val = Math.round((valarray[ii]-4.983851473062)/11.399669586390)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_hue_1</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_hue_2":
          tmp_val = Math.round((valarray[ii]-0.878294937637)/9.109707809135)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_hue_2</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Hue_var":
          tmp_val = Math.round((valarray[ii]-11.495720924974)/10.371188697925)
          tag_html += "<tr class=\"picinfo-data\"><td>Hue_var</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_saturation_1":
          tmp_val = Math.round((valarray[ii]-1.715895972945)/9.674137185044)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_saturation_1</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_value_2":
          tmp_val = Math.round((valarray[ii]-0.113147753739)/8.833455643135)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_value_2</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Rule_of_Thirds_Hue":
          tmp_val = Math.round((valarray[ii]-34.964258953907)/41.115387309711)
          tag_html += "<tr class=\"picinfo-data\"><td>Rule_of_Thirds_Hue</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "DoF_value":
          tmp_val = Math.round((valarray[ii]-0.032788215720)/0.251384199363)
          tag_html += "<tr class=\"picinfo-data\"><td>DoF_value</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_hue_0":
          tmp_val = Math.round((valarray[ii]-647.278440494528)/260.158565289573)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_hue_0</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_hue":
          tmp_val = Math.round((valarray[ii]-656.171403427916)/268.718322358896)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_hue</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_value_1":
          tmp_val = Math.round((valarray[ii]-6.878471364225)/11.687033707520)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_value_1</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_value":
          tmp_val = Math.round((valarray[ii]-672.922694318031)/268.809334106678)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_value</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "DoF_hue":
          tmp_val = Math.round((valarray[ii]-0.095017843727)/0.353012749845)
          tag_html += "<tr class=\"picinfo-data\"><td>DoF_hue</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_value_0":
          tmp_val = Math.round((valarray[ii]-666.268436317761)/263.032850537024)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_value_0</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_saturation_0":
          tmp_val = Math.round((valarray[ii]-647.951296155396)/260.493514473534)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_saturation_0</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "DoF_saturation":
          tmp_val = Math.round((valarray[ii]-0.059670547493)/0.285434888482)
          tag_html += "<tr class=\"picinfo-data\"><td>DoF_saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Img_size":
          tmp_val = Math.round((valarray[ii]-1471.000000000000)/572.275759822090)
          tag_html += "<tr class=\"picinfo-data\"><td>Img_size</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Wavelet_saturation":
          tmp_val = Math.round((valarray[ii]-652.511988899084)/262.878800678924)
          tag_html += "<tr class=\"picinfo-data\"><td>Wavelet_saturation</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Salience_var":
          tmp_val = Math.round((valarray[ii]-0.016361398806)/0.007851483535)
          tag_html += "<tr class=\"picinfo-data\"><td>Salience_var</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Rule_of_Thirds_Distance":
          tmp_val = Math.round((valarray[ii]-0.099937758408)/0.120074289652)
          tag_html += "<tr class=\"picinfo-data\"><td>Rule_of_Thirds_Distance</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Value_var":
          tmp_val = Math.round((valarray[ii]-0.059188340388)/0.029981311879)
          tag_html += "<tr class=\"picinfo-data\"><td>Value_var</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Sym_Vertical_Hue":
          tmp_val = Math.round((valarray[ii]-0.697151854721)/0.245965651239)
          tag_html += "<tr class=\"picinfo-data\"><td>Sym_Vertical_Hue</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Rule_of_Thirds_Salience":
          tmp_val = Math.round((valarray[ii]-0.185406421148)/0.075535392282)
          tag_html += "<tr class=\"picinfo-data\"><td>Rule_of_Thirds_Salience</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
        case "Salience_mu":
          tmp_val = Math.round((valarray[ii]-0.166733457782)/0.055845670611)
          tag_html += "<tr class=\"picinfo-data\"><td>Salience_mu</td><td>" + showthumbs(tmp_val) + "</td></tr>"
          break;
          
        default:
          tag_html += "<tr class=\"picinfo-data\"><td>" + keyarray[ii] + "</td><td>" + valarray[ii] + "</td></tr>"
          break;

      }
    }

    // var tag_html = "<table class=\"table table-striped picinfo\" >"
    // for (ii = 0; ii < keyarray.length; ii++){
    //   switch (keyarray[ii]) {
    //     case "Sym_Horizontal_Value":
    //       tag_html += "<tr class=\"picinfo-data\"><td>Horizontal Symmetry</td><td>"+(valarray[ii]-0.782626515285)/0.145689149178+"</td></tr>"
    //       break;
    //     case "Value_mu":
    //       tag_html += "<tr class=\"picinfo-data\"><td>Brightness</td><td>"+(valarray[ii]-0.47335433248)/0.158766686174+"</td></tr>"
    //       break;
    //     case "Salience_med":
    //       tag_html += "<tr class=\"picinfo-data\"><td>Salience</td><td>"+(valarray[ii]-0.136567874206)/0.0551349502041+"</td></tr>"
    //       break;
    //     case "Rule_of_Thirds_Saturation":
    //       tag_html += "<tr class=\"picinfo-data\"><td>Rule of Thirds</td><td>"+(valarray[ii]-0.388725034146)/0.232371660493+"</td></tr>"
    //       break;
    //     case "LapVar_Value":
    //       tag_html += "<tr class=\"picinfo-data\"><td>Blurriness</td><td>"+(valarray[ii]+4.52097908699)/1.38705721065+"</td></tr>"
    //       break;
    //     case "ComplementaryColorIndex":
    //       tag_html += "<tr class=\"picinfo-data\"><td>Complementary Colors</td><td>"+(valarray[ii]-0.637539842091)/0.275089200342+"</td></tr>"
    //       break;
    //     default:
    //   }
    // }

    tag_html += "<tr class=\"picinfo-extra\"><td></td><td></td></tr></table>"

    $("#divpicinfo").html(tag_html);
    $(".dz-progress").remove();
}

/*
function recommend_images() {
    $(".searchresults").remove();
    $.getJSON(
        "/search", 
        {'tags': $("#tags").val(),
         'classification_vector': window.classification_vector },
        function(response) {
            var images = response.suggested_images;
            var tag_html = "<div class=\"container-fluid carousel-container\"><div id=\"carousel\" class=\"carousel slide\" data-ride=\"carousel\"><ol class=\"carousel-indicators\">\n";
            for (var i = 0; i < images.length; i++) {
                tag_html += "<li data-target=\"#carousel\" data-slide-to=\"" + i + "\"></li>\n";
            }
            tag_html += "</ol><div class=\"carousel-inner\" role=\"listbox\">\n";
            for (var i = 0; i < images.length; i++) {
                tag_html += "<div class=\"item" + ((i==0) ? " active" : "") + "\"><img src=\""+images[i]+"\"></div>\n";
            }

            tag_html += "<a class=\"left carousel-control\" href=\"#corousel\" role=\"button\" data-slide=\"prev\">\n";
            tag_html += "  <span class=\"glyphicon glyphicon-chevron-left\" aria-hidden=\"true\"></span>\n";
            tag_html += "  <span class=\"sr-only\">Previous</span>\n";
            tag_html += "</a>\n";
            tag_html += "<a class=\"right carousel-control\" href=\"#carousel\" role=\"button\" data-slide=\"next\">\n";
            tag_html += "  <span class=\"glyphicon glyphicon-chevron-right\" aria-hidden=\"true\"></span>\n";
            tag_html += "  <span class=\"sr-only\">Next</span>\n";
            tag_html += "</a>\n";
            tag_html += "</div></div>\n";

            tagElement = document.createElement("div");
            tagElement.classList.add("row");
            tagElement.classList.add("searchresults");
            tagElement.innerHTML = tag_html;
            document.body.appendChild(tagElement);
        }
      );

    tagElement = document.createElement("div");
    tagElement.classList.add("row");
    tagElement.classList.add("searchresults");
    //tagElement.innerHTML = tag_html;
    document.body.appendChild(tagElement);

    $('searchresults').jscroll({
        debug: true,
        loadingHtml: '<button class="btn btn-lg btn-warning"><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading...</button>',
        autoTrigger: true,
        padding: 20,
        callback: function() {
            console.log("callback");
        }
    });
}
*/

function added_file() {
    $(".dz-message").detach();
    $(".instructions").remove();
    $(".dz-preview").slice(0,-1).remove();
    $(".results").remove();
    $(".searchresults").remove();
    $(".picinfo").remove();
}

$(document).bind("dragover", function(e) {
            e.preventDefault();
            return false;
       });

$(document).bind("drop", function(e){
            e.preventDefault();
            return false;
        });

