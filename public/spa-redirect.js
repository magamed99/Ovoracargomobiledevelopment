(function() {
  var redirect = sessionStorage.getItem('__spa_redirect');
  if (redirect) {
    sessionStorage.removeItem('__spa_redirect');
    history.replaceState(null, null, redirect);
  }
})();
