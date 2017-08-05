// if deployed on a server, this should be put into server-side code
// e.g. like for the previous udacity project "catalog"


// https://www.yelp.com/developers/documentation/v3/authentication
// response body:
// {
//   "access_token": "ACCESS_TOKEN",
//   "token_type": "bearer",
//   "expires_in": 15552000
// }

// check if token is still valid:
if (typeof localStorage['token_expiration'] != 'undefined') {
    var now = new Date();
    var expiryDate = new Date(localStorage['token_expiration']);
    if (expiryDate.getTime(expiryDate) < now.getTime()) {
        get_yelp_token();
    }
} else {
    get_yelp_token();
}

function get_yelp_token() {
    console.log("requesting a new token");
    var tokenURL = "https://api.yelp.com/oauth2/token";

    var data = {
        'grant_type': 'client_credentials',
        'client_id': 'TZ53SO335VUAeUt14E0eGQ',
        'client_secret': 'mfM2XOraxM0KhCsrXjBKXnuCAGM208cTYPxq7jXr1Dc2XqWHt4amItP9Z9IdyhBD'
    };

    $.post(tokenURL, data, function(response) {
        console.log(response.access_token);
        token = response.access_token;
        localStorage['token'] = response.access_token;
        var expiryDate = new Date();
        var expiryDays = response.expires_in/86400;  // get days from seconds
        localStorage['token_expiration'] = expiryDate.setDate(expiryDate.getDate() + expiryDays);
    }, 'jsonp');
}



// TOKEN:
// var token = "I9lRkwU6FrkWsEpXrVDugkUdW7e1yBmyFAUfOQ31uUgq_opceM6RTlq4eE69ACFJ9BC6WvkYP1E1G-ru9IizvF4EbVcgdgwxgciK0mLao6zMUnFZzkpyaWbIyDaDWXYx";



// https://stackoverflow.com/questions/28547288/no-access-control-allow-origin-header-is-present-on-the-requested-resource-err
