/**
 * Ajax Class.
 * Handles client/server communication over AJAX requests.
 */
export default class Ajax {

  // constructor
  constructor( method, endpoint, options ) {

    this._options = Object.assign( {
      // custom request headers object
      headers : {},
      // xhr expected response type from server
      type : 'text',
      // xhr timeout value (default: 10s)
      timeout : 10000,
      // data to be sent (string, selector, object, FormData, function)
      data : null,
      // custom handler before sending a request
      before : null,
      // progress custom handler
      progress : null,
      // error custom handler
      error : null,
      // success custom handler
      success : null,
      // complete custom handler
      complete : null,
      // ...
    }, options );

    this._method   = String( method || 'get' ).toUpperCase();
    this._endpoint = String( endpoint || '' ).trim();
    this._prefix   = /\?.*$/.test( this._endpoint ) ? '&' : '?';
    this._ctype    = '';
    this._headers  = {};
    this._complete = false;

    this._onProgress = this._onProgress.bind( this );
    this._onError    = this._onError.bind( this );
    this._onLoad     = this._onLoad.bind( this );
    this._onComplete = this._onComplete.bind( this );

    this._xhr = new XMLHttpRequest();
    this._xhr.upload.addEventListener( 'progress', this._onProgress, false );
    this._xhr.addEventListener( 'progress', this._onProgress, false );
    this._xhr.addEventListener( 'abort', this._onError, false );
    this._xhr.addEventListener( 'error', this._onError, false );
    this._xhr.addEventListener( 'timeout', this._onError, false );
    this._xhr.addEventListener( 'load', this._onLoad, false );

    this._setHeader( 'X-Requested-With', 'XMLHttpRequest' );
    this._setHeader( 'Accept', 'application/json, text/plain, text/html, */*' );
    this._applyHeaders( this._options.headers );
    this._send();
  }

  // call custom handler by name extracted from list or arguments
  _callHandler() {
    let args = [].slice.call( arguments );
    let name = args.length ? args.shift() : '';

    if ( name && typeof this._options[ name ] === 'function' ) {
      this._options[ name ].apply( this, args );
    }
  }

  // set a header to be applied to the request
  _setHeader( key, value ) {
    key   = String( key || '' ).replace( /[^\w\-]+/g, '' ).toLowerCase();
    value = String( value || '' ).trim();
    if ( key ) this._headers[ key ] = value;
  }

  // check if a header has been set
  _hasHeader( key ) {
    key = String( key || '' ).replace( /[^\w\-]+/g, '' ).toLowerCase();
    return ( Object.keys( this._headers ).indexOf( key ) !== -1 );
  }

  // apply headers from a given object
  _applyHeaders( obj ) {
    if ( typeof obj === 'object' ) {
      for ( let key in obj ) {
        if ( !obj.hasOwnProperty( key ) ) continue;
        this._setHeader( key, obj[ key ] );
      }
    }
  }

  // convert form object into FormData object
  _getFormData( form ) {
    let fdata = new FormData( form );

    if ( form instanceof HTMLFormElement ) {
      for ( let i = 0; i < form.elements.length; i++ ) {
        let elm = form.elements[ i ];

        if ( elm.name && elm.type === 'checkbox' ) {
          fdata.set( elm.name, elm.checked ? 1 : 0 );
        }
      }
    }
    return fdata;
  }

  // encode data as json string
  _jsonEncode( data ) {
    if ( typeof data === 'object' ) {
      try { let json = JSON.stringify( data ); return json; }
      catch ( e ) { return JSON.stringify( e ); }
    }
    return '{}';
  }

  // resolve data to be sent as URL query string
  _resolveQueryData( data ) {
    let obj = {}, pairs = [];
    this._ctype = 'application/x-www-form-urlencode; charset=UTF-8';

    // assume JSON string
    if ( data && typeof data === 'string' ) {
      try { obj = JSON.parse( data ); } catch ( e ) { }
      return this._resolveQueryData( obj );
    }
    // FormData object
    if ( data instanceof FormData ) {
      data.forEach( ( value, key ) => { obj[ key ] = value; } );
      return this._resolveQueryData( obj );
    }
    // form element object
    if ( data instanceof HTMLFormElement ) {
      for ( let i = 0; i < data.elements.length; i++ ) {
        let elm   = data.elements[ i ];
        let value = elm.value || '';

        if ( !elm.name || elm.type === 'file' ) continue;
        if ( elm.type === 'checkbox' ) value = elm.checked ? 1 : 0;
        obj[ elm.name ] = value;
      }
      return this._resolveQueryData( obj );
    }
    // JS object
    if ( data instanceof Object ) {
      for ( let key in data ) {
        if ( !data.hasOwnProperty( key ) || /^\d+$/.test( key ) ) continue;
        if ( /^(function|object)$/.test( typeof data[ key ] ) ) continue;
        pairs.push( encodeURIComponent( key ) + '=' + encodeURIComponent( data[ key ] ) );
      }
      return pairs.join( '&' );
    }
    // all else
    return '';
  }

  // resolve data to be sent for request body
  _resolveRequestData( data ) {
    // data is FormData object, send as is
    if ( data instanceof FormData ) {
      return data;
    }
    // data is FormElement object, convert to FormData
    if ( data instanceof HTMLFormElement ) {
      return this._getFormData( data );
    }
    // data is JS object/array, send as JSON
    if ( typeof data === 'object' ) {
      this._ctype = 'application/json; charset=UTF-8';
      return this._jsonEncode( data );
    }
    // data is a string, send as is
    if ( typeof data === 'string' ) {
      return data;
    }
    // data is a function, pass output back to this function
    if ( typeof data === 'function' ) {
      let output = data.call( this, this._xhr );
      return this._resolveRequestData( output );
    }
    // all else, send nothing
    return null;
  }

  // resolve data sent back from server based on provided responseType value
  _resolveResponseData() {
    return ( !this._options.type || this._options.type === 'text' ) ? this._xhr.responseText : this._xhr.response;
  }

  // resolve error string from a failed rersponse
  _resolveErrorText( response ) {
    let status     = this._xhr.status | 0;
    let statusText = this._xhr.statusText || 'Unknown status';

    // looks like a json response
    if ( typeof response === 'object' ) {
      if ( typeof response.error === 'string' ) return status + ': ' + response.error;
      if ( typeof response.message === 'string' ) return status + ': ' + response.message;
      if ( typeof response.info === 'string' ) return status + ': ' + response.info;
    }
    // generate a default error based on status
    if ( status == 400 ) return status + ': The request could not be understood by the server due to malformed syntax.';
    if ( status == 401 ) return status + ': You are not authorized to view the response of this request without authentication.';
    if ( status == 403 ) return status + ': The server understood the request, but is refusing to fulfill it.';
    if ( status == 404 ) return status + ': The server did not find anything matching the requested route.';
    if ( status == 405 ) return status + ': The method specified for this request is not allowed for the current requested route.';
    if ( status == 408 ) return status + ': The server did not produce a response in time for the requested route.';
    if ( status == 500 ) return status + ': The server encountered an unexpected condition which prevented it from fulfilling the request.';
    return status + ': The request could not be completed for the requested route ('+ statusText +').';
  }

  // trigger custom progress handler
  _onProgress( e ) {
    if ( !e.lengthComputable ) return;
    let percent = Math.round( ( e.loaded * 100 ) / e.total );
    this._callHandler( 'progress', this._xhr, percent );
  }

  // trigger custom error handler
  _onError( e ) {
    let response = this._resolveResponseData();
    let error    = this._resolveErrorText( response );
    this._callHandler( 'error', this._xhr, error, response );
    this._onComplete( response );
  }

  // trigger custom complete handler
  _onLoad( e ) {
    let status   = this._xhr.status | 0;
    let response = this._resolveResponseData();
    let error    = this._resolveErrorText( response );

    if ( status && status < 400 ) {
      this._callHandler( 'success', this._xhr, response );
    } else {
      this._callHandler( 'error', this._xhr, error, response );
    }
    this._onComplete( response );
  }

  // final event to be triggered after everthing else has finished
  _onComplete( response ) {
    if ( this._complete ) return;
    this._callHandler( 'complete', this._xhr, response );
    this._complete = true;
    this._xhr = null;
  }

  // send new request
  _send() {
    let data = null;

    // send data as URL query, or body, based on request method
    if ( this._method === 'GET' ) {
      let prefix = /\?.*$/.test( this._endpoint ) ? '&' : '?';
      let query  = this._resolveQueryData( this._options.data );
      this._endpoint += prefix + query;
    } else {
      data = this._resolveRequestData( this._options.data );
    }
    // open connection and apply options/headers
    this._xhr.open( this._method, this._endpoint, true );
    this._xhr.responseType = this._options.type || 'text';
    this._xhr.timeout = this._options.timeout | 0;

    // apply custom content type header if not already set
    if ( this._ctype && !this._hasHeader( 'Content-type' ) ) {
      this._setHeader( 'Content-type', this._ctype );
    }
    // apply all headers to request
    for ( let key in this._headers ) {
      if ( this._headers.hasOwnProperty( key ) ) {
        let value = this._headers[ key ];
        let words = key.split( '-' );
        words.forEach( ( word, i ) => { words[ i ] = word.charAt( 0 ).toUpperCase() + word.slice( 1 ); } );
        this._xhr.setRequestHeader( words.join( '-' ), value );
      }
    }
    // send request
    this._callHandler( 'before', this._xhr );
    this._xhr.send( data );
  }
};
