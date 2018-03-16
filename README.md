[twitter]: http://twitter.com/raintek_
[demo]: https://rainner.github.io/ajax/
[mit]: http://www.opensource.org/licenses/mit-license.php

# Ajax Client

This is a lightweight Ajax client class built on top of the JS XMLHttpRequest object that works similar to the jQuery.ajax() function, focused on providing an easy way to make Ajax requests passing different types of data and making it easy to handle the different states of the request with custom event handlers, including multipart form upload progress.

[Check out the demo][demo]

### Install

```bash
npm install rainner/ajax
```

### Usage
Import as a module and bundle using your preferred bundling method (Webpack, Gulp, etc)...

```js
// import class
import Ajax from 'ajax';

// send JSON data, get JSON response from endpoint
// Syntax: Ajax( method, url, options )

new Ajax( 'POST', '/endpoint', {
    // set some custom headers
    haeders: { "X-Foobar": "my-custom-header" },
    // set data to send
    data: { param1: "value1", param2: "value2" },
    // set responseType to be parsed
    type: 'json',
    // just before xhr.send()
    before: function( xhr ) {},
    // request or response error handler
    error: function( xhr, error, response ) {},
    // upload progress handler
    progress: function( xhr, percent ) {},
    // success response handler
    success: function( xhr, response ) {},
    // complete handler
    complete: function( xhr, response ) {},
});
```

### Data value

The `data` property used to send data along with the request accepts different types. For `GET` requests, the `data` value is converted to URL-encoded string if possible and appended to the endpoint URL to be sent as query arguments. For everything else...

* `String` will be sent as-is, so you need to specify the `Content-type` header for it.
* `Object` will be stringified and sent as JSON string with content-type set.
* `FormData` will be sent as-is with `multipart/form-data` content-type set.
* `HTMLFormElement` will be converted to `FormData` and sent as above.
* `Function` will be executed and the output is re-checked for a type listed above.

### Headers

The `headers` property accepts a named object with name/value pairs to set as request headers. Names are NOT case-sensitive, meaning same names will get overwritten. Custom headers are applied just before XHR.send(), which can be used to overwrite any default headers aready added.

### Response data

The `response` param passed to custom handlers depend on the `type` option used for the request. For more information about the `responseType` option, see: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType

### Author

Rainner Lins: [@raintek_][twitter]

### License

Licensed under [MIT][mit].

