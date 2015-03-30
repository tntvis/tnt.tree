(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof tnt === "undefined") {
    module.exports = tnt = {};
}
tnt.tree = require("./index.js");
tnt.tree.node = require("tnt.tree.node");
tnt.tree.parse_newick = require("tnt.newick").parse_newick;
tnt.tree.parse_nhx = require("tnt.newick").parse_nhx;


},{"./index.js":2,"tnt.newick":8,"tnt.tree.node":10}],2:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
module.exports = tree = require("./src/index.js");
var eventsystem = require("biojs-events");
eventsystem.mixin(tree);
//tnt.utils = require("tnt.utils");
//tnt.tooltip = require("tnt.tooltip");
//tnt.tree = require("./src/index.js");


},{"./src/index.js":17,"biojs-events":3}],3:[function(require,module,exports){
var events = require("backbone-events-standalone");

events.onAll = function(callback,context){
  this.on("all", callback,context);
  return this;
};

// Mixin utility
events.oldMixin = events.mixin;
events.mixin = function(proto) {
  events.oldMixin(proto);
  // add custom onAll
  var exports = ['onAll'];
  for(var i=0; i < exports.length;i++){
    var name = exports[i];
    proto[name] = this[name];
  }
  return proto;
};

module.exports = events;

},{"backbone-events-standalone":5}],4:[function(require,module,exports){
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {
  var root = this,
      breaker = {},
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {
    return {
      keys: Object.keys || function (obj) {
        if (typeof obj !== "object" && typeof obj !== "function" || obj === null) {
          throw new TypeError("keys() called on a non-object");
        }
        var key, keys = [];
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            keys[keys.length] = key;
          }
        }
        return keys;
      },

      uniqueId: function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              if (iterator.call(context, obj[key], key, obj) === breaker) return;
            }
          }
        }
      },

      once: function(func) {
        var ran = false, memo;
        return function() {
          if (ran) return memo;
          ran = true;
          memo = func.apply(this, arguments);
          func = null;
          return memo;
        };
      }
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof define === "function") {
    define(function() {
      return Events;
    });
  } else if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],5:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":4}],6:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":7}],7:[function(require,module,exports){
var api = function (who) {

    var _methods = function () {
	var m = [];

	m.add_batch = function (obj) {
	    m.unshift(obj);
	};

	m.update = function (method, value) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			m[i][p] = value;
			return true;
		    }
		}
	    }
	    return false;
	};

	m.add = function (method, value) {
	    if (m.update (method, value) ) {
	    } else {
		var reg = {};
		reg[method] = value;
		m.add_batch (reg);
	    }
	};

	m.get = function (method) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			return m[i][p];
		    }
		}
	    }
	};

	return m;
    };

    var methods    = _methods();
    var api = function () {};

    api.check = function (method, check, msg) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.check(method[i], check, msg);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.check(check, msg);
	} else {
	    who[method].check(check, msg);
	}
	return api;
    };

    api.transform = function (method, cbak) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.transform (method[i], cbak);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.transform (cbak);
	} else {
	    who[method].transform(cbak);
	}
	return api;
    };

    var attach_method = function (method, opts) {
	var checks = [];
	var transforms = [];

	var getter = opts.on_getter || function () {
	    return methods.get(method);
	};

	var setter = opts.on_setter || function (x) {
	    for (var i=0; i<transforms.length; i++) {
		x = transforms[i](x);
	    }

	    for (var j=0; j<checks.length; j++) {
		if (!checks[j].check(x)) {
		    var msg = checks[j].msg || 
			("Value " + x + " doesn't seem to be valid for this method");
		    throw (msg);
		}
	    }
	    methods.add(method, x);
	};

	var new_method = function (new_val) {
	    if (!arguments.length) {
		return getter();
	    }
	    setter(new_val);
	    return who; // Return this?
	};
	new_method.check = function (cbak, msg) {
	    if (!arguments.length) {
		return checks;
	    }
	    checks.push ({check : cbak,
			  msg   : msg});
	    return this;
	};
	new_method.transform = function (cbak) {
	    if (!arguments.length) {
		return transforms;
	    }
	    transforms.push(cbak);
	    return this;
	};

	who[method] = new_method;
    };

    var getset = function (param, opts) {
	if (typeof (param) === 'object') {
	    methods.add_batch (param);
	    for (var p in param) {
		attach_method (p, opts);
	    }
	} else {
	    methods.add (param, opts.default_value);
	    attach_method (param, opts);
	}
    };

    api.getset = function (param, def) {
	getset(param, {default_value : def});

	return api;
    };

    api.get = function (param, def) {
	var on_setter = function () {
	    throw ("Method defined only as a getter (you are trying to use it as a setter");
	};

	getset(param, {default_value : def,
		       on_setter : on_setter}
	      );

	return api;
    };

    api.set = function (param, def) {
	var on_getter = function () {
	    throw ("Method defined only as a setter (you are trying to use it as a getter");
	};

	getset(param, {default_value : def,
		       on_getter : on_getter}
	      );

	return api;
    };

    api.method = function (name, cbak) {
	if (typeof (name) === 'object') {
	    for (var p in name) {
		who[p] = name[p];
	    }
	} else {
	    who[name] = cbak;
	}
	return api;
    };

    return api;
    
};

module.exports = exports = api;
},{}],8:[function(require,module,exports){
module.exports = require("./src/newick.js");

},{"./src/newick.js":9}],9:[function(require,module,exports){
/**
 * Newick and nhx formats parser in JavaScript.
 *
 * Copyright (c) Jason Davies 2010 and Miguel Pignatelli
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Example tree (from http://en.wikipedia.org/wiki/Newick_format):
 *
 * +--0.1--A
 * F-----0.2-----B            +-------0.3----C
 * +------------------0.5-----E
 *                            +---------0.4------D
 *
 * Newick format:
 * (A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;
 *
 * Converted to JSON:
 * {
 *   name: "F",
 *   branchset: [
 *     {name: "A", length: 0.1},
 *     {name: "B", length: 0.2},
 *     {
 *       name: "E",
 *       length: 0.5,
 *       branchset: [
 *         {name: "C", length: 0.3},
 *         {name: "D", length: 0.4}
 *       ]
 *     }
 *   ]
 * }
 *
 * Converted to JSON, but with no names or lengths:
 * {
 *   branchset: [
 *     {}, {}, {
 *       branchset: [{}, {}]
 *     }
 *   ]
 * }
 */

module.exports = {
    parse_newick : function(s) {
	var ancestors = [];
	var tree = {};
	var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
	var subtree;
	for (var i=0; i<tokens.length; i++) {
	    var token = tokens[i];
	    switch (token) {
            case '(': // new branchset
		subtree = {};
		tree.children = [subtree];
		ancestors.push(tree);
		tree = subtree;
		break;
            case ',': // another branch
		subtree = {};
		ancestors[ancestors.length-1].children.push(subtree);
		tree = subtree;
		break;
            case ')': // optional name next
		tree = ancestors.pop();
		break;
            case ':': // optional length next
		break;
            default:
		var x = tokens[i-1];
		if (x == ')' || x == '(' || x == ',') {
		    tree.name = token;
		} else if (x == ':') {
		    tree.branch_length = parseFloat(token);
		}
	    }
	}
	return tree;
    },

    parse_nhx : function (s) {
	var ancestors = [];
	var tree = {};
	var subtree;

	var tokens = s.split( /\s*(;|\(|\)|\[|\]|,|:|=)\s*/ );
	for (var i=0; i<tokens.length; i++) {
	    var token = tokens[i];
	    switch (token) {
            case '(': // new children
		subtree = {};
		tree.children = [subtree];
		ancestors.push(tree);
		tree = subtree;
		break;
            case ',': // another branch
		subtree = {};
		ancestors[ancestors.length-1].children.push(subtree);
		tree = subtree;
		break;
            case ')': // optional name next
		tree = ancestors.pop();
		break;
            case ':': // optional length next
		break;
            default:
		var x = tokens[i-1];
		if (x == ')' || x == '(' || x == ',') {
		    tree.name = token;
		}
		else if (x == ':') {
		    var test_type = typeof token;
		    if(!isNaN(token)){
			tree.branch_length = parseFloat(token);
		    }
		}
		else if (x == '='){
		    var x2 = tokens[i-2];
		    switch(x2){
		    case 'D':
			tree.duplication = token;
			break;
		    case 'G':
			tree.gene_id = token;
			break;
		    case 'T':
			tree.taxon_id = token;
			break;
		    default :
			tree[tokens[i-2]] = token;
		    }
		}
		else {
		    var test;

		}
	    }
	}
	return tree;
    }
};

},{}],10:[function(require,module,exports){
module.exports = require("./src/node.js");

},{"./src/node.js":15}],11:[function(require,module,exports){
module.exports = require("./src/index.js");

},{"./src/index.js":12}],12:[function(require,module,exports){
// require('fs').readdirSync(__dirname + '/').forEach(function(file) {
//     if (file.match(/.+\.js/g) !== null && file !== __filename) {
// 	var name = file.replace('.js', '');
// 	module.exports[name] = require('./' + file);
//     }
// });

// Same as
var utils = require("./utils.js");
utils.reduce = require("./reduce.js");
module.exports = exports = utils;

},{"./reduce.js":13,"./utils.js":14}],13:[function(require,module,exports){
var reduce = function () {
    var smooth = 5;
    var value = 'val';
    var redundant = function (a, b) {
	if (a < b) {
	    return ((b-a) <= (b * 0.2));
	}
	return ((a-b) <= (a * 0.2));
    };
    var perform_reduce = function (arr) {return arr;};

    var reduce = function (arr) {
	if (!arr.length) {
	    return arr;
	}
	var smoothed = perform_smooth(arr);
	var reduced  = perform_reduce(smoothed);
	return reduced;
    };

    var median = function (v, arr) {
	arr.sort(function (a, b) {
	    return a[value] - b[value];
	});
	if (arr.length % 2) {
	    v[value] = arr[~~(arr.length / 2)][value];	    
	} else {
	    var n = ~~(arr.length / 2) - 1;
	    v[value] = (arr[n][value] + arr[n+1][value]) / 2;
	}

	return v;
    };

    var clone = function (source) {
	var target = {};
	for (var prop in source) {
	    if (source.hasOwnProperty(prop)) {
		target[prop] = source[prop];
	    }
	}
	return target;
    };

    var perform_smooth = function (arr) {
	if (smooth === 0) { // no smooth
	    return arr;
	}
	var smooth_arr = [];
	for (var i=0; i<arr.length; i++) {
	    var low = (i < smooth) ? 0 : (i - smooth);
	    var high = (i > (arr.length - smooth)) ? arr.length : (i + smooth);
	    smooth_arr[i] = median(clone(arr[i]), arr.slice(low,high+1));
	}
	return smooth_arr;
    };

    reduce.reducer = function (cbak) {
	if (!arguments.length) {
	    return perform_reduce;
	}
	perform_reduce = cbak;
	return reduce;
    };

    reduce.redundant = function (cbak) {
	if (!arguments.length) {
	    return redundant;
	}
	redundant = cbak;
	return reduce;
    };

    reduce.value = function (val) {
	if (!arguments.length) {
	    return value;
	}
	value = val;
	return reduce;
    };

    reduce.smooth = function (val) {
	if (!arguments.length) {
	    return smooth;
	}
	smooth = val;
	return reduce;
    };

    return reduce;
};

var block = function () {
    var red = reduce()
	.value('start');

    var value2 = 'end';

    var join = function (obj1, obj2) {
        return {
            'object' : {
                'start' : obj1.object[red.value()],
                'end'   : obj2[value2]
            },
            'value'  : obj2[value2]
        };
    };

    // var join = function (obj1, obj2) { return obj1 };

    red.reducer( function (arr) {
	var value = red.value();
	var redundant = red.redundant();
	var reduced_arr = [];
	var curr = {
	    'object' : arr[0],
	    'value'  : arr[0][value2]
	};
	for (var i=1; i<arr.length; i++) {
	    if (redundant (arr[i][value], curr.value)) {
		curr = join(curr, arr[i]);
		continue;
	    }
	    reduced_arr.push (curr.object);
	    curr.object = arr[i];
	    curr.value = arr[i].end;
	}
	reduced_arr.push(curr.object);

	// reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    });

    reduce.join = function (cbak) {
	if (!arguments.length) {
	    return join;
	}
	join = cbak;
	return red;
    };

    reduce.value2 = function (field) {
	if (!arguments.length) {
	    return value2;
	}
	value2 = field;
	return red;
    };

    return red;
};

var line = function () {
    var red = reduce();

    red.reducer ( function (arr) {
	var redundant = red.redundant();
	var value = red.value();
	var reduced_arr = [];
	var curr = arr[0];
	for (var i=1; i<arr.length-1; i++) {
	    if (redundant (arr[i][value], curr[value])) {
		continue;
	    }
	    reduced_arr.push (curr);
	    curr = arr[i];
	}
	reduced_arr.push(curr);
	reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    });

    return red;

};

module.exports = reduce;
module.exports.line = line;
module.exports.block = block;


},{}],14:[function(require,module,exports){

module.exports = {
    iterator : function(init_val) {
	var i = init_val || 0;
	var iter = function () {
	    return i++;
	};
	return iter;
    },

    script_path : function (script_name) { // script_name is the filename
	var script_scaped = script_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	var script_re = new RegExp(script_scaped + '$');
	var script_re_sub = new RegExp('(.*)' + script_scaped + '$');

	// TODO: This requires phantom.js or a similar headless webkit to work (document)
	var scripts = document.getElementsByTagName('script');
	var path = "";  // Default to current path
	if(scripts !== undefined) {
            for(var i in scripts) {
		if(scripts[i].src && scripts[i].src.match(script_re)) {
                    return scripts[i].src.replace(script_re_sub, '$1');
		}
            }
	}
	return path;
    },

    defer_cancel : function (cbak, time) {
	var tick;

	var defer_cancel = function () {
	    clearTimeout(tick);
	    tick = setTimeout(cbak, time);
	};

	return defer_cancel;
    }
};

},{}],15:[function(require,module,exports){
var apijs = require("tnt.api");
var iterator = require("tnt.utils").iterator;

var tnt_node = function (data) {
//tnt.tree.node = function (data) {
    "use strict";

    var node = function () {
    };

    var api = apijs (node);

    // API
//     node.nodes = function() {
// 	if (cluster === undefined) {
// 	    cluster = d3.layout.cluster()
// 	    // TODO: length and children should be exposed in the API
// 	    // i.e. the user should be able to change this defaults via the API
// 	    // children is the defaults for parse_newick, but maybe we should change that
// 	    // or at least not assume this is always the case for the data provided
// 		.value(function(d) {return d.length})
// 		.children(function(d) {return d.children});
// 	}
// 	nodes = cluster.nodes(data);
// 	return nodes;
//     };

    var apply_to_data = function (data, cbak) {
	cbak(data);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		apply_to_data(data.children[i], cbak);
	    }
	}
    };

    var create_ids = function () {
	var i = iterator(1);
	// We can't use apply because apply creates new trees on every node
	// We should use the direct data instead
	apply_to_data (data, function (d) {
	    if (d._id === undefined) {
		d._id = i();
		// TODO: Not sure _inSubTree is strictly necessary
		// d._inSubTree = {prev:true, curr:true};
	    }
	});
    };

    var link_parents = function (data) {
	if (data === undefined) {
	    return;
	}
	if (data.children === undefined) {
	    return;
	}
	for (var i=0; i<data.children.length; i++) {
	    // _parent?
	    data.children[i]._parent = data;
	    link_parents(data.children[i]);
	}
    };

    var compute_root_dists = function (data) {
	// console.log(data);
	apply_to_data (data, function (d) {
	    var l;
	    if (d._parent === undefined) {
		d._root_dist = 0;
	    } else {
		var l = 0;
		if (d.branch_length) {
		    l = d.branch_length
		}
		d._root_dist = l + d._parent._root_dist;
	    }
	});
    };

    // TODO: data can't be rewritten used the api yet. We need finalizers
    node.data = function(new_data) {
	if (!arguments.length) {
	    return data
	}
	data = new_data;
	create_ids();
	link_parents(data);
	compute_root_dists(data);
	return node;
    };
    // We bind the data that has been passed
    node.data(data);

    api.method ('find_node', function (cbak, deep) {
	if (cbak(node)) {
	    return node;
	}

	if (data.children !== undefined) {
	    for (var j=0; j<data.children.length; j++) {
		var found = tnt_node(data.children[j]).find_node(cbak);
		if (found) {
		    return found;
		}
	    }
	}

	if (deep && (data._children !== undefined)) {
	    for (var i=0; i<data._children.length; i++) {
		tnt_node(data._children[i]).find_node(cbak)
		var found = tnt_node(data.children[j]).find_node(cbak);
		if (found) {
		    return found;
		}
	    }
	}
    });

    api.method ('find_node_by_name', function(name) {
	return node.find_node (function (node) {
	    return node.node_name() === name
	});
    });

    api.method ('toggle', function() {
	if (data) {
	    if (data.children) { // Uncollapsed -> collapse
		var hidden = 0;
		node.apply (function (n) {
		    var hidden_here = n.n_hidden() || 0;
		    hidden += (n.n_hidden() || 0) + 1;
		});
		node.n_hidden (hidden-1);
		data._children = data.children;
		data.children = undefined;
	    } else {             // Collapsed -> uncollapse
		node.n_hidden(0);
		data.children = data._children;
		data._children = undefined;
	    }
	}
    });

    api.method ('is_collapsed', function () {
	return (data._children !== undefined && data.children === undefined);
    });

    var has_ancestor = function(n, ancestor) {
	// It is better to work at the data level
	n = n.data();
	ancestor = ancestor.data();
	if (n._parent === undefined) {
	    return false
	}
	n = n._parent
	for (;;) {
	    if (n === undefined) {
		return false;
	    }
	    if (n === ancestor) {
		return true;
	    }
	    n = n._parent;
	}
    };

    // This is the easiest way to calculate the LCA I can think of. But it is very inefficient too.
    // It is working fine by now, but in case it needs to be more performant we can implement the LCA
    // algorithm explained here:
    // http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=lowestCommonAncestor
    api.method ('lca', function (nodes) {
	if (nodes.length === 1) {
	    return nodes[0];
	}
	var lca_node = nodes[0];
	for (var i = 1; i<nodes.length; i++) {
	    lca_node = _lca(lca_node, nodes[i]);
	}
	return lca_node;
	// return tnt_node(lca_node);
    });

    var _lca = function(node1, node2) {
	if (node1.data() === node2.data()) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return _lca(node1, node2.parent());
    };

    api.method('n_hidden', function (val) {
	if (!arguments.length) {
	    return node.property('_hidden');
	}
	node.property('_hidden', val);
	return node
    });

    api.method ('get_all_nodes', function () {
	var nodes = [];
	node.apply(function (n) {
	    nodes.push(n);
	});
	return nodes;
    });

    api.method ('get_all_leaves', function () {
	var leaves = [];
	node.apply(function (n) {
	    if (n.is_leaf()) {
		leaves.push(n);
	    }
	});
	return leaves;
    });

    api.method ('upstream', function(cbak) {
	cbak(node);
	var parent = node.parent();
	if (parent !== undefined) {
	    parent.upstream(cbak);
	}
//	tnt_node(parent).upstream(cbak);
// 	node.upstream(node._parent, cbak);
    });

    api.method ('subtree', function(nodes) {
    	var node_counts = {};
    	for (var i=0; i<nodes.length; i++) {
	    var n = nodes[i];
	    if (n !== undefined) {
		n.upstream (function (this_node){
		    var id = this_node.id();
		    if (node_counts[id] === undefined) {
			node_counts[id] = 0;
		    }
		    node_counts[id]++
    		});
	    }
    	}
    

	var is_singleton = function (node_data) {
	    var n_children = 0;
	    if (node_data.children === undefined) {
		return false;
	    }
	    for (var i=0; i<node_data.children.length; i++) {
		var id = node_data.children[i]._id;
		if (node_counts[id] > 0) {
		    n_children++;
		}
	    }
	    return n_children === 1;
	};

	var copy_data = function (orig_data, subtree, condition) {
            if (orig_data === undefined) {
		return;
            }

            if (condition(orig_data)) {
		var copy = copy_node(orig_data);
		if (subtree.children === undefined) {
                    subtree.children = [];
		}
		subtree.children.push(copy);
		if (orig_data.children === undefined) {
                    return;
		}
		for (var i = 0; i < orig_data.children.length; i++) {
                    copy_data (orig_data.children[i], copy, condition);
		}
            } else {
		if (orig_data.children === undefined) {
                    return;
		}
		for (var i = 0; i < orig_data.children.length; i++) {
                    copy_data(orig_data.children[i], subtree, condition);
		}
            }
	};

	var copy_node = function (node_data) {
	    var copy = {};
	    // copy all the own properties excepts links to other nodes or depth
	    for (var param in node_data) {
		if ((param === "children") ||
		    (param === "children") ||
		    (param === "_parent") ||
		    (param === "depth")) {
		    continue;
		}
		if (node_data.hasOwnProperty(param)) {
		    copy[param] = node_data[param];
		}
	    }
	    return copy;
	};

	var subtree = {};
	copy_data (data, subtree, function (node_data) {
	    var node_id = node_data._id;
	    var counts = node_counts[node_id];

	    if (counts === undefined) {
	    	return false;
	    }
// 	    if ((node.children !== undefined) && (node.children.length < 2)) {
// 		return false;
// 	    }
	    if ((counts > 1) && (!is_singleton(node_data))) {
		return true;
	    }
	    if ((counts > 0) && (node_data.children === undefined)) {
		return true;
	    }
	    return false;
	});

	return tnt_node(subtree.children[0]);
    });

    // TODO: This method visits all the nodes
    // a more performant version should return true
    // the first time cbak(node) is true
    api.method ('present', function (cbak) {
	// cbak should return true/false
	var is_true = false;
	node.apply (function (n) {
	    if (cbak(n) === true) {
		is_true = true;
	    }
	});
	return is_true;
    });

    // cbak is called with two nodes
    // and should return a negative number, 0 or a positive number
    api.method ('sort', function (cbak) {
	if (data.children === undefined) {
	    return;
	}

	var new_children = [];
	for (var i=0; i<data.children.length; i++) {
	    new_children.push(tnt_node(data.children[i]));
	}

	new_children.sort(cbak);

	data.children = [];
	for (var i=0; i<new_children.length; i++) {
	    data.children.push(new_children[i].data());
	}

	for (var i=0; i<data.children.length; i++) {
	    tnt_node(data.children[i]).sort(cbak);
	}
    });

    // TODO: This method only 'apply's to non collapsed nodes (ie ._children is not visited)
    // Would it be better to have an extra flag (true/false) to visit also collapsed nodes?
    api.method ('apply', function(cbak) {
	cbak(node);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = tnt_node(data.children[i])
		n.apply(cbak);
	    }
	}
    });

    // TODO: Not sure if it makes sense to set via a callback:
    // root.property (function (node, val) {
    //    node.deeper.field = val
    // }, 'new_value')
    api.method ('property', function(prop, value) {
	if (arguments.length === 1) {
	    if ((typeof prop) === 'function') {
		return prop(data)	
	    }
	    return data[prop]
	}
	if ((typeof prop) === 'function') {
	    prop(data, value);   
	}
	data[prop] = value;
	return node;
    });

    api.method ('is_leaf', function() {
	return data.children === undefined;
    });

    // It looks like the cluster can't be used for anything useful here
    // It is now included as an optional parameter to the tnt.tree() method call
    // so I'm commenting the getter
    // node.cluster = function() {
    // 	return cluster;
    // };

    // node.depth = function (node) {
    //     return node.depth;
    // };

//     node.name = function (node) {
//         return node.name;
//     };

    api.method ('id', function () {
	return node.property('_id');
    });

    api.method ('node_name', function () {
	return node.property('name');
    });

    api.method ('branch_length', function () {
	return node.property('branch_length');
    });

    api.method ('root_dist', function () {
	return node.property('_root_dist');
    });

    api.method ('children', function () {
	if (data.children === undefined) {
	    return;
	}
	var children = [];
	for (var i=0; i<data.children.length; i++) {
	    children.push(tnt_node(data.children[i]));
	}
	return children;
    });

    api.method ('parent', function () {
	if (data._parent === undefined) {
	    return undefined;
	}
	return tnt_node(data._parent);
    });

    return node;

};

module.exports = exports = tnt_node;


},{"tnt.api":6,"tnt.utils":11}],16:[function(require,module,exports){
var apijs = require('tnt.api');
var tree = {};

tree.diagonal = function () {
    var d = function (diagonalPath) {
	var source = diagonalPath.source;
        var target = diagonalPath.target;
        var midpointX = (source.x + target.x) / 2;
        var midpointY = (source.y + target.y) / 2;
        var pathData = [source, {x: target.x, y: source.y}, target];
	pathData = pathData.map(d.projection());
	return d.path()(pathData, radial_calc.call(this,pathData))
    };

    var api = apijs (d)
	.getset ('projection')
	.getset ('path')
    
    var coordinateToAngle = function (coord, radius) {
      	var wholeAngle = 2 * Math.PI,
        quarterAngle = wholeAngle / 4
	
      	var coordQuad = coord[0] >= 0 ? (coord[1] >= 0 ? 1 : 2) : (coord[1] >= 0 ? 4 : 3),
        coordBaseAngle = Math.abs(Math.asin(coord[1] / radius))
	
      	// Since this is just based on the angle of the right triangle formed
      	// by the coordinate and the origin, each quad will have different 
      	// offsets
      	var coordAngle;
      	switch (coordQuad) {
      	case 1:
      	    coordAngle = quarterAngle - coordBaseAngle
      	    break
      	case 2:
      	    coordAngle = quarterAngle + coordBaseAngle
      	    break
      	case 3:
      	    coordAngle = 2*quarterAngle + quarterAngle - coordBaseAngle
      	    break
      	case 4:
      	    coordAngle = 3*quarterAngle + coordBaseAngle
      	}
      	return coordAngle
    };

    var radial_calc = function (pathData) {
	var src = pathData[0];
	var mid = pathData[1];
	var dst = pathData[2];
	var radius = Math.sqrt(src[0]*src[0] + src[1]*src[1]);
	var srcAngle = coordinateToAngle(src, radius);
	var midAngle = coordinateToAngle(mid, radius);
	var clockwise = Math.abs(midAngle - srcAngle) > Math.PI ? midAngle <= srcAngle : midAngle > srcAngle;
	return {
	    radius   : radius,
	    clockwise : clockwise
	};
    };

    return d;
};

// vertical diagonal for rect branches
tree.diagonal.vertical = function () {
    var path = function(pathData, obj) {
	var src = pathData[0];
	var mid = pathData[1];
	var dst = pathData[2];
	var radius = 200000; // Number long enough

	return "M" + src + " A" + [radius,radius] + " 0 0,0 " + mid + "M" + mid + "L" + dst; 
	
    };

    var projection = function(d) { 
	return [d.y, d.x];
    }

    return tree.diagonal()
      	.path(path)
      	.projection(projection);
};

tree.diagonal.radial = function () {
    var path = function(pathData, obj) {
      	var src = pathData[0];
      	var mid = pathData[1];
      	var dst = pathData[2];
	var radius = obj.radius;
	var clockwise = obj.clockwise;

	if (clockwise) {
	    return "M" + src + " A" + [radius,radius] + " 0 0,0 " + mid + "M" + mid + "L" + dst; 
	} else {
	    return "M" + mid + " A" + [radius,radius] + " 0 0,0 " + src + "M" + mid + "L" + dst;
	}

    };

    var projection = function(d) {
      	var r = d.y, a = (d.x - 90) / 180 * Math.PI;
      	return [r * Math.cos(a), r * Math.sin(a)];
    };

    return tree.diagonal()
      	.path(path)
      	.projection(projection)
};

module.exports = exports = tree.diagonal;

},{"tnt.api":6}],17:[function(require,module,exports){
var tree = require ("./tree.js");
tree.label = require("./label.js");
tree.diagonal = require("./diagonal.js");
tree.layout = require("./layout.js");
tree.node_display = require("./node_display.js");
// tree.node = require("tnt.tree.node");
// tree.parse_newick = require("tnt.newick").parse_newick;
// tree.parse_nhx = require("tnt.newick").parse_nhx;

module.exports = exports = tree;


},{"./diagonal.js":16,"./label.js":18,"./layout.js":19,"./node_display.js":20,"./tree.js":21}],18:[function(require,module,exports){
var apijs = require("tnt.api");
var tree = {};

tree.label = function () {
"use strict";

    // TODO: Not sure if we should be removing by default prev labels
    // or it would be better to have a separate remove method called by the vis
    // on update
    // We also have the problem that we may be transitioning from
    // text to img labels and we need to remove the label of a different type
    var label = function (node, layout_type, node_size) {
	if (typeof (node) !== 'function') {
            throw(node);
        }

	label.display().call(this, node, layout_type)
	    .attr("class", "tnt_tree_label")
	    .attr("transform", function (d) {
		var t = label.transform()(node, layout_type);
		return "translate (" + (t.translate[0] + node_size) + " " + t.translate[1] + ")rotate(" + t.rotate + ")";
	    })
	// TODO: this click event is probably never fired since there is an onclick event in the node g element?
	    .on("click", function(){
		if (label.on_click() !== undefined) {
		    d3.event.stopPropagation();
		    label.on_click().call(this, node);
		}
	    });
    };

    var api = apijs (label)
	.getset ('width', function () { throw "Need a width callback" })
	.getset ('height', function () { throw "Need a height callback" })
	.getset ('display', function () { throw "Need a display callback" })
	.getset ('transform', function () { throw "Need a transform callback" })
	.getset ('on_click');

    return label;
};

// Text based labels
tree.label.text = function () {
    var label = tree.label();

    var api = apijs (label)
	.getset ('fontsize', 10)
	.getset ('color', "#000")
	.getset ('text', function (d) {
	    return d.data().name;
	})

    label.display (function (node, layout_type) {
	var l = d3.select(this)
	    .append("text")
	    .attr("text-anchor", function (d) {
		if (layout_type === "radial") {
		    return (d.x%360 < 180) ? "start" : "end";
		}
		return "start";
	    })
	    .text(function(){
		return label.text()(node)
	    })
	    .style('font-size', label.fontsize() + "px")
	    .style('fill', d3.functor(label.color())(node));

	return l;
    });

    label.transform (function (node, layout_type) {
	var d = node.data();
	var t = {
	    translate : [5, 5],
	    rotate : 0
	};
	if (layout_type === "radial") {
	    t.translate[1] = t.translate[1] - (d.x%360 < 180 ? 0 : label.fontsize())
	    t.rotate = (d.x%360 < 180 ? 0 : 180)
	}
	return t;
    });


    // label.transform (function (node) {
    // 	var d = node.data();
    // 	return "translate(10 5)rotate(" + (d.x%360 < 180 ? 0 : 180) + ")";
    // });

    label.width (function (node) {
	var svg = d3.select("body")
	    .append("svg")
	    .attr("height", 0)
	    .style('visibility', 'hidden');

	var text = svg
	    .append("text")
	    .style('font-size', label.fontsize() + "px")
	    .text(label.text()(node));

	var width = text.node().getBBox().width;
	svg.remove();

	return width;
    });

    label.height (function (node) {
	return label.fontsize();
    });

    return label;
};

// Image based labels
tree.label.img = function () {
    var label = tree.label();

    var api = apijs (label)
	.getset ('src', function () {})

    label.display (function (node, layout_type) {
	if (label.src()(node)) {
	    var l = d3.select(this)
		.append("image")
		.attr("width", label.width()())
		.attr("height", label.height()())
		.attr("xlink:href", label.src()(node));
	    return l;
	}
	// fallback text in case the img is not found?
	return d3.select(this)
	    .append("text")
	    .text("");
    });

    label.transform (function (node, layout_type) {
	var d = node.data();
	var t = {
	    translate : [10, (-label.height()() / 2)],
	    rotate : 0
	};
	if (layout_type === 'radial') {
	    t.translate[0] = t.translate[0] + (d.x%360 < 180 ? 0 : label.width()()),
	    t.translate[1] = t.translate[1] + (d.x%360 < 180 ? 0 : label.height()()),
	    t.rotate = (d.x%360 < 180 ? 0 : 180)
	}

	return t;
    });

    return label;
};

// Labels made of 2+ simple labels
tree.label.composite = function () {
    var labels = [];

    var label = function (node, layout_type) {
	var curr_xoffset = 0;

	for (var i=0; i<labels.length; i++) {
	    var display = labels[i];

	    (function (offset) {
		display.transform (function (node, layout_type) {
		    var tsuper = display._super_.transform()(node, layout_type);
		    var t = {
			translate : [offset + tsuper.translate[0], tsuper.translate[1]],
			rotate : tsuper.rotate
		    };
		    return t;
		})
	    })(curr_xoffset);

	    curr_xoffset += 10;
	    curr_xoffset += display.width()(node);

	    display.call(this, node, layout_type);
	}
    };

    var api = apijs (label)

    api.method ('add_label', function (display, node) {
	display._super_ = {};
	apijs (display._super_)
	    .get ('transform', display.transform());

	labels.push(display);
	return label;
    });
    
    api.method ('width', function () {
	return function (node) {
	    var tot_width = 0;
	    for (var i=0; i<labels.length; i++) {
		tot_width += parseInt(labels[i].width()(node));
		tot_width += parseInt(labels[i]._super_.transform()(node).translate[0]);
	    }

	    return tot_width;
	}
    });

    api.method ('height', function () {
	return function (node) {
	    var max_height = 0;
	    for (var i=0; i<labels.length; i++) {
		var curr_height = labels[i].height()(node);
		if ( curr_height > max_height) {
		    max_height = curr_height;
		}
	    }
	    return max_height;
	}
    });

    return label;
};

module.exports = exports = tree.label;



},{"tnt.api":6}],19:[function(require,module,exports){
// Based on the code by Ken-ichi Ueda in http://bl.ocks.org/kueda/1036776#d3.phylogram.js

var apijs = require("tnt.api");
var diagonal = require("./diagonal.js");
var tree = {};

tree.layout = function () {

    var l = function () {
    };

    var cluster = d3.layout.cluster()
	.sort(null)
	.value(function (d) {return d.length} )
	.separation(function () {return 1});
    
    var api = apijs (l)
	.getset ('scale', true)
	.getset ('max_leaf_label_width', 0)
	.method ("cluster", cluster)
	.method('yscale', function () {throw "yscale is not defined in the base object"})
	.method('adjust_cluster_size', function () {throw "adjust_cluster_size is not defined in the base object" })
	.method('width', function () {throw "width is not defined in the base object"})
	.method('height', function () {throw "height is not defined in the base object"});

    api.method('scale_branch_lengths', function (curr) {
	if (l.scale() === false) {
	    return
	}

	var nodes = curr.nodes;
	var tree = curr.tree;

	var root_dists = nodes.map (function (d) {
	    return d._root_dist;
	});

	var yscale = l.yscale(root_dists);
	tree.apply (function (node) {
	    node.property("y", yscale(node.root_dist()));
	});
    });

    return l;
};

tree.layout.vertical = function () {
    var layout = tree.layout();
    // Elements like 'labels' depend on the layout type. This exposes a way of identifying the layout type
    layout.type = "vertical";

    var api = apijs (layout)
	.getset ('width', 360)
	.get ('translate_vis', [20,20])
	.method ('diagonal', diagonal.vertical)
	.method ('transform_node', function (d) {
    	    return "translate(" + d.y + "," + d.x + ")";
	});

    api.method('height', function (params) {
    	return (params.n_leaves * params.label_height);
    }); 

    api.method('yscale', function (dists) {
    	return d3.scale.linear()
    	    .domain([0, d3.max(dists)])
    	    .range([0, layout.width() - 20 - layout.max_leaf_label_width()]);
    });

    api.method('adjust_cluster_size', function (params) {
    	var h = layout.height(params);
    	var w = layout.width() - layout.max_leaf_label_width() - layout.translate_vis()[0] - params.label_padding;
    	layout.cluster.size ([h,w]);
    	return layout;
    });

    return layout;
};

tree.layout.radial = function () {
    var layout = tree.layout();
    // Elements like 'labels' depend on the layout type. This exposes a way of identifying the layout type
    layout.type = 'radial';

    var default_width = 360;
    var r = default_width / 2;

    var conf = {
    	width : 360
    };

    var api = apijs (layout)
	.getset (conf)
	.getset ('translate_vis', [r, r]) // TODO: 1.3 should be replaced by a sensible value
	.method ('transform_node', function (d) {
	    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
	})
	.method ('diagonal', diagonal.radial)
	.method ('height', function () { return conf.width });

    // Changes in width affect changes in r
    layout.width.transform (function (val) {
    	r = val / 2;
    	layout.cluster.size([360, r])
    	layout.translate_vis([r, r]);
    	return val;
    });

    api.method ("yscale",  function (dists) {
	return d3.scale.linear()
	    .domain([0,d3.max(dists)])
	    .range([0, r]);
    });

    api.method ("adjust_cluster_size", function (params) {
	r = (layout.width()/2) - layout.max_leaf_label_width() - 20;
	layout.cluster.size([360, r]);
	return layout;
    });

    return layout;
};

module.exports = exports = tree.layout;

},{"./diagonal.js":16,"tnt.api":6}],20:[function(require,module,exports){
var apijs = require("tnt.api");
var tree = {};

tree.node_display = function () {
    "use strict";

    var n = function (node) {
	n.display().call(this, node)
    };

    var api = apijs (n)
	.getset("size", 4.5)
	.getset("fill", "black")
	.getset("stroke", "black")
	.getset("stroke_width", "1px")
	.getset("display", function () {throw "display is not defined in the base object"});

    return n;
};

tree.node_display.circle = function () {
    var n = tree.node_display();

    n.display (function (node) {
	d3.select(this)
	    .append("circle")
	    .attr("r", function (d) {
		return d3.functor(n.size())(node);
	    })
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

tree.node_display.square = function () {
    var n = tree.node_display();

    n.display (function (node) {
	var s = d3.functor(n.size())(node);
	d3.select(this)
	    .append("rect")
	    .attr("x", function (d) {
		return -s
	    })
	    .attr("y", function (d) {
		return -s;
	    })
	    .attr("width", function (d) {
		return s*2;
	    })
	    .attr("height", function (d) {
		return s*2;
	    })
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

tree.node_display.triangle = function () {
    var n = tree.node_display();

    n.display (function (node) {
	var s = d3.functor(n.size())(node);
	d3.select(this)
	    .append("polygon")
	    .attr("points", (-s) + ",0 " + s + "," + (-s) + " " + s + "," + s)
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

tree.node_display.cond = function () {
    var n = tree.node_display();

    // conditions are objects with
    // name : a name for this display
    // callback: the condition to apply (receives a tnt.node)
    // display: a node_display
    var conds = [];

    n.display (function (node) {
	var s = d3.functor(n.size())(node);
	for (var i=0; i<conds.length; i++) {
	    var cond = conds[i];
	    // For each node, the first condition met is used
	    if (cond.callback.call(this, node) === true) {
		cond.display.call(this, node)
		break;
	    }
	}
    })

    var api = apijs(n);

    api.method("add", function (name, cbak, node_display) {
	conds.push({ name : name,
		     callback : cbak,
		     display : node_display
		   });
	return n;
    });

    api.method("reset", function () {
	conds = [];
	return n;
    });

    api.method("update", function (name, cbak, new_display) {
	for (var i=0; i<conds.length; i++) {
	    if (conds[i].name === name) {
		conds[i].callback = cbak;
		conds[i].display = new_display;
	    }
	}
	return n;
    });

    return n;

};

module.exports = exports = tree.node_display;

},{"tnt.api":6}],21:[function(require,module,exports){
var apijs = require("tnt.api");
var tnt_tree_node = require("tnt.tree.node");

var tree = function () {
    "use strict";

    var conf = {
	duration         : 500,      // Duration of the transitions
	node_display     : tree.node_display.circle(),
	label            : tree.label.text(),
	layout           : tree.layout.vertical(),
	on_click         : function () {},
	on_dbl_click     : function () {},
	on_mouseover     : function () {},
	link_color       : 'black',
	id               : "_id"
    };

    // Keep track of the focused node
    // TODO: Would it be better to have multiple focused nodes? (ie use an array)
    var focused_node;

    // Extra delay in the transitions (TODO: Needed?)
    var delay = 0;

    // Ease of the transitions
    var ease = "cubic-in-out";

    // By node data
    var sp_counts = {};
 
    var scale = false;

    // The id of the tree container
    var div_id;

    // The tree visualization (svg)
    var svg;
    var vis;

    // TODO: For now, counts are given only for leaves
    // but it may be good to allow counts for internal nodes
    var counts = {};

    // The full tree
    var base = {
	tree : undefined,
	data : undefined,	
	nodes : undefined,
	links : undefined
    };

    // The curr tree. Needed to re-compute the links / nodes positions of subtrees
    var curr = {
	tree : undefined,
	data : undefined,
	nodes : undefined,
	links : undefined
    };

    // The cbak returned
    var t = function (div) {
	div_id = d3.select(div).attr("id");

        var tree_div = d3.select(div)
            .append("div")
	    .style("width", (conf.layout.width() +  "px"))
	    .attr("class", "tnt_groupDiv");

	var cluster = conf.layout.cluster;

	var n_leaves = curr.tree.get_all_leaves().length;

	var max_leaf_label_length = function (tree) {
	    var max = 0;
	    var leaves = tree.get_all_leaves();
	    for (var i=0; i<leaves.length; i++) {
		var label_width = conf.label.width()(leaves[i]) + d3.functor(conf.node_display.size())(leaves[i]);
		if (label_width > max) {
		    max = label_width;
		}
	    }
	    return max;
	};

	var max_leaf_node_height = function (tree) {
	    var max = 0;
	    var leaves = tree.get_all_leaves();
	    for (var i=0; i<leaves.length; i++) {
		var node_size = d3.functor(conf.node_display.size())(leaves[i]);
		if (node_size > max) {
		    max = node_size;
		}
	    }
	    return max * 2;
	};

	var max_label_length = max_leaf_label_length(curr.tree);
	conf.layout.max_leaf_label_width(max_label_length);

	var max_node_height = max_leaf_node_height(curr.tree);

	// Cluster size is the result of...
	// total width of the vis - transform for the tree - max_leaf_label_width - horizontal transform of the label
	// TODO: Substitute 15 by the horizontal transform of the nodes
	var cluster_size_params = {
	    n_leaves : n_leaves,
	    label_height : d3.max([d3.functor(conf.label.height())(), max_node_height]),
	    label_padding : 15
	};

	conf.layout.adjust_cluster_size(cluster_size_params);

	var diagonal = conf.layout.diagonal();
	var transform = conf.layout.transform_node;

	svg = tree_div
	    .append("svg")
	    .attr("width", conf.layout.width())
	    .attr("height", conf.layout.height(cluster_size_params) + 30)
	    .attr("fill", "none");

	vis = svg
	    .append("g")
	    .attr("id", "tnt_st_" + div_id)
	    .attr("transform",
		  "translate(" +
		  conf.layout.translate_vis()[0] +
		  "," +
		  conf.layout.translate_vis()[1] +
		  ")");

	curr.nodes = cluster.nodes(curr.data);
	conf.layout.scale_branch_lengths(curr);
	curr.links = cluster.links(curr.nodes);

	// LINKS
	var link = vis.selectAll("path.tnt_tree_link")
	    .data(curr.links, function(d){return d.target[conf.id]});
	
	link
	    .enter()
	    .append("path")
	    .attr("class", "tnt_tree_link")
	    .attr("id", function(d) {
	    	return "tnt_tree_link_" + div_id + "_" + d.target._id;
	    })
	    .style("stroke", function (d) {
		return d3.functor(conf.link_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
	    })
	    .attr("d", diagonal);	    

	// NODES
	var node = vis.selectAll("g.tnt_tree_node")
	    .data(curr.nodes, function(d) {return d[conf.id]});

	var new_node = node
	    .enter().append("g")
	    .attr("class", function(n) {
		if (n.children) {
		    if (n.depth == 0) {
			return "root tnt_tree_node"
		    } else {
			return "inner tnt_tree_node"
		    }
		} else {
		    return "leaf tnt_tree_node"
		}
	    })
	    .attr("id", function(d) {
		return "tnt_tree_node_" + div_id + "_" + d._id
	    })
	    .attr("transform", transform);

	// display node shape
	new_node
	    .each (function (d) {
		conf.node_display.call(this, tnt_tree_node(d))
	    });

	// display node label
	new_node
	    .each (function (d) {
	    	conf.label.call(this, tnt_tree_node(d), conf.layout.type, d3.functor(conf.node_display.size())(tnt_tree_node(d)));
	    });

	new_node.on("click", function (node) {
	    conf.on_click.call(this, tnt_tree_node(node));

	    tree.trigger("node:click", tnt_tree_node(node));
	});

	new_node.on("mouseenter", function (node) {
	    conf.on_mouseover.call(this, tnt_tree_node(node));

	    tree.trigger("node:hover", tnt_tree_node(node));
	});

	new_node.on("dblclick", function (node) {
	    conf.on_dbl_click.call(this, tnt_tree_node(node));

	    tree.trigger("node:dblclick", tnt_tree_node(node));
	});


	// Update plots an updated tree
	api.method ('update', function() {
	    tree_div
		.style("width", (conf.layout.width() + "px"));
	    svg.attr("width", conf.layout.width());

	    var cluster = conf.layout.cluster;
	    var diagonal = conf.layout.diagonal();
	    var transform = conf.layout.transform_node;

	    var max_label_length = max_leaf_label_length(curr.tree);
	    conf.layout.max_leaf_label_width(max_label_length);

	    var max_node_height = max_leaf_node_height(curr.tree);

	    // Cluster size is the result of...
	    // total width of the vis - transform for the tree - max_leaf_label_width - horizontal transform of the label
	// TODO: Substitute 15 by the transform of the nodes (probably by selecting one node assuming all the nodes have the same transform
	    var n_leaves = curr.tree.get_all_leaves().length;
	    var cluster_size_params = {
		n_leaves : n_leaves,
		label_height : d3.max([d3.functor(conf.label.height())()]),
		label_padding : 15
	    };
	    conf.layout.adjust_cluster_size(cluster_size_params);

	    svg
		.transition()
		.duration(conf.duration)
		.ease(ease)
		.attr("height", conf.layout.height(cluster_size_params) + 30); // height is in the layout

	    vis
		.transition()
		.duration(conf.duration)
		.attr("transform",
		      "translate(" +
		      conf.layout.translate_vis()[0] +
		      "," +
		      conf.layout.translate_vis()[1] +
		      ")");
	    
	    curr.nodes = cluster.nodes(curr.data);
	    conf.layout.scale_branch_lengths(curr);
	    curr.links = cluster.links(curr.nodes);

	    // LINKS
	    var link = vis.selectAll("path.tnt_tree_link")
		.data(curr.links, function(d){return d.target[conf.id]});

            // NODES
	    var node = vis.selectAll("g.tnt_tree_node")
		.data(curr.nodes, function(d) {return d[conf.id]});

	    var exit_link = link
		.exit()
		.remove();

	    link
		.enter()
		.append("path")
		.attr("class", "tnt_tree_link")
		.attr("id", function (d) {
		    return "tnt_tree_link_" + div_id + "_" + d.target._id;
		})
		.attr("stroke", function (d) {
		    return d3.functor(conf.link_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
		})
		.attr("d", diagonal);

	    link
	    	.transition()
		.ease(ease)
	    	.duration(conf.duration)
	    	.attr("d", diagonal);


	    // Nodes
	    var new_node = node
		.enter()
		.append("g")
		.attr("class", function(n) {
		    if (n.children) {
			if (n.depth == 0) {
			    return "root tnt_tree_node"
			} else {
			    return "inner tnt_tree_node"
			}
		    } else {
			return "leaf tnt_tree_node"
		    }
		})
		.attr("id", function (d) {
		    return "tnt_tree_node_" + div_id + "_" + d._id;
		})
		.attr("transform", transform);
   
	    // Exiting nodes are just removed
	    node
		.exit()
		.remove();

	    new_node.on("click", function (node) {
		conf.on_click.call(this, tnt_tree_node(node));

		tree.trigger("node:click", tnt_tree_node(node));
	    });

	    new_node.on("mouseenter", function (node) {
		conf.on_mouseover.call(this, tnt_tree_node(node));

		tree.trigger("node:hover", tnt_tree_node(node));
	    });

	    new_node.on("dblclick", function (node) {
		conf.on_dbl_click.call(this, tnt_tree_node(node));

		tree.trigger("node:dblclick", tnt_tree_node(node));
	    });


	    // We need to re-create all the nodes again in case they have changed lively (or the layout)
	    node.selectAll("*").remove();
	    node
		    .each(function (d) {
			conf.node_display.call(this, tnt_tree_node(d))
		    });

	    // We need to re-create all the labels again in case they have changed lively (or the layout)
	    node
		    .each (function (d) {
			conf.label.call(this, tnt_tree_node(d), conf.layout.type, d3.functor(conf.node_display.size())(tnt_tree_node(d)));
		    });

	    node
		.transition()
		.ease(ease)
		.duration(conf.duration)
		.attr("transform", transform);

	});
    };

    // API
    var api = apijs (t)
	.getset (conf)

    // TODO: Rewrite data using getset / finalizers & transforms
    api.method ('data', function (d) {
	if (!arguments.length) {
	    return base.data;
	}

	// The original data is stored as the base and curr data
	base.data = d;
	curr.data = d;

	// Set up a new tree based on the data
	var newtree = tnt_tree_node(base.data);

	t.root(newtree);

	tree.trigger("data:hasChanged", base.data);

	return this;
    });

    // TODO: Rewrite tree using getset / finalizers & transforms
    api.method ('root', function (myTree) {
    	if (!arguments.length) {
    	    return curr.tree;
    	}

	// The original tree is stored as the base, prev and curr tree
    	base.tree = myTree;
	curr.tree = base.tree;
//	prev.tree = base.tree;
    	return this;
    });

    api.method ('subtree', function (curr_nodes) {
	var subtree = base.tree.subtree(curr_nodes);
	curr.data = subtree.data();
	curr.tree = subtree;

	return this;
    });

    api.method ('focus_node', function (node) {
	// find 
	var found_node = t.root().find_node(function (n) {
	    return node.id() === n.id();
	});
	focused_node = found_node;
	t.subtree(found_node.get_all_leaves());

	return this;
    });

    api.method ('has_focus', function (node) {
	return ((focused_node !== undefined) && (focused_node.id() === node.id()));
    });

    api.method ('release_focus', function () {
	t.data (base.data);
	focused_node = undefined;
	return this;
    });

    return t;
};

module.exports = exports = tree;

},{"tnt.api":6,"tnt.tree.node":10}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvZmFrZV8zY2Q1NGJlYS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvYmlvanMtZXZlbnRzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQuYXBpL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQuYXBpL3NyYy9hcGkuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svc3JjL25ld2ljay5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3JlZHVjZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy91dGlscy5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9zcmMvbm9kZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9zcmMvZGlhZ29uYWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL3NyYy9sYWJlbC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9zcmMvbGF5b3V0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL3NyYy9ub2RlX2Rpc3BsYXkuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvc3JjL3RyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHR5cGVvZiB0bnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHRudCA9IHt9O1xufVxudG50LnRyZWUgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbnRudC50cmVlLm5vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcbnRudC50cmVlLnBhcnNlX25ld2ljayA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25ld2ljaztcbnRudC50cmVlLnBhcnNlX25oeCA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25oeDtcblxuIiwiLy8gaWYgKHR5cGVvZiB0bnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IHRudCA9IHt9XG4vLyB9XG5tb2R1bGUuZXhwb3J0cyA9IHRyZWUgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG52YXIgZXZlbnRzeXN0ZW0gPSByZXF1aXJlKFwiYmlvanMtZXZlbnRzXCIpO1xuZXZlbnRzeXN0ZW0ubWl4aW4odHJlZSk7XG4vL3RudC51dGlscyA9IHJlcXVpcmUoXCJ0bnQudXRpbHNcIik7XG4vL3RudC50b29sdGlwID0gcmVxdWlyZShcInRudC50b29sdGlwXCIpO1xuLy90bnQudHJlZSA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcblxuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoXCJiYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZVwiKTtcblxuZXZlbnRzLm9uQWxsID0gZnVuY3Rpb24oY2FsbGJhY2ssY29udGV4dCl7XG4gIHRoaXMub24oXCJhbGxcIiwgY2FsbGJhY2ssY29udGV4dCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gTWl4aW4gdXRpbGl0eVxuZXZlbnRzLm9sZE1peGluID0gZXZlbnRzLm1peGluO1xuZXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgZXZlbnRzLm9sZE1peGluKHByb3RvKTtcbiAgLy8gYWRkIGN1c3RvbSBvbkFsbFxuICB2YXIgZXhwb3J0cyA9IFsnb25BbGwnXTtcbiAgZm9yKHZhciBpPTA7IGkgPCBleHBvcnRzLmxlbmd0aDtpKyspe1xuICAgIHZhciBuYW1lID0gZXhwb3J0c1tpXTtcbiAgICBwcm90b1tuYW1lXSA9IHRoaXNbbmFtZV07XG4gIH1cbiAgcmV0dXJuIHByb3RvO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBldmVudHM7XG4iLCIvKipcbiAqIFN0YW5kYWxvbmUgZXh0cmFjdGlvbiBvZiBCYWNrYm9uZS5FdmVudHMsIG5vIGV4dGVybmFsIGRlcGVuZGVuY3kgcmVxdWlyZWQuXG4gKiBEZWdyYWRlcyBuaWNlbHkgd2hlbiBCYWNrb25lL3VuZGVyc2NvcmUgYXJlIGFscmVhZHkgYXZhaWxhYmxlIGluIHRoZSBjdXJyZW50XG4gKiBnbG9iYWwgY29udGV4dC5cbiAqXG4gKiBOb3RlIHRoYXQgZG9jcyBzdWdnZXN0IHRvIHVzZSB1bmRlcnNjb3JlJ3MgYF8uZXh0ZW5kKClgIG1ldGhvZCB0byBhZGQgRXZlbnRzXG4gKiBzdXBwb3J0IHRvIHNvbWUgZ2l2ZW4gb2JqZWN0LiBBIGBtaXhpbigpYCBtZXRob2QgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIEV2ZW50c1xuICogcHJvdG90eXBlIHRvIGF2b2lkIHVzaW5nIHVuZGVyc2NvcmUgZm9yIHRoYXQgc29sZSBwdXJwb3NlOlxuICpcbiAqICAgICB2YXIgbXlFdmVudEVtaXR0ZXIgPSBCYWNrYm9uZUV2ZW50cy5taXhpbih7fSk7XG4gKlxuICogT3IgZm9yIGEgZnVuY3Rpb24gY29uc3RydWN0b3I6XG4gKlxuICogICAgIGZ1bmN0aW9uIE15Q29uc3RydWN0b3IoKXt9XG4gKiAgICAgTXlDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZm9vID0gZnVuY3Rpb24oKXt9XG4gKiAgICAgQmFja2JvbmVFdmVudHMubWl4aW4oTXlDb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICpcbiAqIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIEluYy5cbiAqIChjKSAyMDEzIE5pY29sYXMgUGVycmlhdWx0XG4gKi9cbi8qIGdsb2JhbCBleHBvcnRzOnRydWUsIGRlZmluZSwgbW9kdWxlICovXG4oZnVuY3Rpb24oKSB7XG4gIHZhciByb290ID0gdGhpcyxcbiAgICAgIGJyZWFrZXIgPSB7fSxcbiAgICAgIG5hdGl2ZUZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCxcbiAgICAgIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSxcbiAgICAgIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuICAgICAgaWRDb3VudGVyID0gMDtcblxuICAvLyBSZXR1cm5zIGEgcGFydGlhbCBpbXBsZW1lbnRhdGlvbiBtYXRjaGluZyB0aGUgbWluaW1hbCBBUEkgc3Vic2V0IHJlcXVpcmVkXG4gIC8vIGJ5IEJhY2tib25lLkV2ZW50c1xuICBmdW5jdGlvbiBtaW5pc2NvcmUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGtleXM6IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iaiAhPT0gXCJmdW5jdGlvblwiIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJrZXlzKCkgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5LCBrZXlzID0gW107XG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAga2V5c1trZXlzLmxlbmd0aF0gPSBrZXk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgICAgfSxcblxuICAgICAgdW5pcXVlSWQ6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgICAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgICAgIH0sXG5cbiAgICAgIGhhczogZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICAgICAgfSxcblxuICAgICAgZWFjaDogZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgICAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICAgICAgaWYgKG5hdGl2ZUZvckVhY2ggJiYgb2JqLmZvckVhY2ggPT09IG5hdGl2ZUZvckVhY2gpIHtcbiAgICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9iai5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXMob2JqLCBrZXkpKSB7XG4gICAgICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIG9uY2U6IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgdmFyIHJhbiA9IGZhbHNlLCBtZW1vO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICB2YXIgXyA9IG1pbmlzY29yZSgpLCBFdmVudHM7XG5cbiAgLy8gQmFja2JvbmUuRXZlbnRzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEEgbW9kdWxlIHRoYXQgY2FuIGJlIG1peGVkIGluIHRvICphbnkgb2JqZWN0KiBpbiBvcmRlciB0byBwcm92aWRlIGl0IHdpdGhcbiAgLy8gY3VzdG9tIGV2ZW50cy4gWW91IG1heSBiaW5kIHdpdGggYG9uYCBvciByZW1vdmUgd2l0aCBgb2ZmYCBjYWxsYmFja1xuICAvLyBmdW5jdGlvbnMgdG8gYW4gZXZlbnQ7IGB0cmlnZ2VyYC1pbmcgYW4gZXZlbnQgZmlyZXMgYWxsIGNhbGxiYWNrcyBpblxuICAvLyBzdWNjZXNzaW9uLlxuICAvL1xuICAvLyAgICAgdmFyIG9iamVjdCA9IHt9O1xuICAvLyAgICAgXy5leHRlbmQob2JqZWN0LCBCYWNrYm9uZS5FdmVudHMpO1xuICAvLyAgICAgb2JqZWN0Lm9uKCdleHBhbmQnLCBmdW5jdGlvbigpeyBhbGVydCgnZXhwYW5kZWQnKTsgfSk7XG4gIC8vICAgICBvYmplY3QudHJpZ2dlcignZXhwYW5kJyk7XG4gIC8vXG4gIEV2ZW50cyA9IHtcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gYSBgY2FsbGJhY2tgIGZ1bmN0aW9uLiBQYXNzaW5nIGBcImFsbFwiYCB3aWxsIGJpbmRcbiAgICAvLyB0aGUgY2FsbGJhY2sgdG8gYWxsIGV2ZW50cyBmaXJlZC5cbiAgICBvbjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICdvbicsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0gfHwgKHRoaXMuX2V2ZW50c1tuYW1lXSA9IFtdKTtcbiAgICAgIGV2ZW50cy5wdXNoKHtjYWxsYmFjazogY2FsbGJhY2ssIGNvbnRleHQ6IGNvbnRleHQsIGN0eDogY29udGV4dCB8fCB0aGlzfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBvbmx5IGJlIHRyaWdnZXJlZCBhIHNpbmdsZSB0aW1lLiBBZnRlciB0aGUgZmlyc3QgdGltZVxuICAgIC8vIHRoZSBjYWxsYmFjayBpcyBpbnZva2VkLCBpdCB3aWxsIGJlIHJlbW92ZWQuXG4gICAgb25jZTogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICdvbmNlJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBvbmNlID0gXy5vbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLm9mZihuYW1lLCBvbmNlKTtcbiAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgICAgb25jZS5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgIHJldHVybiB0aGlzLm9uKG5hbWUsIG9uY2UsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgb25lIG9yIG1hbnkgY2FsbGJhY2tzLiBJZiBgY29udGV4dGAgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3Mgd2l0aCB0aGF0IGZ1bmN0aW9uLiBJZiBgY2FsbGJhY2tgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIGZvciB0aGUgZXZlbnQuIElmIGBuYW1lYCBpcyBudWxsLCByZW1vdmVzIGFsbCBib3VuZFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgYWxsIGV2ZW50cy5cbiAgICBvZmY6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmV0YWluLCBldiwgZXZlbnRzLCBuYW1lcywgaSwgbCwgaiwgaztcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICFldmVudHNBcGkodGhpcywgJ29mZicsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pKSByZXR1cm4gdGhpcztcbiAgICAgIGlmICghbmFtZSAmJiAhY2FsbGJhY2sgJiYgIWNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBuYW1lcyA9IG5hbWUgPyBbbmFtZV0gOiBfLmtleXModGhpcy5fZXZlbnRzKTtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICBpZiAoZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdID0gcmV0YWluID0gW107XG4gICAgICAgICAgaWYgKGNhbGxiYWNrIHx8IGNvbnRleHQpIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGsgPSBldmVudHMubGVuZ3RoOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICAgIGV2ID0gZXZlbnRzW2pdO1xuICAgICAgICAgICAgICBpZiAoKGNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldi5jYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2suX2NhbGxiYWNrKSB8fFxuICAgICAgICAgICAgICAgICAgKGNvbnRleHQgJiYgY29udGV4dCAhPT0gZXYuY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICByZXRhaW4ucHVzaChldik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFyZXRhaW4ubGVuZ3RoKSBkZWxldGUgdGhpcy5fZXZlbnRzW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBUcmlnZ2VyIG9uZSBvciBtYW55IGV2ZW50cywgZmlyaW5nIGFsbCBib3VuZCBjYWxsYmFja3MuIENhbGxiYWNrcyBhcmVcbiAgICAvLyBwYXNzZWQgdGhlIHNhbWUgYXJndW1lbnRzIGFzIGB0cmlnZ2VyYCBpcywgYXBhcnQgZnJvbSB0aGUgZXZlbnQgbmFtZVxuICAgIC8vICh1bmxlc3MgeW91J3JlIGxpc3RlbmluZyBvbiBgXCJhbGxcImAsIHdoaWNoIHdpbGwgY2F1c2UgeW91ciBjYWxsYmFjayB0b1xuICAgIC8vIHJlY2VpdmUgdGhlIHRydWUgbmFtZSBvZiB0aGUgZXZlbnQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50KS5cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICd0cmlnZ2VyJywgbmFtZSwgYXJncykpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgIHZhciBhbGxFdmVudHMgPSB0aGlzLl9ldmVudHMuYWxsO1xuICAgICAgaWYgKGV2ZW50cykgdHJpZ2dlckV2ZW50cyhldmVudHMsIGFyZ3MpO1xuICAgICAgaWYgKGFsbEV2ZW50cykgdHJpZ2dlckV2ZW50cyhhbGxFdmVudHMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVGVsbCB0aGlzIG9iamVjdCB0byBzdG9wIGxpc3RlbmluZyB0byBlaXRoZXIgc3BlY2lmaWMgZXZlbnRzIC4uLiBvclxuICAgIC8vIHRvIGV2ZXJ5IG9iamVjdCBpdCdzIGN1cnJlbnRseSBsaXN0ZW5pbmcgdG8uXG4gICAgc3RvcExpc3RlbmluZzogZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycztcbiAgICAgIGlmICghbGlzdGVuZXJzKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBkZWxldGVMaXN0ZW5lciA9ICFuYW1lICYmICFjYWxsYmFjaztcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIGlmIChvYmopIChsaXN0ZW5lcnMgPSB7fSlbb2JqLl9saXN0ZW5lcklkXSA9IG9iajtcbiAgICAgIGZvciAodmFyIGlkIGluIGxpc3RlbmVycykge1xuICAgICAgICBsaXN0ZW5lcnNbaWRdLm9mZihuYW1lLCBjYWxsYmFjaywgdGhpcyk7XG4gICAgICAgIGlmIChkZWxldGVMaXN0ZW5lcikgZGVsZXRlIHRoaXMuX2xpc3RlbmVyc1tpZF07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgfTtcblxuICAvLyBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBzcGxpdCBldmVudCBzdHJpbmdzLlxuICB2YXIgZXZlbnRTcGxpdHRlciA9IC9cXHMrLztcblxuICAvLyBJbXBsZW1lbnQgZmFuY3kgZmVhdHVyZXMgb2YgdGhlIEV2ZW50cyBBUEkgc3VjaCBhcyBtdWx0aXBsZSBldmVudFxuICAvLyBuYW1lcyBgXCJjaGFuZ2UgYmx1clwiYCBhbmQgalF1ZXJ5LXN0eWxlIGV2ZW50IG1hcHMgYHtjaGFuZ2U6IGFjdGlvbn1gXG4gIC8vIGluIHRlcm1zIG9mIHRoZSBleGlzdGluZyBBUEkuXG4gIHZhciBldmVudHNBcGkgPSBmdW5jdGlvbihvYmosIGFjdGlvbiwgbmFtZSwgcmVzdCkge1xuICAgIGlmICghbmFtZSkgcmV0dXJuIHRydWU7XG5cbiAgICAvLyBIYW5kbGUgZXZlbnQgbWFwcy5cbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gbmFtZSkge1xuICAgICAgICBvYmpbYWN0aW9uXS5hcHBseShvYmosIFtrZXksIG5hbWVba2V5XV0uY29uY2F0KHJlc3QpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgc3BhY2Ugc2VwYXJhdGVkIGV2ZW50IG5hbWVzLlxuICAgIGlmIChldmVudFNwbGl0dGVyLnRlc3QobmFtZSkpIHtcbiAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoZXZlbnRTcGxpdHRlcik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBvYmpbYWN0aW9uXS5hcHBseShvYmosIFtuYW1lc1tpXV0uY29uY2F0KHJlc3QpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBBIGRpZmZpY3VsdC10by1iZWxpZXZlLCBidXQgb3B0aW1pemVkIGludGVybmFsIGRpc3BhdGNoIGZ1bmN0aW9uIGZvclxuICAvLyB0cmlnZ2VyaW5nIGV2ZW50cy4gVHJpZXMgdG8ga2VlcCB0aGUgdXN1YWwgY2FzZXMgc3BlZWR5IChtb3N0IGludGVybmFsXG4gIC8vIEJhY2tib25lIGV2ZW50cyBoYXZlIDMgYXJndW1lbnRzKS5cbiAgdmFyIHRyaWdnZXJFdmVudHMgPSBmdW5jdGlvbihldmVudHMsIGFyZ3MpIHtcbiAgICB2YXIgZXYsIGkgPSAtMSwgbCA9IGV2ZW50cy5sZW5ndGgsIGExID0gYXJnc1swXSwgYTIgPSBhcmdzWzFdLCBhMyA9IGFyZ3NbMl07XG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCk7IHJldHVybjtcbiAgICAgIGNhc2UgMTogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExKTsgcmV0dXJuO1xuICAgICAgY2FzZSAyOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyKTsgcmV0dXJuO1xuICAgICAgY2FzZSAzOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyLCBhMyk7IHJldHVybjtcbiAgICAgIGRlZmF1bHQ6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmFwcGx5KGV2LmN0eCwgYXJncyk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBsaXN0ZW5NZXRob2RzID0ge2xpc3RlblRvOiAnb24nLCBsaXN0ZW5Ub09uY2U6ICdvbmNlJ307XG5cbiAgLy8gSW52ZXJzaW9uLW9mLWNvbnRyb2wgdmVyc2lvbnMgb2YgYG9uYCBhbmQgYG9uY2VgLiBUZWxsICp0aGlzKiBvYmplY3QgdG9cbiAgLy8gbGlzdGVuIHRvIGFuIGV2ZW50IGluIGFub3RoZXIgb2JqZWN0IC4uLiBrZWVwaW5nIHRyYWNrIG9mIHdoYXQgaXQnc1xuICAvLyBsaXN0ZW5pbmcgdG8uXG4gIF8uZWFjaChsaXN0ZW5NZXRob2RzLCBmdW5jdGlvbihpbXBsZW1lbnRhdGlvbiwgbWV0aG9kKSB7XG4gICAgRXZlbnRzW21ldGhvZF0gPSBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzIHx8ICh0aGlzLl9saXN0ZW5lcnMgPSB7fSk7XG4gICAgICB2YXIgaWQgPSBvYmouX2xpc3RlbmVySWQgfHwgKG9iai5fbGlzdGVuZXJJZCA9IF8udW5pcXVlSWQoJ2wnKSk7XG4gICAgICBsaXN0ZW5lcnNbaWRdID0gb2JqO1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JykgY2FsbGJhY2sgPSB0aGlzO1xuICAgICAgb2JqW2ltcGxlbWVudGF0aW9uXShuYW1lLCBjYWxsYmFjaywgdGhpcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICB9KTtcblxuICAvLyBBbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgRXZlbnRzLmJpbmQgICA9IEV2ZW50cy5vbjtcbiAgRXZlbnRzLnVuYmluZCA9IEV2ZW50cy5vZmY7XG5cbiAgLy8gTWl4aW4gdXRpbGl0eVxuICBFdmVudHMubWl4aW4gPSBmdW5jdGlvbihwcm90bykge1xuICAgIHZhciBleHBvcnRzID0gWydvbicsICdvbmNlJywgJ29mZicsICd0cmlnZ2VyJywgJ3N0b3BMaXN0ZW5pbmcnLCAnbGlzdGVuVG8nLFxuICAgICAgICAgICAgICAgICAgICdsaXN0ZW5Ub09uY2UnLCAnYmluZCcsICd1bmJpbmQnXTtcbiAgICBfLmVhY2goZXhwb3J0cywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgcHJvdG9bbmFtZV0gPSB0aGlzW25hbWVdO1xuICAgIH0sIHRoaXMpO1xuICAgIHJldHVybiBwcm90bztcbiAgfTtcblxuICAvLyBFeHBvcnQgRXZlbnRzIGFzIEJhY2tib25lRXZlbnRzIGRlcGVuZGluZyBvbiBjdXJyZW50IGNvbnRleHRcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBFdmVudHM7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7XG4gICAgfVxuICAgIGV4cG9ydHMuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfVxufSkodGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2FwaS5qc1wiKTtcbiIsInZhciBhcGkgPSBmdW5jdGlvbiAod2hvKSB7XG5cbiAgICB2YXIgX21ldGhvZHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBtID0gW107XG5cblx0bS5hZGRfYmF0Y2ggPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICBtLnVuc2hpZnQob2JqKTtcblx0fTtcblxuXHRtLnVwZGF0ZSA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRtW2ldW3BdID0gdmFsdWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBmYWxzZTtcblx0fTtcblxuXHRtLmFkZCA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlKSB7XG5cdCAgICBpZiAobS51cGRhdGUgKG1ldGhvZCwgdmFsdWUpICkge1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgcmVnID0ge307XG5cdFx0cmVnW21ldGhvZF0gPSB2YWx1ZTtcblx0XHRtLmFkZF9iYXRjaCAocmVnKTtcblx0ICAgIH1cblx0fTtcblxuXHRtLmdldCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdHJldHVybiBtW2ldW3BdO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHR9O1xuXG5cdHJldHVybiBtO1xuICAgIH07XG5cbiAgICB2YXIgbWV0aG9kcyAgICA9IF9tZXRob2RzKCk7XG4gICAgdmFyIGFwaSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgYXBpLmNoZWNrID0gZnVuY3Rpb24gKG1ldGhvZCwgY2hlY2ssIG1zZykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkuY2hlY2sobWV0aG9kW2ldLCBjaGVjaywgbXNnKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC5jaGVjayhjaGVjaywgbXNnKTtcblx0fSBlbHNlIHtcblx0ICAgIHdob1ttZXRob2RdLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAobWV0aG9kLCBjYmFrKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS50cmFuc2Zvcm0gKG1ldGhvZFtpXSwgY2Jhayk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QudHJhbnNmb3JtIChjYmFrKTtcblx0fSBlbHNlIHtcblx0ICAgIHdob1ttZXRob2RdLnRyYW5zZm9ybShjYmFrKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICB2YXIgYXR0YWNoX21ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QsIG9wdHMpIHtcblx0dmFyIGNoZWNrcyA9IFtdO1xuXHR2YXIgdHJhbnNmb3JtcyA9IFtdO1xuXG5cdHZhciBnZXR0ZXIgPSBvcHRzLm9uX2dldHRlciB8fCBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gbWV0aG9kcy5nZXQobWV0aG9kKTtcblx0fTtcblxuXHR2YXIgc2V0dGVyID0gb3B0cy5vbl9zZXR0ZXIgfHwgZnVuY3Rpb24gKHgpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFuc2Zvcm1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0eCA9IHRyYW5zZm9ybXNbaV0oeCk7XG5cdCAgICB9XG5cblx0ICAgIGZvciAodmFyIGo9MDsgajxjaGVja3MubGVuZ3RoOyBqKyspIHtcblx0XHRpZiAoIWNoZWNrc1tqXS5jaGVjayh4KSkge1xuXHRcdCAgICB2YXIgbXNnID0gY2hlY2tzW2pdLm1zZyB8fCBcblx0XHRcdChcIlZhbHVlIFwiICsgeCArIFwiIGRvZXNuJ3Qgc2VlbSB0byBiZSB2YWxpZCBmb3IgdGhpcyBtZXRob2RcIik7XG5cdFx0ICAgIHRocm93IChtc2cpO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIG1ldGhvZHMuYWRkKG1ldGhvZCwgeCk7XG5cdH07XG5cblx0dmFyIG5ld19tZXRob2QgPSBmdW5jdGlvbiAobmV3X3ZhbCkge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGdldHRlcigpO1xuXHQgICAgfVxuXHQgICAgc2V0dGVyKG5ld192YWwpO1xuXHQgICAgcmV0dXJuIHdobzsgLy8gUmV0dXJuIHRoaXM/XG5cdH07XG5cdG5ld19tZXRob2QuY2hlY2sgPSBmdW5jdGlvbiAoY2JhaywgbXNnKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gY2hlY2tzO1xuXHQgICAgfVxuXHQgICAgY2hlY2tzLnB1c2ggKHtjaGVjayA6IGNiYWssXG5cdFx0XHQgIG1zZyAgIDogbXNnfSk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fTtcblx0bmV3X21ldGhvZC50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY2Jhaykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIHRyYW5zZm9ybXM7XG5cdCAgICB9XG5cdCAgICB0cmFuc2Zvcm1zLnB1c2goY2Jhayk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fTtcblxuXHR3aG9bbWV0aG9kXSA9IG5ld19tZXRob2Q7XG4gICAgfTtcblxuICAgIHZhciBnZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIG9wdHMpIHtcblx0aWYgKHR5cGVvZiAocGFyYW0pID09PSAnb2JqZWN0Jykge1xuXHQgICAgbWV0aG9kcy5hZGRfYmF0Y2ggKHBhcmFtKTtcblx0ICAgIGZvciAodmFyIHAgaW4gcGFyYW0pIHtcblx0XHRhdHRhY2hfbWV0aG9kIChwLCBvcHRzKTtcblx0ICAgIH1cblx0fSBlbHNlIHtcblx0ICAgIG1ldGhvZHMuYWRkIChwYXJhbSwgb3B0cy5kZWZhdWx0X3ZhbHVlKTtcblx0ICAgIGF0dGFjaF9tZXRob2QgKHBhcmFtLCBvcHRzKTtcblx0fVxuICAgIH07XG5cbiAgICBhcGkuZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZn0pO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5nZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fc2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIGdldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgc2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX3NldHRlciA6IG9uX3NldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuc2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX2dldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBzZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIGdldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9nZXR0ZXIgOiBvbl9nZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCA9IGZ1bmN0aW9uIChuYW1lLCBjYmFrKSB7XG5cdGlmICh0eXBlb2YgKG5hbWUpID09PSAnb2JqZWN0Jykge1xuXHQgICAgZm9yICh2YXIgcCBpbiBuYW1lKSB7XG5cdFx0d2hvW3BdID0gbmFtZVtwXTtcblx0ICAgIH1cblx0fSBlbHNlIHtcblx0ICAgIHdob1tuYW1lXSA9IGNiYWs7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFwaTtcbiAgICBcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGFwaTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9uZXdpY2suanNcIik7XG4iLCIvKipcbiAqIE5ld2ljayBhbmQgbmh4IGZvcm1hdHMgcGFyc2VyIGluIEphdmFTY3JpcHQuXG4gKlxuICogQ29weXJpZ2h0IChjKSBKYXNvbiBEYXZpZXMgMjAxMCBhbmQgTWlndWVsIFBpZ25hdGVsbGlcbiAqICBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqICBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqICBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICpcbiAqIEV4YW1wbGUgdHJlZSAoZnJvbSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL05ld2lja19mb3JtYXQpOlxuICpcbiAqICstLTAuMS0tQVxuICogRi0tLS0tMC4yLS0tLS1CICAgICAgICAgICAgKy0tLS0tLS0wLjMtLS0tQ1xuICogKy0tLS0tLS0tLS0tLS0tLS0tLTAuNS0tLS0tRVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgKy0tLS0tLS0tLTAuNC0tLS0tLURcbiAqXG4gKiBOZXdpY2sgZm9ybWF0OlxuICogKEE6MC4xLEI6MC4yLChDOjAuMyxEOjAuNClFOjAuNSlGO1xuICpcbiAqIENvbnZlcnRlZCB0byBKU09OOlxuICoge1xuICogICBuYW1lOiBcIkZcIixcbiAqICAgYnJhbmNoc2V0OiBbXG4gKiAgICAge25hbWU6IFwiQVwiLCBsZW5ndGg6IDAuMX0sXG4gKiAgICAge25hbWU6IFwiQlwiLCBsZW5ndGg6IDAuMn0sXG4gKiAgICAge1xuICogICAgICAgbmFtZTogXCJFXCIsXG4gKiAgICAgICBsZW5ndGg6IDAuNSxcbiAqICAgICAgIGJyYW5jaHNldDogW1xuICogICAgICAgICB7bmFtZTogXCJDXCIsIGxlbmd0aDogMC4zfSxcbiAqICAgICAgICAge25hbWU6IFwiRFwiLCBsZW5ndGg6IDAuNH1cbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIF1cbiAqIH1cbiAqXG4gKiBDb252ZXJ0ZWQgdG8gSlNPTiwgYnV0IHdpdGggbm8gbmFtZXMgb3IgbGVuZ3RoczpcbiAqIHtcbiAqICAgYnJhbmNoc2V0OiBbXG4gKiAgICAge30sIHt9LCB7XG4gKiAgICAgICBicmFuY2hzZXQ6IFt7fSwge31dXG4gKiAgICAgfVxuICogICBdXG4gKiB9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcGFyc2VfbmV3aWNrIDogZnVuY3Rpb24ocykge1xuXHR2YXIgYW5jZXN0b3JzID0gW107XG5cdHZhciB0cmVlID0ge307XG5cdHZhciB0b2tlbnMgPSBzLnNwbGl0KC9cXHMqKDt8XFwofFxcKXwsfDopXFxzKi8pO1xuXHR2YXIgc3VidHJlZTtcblx0Zm9yICh2YXIgaT0wOyBpPHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXHQgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgICAgY2FzZSAnKCc6IC8vIG5ldyBicmFuY2hzZXRcblx0XHRzdWJ0cmVlID0ge307XG5cdFx0dHJlZS5jaGlsZHJlbiA9IFtzdWJ0cmVlXTtcblx0XHRhbmNlc3RvcnMucHVzaCh0cmVlKTtcblx0XHR0cmVlID0gc3VidHJlZTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJywnOiAvLyBhbm90aGVyIGJyYW5jaFxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHRhbmNlc3RvcnNbYW5jZXN0b3JzLmxlbmd0aC0xXS5jaGlsZHJlbi5wdXNoKHN1YnRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnKSc6IC8vIG9wdGlvbmFsIG5hbWUgbmV4dFxuXHRcdHRyZWUgPSBhbmNlc3RvcnMucG9wKCk7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICc6JzogLy8gb3B0aW9uYWwgbGVuZ3RoIG5leHRcblx0XHRicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG5cdFx0dmFyIHggPSB0b2tlbnNbaS0xXTtcblx0XHRpZiAoeCA9PSAnKScgfHwgeCA9PSAnKCcgfHwgeCA9PSAnLCcpIHtcblx0XHQgICAgdHJlZS5uYW1lID0gdG9rZW47XG5cdFx0fSBlbHNlIGlmICh4ID09ICc6Jykge1xuXHRcdCAgICB0cmVlLmJyYW5jaF9sZW5ndGggPSBwYXJzZUZsb2F0KHRva2VuKTtcblx0XHR9XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRyZWU7XG4gICAgfSxcblxuICAgIHBhcnNlX25oeCA6IGZ1bmN0aW9uIChzKSB7XG5cdHZhciBhbmNlc3RvcnMgPSBbXTtcblx0dmFyIHRyZWUgPSB7fTtcblx0dmFyIHN1YnRyZWU7XG5cblx0dmFyIHRva2VucyA9IHMuc3BsaXQoIC9cXHMqKDt8XFwofFxcKXxcXFt8XFxdfCx8Onw9KVxccyovICk7XG5cdGZvciAodmFyIGk9MDsgaTx0b2tlbnMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXTtcblx0ICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgICAgICAgIGNhc2UgJygnOiAvLyBuZXcgY2hpbGRyZW5cblx0XHRzdWJ0cmVlID0ge307XG5cdFx0dHJlZS5jaGlsZHJlbiA9IFtzdWJ0cmVlXTtcblx0XHRhbmNlc3RvcnMucHVzaCh0cmVlKTtcblx0XHR0cmVlID0gc3VidHJlZTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJywnOiAvLyBhbm90aGVyIGJyYW5jaFxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHRhbmNlc3RvcnNbYW5jZXN0b3JzLmxlbmd0aC0xXS5jaGlsZHJlbi5wdXNoKHN1YnRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnKSc6IC8vIG9wdGlvbmFsIG5hbWUgbmV4dFxuXHRcdHRyZWUgPSBhbmNlc3RvcnMucG9wKCk7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICc6JzogLy8gb3B0aW9uYWwgbGVuZ3RoIG5leHRcblx0XHRicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG5cdFx0dmFyIHggPSB0b2tlbnNbaS0xXTtcblx0XHRpZiAoeCA9PSAnKScgfHwgeCA9PSAnKCcgfHwgeCA9PSAnLCcpIHtcblx0XHQgICAgdHJlZS5uYW1lID0gdG9rZW47XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHggPT0gJzonKSB7XG5cdFx0ICAgIHZhciB0ZXN0X3R5cGUgPSB0eXBlb2YgdG9rZW47XG5cdFx0ICAgIGlmKCFpc05hTih0b2tlbikpe1xuXHRcdFx0dHJlZS5icmFuY2hfbGVuZ3RoID0gcGFyc2VGbG9hdCh0b2tlbik7XG5cdFx0ICAgIH1cblx0XHR9XG5cdFx0ZWxzZSBpZiAoeCA9PSAnPScpe1xuXHRcdCAgICB2YXIgeDIgPSB0b2tlbnNbaS0yXTtcblx0XHQgICAgc3dpdGNoKHgyKXtcblx0XHQgICAgY2FzZSAnRCc6XG5cdFx0XHR0cmVlLmR1cGxpY2F0aW9uID0gdG9rZW47XG5cdFx0XHRicmVhaztcblx0XHQgICAgY2FzZSAnRyc6XG5cdFx0XHR0cmVlLmdlbmVfaWQgPSB0b2tlbjtcblx0XHRcdGJyZWFrO1xuXHRcdCAgICBjYXNlICdUJzpcblx0XHRcdHRyZWUudGF4b25faWQgPSB0b2tlbjtcblx0XHRcdGJyZWFrO1xuXHRcdCAgICBkZWZhdWx0IDpcblx0XHRcdHRyZWVbdG9rZW5zW2ktMl1dID0gdG9rZW47XG5cdFx0ICAgIH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0ICAgIHZhciB0ZXN0O1xuXG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0cmVlO1xuICAgIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9ub2RlLmpzXCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIvLyByZXF1aXJlKCdmcycpLnJlYWRkaXJTeW5jKF9fZGlybmFtZSArICcvJykuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4vLyAgICAgaWYgKGZpbGUubWF0Y2goLy4rXFwuanMvZykgIT09IG51bGwgJiYgZmlsZSAhPT0gX19maWxlbmFtZSkge1xuLy8gXHR2YXIgbmFtZSA9IGZpbGUucmVwbGFjZSgnLmpzJywgJycpO1xuLy8gXHRtb2R1bGUuZXhwb3J0c1tuYW1lXSA9IHJlcXVpcmUoJy4vJyArIGZpbGUpO1xuLy8gICAgIH1cbi8vIH0pO1xuXG4vLyBTYW1lIGFzXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnV0aWxzLnJlZHVjZSA9IHJlcXVpcmUoXCIuL3JlZHVjZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHV0aWxzO1xuIiwidmFyIHJlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc21vb3RoID0gNTtcbiAgICB2YXIgdmFsdWUgPSAndmFsJztcbiAgICB2YXIgcmVkdW5kYW50ID0gZnVuY3Rpb24gKGEsIGIpIHtcblx0aWYgKGEgPCBiKSB7XG5cdCAgICByZXR1cm4gKChiLWEpIDw9IChiICogMC4yKSk7XG5cdH1cblx0cmV0dXJuICgoYS1iKSA8PSAoYSAqIDAuMikpO1xuICAgIH07XG4gICAgdmFyIHBlcmZvcm1fcmVkdWNlID0gZnVuY3Rpb24gKGFycikge3JldHVybiBhcnI7fTtcblxuICAgIHZhciByZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmICghYXJyLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoZWQgPSBwZXJmb3JtX3Ntb290aChhcnIpO1xuXHR2YXIgcmVkdWNlZCAgPSBwZXJmb3JtX3JlZHVjZShzbW9vdGhlZCk7XG5cdHJldHVybiByZWR1Y2VkO1xuICAgIH07XG5cbiAgICB2YXIgbWVkaWFuID0gZnVuY3Rpb24gKHYsIGFycikge1xuXHRhcnIuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHQgICAgcmV0dXJuIGFbdmFsdWVdIC0gYlt2YWx1ZV07XG5cdH0pO1xuXHRpZiAoYXJyLmxlbmd0aCAlIDIpIHtcblx0ICAgIHZbdmFsdWVdID0gYXJyW35+KGFyci5sZW5ndGggLyAyKV1bdmFsdWVdO1x0ICAgIFxuXHR9IGVsc2Uge1xuXHQgICAgdmFyIG4gPSB+fihhcnIubGVuZ3RoIC8gMikgLSAxO1xuXHQgICAgdlt2YWx1ZV0gPSAoYXJyW25dW3ZhbHVlXSArIGFycltuKzFdW3ZhbHVlXSkgLyAyO1xuXHR9XG5cblx0cmV0dXJuIHY7XG4gICAgfTtcblxuICAgIHZhciBjbG9uZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcblx0dmFyIHRhcmdldCA9IHt9O1xuXHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuXHQgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICB2YXIgcGVyZm9ybV9zbW9vdGggPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmIChzbW9vdGggPT09IDApIHsgLy8gbm8gc21vb3RoXG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhfYXJyID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBsb3cgPSAoaSA8IHNtb290aCkgPyAwIDogKGkgLSBzbW9vdGgpO1xuXHQgICAgdmFyIGhpZ2ggPSAoaSA+IChhcnIubGVuZ3RoIC0gc21vb3RoKSkgPyBhcnIubGVuZ3RoIDogKGkgKyBzbW9vdGgpO1xuXHQgICAgc21vb3RoX2FycltpXSA9IG1lZGlhbihjbG9uZShhcnJbaV0pLCBhcnIuc2xpY2UobG93LGhpZ2grMSkpO1xuXHR9XG5cdHJldHVybiBzbW9vdGhfYXJyO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdWNlciA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHBlcmZvcm1fcmVkdWNlO1xuXHR9XG5cdHBlcmZvcm1fcmVkdWNlID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVuZGFudCA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHJlZHVuZGFudDtcblx0fVxuXHRyZWR1bmRhbnQgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUgPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cdHZhbHVlID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2Uuc21vb3RoID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBzbW9vdGg7XG5cdH1cblx0c21vb3RoID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkdWNlO1xufTtcblxudmFyIGJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKVxuXHQudmFsdWUoJ3N0YXJ0Jyk7XG5cbiAgICB2YXIgdmFsdWUyID0gJ2VuZCc7XG5cbiAgICB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnb2JqZWN0JyA6IHtcbiAgICAgICAgICAgICAgICAnc3RhcnQnIDogb2JqMS5vYmplY3RbcmVkLnZhbHVlKCldLFxuICAgICAgICAgICAgICAgICdlbmQnICAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndmFsdWUnICA6IG9iajJbdmFsdWUyXVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7IHJldHVybiBvYmoxIH07XG5cbiAgICByZWQucmVkdWNlciggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0ge1xuXHQgICAgJ29iamVjdCcgOiBhcnJbMF0sXG5cdCAgICAndmFsdWUnICA6IGFyclswXVt2YWx1ZTJdXG5cdH07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnIudmFsdWUpKSB7XG5cdFx0Y3VyciA9IGpvaW4oY3VyciwgYXJyW2ldKTtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIub2JqZWN0KTtcblx0ICAgIGN1cnIub2JqZWN0ID0gYXJyW2ldO1xuXHQgICAgY3Vyci52YWx1ZSA9IGFycltpXS5lbmQ7XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyLm9iamVjdCk7XG5cblx0Ly8gcmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJlZHVjZS5qb2luID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gam9pbjtcblx0fVxuXHRqb2luID0gY2Jhaztcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlMiA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTI7XG5cdH1cblx0dmFsdWUyID0gZmllbGQ7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJldHVybiByZWQ7XG59O1xuXG52YXIgbGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKCk7XG5cbiAgICByZWQucmVkdWNlciAoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IGFyclswXTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGgtMTsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyW3ZhbHVlXSkpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIpO1xuXHQgICAgY3VyciA9IGFycltpXTtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIpO1xuXHRyZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlZDtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2U7XG5tb2R1bGUuZXhwb3J0cy5saW5lID0gbGluZTtcbm1vZHVsZS5leHBvcnRzLmJsb2NrID0gYmxvY2s7XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXRlcmF0b3IgOiBmdW5jdGlvbihpbml0X3ZhbCkge1xuXHR2YXIgaSA9IGluaXRfdmFsIHx8IDA7XG5cdHZhciBpdGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIGkrKztcblx0fTtcblx0cmV0dXJuIGl0ZXI7XG4gICAgfSxcblxuICAgIHNjcmlwdF9wYXRoIDogZnVuY3Rpb24gKHNjcmlwdF9uYW1lKSB7IC8vIHNjcmlwdF9uYW1lIGlzIHRoZSBmaWxlbmFtZVxuXHR2YXIgc2NyaXB0X3NjYXBlZCA9IHNjcmlwdF9uYW1lLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuXHR2YXIgc2NyaXB0X3JlID0gbmV3IFJlZ0V4cChzY3JpcHRfc2NhcGVkICsgJyQnKTtcblx0dmFyIHNjcmlwdF9yZV9zdWIgPSBuZXcgUmVnRXhwKCcoLiopJyArIHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXG5cdC8vIFRPRE86IFRoaXMgcmVxdWlyZXMgcGhhbnRvbS5qcyBvciBhIHNpbWlsYXIgaGVhZGxlc3Mgd2Via2l0IHRvIHdvcmsgKGRvY3VtZW50KVxuXHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0dmFyIHBhdGggPSBcIlwiOyAgLy8gRGVmYXVsdCB0byBjdXJyZW50IHBhdGhcblx0aWYoc2NyaXB0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgaW4gc2NyaXB0cykge1xuXHRcdGlmKHNjcmlwdHNbaV0uc3JjICYmIHNjcmlwdHNbaV0uc3JjLm1hdGNoKHNjcmlwdF9yZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdHNbaV0uc3JjLnJlcGxhY2Uoc2NyaXB0X3JlX3N1YiwgJyQxJyk7XG5cdFx0fVxuICAgICAgICAgICAgfVxuXHR9XG5cdHJldHVybiBwYXRoO1xuICAgIH0sXG5cbiAgICBkZWZlcl9jYW5jZWwgOiBmdW5jdGlvbiAoY2JhaywgdGltZSkge1xuXHR2YXIgdGljaztcblxuXHR2YXIgZGVmZXJfY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgY2xlYXJUaW1lb3V0KHRpY2spO1xuXHQgICAgdGljayA9IHNldFRpbWVvdXQoY2JhaywgdGltZSk7XG5cdH07XG5cblx0cmV0dXJuIGRlZmVyX2NhbmNlbDtcbiAgICB9XG59O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG52YXIgdG50X25vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy90bnQudHJlZS5ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub2RlID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG5vZGUpO1xuXG4gICAgLy8gQVBJXG4vLyAgICAgbm9kZS5ub2RlcyA9IGZ1bmN0aW9uKCkge1xuLy8gXHRpZiAoY2x1c3RlciA9PT0gdW5kZWZpbmVkKSB7XG4vLyBcdCAgICBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuLy8gXHQgICAgLy8gVE9ETzogbGVuZ3RoIGFuZCBjaGlsZHJlbiBzaG91bGQgYmUgZXhwb3NlZCBpbiB0aGUgQVBJXG4vLyBcdCAgICAvLyBpLmUuIHRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNoYW5nZSB0aGlzIGRlZmF1bHRzIHZpYSB0aGUgQVBJXG4vLyBcdCAgICAvLyBjaGlsZHJlbiBpcyB0aGUgZGVmYXVsdHMgZm9yIHBhcnNlX25ld2ljaywgYnV0IG1heWJlIHdlIHNob3VsZCBjaGFuZ2UgdGhhdFxuLy8gXHQgICAgLy8gb3IgYXQgbGVhc3Qgbm90IGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZSBmb3IgdGhlIGRhdGEgcHJvdmlkZWRcbi8vIFx0XHQudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmxlbmd0aH0pXG4vLyBcdFx0LmNoaWxkcmVuKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jaGlsZHJlbn0pO1xuLy8gXHR9XG4vLyBcdG5vZGVzID0gY2x1c3Rlci5ub2RlcyhkYXRhKTtcbi8vIFx0cmV0dXJuIG5vZGVzO1xuLy8gICAgIH07XG5cbiAgICB2YXIgYXBwbHlfdG9fZGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYmFrKSB7XG5cdGNiYWsoZGF0YSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBwbHlfdG9fZGF0YShkYXRhLmNoaWxkcmVuW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlX2lkcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGkgPSBpdGVyYXRvcigxKTtcblx0Ly8gV2UgY2FuJ3QgdXNlIGFwcGx5IGJlY2F1c2UgYXBwbHkgY3JlYXRlcyBuZXcgdHJlZXMgb24gZXZlcnkgbm9kZVxuXHQvLyBXZSBzaG91bGQgdXNlIHRoZSBkaXJlY3QgZGF0YSBpbnN0ZWFkXG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICBpZiAoZC5faWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX2lkID0gaSgpO1xuXHRcdC8vIFRPRE86IE5vdCBzdXJlIF9pblN1YlRyZWUgaXMgc3RyaWN0bHkgbmVjZXNzYXJ5XG5cdFx0Ly8gZC5faW5TdWJUcmVlID0ge3ByZXY6dHJ1ZSwgY3Vycjp0cnVlfTtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIHZhciBsaW5rX3BhcmVudHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBfcGFyZW50P1xuXHQgICAgZGF0YS5jaGlsZHJlbltpXS5fcGFyZW50ID0gZGF0YTtcblx0ICAgIGxpbmtfcGFyZW50cyhkYXRhLmNoaWxkcmVuW2ldKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgY29tcHV0ZV9yb290X2Rpc3RzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0Ly8gY29uc29sZS5sb2coZGF0YSk7XG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICB2YXIgbDtcblx0ICAgIGlmIChkLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX3Jvb3RfZGlzdCA9IDA7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciBsID0gMDtcblx0XHRpZiAoZC5icmFuY2hfbGVuZ3RoKSB7XG5cdFx0ICAgIGwgPSBkLmJyYW5jaF9sZW5ndGhcblx0XHR9XG5cdFx0ZC5fcm9vdF9kaXN0ID0gbCArIGQuX3BhcmVudC5fcm9vdF9kaXN0O1xuXHQgICAgfVxuXHR9KTtcbiAgICB9O1xuXG4gICAgLy8gVE9ETzogZGF0YSBjYW4ndCBiZSByZXdyaXR0ZW4gdXNlZCB0aGUgYXBpIHlldC4gV2UgbmVlZCBmaW5hbGl6ZXJzXG4gICAgbm9kZS5kYXRhID0gZnVuY3Rpb24obmV3X2RhdGEpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gZGF0YVxuXHR9XG5cdGRhdGEgPSBuZXdfZGF0YTtcblx0Y3JlYXRlX2lkcygpO1xuXHRsaW5rX3BhcmVudHMoZGF0YSk7XG5cdGNvbXB1dGVfcm9vdF9kaXN0cyhkYXRhKTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfTtcbiAgICAvLyBXZSBiaW5kIHRoZSBkYXRhIHRoYXQgaGFzIGJlZW4gcGFzc2VkXG4gICAgbm9kZS5kYXRhKGRhdGEpO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZScsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdGlmIChjYmFrKG5vZGUpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWspO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0aWYgKGRlZXAgJiYgKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWspXG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWspO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlX2J5X25hbWUnLCBmdW5jdGlvbihuYW1lKSB7XG5cdHJldHVybiBub2RlLmZpbmRfbm9kZSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHJldHVybiBub2RlLm5vZGVfbmFtZSgpID09PSBuYW1lXG5cdH0pO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3RvZ2dsZScsIGZ1bmN0aW9uKCkge1xuXHRpZiAoZGF0YSkge1xuXHQgICAgaWYgKGRhdGEuY2hpbGRyZW4pIHsgLy8gVW5jb2xsYXBzZWQgLT4gY29sbGFwc2Vcblx0XHR2YXIgaGlkZGVuID0gMDtcblx0XHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHRcdCAgICB2YXIgaGlkZGVuX2hlcmUgPSBuLm5faGlkZGVuKCkgfHwgMDtcblx0XHQgICAgaGlkZGVuICs9IChuLm5faGlkZGVuKCkgfHwgMCkgKyAxO1xuXHRcdH0pO1xuXHRcdG5vZGUubl9oaWRkZW4gKGhpZGRlbi0xKTtcblx0XHRkYXRhLl9jaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW47XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IHVuZGVmaW5lZDtcblx0ICAgIH0gZWxzZSB7ICAgICAgICAgICAgIC8vIENvbGxhcHNlZCAtPiB1bmNvbGxhcHNlXG5cdFx0bm9kZS5uX2hpZGRlbigwKTtcblx0XHRkYXRhLmNoaWxkcmVuID0gZGF0YS5fY2hpbGRyZW47XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdpc19jb2xsYXBzZWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiAoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCAmJiBkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGhhc19hbmNlc3RvciA9IGZ1bmN0aW9uKG4sIGFuY2VzdG9yKSB7XG5cdC8vIEl0IGlzIGJldHRlciB0byB3b3JrIGF0IHRoZSBkYXRhIGxldmVsXG5cdG4gPSBuLmRhdGEoKTtcblx0YW5jZXN0b3IgPSBhbmNlc3Rvci5kYXRhKCk7XG5cdGlmIChuLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIGZhbHNlXG5cdH1cblx0biA9IG4uX3BhcmVudFxuXHRmb3IgKDs7KSB7XG5cdCAgICBpZiAobiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgaWYgKG4gPT09IGFuY2VzdG9yKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdCAgICB9XG5cdCAgICBuID0gbi5fcGFyZW50O1xuXHR9XG4gICAgfTtcblxuICAgIC8vIFRoaXMgaXMgdGhlIGVhc2llc3Qgd2F5IHRvIGNhbGN1bGF0ZSB0aGUgTENBIEkgY2FuIHRoaW5rIG9mLiBCdXQgaXQgaXMgdmVyeSBpbmVmZmljaWVudCB0b28uXG4gICAgLy8gSXQgaXMgd29ya2luZyBmaW5lIGJ5IG5vdywgYnV0IGluIGNhc2UgaXQgbmVlZHMgdG8gYmUgbW9yZSBwZXJmb3JtYW50IHdlIGNhbiBpbXBsZW1lbnQgdGhlIExDQVxuICAgIC8vIGFsZ29yaXRobSBleHBsYWluZWQgaGVyZTpcbiAgICAvLyBodHRwOi8vY29tbXVuaXR5LnRvcGNvZGVyLmNvbS90Yz9tb2R1bGU9U3RhdGljJmQxPXR1dG9yaWFscyZkMj1sb3dlc3RDb21tb25BbmNlc3RvclxuICAgIGFwaS5tZXRob2QgKCdsY2EnLCBmdW5jdGlvbiAobm9kZXMpIHtcblx0aWYgKG5vZGVzLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgcmV0dXJuIG5vZGVzWzBdO1xuXHR9XG5cdHZhciBsY2Ffbm9kZSA9IG5vZGVzWzBdO1xuXHRmb3IgKHZhciBpID0gMTsgaTxub2Rlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgbGNhX25vZGUgPSBfbGNhKGxjYV9ub2RlLCBub2Rlc1tpXSk7XG5cdH1cblx0cmV0dXJuIGxjYV9ub2RlO1xuXHQvLyByZXR1cm4gdG50X25vZGUobGNhX25vZGUpO1xuICAgIH0pO1xuXG4gICAgdmFyIF9sY2EgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcblx0aWYgKG5vZGUxLmRhdGEoKSA9PT0gbm9kZTIuZGF0YSgpKSB7XG5cdCAgICByZXR1cm4gbm9kZTE7XG5cdH1cblx0aWYgKGhhc19hbmNlc3Rvcihub2RlMSwgbm9kZTIpKSB7XG5cdCAgICByZXR1cm4gbm9kZTI7XG5cdH1cblx0cmV0dXJuIF9sY2Eobm9kZTEsIG5vZGUyLnBhcmVudCgpKTtcbiAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCgnbl9oaWRkZW4nLCBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIG5vZGUucHJvcGVydHkoJ19oaWRkZW4nKTtcblx0fVxuXHRub2RlLnByb3BlcnR5KCdfaGlkZGVuJywgdmFsKTtcblx0cmV0dXJuIG5vZGVcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX25vZGVzJywgZnVuY3Rpb24gKCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgbm9kZXMucHVzaChuKTtcblx0fSk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX2xlYXZlcycsIGZ1bmN0aW9uICgpIHtcblx0dmFyIGxlYXZlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAobi5pc19sZWFmKCkpIHtcblx0XHRsZWF2ZXMucHVzaChuKTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBsZWF2ZXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgndXBzdHJlYW0nLCBmdW5jdGlvbihjYmFrKSB7XG5cdGNiYWsobm9kZSk7XG5cdHZhciBwYXJlbnQgPSBub2RlLnBhcmVudCgpO1xuXHRpZiAocGFyZW50ICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIHBhcmVudC51cHN0cmVhbShjYmFrKTtcblx0fVxuLy9cdHRudF9ub2RlKHBhcmVudCkudXBzdHJlYW0oY2Jhayk7XG4vLyBcdG5vZGUudXBzdHJlYW0obm9kZS5fcGFyZW50LCBjYmFrKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdzdWJ0cmVlJywgZnVuY3Rpb24obm9kZXMpIHtcbiAgICBcdHZhciBub2RlX2NvdW50cyA9IHt9O1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbiA9IG5vZGVzW2ldO1xuXHQgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdG4udXBzdHJlYW0gKGZ1bmN0aW9uICh0aGlzX25vZGUpe1xuXHRcdCAgICB2YXIgaWQgPSB0aGlzX25vZGUuaWQoKTtcblx0XHQgICAgaWYgKG5vZGVfY291bnRzW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub2RlX2NvdW50c1tpZF0gPSAwO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5vZGVfY291bnRzW2lkXSsrXG4gICAgXHRcdH0pO1xuXHQgICAgfVxuICAgIFx0fVxuICAgIFxuXG5cdHZhciBpc19zaW5nbGV0b24gPSBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbl9jaGlsZHJlbiA9IDA7XG5cdCAgICBpZiAobm9kZV9kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bm9kZV9kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGlkID0gbm9kZV9kYXRhLmNoaWxkcmVuW2ldLl9pZDtcblx0XHRpZiAobm9kZV9jb3VudHNbaWRdID4gMCkge1xuXHRcdCAgICBuX2NoaWxkcmVuKys7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG5fY2hpbGRyZW4gPT09IDE7XG5cdH07XG5cblx0dmFyIGNvcHlfZGF0YSA9IGZ1bmN0aW9uIChvcmlnX2RhdGEsIHN1YnRyZWUsIGNvbmRpdGlvbikge1xuICAgICAgICAgICAgaWYgKG9yaWdfZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY29uZGl0aW9uKG9yaWdfZGF0YSkpIHtcblx0XHR2YXIgY29weSA9IGNvcHlfbm9kZShvcmlnX2RhdGEpO1xuXHRcdGlmIChzdWJ0cmVlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3VidHJlZS5jaGlsZHJlbiA9IFtdO1xuXHRcdH1cblx0XHRzdWJ0cmVlLmNoaWxkcmVuLnB1c2goY29weSk7XG5cdFx0aWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0XHR9XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29weV9kYXRhIChvcmlnX2RhdGEuY2hpbGRyZW5baV0sIGNvcHksIGNvbmRpdGlvbik7XG5cdFx0fVxuICAgICAgICAgICAgfSBlbHNlIHtcblx0XHRpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHRcdH1cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb3B5X2RhdGEob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBzdWJ0cmVlLCBjb25kaXRpb24pO1xuXHRcdH1cbiAgICAgICAgICAgIH1cblx0fTtcblxuXHR2YXIgY29weV9ub2RlID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIGNvcHkgPSB7fTtcblx0ICAgIC8vIGNvcHkgYWxsIHRoZSBvd24gcHJvcGVydGllcyBleGNlcHRzIGxpbmtzIHRvIG90aGVyIG5vZGVzIG9yIGRlcHRoXG5cdCAgICBmb3IgKHZhciBwYXJhbSBpbiBub2RlX2RhdGEpIHtcblx0XHRpZiAoKHBhcmFtID09PSBcImNoaWxkcmVuXCIpIHx8XG5cdFx0ICAgIChwYXJhbSA9PT0gXCJjaGlsZHJlblwiKSB8fFxuXHRcdCAgICAocGFyYW0gPT09IFwiX3BhcmVudFwiKSB8fFxuXHRcdCAgICAocGFyYW0gPT09IFwiZGVwdGhcIikpIHtcblx0XHQgICAgY29udGludWU7XG5cdFx0fVxuXHRcdGlmIChub2RlX2RhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG5cdFx0ICAgIGNvcHlbcGFyYW1dID0gbm9kZV9kYXRhW3BhcmFtXTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gY29weTtcblx0fTtcblxuXHR2YXIgc3VidHJlZSA9IHt9O1xuXHRjb3B5X2RhdGEgKGRhdGEsIHN1YnRyZWUsIGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0ICAgIHZhciBub2RlX2lkID0gbm9kZV9kYXRhLl9pZDtcblx0ICAgIHZhciBjb3VudHMgPSBub2RlX2NvdW50c1tub2RlX2lkXTtcblxuXHQgICAgaWYgKGNvdW50cyA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cbi8vIFx0ICAgIGlmICgobm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSAmJiAobm9kZS5jaGlsZHJlbi5sZW5ndGggPCAyKSkge1xuLy8gXHRcdHJldHVybiBmYWxzZTtcbi8vIFx0ICAgIH1cblx0ICAgIGlmICgoY291bnRzID4gMSkgJiYgKCFpc19zaW5nbGV0b24obm9kZV9kYXRhKSkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIGlmICgoY291bnRzID4gMCkgJiYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9KTtcblxuXHRyZXR1cm4gdG50X25vZGUoc3VidHJlZS5jaGlsZHJlblswXSk7XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCB2aXNpdHMgYWxsIHRoZSBub2Rlc1xuICAgIC8vIGEgbW9yZSBwZXJmb3JtYW50IHZlcnNpb24gc2hvdWxkIHJldHVybiB0cnVlXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgY2Jhayhub2RlKSBpcyB0cnVlXG4gICAgYXBpLm1ldGhvZCAoJ3ByZXNlbnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHQvLyBjYmFrIHNob3VsZCByZXR1cm4gdHJ1ZS9mYWxzZVxuXHR2YXIgaXNfdHJ1ZSA9IGZhbHNlO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikgPT09IHRydWUpIHtcblx0XHRpc190cnVlID0gdHJ1ZTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBpc190cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gY2JhayBpcyBjYWxsZWQgd2l0aCB0d28gbm9kZXNcbiAgICAvLyBhbmQgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciwgMCBvciBhIHBvc2l0aXZlIG51bWJlclxuICAgIGFwaS5tZXRob2QgKCdzb3J0JywgZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dmFyIG5ld19jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3X2NoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cblx0bmV3X2NoaWxkcmVuLnNvcnQoY2Jhayk7XG5cblx0ZGF0YS5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bmV3X2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkYXRhLmNoaWxkcmVuLnB1c2gobmV3X2NoaWxkcmVuW2ldLmRhdGEoKSk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkuc29ydChjYmFrKTtcblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogVGhpcyBtZXRob2Qgb25seSAnYXBwbHkncyB0byBub24gY29sbGFwc2VkIG5vZGVzIChpZSAuX2NoaWxkcmVuIGlzIG5vdCB2aXNpdGVkKVxuICAgIC8vIFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIGFuIGV4dHJhIGZsYWcgKHRydWUvZmFsc2UpIHRvIHZpc2l0IGFsc28gY29sbGFwc2VkIG5vZGVzP1xuICAgIGFwaS5tZXRob2QgKCdhcHBseScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cdHJldHVybiBjaGlsZHJlbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gdG50X25vZGUoZGF0YS5fcGFyZW50KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBub2RlO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfbm9kZTtcblxuIiwidmFyIGFwaWpzID0gcmVxdWlyZSgndG50LmFwaScpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5kaWFnb25hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZCA9IGZ1bmN0aW9uIChkaWFnb25hbFBhdGgpIHtcblx0dmFyIHNvdXJjZSA9IGRpYWdvbmFsUGF0aC5zb3VyY2U7XG4gICAgICAgIHZhciB0YXJnZXQgPSBkaWFnb25hbFBhdGgudGFyZ2V0O1xuICAgICAgICB2YXIgbWlkcG9pbnRYID0gKHNvdXJjZS54ICsgdGFyZ2V0LngpIC8gMjtcbiAgICAgICAgdmFyIG1pZHBvaW50WSA9IChzb3VyY2UueSArIHRhcmdldC55KSAvIDI7XG4gICAgICAgIHZhciBwYXRoRGF0YSA9IFtzb3VyY2UsIHt4OiB0YXJnZXQueCwgeTogc291cmNlLnl9LCB0YXJnZXRdO1xuXHRwYXRoRGF0YSA9IHBhdGhEYXRhLm1hcChkLnByb2plY3Rpb24oKSk7XG5cdHJldHVybiBkLnBhdGgoKShwYXRoRGF0YSwgcmFkaWFsX2NhbGMuY2FsbCh0aGlzLHBhdGhEYXRhKSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChkKVxuXHQuZ2V0c2V0ICgncHJvamVjdGlvbicpXG5cdC5nZXRzZXQgKCdwYXRoJylcbiAgICBcbiAgICB2YXIgY29vcmRpbmF0ZVRvQW5nbGUgPSBmdW5jdGlvbiAoY29vcmQsIHJhZGl1cykge1xuICAgICAgXHR2YXIgd2hvbGVBbmdsZSA9IDIgKiBNYXRoLlBJLFxuICAgICAgICBxdWFydGVyQW5nbGUgPSB3aG9sZUFuZ2xlIC8gNFxuXHRcbiAgICAgIFx0dmFyIGNvb3JkUXVhZCA9IGNvb3JkWzBdID49IDAgPyAoY29vcmRbMV0gPj0gMCA/IDEgOiAyKSA6IChjb29yZFsxXSA+PSAwID8gNCA6IDMpLFxuICAgICAgICBjb29yZEJhc2VBbmdsZSA9IE1hdGguYWJzKE1hdGguYXNpbihjb29yZFsxXSAvIHJhZGl1cykpXG5cdFxuICAgICAgXHQvLyBTaW5jZSB0aGlzIGlzIGp1c3QgYmFzZWQgb24gdGhlIGFuZ2xlIG9mIHRoZSByaWdodCB0cmlhbmdsZSBmb3JtZWRcbiAgICAgIFx0Ly8gYnkgdGhlIGNvb3JkaW5hdGUgYW5kIHRoZSBvcmlnaW4sIGVhY2ggcXVhZCB3aWxsIGhhdmUgZGlmZmVyZW50IFxuICAgICAgXHQvLyBvZmZzZXRzXG4gICAgICBcdHZhciBjb29yZEFuZ2xlO1xuICAgICAgXHRzd2l0Y2ggKGNvb3JkUXVhZCkge1xuICAgICAgXHRjYXNlIDE6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gcXVhcnRlckFuZ2xlIC0gY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgMjpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSBxdWFydGVyQW5nbGUgKyBjb29yZEJhc2VBbmdsZVxuICAgICAgXHQgICAgYnJlYWtcbiAgICAgIFx0Y2FzZSAzOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IDIqcXVhcnRlckFuZ2xlICsgcXVhcnRlckFuZ2xlIC0gY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgNDpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSAzKnF1YXJ0ZXJBbmdsZSArIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdH1cbiAgICAgIFx0cmV0dXJuIGNvb3JkQW5nbGVcbiAgICB9O1xuXG4gICAgdmFyIHJhZGlhbF9jYWxjID0gZnVuY3Rpb24gKHBhdGhEYXRhKSB7XG5cdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcblx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSBNYXRoLnNxcnQoc3JjWzBdKnNyY1swXSArIHNyY1sxXSpzcmNbMV0pO1xuXHR2YXIgc3JjQW5nbGUgPSBjb29yZGluYXRlVG9BbmdsZShzcmMsIHJhZGl1cyk7XG5cdHZhciBtaWRBbmdsZSA9IGNvb3JkaW5hdGVUb0FuZ2xlKG1pZCwgcmFkaXVzKTtcblx0dmFyIGNsb2Nrd2lzZSA9IE1hdGguYWJzKG1pZEFuZ2xlIC0gc3JjQW5nbGUpID4gTWF0aC5QSSA/IG1pZEFuZ2xlIDw9IHNyY0FuZ2xlIDogbWlkQW5nbGUgPiBzcmNBbmdsZTtcblx0cmV0dXJuIHtcblx0ICAgIHJhZGl1cyAgIDogcmFkaXVzLFxuXHQgICAgY2xvY2t3aXNlIDogY2xvY2t3aXNlXG5cdH07XG4gICAgfTtcblxuICAgIHJldHVybiBkO1xufTtcblxuLy8gdmVydGljYWwgZGlhZ29uYWwgZm9yIHJlY3QgYnJhbmNoZXNcbnRyZWUuZGlhZ29uYWwudmVydGljYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSBmdW5jdGlvbihwYXRoRGF0YSwgb2JqKSB7XG5cdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcblx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSAyMDAwMDA7IC8vIE51bWJlciBsb25nIGVub3VnaFxuXG5cdHJldHVybiBcIk1cIiArIHNyYyArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgbWlkICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDsgXG5cdFxuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGZ1bmN0aW9uKGQpIHsgXG5cdHJldHVybiBbZC55LCBkLnhdO1xuICAgIH1cblxuICAgIHJldHVybiB0cmVlLmRpYWdvbmFsKClcbiAgICAgIFx0LnBhdGgocGF0aClcbiAgICAgIFx0LnByb2plY3Rpb24ocHJvamVjdGlvbik7XG59O1xuXG50cmVlLmRpYWdvbmFsLnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGF0aCA9IGZ1bmN0aW9uKHBhdGhEYXRhLCBvYmopIHtcbiAgICAgIFx0dmFyIHNyYyA9IHBhdGhEYXRhWzBdO1xuICAgICAgXHR2YXIgbWlkID0gcGF0aERhdGFbMV07XG4gICAgICBcdHZhciBkc3QgPSBwYXRoRGF0YVsyXTtcblx0dmFyIHJhZGl1cyA9IG9iai5yYWRpdXM7XG5cdHZhciBjbG9ja3dpc2UgPSBvYmouY2xvY2t3aXNlO1xuXG5cdGlmIChjbG9ja3dpc2UpIHtcblx0ICAgIHJldHVybiBcIk1cIiArIHNyYyArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgbWlkICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDsgXG5cdH0gZWxzZSB7XG5cdCAgICByZXR1cm4gXCJNXCIgKyBtaWQgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIHNyYyArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7XG5cdH1cblxuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIFx0dmFyIHIgPSBkLnksIGEgPSAoZC54IC0gOTApIC8gMTgwICogTWF0aC5QSTtcbiAgICAgIFx0cmV0dXJuIFtyICogTWF0aC5jb3MoYSksIHIgKiBNYXRoLnNpbihhKV07XG4gICAgfTtcblxuICAgIHJldHVybiB0cmVlLmRpYWdvbmFsKClcbiAgICAgIFx0LnBhdGgocGF0aClcbiAgICAgIFx0LnByb2plY3Rpb24ocHJvamVjdGlvbilcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUuZGlhZ29uYWw7XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUgKFwiLi90cmVlLmpzXCIpO1xudHJlZS5sYWJlbCA9IHJlcXVpcmUoXCIuL2xhYmVsLmpzXCIpO1xudHJlZS5kaWFnb25hbCA9IHJlcXVpcmUoXCIuL2RpYWdvbmFsLmpzXCIpO1xudHJlZS5sYXlvdXQgPSByZXF1aXJlKFwiLi9sYXlvdXQuanNcIik7XG50cmVlLm5vZGVfZGlzcGxheSA9IHJlcXVpcmUoXCIuL25vZGVfZGlzcGxheS5qc1wiKTtcbi8vIHRyZWUubm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuLy8gdHJlZS5wYXJzZV9uZXdpY2sgPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uZXdpY2s7XG4vLyB0cmVlLnBhcnNlX25oeCA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25oeDtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZTtcblxuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxhYmVsID0gZnVuY3Rpb24gKCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiB3ZSBzaG91bGQgYmUgcmVtb3ZpbmcgYnkgZGVmYXVsdCBwcmV2IGxhYmVsc1xuICAgIC8vIG9yIGl0IHdvdWxkIGJlIGJldHRlciB0byBoYXZlIGEgc2VwYXJhdGUgcmVtb3ZlIG1ldGhvZCBjYWxsZWQgYnkgdGhlIHZpc1xuICAgIC8vIG9uIHVwZGF0ZVxuICAgIC8vIFdlIGFsc28gaGF2ZSB0aGUgcHJvYmxlbSB0aGF0IHdlIG1heSBiZSB0cmFuc2l0aW9uaW5nIGZyb21cbiAgICAvLyB0ZXh0IHRvIGltZyBsYWJlbHMgYW5kIHdlIG5lZWQgdG8gcmVtb3ZlIHRoZSBsYWJlbCBvZiBhIGRpZmZlcmVudCB0eXBlXG4gICAgdmFyIGxhYmVsID0gZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlLCBub2RlX3NpemUpIHtcblx0aWYgKHR5cGVvZiAobm9kZSkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93KG5vZGUpO1xuICAgICAgICB9XG5cblx0bGFiZWwuZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSwgbGF5b3V0X3R5cGUpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGFiZWxcIilcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0dmFyIHQgPSBsYWJlbC50cmFuc2Zvcm0oKShub2RlLCBsYXlvdXRfdHlwZSk7XG5cdFx0cmV0dXJuIFwidHJhbnNsYXRlIChcIiArICh0LnRyYW5zbGF0ZVswXSArIG5vZGVfc2l6ZSkgKyBcIiBcIiArIHQudHJhbnNsYXRlWzFdICsgXCIpcm90YXRlKFwiICsgdC5yb3RhdGUgKyBcIilcIjtcblx0ICAgIH0pXG5cdC8vIFRPRE86IHRoaXMgY2xpY2sgZXZlbnQgaXMgcHJvYmFibHkgbmV2ZXIgZmlyZWQgc2luY2UgdGhlcmUgaXMgYW4gb25jbGljayBldmVudCBpbiB0aGUgbm9kZSBnIGVsZW1lbnQ/XG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbigpe1xuXHRcdGlmIChsYWJlbC5vbl9jbGljaygpICE9PSB1bmRlZmluZWQpIHtcblx0XHQgICAgZDMuZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0ICAgIGxhYmVsLm9uX2NsaWNrKCkuY2FsbCh0aGlzLCBub2RlKTtcblx0XHR9XG5cdCAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblx0LmdldHNldCAoJ3dpZHRoJywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSB3aWR0aCBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIGhlaWdodCBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCdkaXNwbGF5JywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSBkaXNwbGF5IGNhbGxiYWNrXCIgfSlcblx0LmdldHNldCAoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgdHJhbnNmb3JtIGNhbGxiYWNrXCIgfSlcblx0LmdldHNldCAoJ29uX2NsaWNrJyk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBUZXh0IGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC50ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbCA9IHRyZWUubGFiZWwoKTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cdC5nZXRzZXQgKCdmb250c2l6ZScsIDEwKVxuXHQuZ2V0c2V0ICgnY29sb3InLCBcIiMwMDBcIilcblx0LmdldHNldCAoJ3RleHQnLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgcmV0dXJuIGQuZGF0YSgpLm5hbWU7XG5cdH0pXG5cbiAgICBsYWJlbC5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGwgPSBkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGxheW91dF90eXBlID09PSBcInJhZGlhbFwiKSB7XG5cdFx0ICAgIHJldHVybiAoZC54JTM2MCA8IDE4MCkgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xuXHRcdH1cblx0XHRyZXR1cm4gXCJzdGFydFwiO1xuXHQgICAgfSlcblx0ICAgIC50ZXh0KGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIGxhYmVsLnRleHQoKShub2RlKVxuXHQgICAgfSlcblx0ICAgIC5zdHlsZSgnZm9udC1zaXplJywgbGFiZWwuZm9udHNpemUoKSArIFwicHhcIilcblx0ICAgIC5zdHlsZSgnZmlsbCcsIGQzLmZ1bmN0b3IobGFiZWwuY29sb3IoKSkobm9kZSkpO1xuXG5cdHJldHVybiBsO1xuICAgIH0pO1xuXG4gICAgbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGQgPSBub2RlLmRhdGEoKTtcblx0dmFyIHQgPSB7XG5cdCAgICB0cmFuc2xhdGUgOiBbNSwgNV0sXG5cdCAgICByb3RhdGUgOiAwXG5cdH07XG5cdGlmIChsYXlvdXRfdHlwZSA9PT0gXCJyYWRpYWxcIikge1xuXHQgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSAtIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmZvbnRzaXplKCkpXG5cdCAgICB0LnJvdGF0ZSA9IChkLnglMzYwIDwgMTgwID8gMCA6IDE4MClcblx0fVxuXHRyZXR1cm4gdDtcbiAgICB9KTtcblxuXG4gICAgLy8gbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSkge1xuICAgIC8vIFx0dmFyIGQgPSBub2RlLmRhdGEoKTtcbiAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZSgxMCA1KXJvdGF0ZShcIiArIChkLnglMzYwIDwgMTgwID8gMCA6IDE4MCkgKyBcIilcIjtcbiAgICAvLyB9KTtcblxuICAgIGxhYmVsLndpZHRoIChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgc3ZnID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuXHQgICAgLmFwcGVuZChcInN2Z1wiKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgMClcblx0ICAgIC5zdHlsZSgndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcblxuXHR2YXIgdGV4dCA9IHN2Z1xuXHQgICAgLmFwcGVuZChcInRleHRcIilcblx0ICAgIC5zdHlsZSgnZm9udC1zaXplJywgbGFiZWwuZm9udHNpemUoKSArIFwicHhcIilcblx0ICAgIC50ZXh0KGxhYmVsLnRleHQoKShub2RlKSk7XG5cblx0dmFyIHdpZHRoID0gdGV4dC5ub2RlKCkuZ2V0QkJveCgpLndpZHRoO1xuXHRzdmcucmVtb3ZlKCk7XG5cblx0cmV0dXJuIHdpZHRoO1xuICAgIH0pO1xuXG4gICAgbGFiZWwuaGVpZ2h0IChmdW5jdGlvbiAobm9kZSkge1xuXHRyZXR1cm4gbGFiZWwuZm9udHNpemUoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIEltYWdlIGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC5pbWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVsID0gdHJlZS5sYWJlbCgpO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblx0LmdldHNldCAoJ3NyYycsIGZ1bmN0aW9uICgpIHt9KVxuXG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdGlmIChsYWJlbC5zcmMoKShub2RlKSkge1xuXHQgICAgdmFyIGwgPSBkMy5zZWxlY3QodGhpcylcblx0XHQuYXBwZW5kKFwiaW1hZ2VcIilcblx0XHQuYXR0cihcIndpZHRoXCIsIGxhYmVsLndpZHRoKCkoKSlcblx0XHQuYXR0cihcImhlaWdodFwiLCBsYWJlbC5oZWlnaHQoKSgpKVxuXHRcdC5hdHRyKFwieGxpbms6aHJlZlwiLCBsYWJlbC5zcmMoKShub2RlKSk7XG5cdCAgICByZXR1cm4gbDtcblx0fVxuXHQvLyBmYWxsYmFjayB0ZXh0IGluIGNhc2UgdGhlIGltZyBpcyBub3QgZm91bmQ/XG5cdHJldHVybiBkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAudGV4dChcIlwiKTtcbiAgICB9KTtcblxuICAgIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdHZhciBkID0gbm9kZS5kYXRhKCk7XG5cdHZhciB0ID0ge1xuXHQgICAgdHJhbnNsYXRlIDogWzEwLCAoLWxhYmVsLmhlaWdodCgpKCkgLyAyKV0sXG5cdCAgICByb3RhdGUgOiAwXG5cdH07XG5cdGlmIChsYXlvdXRfdHlwZSA9PT0gJ3JhZGlhbCcpIHtcblx0ICAgIHQudHJhbnNsYXRlWzBdID0gdC50cmFuc2xhdGVbMF0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC53aWR0aCgpKCkpLFxuXHQgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSArIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmhlaWdodCgpKCkpLFxuXHQgICAgdC5yb3RhdGUgPSAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApXG5cdH1cblxuXHRyZXR1cm4gdDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIExhYmVscyBtYWRlIG9mIDIrIHNpbXBsZSBsYWJlbHNcbnRyZWUubGFiZWwuY29tcG9zaXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbHMgPSBbXTtcblxuICAgIHZhciBsYWJlbCA9IGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHR2YXIgY3Vycl94b2Zmc2V0ID0gMDtcblxuXHRmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgZGlzcGxheSA9IGxhYmVsc1tpXTtcblxuXHQgICAgKGZ1bmN0aW9uIChvZmZzZXQpIHtcblx0XHRkaXNwbGF5LnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdFx0ICAgIHZhciB0c3VwZXIgPSBkaXNwbGF5Ll9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuXHRcdCAgICB2YXIgdCA9IHtcblx0XHRcdHRyYW5zbGF0ZSA6IFtvZmZzZXQgKyB0c3VwZXIudHJhbnNsYXRlWzBdLCB0c3VwZXIudHJhbnNsYXRlWzFdXSxcblx0XHRcdHJvdGF0ZSA6IHRzdXBlci5yb3RhdGVcblx0XHQgICAgfTtcblx0XHQgICAgcmV0dXJuIHQ7XG5cdFx0fSlcblx0ICAgIH0pKGN1cnJfeG9mZnNldCk7XG5cblx0ICAgIGN1cnJfeG9mZnNldCArPSAxMDtcblx0ICAgIGN1cnJfeG9mZnNldCArPSBkaXNwbGF5LndpZHRoKCkobm9kZSk7XG5cblx0ICAgIGRpc3BsYXkuY2FsbCh0aGlzLCBub2RlLCBsYXlvdXRfdHlwZSk7XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblxuICAgIGFwaS5tZXRob2QgKCdhZGRfbGFiZWwnLCBmdW5jdGlvbiAoZGlzcGxheSwgbm9kZSkge1xuXHRkaXNwbGF5Ll9zdXBlcl8gPSB7fTtcblx0YXBpanMgKGRpc3BsYXkuX3N1cGVyXylcblx0ICAgIC5nZXQgKCd0cmFuc2Zvcm0nLCBkaXNwbGF5LnRyYW5zZm9ybSgpKTtcblxuXHRsYWJlbHMucHVzaChkaXNwbGF5KTtcblx0cmV0dXJuIGxhYmVsO1xuICAgIH0pO1xuICAgIFxuICAgIGFwaS5tZXRob2QgKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICB2YXIgdG90X3dpZHRoID0gMDtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcblx0XHR0b3Rfd2lkdGggKz0gcGFyc2VJbnQobGFiZWxzW2ldLndpZHRoKCkobm9kZSkpO1xuXHRcdHRvdF93aWR0aCArPSBwYXJzZUludChsYWJlbHNbaV0uX3N1cGVyXy50cmFuc2Zvcm0oKShub2RlKS50cmFuc2xhdGVbMF0pO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdG90X3dpZHRoO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHZhciBtYXhfaGVpZ2h0ID0gMDtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgY3Vycl9oZWlnaHQgPSBsYWJlbHNbaV0uaGVpZ2h0KCkobm9kZSk7XG5cdFx0aWYgKCBjdXJyX2hlaWdodCA+IG1heF9oZWlnaHQpIHtcblx0XHQgICAgbWF4X2hlaWdodCA9IGN1cnJfaGVpZ2h0O1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBtYXhfaGVpZ2h0O1xuXHR9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxhYmVsO1xuXG5cbiIsIi8vIEJhc2VkIG9uIHRoZSBjb2RlIGJ5IEtlbi1pY2hpIFVlZGEgaW4gaHR0cDovL2JsLm9ja3Mub3JnL2t1ZWRhLzEwMzY3NzYjZDMucGh5bG9ncmFtLmpzXG5cbnZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGRpYWdvbmFsID0gcmVxdWlyZShcIi4vZGlhZ29uYWwuanNcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxheW91dCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBsID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcblx0LnNvcnQobnVsbClcblx0LnZhbHVlKGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQubGVuZ3RofSApXG5cdC5zZXBhcmF0aW9uKGZ1bmN0aW9uICgpIHtyZXR1cm4gMX0pO1xuICAgIFxuICAgIHZhciBhcGkgPSBhcGlqcyAobClcblx0LmdldHNldCAoJ3NjYWxlJywgdHJ1ZSlcblx0LmdldHNldCAoJ21heF9sZWFmX2xhYmVsX3dpZHRoJywgMClcblx0Lm1ldGhvZCAoXCJjbHVzdGVyXCIsIGNsdXN0ZXIpXG5cdC5tZXRob2QoJ3lzY2FsZScsIGZ1bmN0aW9uICgpIHt0aHJvdyBcInlzY2FsZSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pXG5cdC5tZXRob2QoJ2FkanVzdF9jbHVzdGVyX3NpemUnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJhZGp1c3RfY2x1c3Rlcl9zaXplIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiIH0pXG5cdC5tZXRob2QoJ3dpZHRoJywgZnVuY3Rpb24gKCkge3Rocm93IFwid2lkdGggaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KVxuXHQubWV0aG9kKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJoZWlnaHQgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KTtcblxuICAgIGFwaS5tZXRob2QoJ3NjYWxlX2JyYW5jaF9sZW5ndGhzJywgZnVuY3Rpb24gKGN1cnIpIHtcblx0aWYgKGwuc2NhbGUoKSA9PT0gZmFsc2UpIHtcblx0ICAgIHJldHVyblxuXHR9XG5cblx0dmFyIG5vZGVzID0gY3Vyci5ub2Rlcztcblx0dmFyIHRyZWUgPSBjdXJyLnRyZWU7XG5cblx0dmFyIHJvb3RfZGlzdHMgPSBub2Rlcy5tYXAgKGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5fcm9vdF9kaXN0O1xuXHR9KTtcblxuXHR2YXIgeXNjYWxlID0gbC55c2NhbGUocm9vdF9kaXN0cyk7XG5cdHRyZWUuYXBwbHkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBub2RlLnByb3BlcnR5KFwieVwiLCB5c2NhbGUobm9kZS5yb290X2Rpc3QoKSkpO1xuXHR9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsO1xufTtcblxudHJlZS5sYXlvdXQudmVydGljYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxheW91dCA9IHRyZWUubGF5b3V0KCk7XG4gICAgLy8gRWxlbWVudHMgbGlrZSAnbGFiZWxzJyBkZXBlbmQgb24gdGhlIGxheW91dCB0eXBlLiBUaGlzIGV4cG9zZXMgYSB3YXkgb2YgaWRlbnRpZnlpbmcgdGhlIGxheW91dCB0eXBlXG4gICAgbGF5b3V0LnR5cGUgPSBcInZlcnRpY2FsXCI7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxheW91dClcblx0LmdldHNldCAoJ3dpZHRoJywgMzYwKVxuXHQuZ2V0ICgndHJhbnNsYXRlX3ZpcycsIFsyMCwyMF0pXG5cdC5tZXRob2QgKCdkaWFnb25hbCcsIGRpYWdvbmFsLnZlcnRpY2FsKVxuXHQubWV0aG9kICgndHJhbnNmb3JtX25vZGUnLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueSArIFwiLFwiICsgZC54ICsgXCIpXCI7XG5cdH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnaGVpZ2h0JywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0cmV0dXJuIChwYXJhbXMubl9sZWF2ZXMgKiBwYXJhbXMubGFiZWxfaGVpZ2h0KTtcbiAgICB9KTsgXG5cbiAgICBhcGkubWV0aG9kKCd5c2NhbGUnLCBmdW5jdGlvbiAoZGlzdHMpIHtcbiAgICBcdHJldHVybiBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0ICAgIC5kb21haW4oWzAsIGQzLm1heChkaXN0cyldKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgbGF5b3V0LndpZHRoKCkgLSAyMCAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpXSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKCdhZGp1c3RfY2x1c3Rlcl9zaXplJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0dmFyIGggPSBsYXlvdXQuaGVpZ2h0KHBhcmFtcyk7XG4gICAgXHR2YXIgdyA9IGxheW91dC53aWR0aCgpIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCkgLSBsYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdIC0gcGFyYW1zLmxhYmVsX3BhZGRpbmc7XG4gICAgXHRsYXlvdXQuY2x1c3Rlci5zaXplIChbaCx3XSk7XG4gICAgXHRyZXR1cm4gbGF5b3V0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxheW91dDtcbn07XG5cbnRyZWUubGF5b3V0LnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGF5b3V0ID0gdHJlZS5sYXlvdXQoKTtcbiAgICAvLyBFbGVtZW50cyBsaWtlICdsYWJlbHMnIGRlcGVuZCBvbiB0aGUgbGF5b3V0IHR5cGUuIFRoaXMgZXhwb3NlcyBhIHdheSBvZiBpZGVudGlmeWluZyB0aGUgbGF5b3V0IHR5cGVcbiAgICBsYXlvdXQudHlwZSA9ICdyYWRpYWwnO1xuXG4gICAgdmFyIGRlZmF1bHRfd2lkdGggPSAzNjA7XG4gICAgdmFyIHIgPSBkZWZhdWx0X3dpZHRoIC8gMjtcblxuICAgIHZhciBjb25mID0ge1xuICAgIFx0d2lkdGggOiAzNjBcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYXlvdXQpXG5cdC5nZXRzZXQgKGNvbmYpXG5cdC5nZXRzZXQgKCd0cmFuc2xhdGVfdmlzJywgW3IsIHJdKSAvLyBUT0RPOiAxLjMgc2hvdWxkIGJlIHJlcGxhY2VkIGJ5IGEgc2Vuc2libGUgdmFsdWVcblx0Lm1ldGhvZCAoJ3RyYW5zZm9ybV9ub2RlJywgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBcInJvdGF0ZShcIiArIChkLnggLSA5MCkgKyBcIil0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIilcIjtcblx0fSlcblx0Lm1ldGhvZCAoJ2RpYWdvbmFsJywgZGlhZ29uYWwucmFkaWFsKVxuXHQubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uZi53aWR0aCB9KTtcblxuICAgIC8vIENoYW5nZXMgaW4gd2lkdGggYWZmZWN0IGNoYW5nZXMgaW4gclxuICAgIGxheW91dC53aWR0aC50cmFuc2Zvcm0gKGZ1bmN0aW9uICh2YWwpIHtcbiAgICBcdHIgPSB2YWwgLyAyO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZShbMzYwLCByXSlcbiAgICBcdGxheW91dC50cmFuc2xhdGVfdmlzKFtyLCByXSk7XG4gICAgXHRyZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoXCJ5c2NhbGVcIiwgIGZ1bmN0aW9uIChkaXN0cykge1xuXHRyZXR1cm4gZDMuc2NhbGUubGluZWFyKClcblx0ICAgIC5kb21haW4oWzAsZDMubWF4KGRpc3RzKV0pXG5cdCAgICAucmFuZ2UoWzAsIHJdKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKFwiYWRqdXN0X2NsdXN0ZXJfc2l6ZVwiLCBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdHIgPSAobGF5b3V0LndpZHRoKCkvMikgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKSAtIDIwO1xuXHRsYXlvdXQuY2x1c3Rlci5zaXplKFszNjAsIHJdKTtcblx0cmV0dXJuIGxheW91dDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYXlvdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxheW91dDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5ub2RlX2Rpc3BsYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbiA9IGZ1bmN0aW9uIChub2RlKSB7XG5cdG4uZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChuKVxuXHQuZ2V0c2V0KFwic2l6ZVwiLCA0LjUpXG5cdC5nZXRzZXQoXCJmaWxsXCIsIFwiYmxhY2tcIilcblx0LmdldHNldChcInN0cm9rZVwiLCBcImJsYWNrXCIpXG5cdC5nZXRzZXQoXCJzdHJva2Vfd2lkdGhcIiwgXCIxcHhcIilcblx0LmdldHNldChcImRpc3BsYXlcIiwgZnVuY3Rpb24gKCkge3Rocm93IFwiZGlzcGxheSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcblx0ICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuc3F1YXJlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1zXG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1zO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gcyoyO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHMqMjtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkudHJpYW5nbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJwb2x5Z29uXCIpXG5cdCAgICAuYXR0cihcInBvaW50c1wiLCAoLXMpICsgXCIsMCBcIiArIHMgKyBcIixcIiArICgtcykgKyBcIiBcIiArIHMgKyBcIixcIiArIHMpXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuY29uZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICAvLyBjb25kaXRpb25zIGFyZSBvYmplY3RzIHdpdGhcbiAgICAvLyBuYW1lIDogYSBuYW1lIGZvciB0aGlzIGRpc3BsYXlcbiAgICAvLyBjYWxsYmFjazogdGhlIGNvbmRpdGlvbiB0byBhcHBseSAocmVjZWl2ZXMgYSB0bnQubm9kZSlcbiAgICAvLyBkaXNwbGF5OiBhIG5vZGVfZGlzcGxheVxuICAgIHZhciBjb25kcyA9IFtdO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRmb3IgKHZhciBpPTA7IGk8Y29uZHMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBjb25kID0gY29uZHNbaV07XG5cdCAgICAvLyBGb3IgZWFjaCBub2RlLCB0aGUgZmlyc3QgY29uZGl0aW9uIG1ldCBpcyB1c2VkXG5cdCAgICBpZiAoY29uZC5jYWxsYmFjay5jYWxsKHRoaXMsIG5vZGUpID09PSB0cnVlKSB7XG5cdFx0Y29uZC5kaXNwbGF5LmNhbGwodGhpcywgbm9kZSlcblx0XHRicmVhaztcblx0ICAgIH1cblx0fVxuICAgIH0pXG5cbiAgICB2YXIgYXBpID0gYXBpanMobik7XG5cbiAgICBhcGkubWV0aG9kKFwiYWRkXCIsIGZ1bmN0aW9uIChuYW1lLCBjYmFrLCBub2RlX2Rpc3BsYXkpIHtcblx0Y29uZHMucHVzaCh7IG5hbWUgOiBuYW1lLFxuXHRcdCAgICAgY2FsbGJhY2sgOiBjYmFrLFxuXHRcdCAgICAgZGlzcGxheSA6IG5vZGVfZGlzcGxheVxuXHRcdCAgIH0pO1xuXHRyZXR1cm4gbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QoXCJyZXNldFwiLCBmdW5jdGlvbiAoKSB7XG5cdGNvbmRzID0gW107XG5cdHJldHVybiBuO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZChcInVwZGF0ZVwiLCBmdW5jdGlvbiAobmFtZSwgY2JhaywgbmV3X2Rpc3BsYXkpIHtcblx0Zm9yICh2YXIgaT0wOyBpPGNvbmRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAoY29uZHNbaV0ubmFtZSA9PT0gbmFtZSkge1xuXHRcdGNvbmRzW2ldLmNhbGxiYWNrID0gY2Jhaztcblx0XHRjb25kc1tpXS5kaXNwbGF5ID0gbmV3X2Rpc3BsYXk7XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIG47XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5ub2RlX2Rpc3BsYXk7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0bnRfdHJlZV9ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG5cbnZhciB0cmVlID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGNvbmYgPSB7XG5cdGR1cmF0aW9uICAgICAgICAgOiA1MDAsICAgICAgLy8gRHVyYXRpb24gb2YgdGhlIHRyYW5zaXRpb25zXG5cdG5vZGVfZGlzcGxheSAgICAgOiB0cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUoKSxcblx0bGFiZWwgICAgICAgICAgICA6IHRyZWUubGFiZWwudGV4dCgpLFxuXHRsYXlvdXQgICAgICAgICAgIDogdHJlZS5sYXlvdXQudmVydGljYWwoKSxcblx0b25fY2xpY2sgICAgICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuXHRvbl9kYmxfY2xpY2sgICAgIDogZnVuY3Rpb24gKCkge30sXG5cdG9uX21vdXNlb3ZlciAgICAgOiBmdW5jdGlvbiAoKSB7fSxcblx0bGlua19jb2xvciAgICAgICA6ICdibGFjaycsXG5cdGlkICAgICAgICAgICAgICAgOiBcIl9pZFwiXG4gICAgfTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGZvY3VzZWQgbm9kZVxuICAgIC8vIFRPRE86IFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIG11bHRpcGxlIGZvY3VzZWQgbm9kZXM/IChpZSB1c2UgYW4gYXJyYXkpXG4gICAgdmFyIGZvY3VzZWRfbm9kZTtcblxuICAgIC8vIEV4dHJhIGRlbGF5IGluIHRoZSB0cmFuc2l0aW9ucyAoVE9ETzogTmVlZGVkPylcbiAgICB2YXIgZGVsYXkgPSAwO1xuXG4gICAgLy8gRWFzZSBvZiB0aGUgdHJhbnNpdGlvbnNcbiAgICB2YXIgZWFzZSA9IFwiY3ViaWMtaW4tb3V0XCI7XG5cbiAgICAvLyBCeSBub2RlIGRhdGFcbiAgICB2YXIgc3BfY291bnRzID0ge307XG4gXG4gICAgdmFyIHNjYWxlID0gZmFsc2U7XG5cbiAgICAvLyBUaGUgaWQgb2YgdGhlIHRyZWUgY29udGFpbmVyXG4gICAgdmFyIGRpdl9pZDtcblxuICAgIC8vIFRoZSB0cmVlIHZpc3VhbGl6YXRpb24gKHN2ZylcbiAgICB2YXIgc3ZnO1xuICAgIHZhciB2aXM7XG5cbiAgICAvLyBUT0RPOiBGb3Igbm93LCBjb3VudHMgYXJlIGdpdmVuIG9ubHkgZm9yIGxlYXZlc1xuICAgIC8vIGJ1dCBpdCBtYXkgYmUgZ29vZCB0byBhbGxvdyBjb3VudHMgZm9yIGludGVybmFsIG5vZGVzXG4gICAgdmFyIGNvdW50cyA9IHt9O1xuXG4gICAgLy8gVGhlIGZ1bGwgdHJlZVxuICAgIHZhciBiYXNlID0ge1xuXHR0cmVlIDogdW5kZWZpbmVkLFxuXHRkYXRhIDogdW5kZWZpbmVkLFx0XG5cdG5vZGVzIDogdW5kZWZpbmVkLFxuXHRsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY3VyciB0cmVlLiBOZWVkZWQgdG8gcmUtY29tcHV0ZSB0aGUgbGlua3MgLyBub2RlcyBwb3NpdGlvbnMgb2Ygc3VidHJlZXNcbiAgICB2YXIgY3VyciA9IHtcblx0dHJlZSA6IHVuZGVmaW5lZCxcblx0ZGF0YSA6IHVuZGVmaW5lZCxcblx0bm9kZXMgOiB1bmRlZmluZWQsXG5cdGxpbmtzIDogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFRoZSBjYmFrIHJldHVybmVkXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGl2KSB7XG5cdGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuICAgICAgICB2YXIgdHJlZV9kaXYgPSBkMy5zZWxlY3QoZGl2KVxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyAgXCJweFwiKSlcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3JvdXBEaXZcIik7XG5cblx0dmFyIGNsdXN0ZXIgPSBjb25mLmxheW91dC5jbHVzdGVyO1xuXG5cdHZhciBuX2xlYXZlcyA9IGN1cnIudHJlZS5nZXRfYWxsX2xlYXZlcygpLmxlbmd0aDtcblxuXHR2YXIgbWF4X2xlYWZfbGFiZWxfbGVuZ3RoID0gZnVuY3Rpb24gKHRyZWUpIHtcblx0ICAgIHZhciBtYXggPSAwO1xuXHQgICAgdmFyIGxlYXZlcyA9IHRyZWUuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbGFiZWxfd2lkdGggPSBjb25mLmxhYmVsLndpZHRoKCkobGVhdmVzW2ldKSArIGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKShsZWF2ZXNbaV0pO1xuXHRcdGlmIChsYWJlbF93aWR0aCA+IG1heCkge1xuXHRcdCAgICBtYXggPSBsYWJlbF93aWR0aDtcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbWF4O1xuXHR9O1xuXG5cdHZhciBtYXhfbGVhZl9ub2RlX2hlaWdodCA9IGZ1bmN0aW9uICh0cmVlKSB7XG5cdCAgICB2YXIgbWF4ID0gMDtcblx0ICAgIHZhciBsZWF2ZXMgPSB0cmVlLmdldF9hbGxfbGVhdmVzKCk7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIG5vZGVfc2l6ZSA9IGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKShsZWF2ZXNbaV0pO1xuXHRcdGlmIChub2RlX3NpemUgPiBtYXgpIHtcblx0XHQgICAgbWF4ID0gbm9kZV9zaXplO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBtYXggKiAyO1xuXHR9O1xuXG5cdHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG5cdGNvbmYubGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKG1heF9sYWJlbF9sZW5ndGgpO1xuXG5cdHZhciBtYXhfbm9kZV9oZWlnaHQgPSBtYXhfbGVhZl9ub2RlX2hlaWdodChjdXJyLnRyZWUpO1xuXG5cdC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG5cdC8vIHRvdGFsIHdpZHRoIG9mIHRoZSB2aXMgLSB0cmFuc2Zvcm0gZm9yIHRoZSB0cmVlIC0gbWF4X2xlYWZfbGFiZWxfd2lkdGggLSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbGFiZWxcblx0Ly8gVE9ETzogU3Vic3RpdHV0ZSAxNSBieSB0aGUgaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIG5vZGVzXG5cdHZhciBjbHVzdGVyX3NpemVfcGFyYW1zID0ge1xuXHQgICAgbl9sZWF2ZXMgOiBuX2xlYXZlcyxcblx0ICAgIGxhYmVsX2hlaWdodCA6IGQzLm1heChbZDMuZnVuY3Rvcihjb25mLmxhYmVsLmhlaWdodCgpKSgpLCBtYXhfbm9kZV9oZWlnaHRdKSxcblx0ICAgIGxhYmVsX3BhZGRpbmcgOiAxNVxuXHR9O1xuXG5cdGNvbmYubGF5b3V0LmFkanVzdF9jbHVzdGVyX3NpemUoY2x1c3Rlcl9zaXplX3BhcmFtcyk7XG5cblx0dmFyIGRpYWdvbmFsID0gY29uZi5sYXlvdXQuZGlhZ29uYWwoKTtcblx0dmFyIHRyYW5zZm9ybSA9IGNvbmYubGF5b3V0LnRyYW5zZm9ybV9ub2RlO1xuXG5cdHN2ZyA9IHRyZWVfZGl2XG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGNvbmYubGF5b3V0LndpZHRoKCkpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMClcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cblx0dmlzID0gc3ZnXG5cdCAgICAuYXBwZW5kKFwiZ1wiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9zdF9cIiArIGRpdl9pZClcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsXG5cdFx0ICBcInRyYW5zbGF0ZShcIiArXG5cdFx0ICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuXHRcdCAgXCIsXCIgK1xuXHRcdCAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzFdICtcblx0XHQgIFwiKVwiKTtcblxuXHRjdXJyLm5vZGVzID0gY2x1c3Rlci5ub2RlcyhjdXJyLmRhdGEpO1xuXHRjb25mLmxheW91dC5zY2FsZV9icmFuY2hfbGVuZ3RocyhjdXJyKTtcblx0Y3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cblx0Ly8gTElOS1Ncblx0dmFyIGxpbmsgPSB2aXMuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG5cdCAgICAuZGF0YShjdXJyLmxpbmtzLCBmdW5jdGlvbihkKXtyZXR1cm4gZC50YXJnZXRbY29uZi5pZF19KTtcblx0XG5cdGxpbmtcblx0ICAgIC5lbnRlcigpXG5cdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xpbmtcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24oZCkge1xuXHQgICAgXHRyZXR1cm4gXCJ0bnRfdHJlZV9saW5rX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLnRhcmdldC5faWQ7XG5cdCAgICB9KVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3IoY29uZi5saW5rX2NvbG9yKSh0bnRfdHJlZV9ub2RlKGQuc291cmNlKSwgdG50X3RyZWVfbm9kZShkLnRhcmdldCkpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHQgICAgXG5cblx0Ly8gTk9ERVNcblx0dmFyIG5vZGUgPSB2aXMuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG5cdCAgICAuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7cmV0dXJuIGRbY29uZi5pZF19KTtcblxuXHR2YXIgbmV3X25vZGUgPSBub2RlXG5cdCAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcblx0XHRpZiAobi5jaGlsZHJlbikge1xuXHRcdCAgICBpZiAobi5kZXB0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIlxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiaW5uZXIgdG50X3RyZWVfbm9kZVwiXG5cdFx0ICAgIH1cblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJsZWFmIHRudF90cmVlX25vZGVcIlxuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0XHRyZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZFxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0Ly8gZGlzcGxheSBub2RlIHNoYXBlXG5cdG5ld19ub2RlXG5cdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpXG5cdCAgICB9KTtcblxuXHQvLyBkaXNwbGF5IG5vZGUgbGFiZWxcblx0bmV3X25vZGVcblx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuXHQgICAgXHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcblx0ICAgIH0pO1xuXG5cdG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIGNvbmYub25fY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblxuXHQgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0fSk7XG5cblx0bmV3X25vZGUub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBjb25mLm9uX21vdXNlb3Zlci5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXG5cdCAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHR9KTtcblxuXHRuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBjb25mLm9uX2RibF9jbGljay5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXG5cdCAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHR9KTtcblxuXG5cdC8vIFVwZGF0ZSBwbG90cyBhbiB1cGRhdGVkIHRyZWVcblx0YXBpLm1ldGhvZCAoJ3VwZGF0ZScsIGZ1bmN0aW9uKCkge1xuXHQgICAgdHJlZV9kaXZcblx0XHQuc3R5bGUoXCJ3aWR0aFwiLCAoY29uZi5sYXlvdXQud2lkdGgoKSArIFwicHhcIikpO1xuXHQgICAgc3ZnLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmxheW91dC53aWR0aCgpKTtcblxuXHQgICAgdmFyIGNsdXN0ZXIgPSBjb25mLmxheW91dC5jbHVzdGVyO1xuXHQgICAgdmFyIGRpYWdvbmFsID0gY29uZi5sYXlvdXQuZGlhZ29uYWwoKTtcblx0ICAgIHZhciB0cmFuc2Zvcm0gPSBjb25mLmxheW91dC50cmFuc2Zvcm1fbm9kZTtcblxuXHQgICAgdmFyIG1heF9sYWJlbF9sZW5ndGggPSBtYXhfbGVhZl9sYWJlbF9sZW5ndGgoY3Vyci50cmVlKTtcblx0ICAgIGNvbmYubGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKG1heF9sYWJlbF9sZW5ndGgpO1xuXG5cdCAgICB2YXIgbWF4X25vZGVfaGVpZ2h0ID0gbWF4X2xlYWZfbm9kZV9oZWlnaHQoY3Vyci50cmVlKTtcblxuXHQgICAgLy8gQ2x1c3RlciBzaXplIGlzIHRoZSByZXN1bHQgb2YuLi5cblx0ICAgIC8vIHRvdGFsIHdpZHRoIG9mIHRoZSB2aXMgLSB0cmFuc2Zvcm0gZm9yIHRoZSB0cmVlIC0gbWF4X2xlYWZfbGFiZWxfd2lkdGggLSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbGFiZWxcblx0Ly8gVE9ETzogU3Vic3RpdHV0ZSAxNSBieSB0aGUgdHJhbnNmb3JtIG9mIHRoZSBub2RlcyAocHJvYmFibHkgYnkgc2VsZWN0aW5nIG9uZSBub2RlIGFzc3VtaW5nIGFsbCB0aGUgbm9kZXMgaGF2ZSB0aGUgc2FtZSB0cmFuc2Zvcm1cblx0ICAgIHZhciBuX2xlYXZlcyA9IGN1cnIudHJlZS5nZXRfYWxsX2xlYXZlcygpLmxlbmd0aDtcblx0ICAgIHZhciBjbHVzdGVyX3NpemVfcGFyYW1zID0ge1xuXHRcdG5fbGVhdmVzIDogbl9sZWF2ZXMsXG5cdFx0bGFiZWxfaGVpZ2h0IDogZDMubWF4KFtkMy5mdW5jdG9yKGNvbmYubGFiZWwuaGVpZ2h0KCkpKCldKSxcblx0XHRsYWJlbF9wYWRkaW5nIDogMTVcblx0ICAgIH07XG5cdCAgICBjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG5cdCAgICBzdmdcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdFx0LmVhc2UoZWFzZSlcblx0XHQuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMCk7IC8vIGhlaWdodCBpcyBpbiB0aGUgbGF5b3V0XG5cblx0ICAgIHZpc1xuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLFxuXHRcdCAgICAgIFwidHJhbnNsYXRlKFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuXHRcdCAgICAgIFwiLFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuXHRcdCAgICAgIFwiKVwiKTtcblx0ICAgIFxuXHQgICAgY3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcblx0ICAgIGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuXHQgICAgY3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cblx0ICAgIC8vIExJTktTXG5cdCAgICB2YXIgbGluayA9IHZpcy5zZWxlY3RBbGwoXCJwYXRoLnRudF90cmVlX2xpbmtcIilcblx0XHQuZGF0YShjdXJyLmxpbmtzLCBmdW5jdGlvbihkKXtyZXR1cm4gZC50YXJnZXRbY29uZi5pZF19KTtcblxuICAgICAgICAgICAgLy8gTk9ERVNcblx0ICAgIHZhciBub2RlID0gdmlzLnNlbGVjdEFsbChcImcudG50X3RyZWVfbm9kZVwiKVxuXHRcdC5kYXRhKGN1cnIubm9kZXMsIGZ1bmN0aW9uKGQpIHtyZXR1cm4gZFtjb25mLmlkXX0pO1xuXG5cdCAgICB2YXIgZXhpdF9saW5rID0gbGlua1xuXHRcdC5leGl0KClcblx0XHQucmVtb3ZlKCk7XG5cblx0ICAgIGxpbmtcblx0XHQuZW50ZXIoKVxuXHRcdC5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xpbmtcIilcblx0XHQuYXR0cihcImlkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0ICAgIHJldHVybiBcInRudF90cmVlX2xpbmtfXCIgKyBkaXZfaWQgKyBcIl9cIiArIGQudGFyZ2V0Ll9pZDtcblx0XHR9KVxuXHRcdC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0ICAgIHJldHVybiBkMy5mdW5jdG9yKGNvbmYubGlua19jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0XHR9KVxuXHRcdC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblx0ICAgIGxpbmtcblx0ICAgIFx0LnRyYW5zaXRpb24oKVxuXHRcdC5lYXNlKGVhc2UpXG5cdCAgICBcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHQgICAgXHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cblx0ICAgIC8vIE5vZGVzXG5cdCAgICB2YXIgbmV3X25vZGUgPSBub2RlXG5cdFx0LmVudGVyKClcblx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24obikge1xuXHRcdCAgICBpZiAobi5jaGlsZHJlbikge1xuXHRcdFx0aWYgKG4uZGVwdGggPT0gMCkge1xuXHRcdFx0ICAgIHJldHVybiBcInJvb3QgdG50X3RyZWVfbm9kZVwiXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0ICAgIHJldHVybiBcImlubmVyIHRudF90cmVlX25vZGVcIlxuXHRcdFx0fVxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwibGVhZiB0bnRfdHJlZV9ub2RlXCJcblx0XHQgICAgfVxuXHRcdH0pXG5cdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZDtcblx0XHR9KVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG4gICBcblx0ICAgIC8vIEV4aXRpbmcgbm9kZXMgYXJlIGp1c3QgcmVtb3ZlZFxuXHQgICAgbm9kZVxuXHRcdC5leGl0KClcblx0XHQucmVtb3ZlKCk7XG5cblx0ICAgIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cblx0XHR0cmVlLnRyaWdnZXIoXCJub2RlOmNsaWNrXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgfSk7XG5cblx0ICAgIG5ld19ub2RlLm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdGNvbmYub25fbW91c2VvdmVyLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cblx0XHR0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgfSk7XG5cblx0ICAgIG5ld19ub2RlLm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRjb25mLm9uX2RibF9jbGljay5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXG5cdFx0dHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIH0pO1xuXG5cblx0ICAgIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGFsbCB0aGUgbm9kZXMgYWdhaW4gaW4gY2FzZSB0aGV5IGhhdmUgY2hhbmdlZCBsaXZlbHkgKG9yIHRoZSBsYXlvdXQpXG5cdCAgICBub2RlLnNlbGVjdEFsbChcIipcIikucmVtb3ZlKCk7XG5cdCAgICBub2RlXG5cdFx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpXG5cdFx0ICAgIH0pO1xuXG5cdCAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhbGwgdGhlIGxhYmVscyBhZ2FpbiBpbiBjYXNlIHRoZXkgaGF2ZSBjaGFuZ2VkIGxpdmVseSAob3IgdGhlIGxheW91dClcblx0ICAgIG5vZGVcblx0XHQgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcblx0XHQgICAgfSk7XG5cblx0ICAgIG5vZGVcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmVhc2UoZWFzZSlcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuXG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKHQpXG5cdC5nZXRzZXQgKGNvbmYpXG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIGRhdGEgdXNpbmcgZ2V0c2V0IC8gZmluYWxpemVycyAmIHRyYW5zZm9ybXNcbiAgICBhcGkubWV0aG9kICgnZGF0YScsIGZ1bmN0aW9uIChkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGJhc2UuZGF0YTtcblx0fVxuXG5cdC8vIFRoZSBvcmlnaW5hbCBkYXRhIGlzIHN0b3JlZCBhcyB0aGUgYmFzZSBhbmQgY3VyciBkYXRhXG5cdGJhc2UuZGF0YSA9IGQ7XG5cdGN1cnIuZGF0YSA9IGQ7XG5cblx0Ly8gU2V0IHVwIGEgbmV3IHRyZWUgYmFzZWQgb24gdGhlIGRhdGFcblx0dmFyIG5ld3RyZWUgPSB0bnRfdHJlZV9ub2RlKGJhc2UuZGF0YSk7XG5cblx0dC5yb290KG5ld3RyZWUpO1xuXG5cdHRyZWUudHJpZ2dlcihcImRhdGE6aGFzQ2hhbmdlZFwiLCBiYXNlLmRhdGEpO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogUmV3cml0ZSB0cmVlIHVzaW5nIGdldHNldCAvIGZpbmFsaXplcnMgJiB0cmFuc2Zvcm1zXG4gICAgYXBpLm1ldGhvZCAoJ3Jvb3QnLCBmdW5jdGlvbiAobXlUcmVlKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gY3Vyci50cmVlO1xuICAgIFx0fVxuXG5cdC8vIFRoZSBvcmlnaW5hbCB0cmVlIGlzIHN0b3JlZCBhcyB0aGUgYmFzZSwgcHJldiBhbmQgY3VyciB0cmVlXG4gICAgXHRiYXNlLnRyZWUgPSBteVRyZWU7XG5cdGN1cnIudHJlZSA9IGJhc2UudHJlZTtcbi8vXHRwcmV2LnRyZWUgPSBiYXNlLnRyZWU7XG4gICAgXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdzdWJ0cmVlJywgZnVuY3Rpb24gKGN1cnJfbm9kZXMpIHtcblx0dmFyIHN1YnRyZWUgPSBiYXNlLnRyZWUuc3VidHJlZShjdXJyX25vZGVzKTtcblx0Y3Vyci5kYXRhID0gc3VidHJlZS5kYXRhKCk7XG5cdGN1cnIudHJlZSA9IHN1YnRyZWU7XG5cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZm9jdXNfbm9kZScsIGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vIGZpbmQgXG5cdHZhciBmb3VuZF9ub2RlID0gdC5yb290KCkuZmluZF9ub2RlKGZ1bmN0aW9uIChuKSB7XG5cdCAgICByZXR1cm4gbm9kZS5pZCgpID09PSBuLmlkKCk7XG5cdH0pO1xuXHRmb2N1c2VkX25vZGUgPSBmb3VuZF9ub2RlO1xuXHR0LnN1YnRyZWUoZm91bmRfbm9kZS5nZXRfYWxsX2xlYXZlcygpKTtcblxuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdoYXNfZm9jdXMnLCBmdW5jdGlvbiAobm9kZSkge1xuXHRyZXR1cm4gKChmb2N1c2VkX25vZGUgIT09IHVuZGVmaW5lZCkgJiYgKGZvY3VzZWRfbm9kZS5pZCgpID09PSBub2RlLmlkKCkpKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyZWxlYXNlX2ZvY3VzJywgZnVuY3Rpb24gKCkge1xuXHR0LmRhdGEgKGJhc2UuZGF0YSk7XG5cdGZvY3VzZWRfbm9kZSA9IHVuZGVmaW5lZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWU7XG4iXX0=
