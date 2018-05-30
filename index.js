var map;

function initializeMap(){
    var mapDiv = document.getElementById('map');
    
    map = new google.maps.Map(mapDiv, {
        center: {lat: 40.7290379, lng: -73.9965486},
        zoom: 10}); 
        
    var marker = new google.maps.Marker({ //Line 1
        position: {lat: 40.7290379, lng: -73.9965486},
        animation: google.maps.Animation.BOUNCE, 
        tittle : 'NYU Stern School of Business',
        map: map});
    map.data.loadGeoJson("http://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson");

    map.data.setStyle(function(feature) {
        var borough = feature.getProperty('BoroCD');

        var boroughNumber = Number(String(borough).charAt(0));
        var color;

        if(boroughNumber == 1){
            color = 'blue';
        }else if(boroughNumber == 2){
            color = 'red';
        }else if(boroughNumber == 3){
            color = 'yellow';
        }else if(boroughNumber == 4){
            color = 'green';
        }else if(boroughNumber == 5){
            color = 'purple';
        }
        return {
          fillColor: color,
          strokeWeight: 1
        };
    });

    var legend = document.createElement('div');
    legend.id = 'legend';
    var content = [];
    content.push('<h3>BOROUGHS</h3>');
    content.push('<p><div class="color red"></div>The Bronx</p>');
    content.push('<p><div class="color yellow"></div>Brooklyn</p>');
    content.push('<p><div class="color blue"></div>Manhattan</p>');
    content.push('<p><div class="color green"></div>Queens</p>');
    content.push('<p><div class="color purple"></div>Staten Island</p>');
    legend.innerHTML = content.join('');
    legend.index = 1;

    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
}

var rentArray = [];

function loadNeighbors(){
    var latitudes = [];
    var longitudes = [];
    var districtNames = [];
    var boroughs = [];

    var xmlhttp = new XMLHttpRequest();
    var url = "https://data.cityofnewyork.us/api/views/xyye-rtrs/rows.json?accessType=DOWNLOAD";
    var i;
       
    $.getJSON(url, function(data) { 
        console.log('data', data);
        for(i = 0 ; i<298; i++){
            longitudes[i] = Number(data.data[i][9].split(" ")[1].split("(")[1]);
            latitudes[i] = Number(data.data[i][9].split(" ")[2].split(")")[0]);
            districtNames[i] = data.data[i][10];
            boroughs[i] = data.data[i][16];   
        }
    });  
}

//[0] = Borough, [1] = Crime Desc, [2] = Latitude, [3] = Longitude, [4] = Date
var crimes = [];

function loadCrimes(){

    var httpRequest = new XMLHttpRequest;
    var url = "https://data.cityofnewyork.us/api/views/e3ev-756n/rows.json?accessType=DOWNLOAD";
    var i;

    $.getJSON(url, function(data) {
        for (i = 0 ; i < 970; i++){

            crimes.push(data.data[i][21]);
            crimes.push(data.data[i][15]);
            crimes.push(Number(data.data[i][31][1]));
            crimes.push(Number(data.data[i][31][2]));
            crimes.push(data.data[i][9]);
        }
    });
    console.log(crimes);

}

function placesToRent(){
    var httpRequest = new XMLHttpRequest;
    var url = "https://data.cityofnewyork.us/api/views/hg8x-zxpr/rows.xml?accessType=DOWNLOAD";
    httpRequest.open("GET", url, true);
    httpRequest.send();


    httpRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var document = httpRequest.responseXML;
            var i;
            var rows = document.getElementsByTagName("row");
            var infoWindow  = new google.maps.InfoWindow();
            var icon = {
                url: "https://png.icons8.com/office/40/000000/bungalow.png",
                scaledSize: new google.maps.Size(25, 25),
            };

            for(i = 1 ; i< rows.length ; i++) {
                try {
                    //Address info
                    projectName = document.getElementsByTagName("project_name")[i].childNodes[0].nodeValue;
                    buildingId = Number(document.getElementsByTagName("building_id")[i].childNodes[0].nodeValue);
                    houseNumber = Number(document.getElementsByTagName("house_number")[i].childNodes[0].nodeValue);
                    borough = document.getElementsByTagName("borough")[i].childNodes[0].nodeValue;
                    street = document.getElementsByTagName("street_name")[i].childNodes[0].nodeValue;
                    postcode = Number(document.getElementsByTagName("postcode")[i].childNodes[0].nodeValue);
                    //Location
                    latitude = Number(document.getElementsByTagName("latitude")[i].childNodes[0].nodeValue);
                    longitude = Number(document.getElementsByTagName("longitude")[i].childNodes[0].nodeValue);
                    //Income info
                    eLowIncomeUnits = Number(document.getElementsByTagName("extremely_low_income_units")[0].childNodes[0].nodeValue);

                    var addressInfo = houseNumber+' - '+buildingId+' '+ street;
                    var districtInfo = borough+', NY '+postcode;

                    if(!(projectName === "CONFIDENTIAL")){
                        var rentMark = new google.maps.Marker({
                            projectN : projectName,
                            addInfo : addressInfo,
                            disctInfo : districtInfo,
                            position : {lat: latitude, lng: longitude},
                            affordability : eLowIncomeUnits,  
                            map : map,
                            icon : icon
                        });
                        
                        rentArray.push(rentMark);

                        google.maps.event.addListener(rentMark, 'click', function(){ 
                            infoWindow.setContent('<h3>'+ this.projectN+'</h3><p> <b> Address: </b>'+this.addInfo+'</h3><p> <b> Zip code: </b> '+this.disctInfo+'</p>'+'</h3><p> <b> Low income unit: </b>'+eLowIncomeUnits+'</p>'+'</h3>');
                            infoWindow.open(map, this);
                        });
                    }
                }
                catch(err) {
                    continue;
                }
            }
        } 
    } 
}

function eraseMarks(){
    for(var i=0; i<rentArray.length; i++){
        rentArray[i].setMap(null);
    }
}
    

//[0] = Borough, [1] = Crime Desc, [2] = Latitude, [3] = Longitude, [4] = Date
function updateTabel(){
    ref = $("Table")[0];
    var newRow, borough, crimeDesc, latitude, longitude, date;
    var i;

    for ( i = 0; i < crimes.length; i++) {
        newRow = ref.insertRow(ref.rows.length);
        borough = newRow.insertCell(0);
        crimeDesc = newRow.insertCell(1);
        latitude = newRow.insertCell(2);
        longitude = newRow.insertCell(3);
        date = newRow.insertCell(4);

        borough.innerHTML = crimes[i];
        console.log(i);
        crimeDesc.innerHTML = crimes[++i];
        console.log(i);
        latitude.innerHTML = crimes[++i];
        console.log(i);
        longitude.innerHTML = crimes[++i];
        console.log(i);
        date.innerHTML = crimes[++i];
        console.log(i);
    } 
}

$(document).ready(function(){
    $("#getDataButton").on("click", loadCrimes);
    $("#updateTableButton").on("click", updateTabel)
})