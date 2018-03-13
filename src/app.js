/**
 * App scripts
 */
import Ajax from './ajax';

// page elements
const ajaxForm = document.querySelector( '#ajaxform' );
const progressBar = document.querySelector( '#progressbar' );
const statusBox = document.querySelector( '#status' );
const headersBox = document.querySelector( '#headers' );
const errorBox = document.querySelector( '#error' );
const dataBox = document.querySelector( '#output' );

// reset output boxes and progress
function resetBoxes() {
  progressBar.style.width = '0%';
  statusBox.value = '';
  headersBox.value = '';
  errorBox.value = '';
  dataBox.value = '';
};

// setup custom forms used to add key/val pairs used as headers or data params
function setupPairForms() {
  let pairs = document.querySelectorAll( '[data-pairs]' );

  for ( let i = 0; i < pairs.length; ++i ) {
    let elm    = pairs[ i ];
    let inputs = elm.querySelectorAll( 'input' );
    let btn    = elm.querySelector( 'button' );
    let list   = document.querySelector( elm.getAttribute( 'data-pairs' ) );

    btn.addEventListener( 'click', e => {
      let key = inputs[0].value;
      let val = inputs[1].value;
      if ( !key ) return alert( 'Please provide a name for this entry.' );

      let itm = document.createElement( 'li' );
      itm.setAttribute( 'data-key', key );
      itm.setAttribute( 'data-value', val );
      itm.innerHTML = '<span>'+ key +'&nbsp;:&nbsp;'+ val +'&nbsp;&nbsp;&nbsp;&nbsp;</span>';

      let a = document.createElement( 'a' );
      a.addEventListener( 'click', function( e ) { e.preventDefault(); itm.parentNode.removeChild( itm ); } );
      a.setAttribute( 'href', '#' );
      a.innerHTML = '[delete]';

      itm.appendChild( a );
      list.appendChild( itm );

      inputs[0].value = '';
      inputs[1].value = '';
    });
  }
};

// get pairs data from list
function getPairData( listId ) {
  let list = document.querySelector( listId );
  let data = {};

  if ( list ) {
    for ( let i = 0; i < list.children.length; i++ ) {
      let itm = list.children[ i ];
      let key = itm.getAttribute( 'data-key' );
      let val = itm.getAttribute( 'data-value' );
      data[ key ] = val;
    }
  }
  return data;
};

// when the form is reset
ajaxForm.addEventListener( 'reset', function( e ) {
  e.preventDefault();
  resetBoxes();
});

// when the form is submitted
ajaxForm.addEventListener( 'submit', function( e ) {
  e.preventDefault();
  resetBoxes();

  // default headers and data
  let headers = getPairData( '#headers-data' );
  let params  = getPairData( '#params-data' );
  let data    = null;

  // params will be added to URL if sending a GET request
  if ( this._method.value === 'GET' ) {
    data = params;
  }
  else {
    // sending params as form-data
    if ( this._ctype.value === 'formdata' ) {
      data = new FormData();
      for ( let name in headers ) if ( /content\-type/gi.test( name ) ) delete headers[ name ];
      for ( let key in params ) data.append( key, params[ key ] );
      for ( let i = 0; i < this._files.files.length; i++ ) data.append( 'files[]', this._files.files[ i ] );
    }
    // sending params as url-encoded string
    if ( this._ctype.value === 'urlencoded' ) {
      let pairs = [];
      for ( let key in params ) pairs.push( encodeURIComponent( key ) +'='+ encodeURIComponent( params[ key ] ) );
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      data = pairs.join( '&' );
    }
    // sending params as json string
    if ( this._ctype.value === 'json' ) {
      headers['Content-Type'] = 'application/json';
      data = JSON.stringify( params );
    }
  }

  // send the ajax request
  new Ajax( this._method.value, this._endpoint.value, {

    type: this._type.value,
    headers: headers,
    data: data,

    before: function( xhr ) {
      // console.log( 'onBefore', xhr );
      this._setHeader( 'Content-Type', 'application/json' );
    },
    error: function( xhr, error, response ) {
      errorBox.value = error;
    },
    progress: function( xhr, percent ) {
      progressBar.style.width = percent + '%';
    },
    success: function( xhr, response ) {
      // console.log( response );
    },
    complete: function( xhr, response ) {
      statusBox.value = xhr.status;
      headersBox.value = xhr.getAllResponseHeaders();
      dataBox.value = response;
    },
  });

  // ...
});

// init
setupPairForms();
resetBoxes();

