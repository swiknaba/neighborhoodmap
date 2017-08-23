// Model: holds all the data, no logic
// ViewModel: holds all the logic
// View: HTML/CSS -> use "data-bind" to connect to Model/ViewModel
// Note to my self:
// The View actually just shows an up-to-date version of the ViewModel,
// which tells how data from the Model shall be presented. If data or the
// behavior of the data (ViewModel) change, the View is updated

// viewModel as function or as object literal?
// https://stackoverflow.com/questions/9589419/difference-between-knockout-view-models-declared-as-object-literals-vs-functions

// ============================================================================
// function to initialize google map
// https://developers.google.com/maps/documentation/javascript/tutorial
var map;
  // there are several zoom levels:
  // 1: world, 5: continent, 10: city, 15: streets, 20: buildings
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 52.588862, lng: 13.278735},
        zoom: 15,
        mapTypeControl: false
    });
}
// ============================================================================


// example-data, all in Berlin, district Alt-Tegel
modelData = [
    {
        name: "Bergmann Pizza",
        category: "food",
        lat: 52.589969,
        lng: 13.281440
    },
    {
        name: "L'Angolo del Gelato",
        category: "food",
        lat: 52.589428,
        lng: 13.281779
    },
    {
        name: "Alte Spree Apotheke",
        category: "other",
        lat: 52.592183,
        lng: 13.282605
    },
    {
        name: "Borsighallen",
        category: "shopping",
        lat: 52.584968,
        lng: 13.286043
    },
    {
        name: "Lucky Chinese",
        category: "food",
        lat: 52.588512,
        lng: 13.278548
    },
    {
        name: "R\u00fcan-Thai",
        category: "food",
        lat: 52.588118,
        lng: 13.286179
    },
    {
        name: "Schloss-Apotheke Tegel",
        category: "other",
        lat: 52.588731,
        lng: 13.284178
    },
    {
        name: "Intersport Voswinkel",
        category: "shopping",
        lat: 52.584321,
        lng:  13.286233
    },
    {
        name: "Holi",
        category: "food",
        lat: 52.586944,
        lng: 13.281101
    }
];


// foursquare credentials
// could be stored server side, but actually can be read from get-header, ...
var clientID = "15S4QDKN4EJG4MNX2XPXUSLBWB3ADMHJYJY5PA2FOZNPHLTK";
var clientSecret = "PPCH5JDLNLMPTFBWFBEUO4GOO3B4HIVNZ0IRYJMLRNGTWVHK&v=20170801";

// we want only one info-bubble above a marker to be shown at a time to not clutter the view
// therefore declare it globally, according to stackoverflow: https://stackoverflow.com/questions/19067027/close-all-info-windows-google-maps-api-v3
var infowindow;

// info-window popping up if you click a marker on the map
function bindInfoWindow(marker, map, infowindow, markerAnimation) {
    marker.addListener('click', function() {
        if (infowindow) {
            infowindow.close();
        }
        infowindow.open(map, marker);
        markerAnimation();
    });
}
// info-window popping up if you click a search result
function clickInfoWindow(marker, map, infowindow, markerAnimation) {
    if (infowindow) {
        infowindow.close();
    }
    infowindow.open(map, marker);
    markerAnimation();
}

// the model, which defines information and functions on our model-data
// note the "this" as second argument of the computed-function, so that you
// can use "this" inside the function with it refering to the outer-this
var model = function(modelData) {
    var self = this;
    this.name = modelData.name;
    this.category = modelData.category;  // one of three categories (food, shopping, other)
    this.lat = modelData.lat;
    this.lng = modelData.lng;
    this.street = '';
    this.city = '';
    this.openingTimes = '';  // Contains the opening hours of this point of interest
    this.rating = '';  // Numerical rating of the venue (0 through 10)
    this.cat = '';  // more precise category (e.g. Pizza Place)
    this.iconLink = '';  // google maps special icon
    this.visible = ko.observable();
    this.contentString = [];

    // API endpoint of forsquare, check out: https://developer.foursquare.com/docs/venues/search
    // OAuth doesn't allow CORS, so one can't directly fetch location info via the forsquareID, see: https://developer.foursquare.com/docs/venues/venues
    // since we want to only use frontend for this project
    var fsquareURL =  'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20170804' + '&query=' + this.name + '&limit=1';

    // ajax call to get information on point of interest
    // response: https://developer.foursquare.com/docs/responses/venue
    $.ajax({url: fsquareURL})
        .done(function(data) {
            fsquare = data.response.venues[0];
            console.log("getJSON success: " + self.name);
            self.street = fsquare.location.address;
            self.city = fsquare.location.city;
            self.openingTimes = fsquare.hours;
            self.rating = fsquare.rating;
            self.cat = fsquare.categories[0].shortName;
            self.URL = "https://foursquare.com/v/" + fsquare.id;
            // some values might be undefined if not provided, re-set those to empty string
            if (typeof self.street == 'undefined') { self.street = '<i>unknown</i>'; }
            if (typeof self.city == 'undefined') { self.city = ''; }
            if (typeof self.openingTimes == 'undefined') { self.openingTimes = '<i>not available..</i>'; }
            if (typeof self.rating == 'undefined') { self.rating = '<i>not yet rated...</i>'; }
            if (typeof self.cat == 'undefined') { self.cat = ''; }
            // generate info-windows for each marker, following the documentation
            // https://developers.google.com/maps/documentation/javascript/infowindows
            // with improved string-concenation (just for fun)
            self.contentString.push('<div class="contentString">',
                                  '<p><b>', self.name, '</b>',
                                  '<br><i>', self.cat, '</i>',
                                  '<a target="_blank" href="', self.URL, '"><img border="0" src="img/foursquare.png" alt="foursquare logo" height="30" style="display: inline; float: right;"></a>',
                                  '</p>',
                                  '<p>', self.street, '<br>', self.city, '</p>',
                                  '<p>Opening hours:<br>', self.openingTimes, '</p>',
                                  '<p>User rating (0-10): ', self.rating, '</p>',
                               '</div>');
            self.contentString = self.contentString.join('');
            self.infowindow = new google.maps.InfoWindow({
                content: self.contentString
            });
            // info window which pops up above map-marker
            bindInfoWindow(self.marker, map, self.infowindow, self.markerAnimation);
        })
        .fail(function() {
            alert("Sorry, we are having problems fetching information from foursquare. Pleasy try refreshing your browswer page.");
        });

    this.markerAnimation = function() {
        if (self.marker.getAnimation() !== null) {
            self.marker.setAnimation(null);
        } else {
            self.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                self.marker.setAnimation(null);
            }, 750);
        }
    };

    // if you click a search result, the info-bubble above the corresponding
    // marker shall be opened
    this.showInfo = function() {
        clickInfoWindow(self.marker, map, self.infowindow, self.markerAnimation);
    };

    // generate map-markers
    // custom icons for markers: https://sites.google.com/site/gmapsdevelopment/
    switch (self.category) {
        case "food":
            self.iconLink = 'https://maps.google.com/mapfiles//kml/pal2/icon32.png';
            break;
        case "shopping":
            self.iconLink = 'https://maps.google.com/mapfiles//kml/pal3/icon26.png';
            break;
        case "other":
            self.iconLink = 'https://maps.google.com/mapfiles//kml/pal3/icon53.png';
            break;
    }
    this.marker = new google.maps.Marker({
        position: {lat: this.lat, lng: this.lng},
        title: this.name,  // appears as tooltip
        animation: google.maps.Animation.DROP,
        icon: self.iconLink
    });
    // add marker to the map (necessary if not called within initMap): this.marker.setMap(map);
    // Udactiy: Map (...) displays the filtered subset of location markers when a filter is applied.
    this.showMarker = ko.computed(function() {
        if (self.visible() === true) {
            self.marker.setMap(map);
        } else {
            self.marker.setMap(null);
        }
    });
};


function viewModel() {
    var self = this;  // use self inside the viewModel for clear distinguishing
    this.Query = ko.observable('');
    this.itemlist = ko.observableArray([]);

    // button to show/hide search when mobile phone used for viewing, because search results could take up
    // too much space
    this.showOrHide = ko.observable('hide');
    this.showHideResults = ko.observable(true);
    this.showHideButton = function(showOrHide) {
        return (function(){
            var visibleSearch;
            if (this.showOrHide() == 'hide') {
                this.showHideResults(false);
                this.showOrHide('show');
            } else {
                this.showHideResults(true);
                this.showOrHide('hide');
            }
        });
    };

    // init google maps
    try {
        initMap();
    } catch(error) {
        alert("Sorry, we are having problems with loading google maps. Please try refreshing your browser page.");
    }

    // populate the itemlist with all items from our model-data
    modelData.forEach(function(item) {
        self.itemlist.push(new model(item));
    });

    // generate list which results from search-input
    this.searchResults = ko.computed(function() {
        var filter = self.Query().toLowerCase();
        return ko.utils.arrayFilter(self.itemlist(), function(item) {
            var result = (item.name.toLowerCase().search(filter) >= 0);
            // show search results when typing in case they have been hided before
            self.showHideResults(true);
            self.showOrHide('hide');
            item.visible(result);
            return result;
        });
    });

}


// error handling for google maps
function googleError() {
    alert("Unfortunately we couldn't load google maps. Please try to refresh your browser!");
}

// "Uncaught ReferenceError: google is not defined" @ "this.marker = new google.maps.Marker({.." inside
// "var model = function" because that used to run bevore the map is loaded, so we have to run all application code
// after the map is loaded
function runApp() {
    ko.applyBindings(new viewModel());
}
