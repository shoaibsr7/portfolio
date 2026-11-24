// Builds Cognito hosted-UI links that send users back to whichever host they're on
// (the CloudFront URL or shoaibsr.com). Both are allowed in the Cognito app client.
window.PizzaAuth = (function () {
  var DOMAIN = 'https://shoaibsr-auth.auth.us-east-1.amazoncognito.com';
  var CLIENT_ID = '47bt6f0udrpf1vgfupepcpeh0j';
  var base = location.origin + '/projects/pizza-bot/';
  return {
    loginUrl: function () {
      return DOMAIN + '/login?client_id=' + CLIENT_ID +
        '&response_type=code&scope=email+openid&redirect_uri=' +
        encodeURIComponent(base + 'logged_in.html');
    },
    logoutUrl: function () {
      return DOMAIN + '/logout?client_id=' + CLIENT_ID +
        '&logout_uri=' + encodeURIComponent(base + 'logged_out.html');
    }
  };
})();
