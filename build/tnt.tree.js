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
            iterator.call(context, obj[i], i, obj);
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              iterator.call(context, obj[key], key, obj);
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
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  }else if (typeof define === "function") {
    define(function() {
      return Events;
    });
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
var node = require("./src/node.js");
module.exports = exports = node;

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

    api.method ('find_all', function (cbak, deep) {
	var nodes = [];
	node.apply (function (n) {
	    if (cbak(n)) {
		nodes.push (n);
	    }
	});
	return nodes;
    });
    
    api.method ('find_node', function (cbak, deep) {
	if (cbak(node)) {
	    return node;
	}

	if (data.children !== undefined) {
	    for (var j=0; j<data.children.length; j++) {
		var found = tnt_node(data.children[j]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}

	if (deep && (data._children !== undefined)) {
	    for (var i=0; i<data._children.length; i++) {
		tnt_node(data._children[i]).find_node(cbak, deep)
		var found = tnt_node(data._children[i]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}
    });

    api.method ('find_node_by_name', function(name, deep) {
	return node.find_node (function (node) {
	    return node.node_name() === name
	}, deep);
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
	return this;
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

    api.method ('get_all_nodes', function (deep) {
	var nodes = [];
	node.apply(function (n) {
	    nodes.push(n);
	}, deep);
	return nodes;
    });

    api.method ('get_all_leaves', function (deep) {
	var leaves = [];
	node.apply(function (n) {
	    if (n.is_leaf(deep)) {
		leaves.push(n);
	    }
	}, deep);
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

    api.method ('subtree', function(nodes, keep_singletons) {
	if (keep_singletons === undefined) {
	    keep_singletons = false;
	}
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

	var subtree = {};
	copy_data (data, subtree, 0, function (node_data) {
	    var node_id = node_data._id;
	    var counts = node_counts[node_id];
	    
	    // Is in path
	    if (counts > 0) {
		if (is_singleton(node_data) && !keep_singletons) {
		    return false; 
		}
		return true;
	    }
	    // Is not in path
	    return false;
	});

	return tnt_node(subtree.children[0]);
    });

    var copy_data = function (orig_data, subtree, currBranchLength, condition) {
        if (orig_data === undefined) {
	    return;
        }

        if (condition(orig_data)) {
	    var copy = copy_node(orig_data, currBranchLength);
	    if (subtree.children === undefined) {
                subtree.children = [];
	    }
	    subtree.children.push(copy);
	    if (orig_data.children === undefined) {
                return;
	    }
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data (orig_data.children[i], copy, 0, condition);
	    }
        } else {
	    if (orig_data.children === undefined) {
                return;
	    }
	    currBranchLength += orig_data.branch_length || 0;
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data(orig_data.children[i], subtree, currBranchLength, condition);
	    }
        }
    };

    var copy_node = function (node_data, extraBranchLength) {
	var copy = {};
	// copy all the own properties excepts links to other nodes or depth
	for (var param in node_data) {
	    if ((param === "children") ||
		(param === "_children") ||
		(param === "_parent") ||
		(param === "depth")) {
		continue;
	    }
	    if (node_data.hasOwnProperty(param)) {
		copy[param] = node_data[param];
	    }
	}
	if ((copy.branch_length !== undefined) && (extraBranchLength !== undefined)) {
	    copy.branch_length += extraBranchLength;
	}
	return copy;
    };

    
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

    api.method ('flatten', function () {
	if (node.is_leaf()) {
	    return node;
	}
	var data = node.data();
	var newroot = copy_node(data);
	var leaves = node.get_all_leaves();
	newroot.children = [];
	for (var i=0; i<leaves.length; i++) {
	    newroot.children.push(copy_node(leaves[i].data()));
	}

	return tnt_node(newroot);
    });

    
    // TODO: This method only 'apply's to non collapsed nodes (ie ._children is not visited)
    // Would it be better to have an extra flag (true/false) to visit also collapsed nodes?
    api.method ('apply', function(cbak, deep) {
	if (deep === undefined) {
	    deep = false;
	}
	cbak(node);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = tnt_node(data.children[i])
		n.apply(cbak, deep);
	    }
	}

	if ((data._children !== undefined) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		var n = tnt_node(data._children[j]);
		n.apply(cbak, deep);
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

    api.method ('is_leaf', function(deep) {
	if (deep) {
	    return ((data.children === undefined) && (data._children === undefined));
	}
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

    api.method ('children', function (deep) {
	var children = [];

	if (data.children) {
	    for (var i=0; i<data.children.length; i++) {
		children.push(tnt_node(data.children[i]));
	    }
	}
	if ((data._children) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		children.push(tnt_node(data._children[j]));
	    }
	}
	if (children.length === 0) {
	    return undefined;
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

// tree.node_display.cond = function () {
//     var n = tree.node_display();

//     // conditions are objects with
//     // name : a name for this display
//     // callback: the condition to apply (receives a tnt.node)
//     // display: a node_display
//     var conds = [];

//     n.display (function (node) {
// 	var s = d3.functor(n.size())(node);
// 	for (var i=0; i<conds.length; i++) {
// 	    var cond = conds[i];
// 	    // For each node, the first condition met is used
// 	    if (cond.callback.call(this, node) === true) {
// 		cond.display.call(this, node)
// 		break;
// 	    }
// 	}
//     })

//     var api = apijs(n);

//     api.method("add", function (name, cbak, node_display) {
// 	conds.push({ name : name,
// 		     callback : cbak,
// 		     display : node_display
// 		   });
// 	return n;
//     });

//     api.method("reset", function () {
// 	conds = [];
// 	return n;
//     });

//     api.method("update", function (name, cbak, new_display) {
// 	for (var i=0; i<conds.length; i++) {
// 	    if (conds[i].name === name) {
// 		conds[i].callback = cbak;
// 		conds[i].display = new_display;
// 	    }
// 	}
// 	return n;
//     });

//     return n;

// };

module.exports = exports = tree.node_display;

},{"tnt.api":6}],21:[function(require,module,exports){
var apijs = require("tnt.api");
var tnt_tree_node = require("tnt.tree.node");

var tree = function () {
    "use strict";

    var dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout");

    var conf = {
	duration         : 500,      // Duration of the transitions
	node_display     : tree.node_display.circle(),
	label            : tree.label.text(),
	layout           : tree.layout.vertical(),
	// on_click         : function () {},
	// on_dbl_click     : function () {},
	// on_mouseover     : function () {},
	branch_color       : 'black',
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
    var links_g;
    var nodes_g;

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
	// All the links are grouped in a g element
	links_g = vis
	    .append("g")
	    .attr("class", "links");
	nodes_g = vis
	    .append("g")
	    .attr("class", "nodes");

	//var link = vis
	var link = links_g
	    .selectAll("path.tnt_tree_link")
	    .data(curr.links, function(d){return d.target[conf.id]});

	link
	    .enter()
	    .append("path")
	    .attr("class", "tnt_tree_link")
	    .attr("id", function(d) {
	    	return "tnt_tree_link_" + div_id + "_" + d.target._id;
	    })
	    .style("stroke", function (d) {
		return d3.functor(conf.branch_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
	    })
	    .attr("d", diagonal);

	// NODES
	//var node = vis
	var node = nodes_g
	    .selectAll("g.tnt_tree_node")
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
        var my_node = tnt_tree_node(node);
        tree.trigger("node:click", my_node);
        dispatch.click.call(this, my_node);
    });
    new_node.on("dblclick", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:dblclick", my_node);
        dispatch.dblclick.call(this, my_node);
    });
    new_node.on("mouseover", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:hover", tnt_tree_node(node));
        dispatch.mouseover.call(this, my_node);
    });
    new_node.on("mouseout", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:mouseout", tnt_tree_node(node));
        dispatch.mouseout.call(this, my_node);
    });

	// new_node.on("click", function (node) {
	//     conf.on_click.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:click", tnt_tree_node(node));
	// });
    //
	// new_node.on("mouseenter", function (node) {
	//     conf.on_mouseover.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:hover", tnt_tree_node(node));
	// });
    //
	// new_node.on("dblclick", function (node) {
	//     conf.on_dbl_click.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:dblclick", tnt_tree_node(node));
	// });


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
		label_height : d3.max([d3.functor(conf.label.height())(), max_node_height]),
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
	    var link = links_g
		.selectAll("path.tnt_tree_link")
		.data(curr.links, function(d){return d.target[conf.id]});

            // NODES
	    var node = nodes_g
		.selectAll("g.tnt_tree_node")
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
		    return d3.functor(conf.branch_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
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
            var my_node = tnt_tree_node(node);
            tree.trigger("node:click", my_node);
            dispatch.click.call(this, my_node);
        });
        new_node.on("dblclick", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:dblclick", my_node);
            dispatch.dblclick.call(this, my_node);
        });
        new_node.on("mouseover", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:hover", tnt_tree_node(node));
            dispatch.mouseover.call(this, my_node);
        });
        new_node.on("mouseout", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:mouseout", tnt_tree_node(node));
            dispatch.mouseout.call(this, my_node);
        });

	    // new_node.on("click", function (node) {
		// conf.on_click.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:click", tnt_tree_node(node));
	    // });
        //
	    // new_node.on("mouseenter", function (node) {
		// conf.on_mouseover.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:hover", tnt_tree_node(node));
	    // });
        //
	    // new_node.on("dblclick", function (node) {
		// conf.on_dbl_click.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:dblclick", tnt_tree_node(node));
	    // });


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

    api.method ('subtree', function (curr_nodes, keepSingletons) {
	var subtree = base.tree.subtree(curr_nodes, keepSingletons);
	curr.data = subtree.data();
	curr.tree = subtree;

	return this;
    });

    api.method ('focus_node', function (node, keepSingletons) {
	// find
	var found_node = t.root().find_node(function (n) {
	    return node.id() === n.id();
	});
	focused_node = found_node;
	t.subtree(found_node.get_all_leaves(), keepSingletons);

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

    return d3.rebind (t, dispatch, "on");
};

module.exports = exports = tree;

},{"tnt.api":6,"tnt.tree.node":10}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvZmFrZV82ZTE5MDE3MS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvYmlvanMtZXZlbnRzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQuYXBpL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQuYXBpL3NyYy9hcGkuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svc3JjL25ld2ljay5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3JlZHVjZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy91dGlscy5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9zcmMvbm9kZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9zcmMvZGlhZ29uYWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL3NyYy9sYWJlbC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9zcmMvbGF5b3V0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL3NyYy9ub2RlX2Rpc3BsYXkuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvc3JjL3RyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFJBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSB7fTtcbn1cbnRudC50cmVlID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG50bnQudHJlZS5ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG50bnQudHJlZS5wYXJzZV9uZXdpY2sgPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uZXdpY2s7XG50bnQudHJlZS5wYXJzZV9uaHggPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uaHg7XG5cbiIsIi8vIGlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSB7fVxuLy8gfVxubW9kdWxlLmV4cG9ydHMgPSB0cmVlID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xudmFyIGV2ZW50c3lzdGVtID0gcmVxdWlyZShcImJpb2pzLWV2ZW50c1wiKTtcbmV2ZW50c3lzdGVtLm1peGluKHRyZWUpO1xuLy90bnQudXRpbHMgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpO1xuLy90bnQudG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcbi8vdG50LnRyZWUgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG5cbiIsInZhciBldmVudHMgPSByZXF1aXJlKFwiYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmVcIik7XG5cbmV2ZW50cy5vbkFsbCA9IGZ1bmN0aW9uKGNhbGxiYWNrLGNvbnRleHQpe1xuICB0aGlzLm9uKFwiYWxsXCIsIGNhbGxiYWNrLGNvbnRleHQpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIE1peGluIHV0aWxpdHlcbmV2ZW50cy5vbGRNaXhpbiA9IGV2ZW50cy5taXhpbjtcbmV2ZW50cy5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gIGV2ZW50cy5vbGRNaXhpbihwcm90byk7XG4gIC8vIGFkZCBjdXN0b20gb25BbGxcbiAgdmFyIGV4cG9ydHMgPSBbJ29uQWxsJ107XG4gIGZvcih2YXIgaT0wOyBpIDwgZXhwb3J0cy5sZW5ndGg7aSsrKXtcbiAgICB2YXIgbmFtZSA9IGV4cG9ydHNbaV07XG4gICAgcHJvdG9bbmFtZV0gPSB0aGlzW25hbWVdO1xuICB9XG4gIHJldHVybiBwcm90bztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRzO1xuIiwiLyoqXG4gKiBTdGFuZGFsb25lIGV4dHJhY3Rpb24gb2YgQmFja2JvbmUuRXZlbnRzLCBubyBleHRlcm5hbCBkZXBlbmRlbmN5IHJlcXVpcmVkLlxuICogRGVncmFkZXMgbmljZWx5IHdoZW4gQmFja29uZS91bmRlcnNjb3JlIGFyZSBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgY3VycmVudFxuICogZ2xvYmFsIGNvbnRleHQuXG4gKlxuICogTm90ZSB0aGF0IGRvY3Mgc3VnZ2VzdCB0byB1c2UgdW5kZXJzY29yZSdzIGBfLmV4dGVuZCgpYCBtZXRob2QgdG8gYWRkIEV2ZW50c1xuICogc3VwcG9ydCB0byBzb21lIGdpdmVuIG9iamVjdC4gQSBgbWl4aW4oKWAgbWV0aG9kIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBFdmVudHNcbiAqIHByb3RvdHlwZSB0byBhdm9pZCB1c2luZyB1bmRlcnNjb3JlIGZvciB0aGF0IHNvbGUgcHVycG9zZTpcbiAqXG4gKiAgICAgdmFyIG15RXZlbnRFbWl0dGVyID0gQmFja2JvbmVFdmVudHMubWl4aW4oe30pO1xuICpcbiAqIE9yIGZvciBhIGZ1bmN0aW9uIGNvbnN0cnVjdG9yOlxuICpcbiAqICAgICBmdW5jdGlvbiBNeUNvbnN0cnVjdG9yKCl7fVxuICogICAgIE15Q29uc3RydWN0b3IucHJvdG90eXBlLmZvbyA9IGZ1bmN0aW9uKCl7fVxuICogICAgIEJhY2tib25lRXZlbnRzLm1peGluKE15Q29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAqXG4gKiAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBJbmMuXG4gKiAoYykgMjAxMyBOaWNvbGFzIFBlcnJpYXVsdFxuICovXG4vKiBnbG9iYWwgZXhwb3J0czp0cnVlLCBkZWZpbmUsIG1vZHVsZSAqL1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgcm9vdCA9IHRoaXMsXG4gICAgICBuYXRpdmVGb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2gsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZSxcbiAgICAgIGlkQ291bnRlciA9IDA7XG5cbiAgLy8gUmV0dXJucyBhIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gbWF0Y2hpbmcgdGhlIG1pbmltYWwgQVBJIHN1YnNldCByZXF1aXJlZFxuICAvLyBieSBCYWNrYm9uZS5FdmVudHNcbiAgZnVuY3Rpb24gbWluaXNjb3JlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBrZXlzOiBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvYmogIT09IFwiZnVuY3Rpb25cIiB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwia2V5cygpIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleSwga2V5cyA9IFtdO1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGtleXNba2V5cy5sZW5ndGhdID0ga2V5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgIH0sXG5cbiAgICAgIHVuaXF1ZUlkOiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICAgICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gICAgICB9LFxuXG4gICAgICBoYXM6IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgICAgIH0sXG5cbiAgICAgIGVhY2g6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXksIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvbmNlOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICBmdW5jID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdmFyIF8gPSBtaW5pc2NvcmUoKSwgRXZlbnRzO1xuXG4gIC8vIEJhY2tib25lLkV2ZW50c1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBBIG1vZHVsZSB0aGF0IGNhbiBiZSBtaXhlZCBpbiB0byAqYW55IG9iamVjdCogaW4gb3JkZXIgdG8gcHJvdmlkZSBpdCB3aXRoXG4gIC8vIGN1c3RvbSBldmVudHMuIFlvdSBtYXkgYmluZCB3aXRoIGBvbmAgb3IgcmVtb3ZlIHdpdGggYG9mZmAgY2FsbGJhY2tcbiAgLy8gZnVuY3Rpb25zIHRvIGFuIGV2ZW50OyBgdHJpZ2dlcmAtaW5nIGFuIGV2ZW50IGZpcmVzIGFsbCBjYWxsYmFja3MgaW5cbiAgLy8gc3VjY2Vzc2lvbi5cbiAgLy9cbiAgLy8gICAgIHZhciBvYmplY3QgPSB7fTtcbiAgLy8gICAgIF8uZXh0ZW5kKG9iamVjdCwgQmFja2JvbmUuRXZlbnRzKTtcbiAgLy8gICAgIG9iamVjdC5vbignZXhwYW5kJywgZnVuY3Rpb24oKXsgYWxlcnQoJ2V4cGFuZGVkJyk7IH0pO1xuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIoJ2V4cGFuZCcpO1xuICAvL1xuICBFdmVudHMgPSB7XG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi4gUGFzc2luZyBgXCJhbGxcImAgd2lsbCBiaW5kXG4gICAgLy8gdGhlIGNhbGxiYWNrIHRvIGFsbCBldmVudHMgZmlyZWQuXG4gICAgb246IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb24nLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdIHx8ICh0aGlzLl9ldmVudHNbbmFtZV0gPSBbXSk7XG4gICAgICBldmVudHMucHVzaCh7Y2FsbGJhY2s6IGNhbGxiYWNrLCBjb250ZXh0OiBjb250ZXh0LCBjdHg6IGNvbnRleHQgfHwgdGhpc30pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gb25seSBiZSB0cmlnZ2VyZWQgYSBzaW5nbGUgdGltZS4gQWZ0ZXIgdGhlIGZpcnN0IHRpbWVcbiAgICAvLyB0aGUgY2FsbGJhY2sgaXMgaW52b2tlZCwgaXQgd2lsbCBiZSByZW1vdmVkLlxuICAgIG9uY2U6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb25jZScsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgb25jZSA9IF8ub25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5vZmYobmFtZSwgb25jZSk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICAgIG9uY2UuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICByZXR1cm4gdGhpcy5vbihuYW1lLCBvbmNlLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIG9uZSBvciBtYW55IGNhbGxiYWNrcy4gSWYgYGNvbnRleHRgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIHdpdGggdGhhdCBmdW5jdGlvbi4gSWYgYGNhbGxiYWNrYCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgdGhlIGV2ZW50LiBJZiBgbmFtZWAgaXMgbnVsbCwgcmVtb3ZlcyBhbGwgYm91bmRcbiAgICAvLyBjYWxsYmFja3MgZm9yIGFsbCBldmVudHMuXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgdmFyIHJldGFpbiwgZXYsIGV2ZW50cywgbmFtZXMsIGksIGwsIGosIGs7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhZXZlbnRzQXBpKHRoaXMsICdvZmYnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIW5hbWUgJiYgIWNhbGxiYWNrICYmICFjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbmFtZXMgPSBuYW1lID8gW25hbWVdIDogXy5rZXlzKHRoaXMuX2V2ZW50cyk7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgaWYgKGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IHJldGFpbiA9IFtdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayB8fCBjb250ZXh0KSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gZXZlbnRzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICBldiA9IGV2ZW50c1tqXTtcbiAgICAgICAgICAgICAgaWYgKChjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrLl9jYWxsYmFjaykgfHxcbiAgICAgICAgICAgICAgICAgIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGV2LmNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0YWluLnB1c2goZXYpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmV0YWluLmxlbmd0aCkgZGVsZXRlIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVHJpZ2dlciBvbmUgb3IgbWFueSBldmVudHMsIGZpcmluZyBhbGwgYm91bmQgY2FsbGJhY2tzLiBDYWxsYmFja3MgYXJlXG4gICAgLy8gcGFzc2VkIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBgdHJpZ2dlcmAgaXMsIGFwYXJ0IGZyb20gdGhlIGV2ZW50IG5hbWVcbiAgICAvLyAodW5sZXNzIHlvdSdyZSBsaXN0ZW5pbmcgb24gYFwiYWxsXCJgLCB3aGljaCB3aWxsIGNhdXNlIHlvdXIgY2FsbGJhY2sgdG9cbiAgICAvLyByZWNlaXZlIHRoZSB0cnVlIG5hbWUgb2YgdGhlIGV2ZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCkuXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAndHJpZ2dlcicsIG5hbWUsIGFyZ3MpKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICB2YXIgYWxsRXZlbnRzID0gdGhpcy5fZXZlbnRzLmFsbDtcbiAgICAgIGlmIChldmVudHMpIHRyaWdnZXJFdmVudHMoZXZlbnRzLCBhcmdzKTtcbiAgICAgIGlmIChhbGxFdmVudHMpIHRyaWdnZXJFdmVudHMoYWxsRXZlbnRzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRlbGwgdGhpcyBvYmplY3QgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gZWl0aGVyIHNwZWNpZmljIGV2ZW50cyAuLi4gb3JcbiAgICAvLyB0byBldmVyeSBvYmplY3QgaXQncyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvLlxuICAgIHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZGVsZXRlTGlzdGVuZXIgPSAhbmFtZSAmJiAhY2FsbGJhY2s7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBpZiAob2JqKSAobGlzdGVuZXJzID0ge30pW29iai5fbGlzdGVuZXJJZF0gPSBvYmo7XG4gICAgICBmb3IgKHZhciBpZCBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXJzW2lkXS5vZmYobmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgICBpZiAoZGVsZXRlTGlzdGVuZXIpIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbaWRdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gIH07XG5cbiAgLy8gUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gc3BsaXQgZXZlbnQgc3RyaW5ncy5cbiAgdmFyIGV2ZW50U3BsaXR0ZXIgPSAvXFxzKy87XG5cbiAgLy8gSW1wbGVtZW50IGZhbmN5IGZlYXR1cmVzIG9mIHRoZSBFdmVudHMgQVBJIHN1Y2ggYXMgbXVsdGlwbGUgZXZlbnRcbiAgLy8gbmFtZXMgYFwiY2hhbmdlIGJsdXJcImAgYW5kIGpRdWVyeS1zdHlsZSBldmVudCBtYXBzIGB7Y2hhbmdlOiBhY3Rpb259YFxuICAvLyBpbiB0ZXJtcyBvZiB0aGUgZXhpc3RpbmcgQVBJLlxuICB2YXIgZXZlbnRzQXBpID0gZnVuY3Rpb24ob2JqLCBhY3Rpb24sIG5hbWUsIHJlc3QpIHtcbiAgICBpZiAoIW5hbWUpIHJldHVybiB0cnVlO1xuXG4gICAgLy8gSGFuZGxlIGV2ZW50IG1hcHMuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG5hbWUpIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBba2V5LCBuYW1lW2tleV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHNwYWNlIHNlcGFyYXRlZCBldmVudCBuYW1lcy5cbiAgICBpZiAoZXZlbnRTcGxpdHRlci50ZXN0KG5hbWUpKSB7XG4gICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KGV2ZW50U3BsaXR0ZXIpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBbbmFtZXNbaV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gQSBkaWZmaWN1bHQtdG8tYmVsaWV2ZSwgYnV0IG9wdGltaXplZCBpbnRlcm5hbCBkaXNwYXRjaCBmdW5jdGlvbiBmb3JcbiAgLy8gdHJpZ2dlcmluZyBldmVudHMuIFRyaWVzIHRvIGtlZXAgdGhlIHVzdWFsIGNhc2VzIHNwZWVkeSAobW9zdCBpbnRlcm5hbFxuICAvLyBCYWNrYm9uZSBldmVudHMgaGF2ZSAzIGFyZ3VtZW50cykuXG4gIHZhciB0cmlnZ2VyRXZlbnRzID0gZnVuY3Rpb24oZXZlbnRzLCBhcmdzKSB7XG4gICAgdmFyIGV2LCBpID0gLTEsIGwgPSBldmVudHMubGVuZ3RoLCBhMSA9IGFyZ3NbMF0sIGEyID0gYXJnc1sxXSwgYTMgPSBhcmdzWzJdO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgpOyByZXR1cm47XG4gICAgICBjYXNlIDE6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSk7IHJldHVybjtcbiAgICAgIGNhc2UgMjogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMik7IHJldHVybjtcbiAgICAgIGNhc2UgMzogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMiwgYTMpOyByZXR1cm47XG4gICAgICBkZWZhdWx0OiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5hcHBseShldi5jdHgsIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbGlzdGVuTWV0aG9kcyA9IHtsaXN0ZW5UbzogJ29uJywgbGlzdGVuVG9PbmNlOiAnb25jZSd9O1xuXG4gIC8vIEludmVyc2lvbi1vZi1jb250cm9sIHZlcnNpb25zIG9mIGBvbmAgYW5kIGBvbmNlYC4gVGVsbCAqdGhpcyogb2JqZWN0IHRvXG4gIC8vIGxpc3RlbiB0byBhbiBldmVudCBpbiBhbm90aGVyIG9iamVjdCAuLi4ga2VlcGluZyB0cmFjayBvZiB3aGF0IGl0J3NcbiAgLy8gbGlzdGVuaW5nIHRvLlxuICBfLmVhY2gobGlzdGVuTWV0aG9kcywgZnVuY3Rpb24oaW1wbGVtZW50YXRpb24sIG1ldGhvZCkge1xuICAgIEV2ZW50c1ttZXRob2RdID0gZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCAodGhpcy5fbGlzdGVuZXJzID0ge30pO1xuICAgICAgdmFyIGlkID0gb2JqLl9saXN0ZW5lcklkIHx8IChvYmouX2xpc3RlbmVySWQgPSBfLnVuaXF1ZUlkKCdsJykpO1xuICAgICAgbGlzdGVuZXJzW2lkXSA9IG9iajtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIG9ialtpbXBsZW1lbnRhdGlvbl0obmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIEV2ZW50cy5iaW5kICAgPSBFdmVudHMub247XG4gIEV2ZW50cy51bmJpbmQgPSBFdmVudHMub2ZmO1xuXG4gIC8vIE1peGluIHV0aWxpdHlcbiAgRXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgICB2YXIgZXhwb3J0cyA9IFsnb24nLCAnb25jZScsICdvZmYnLCAndHJpZ2dlcicsICdzdG9wTGlzdGVuaW5nJywgJ2xpc3RlblRvJyxcbiAgICAgICAgICAgICAgICAgICAnbGlzdGVuVG9PbmNlJywgJ2JpbmQnLCAndW5iaW5kJ107XG4gICAgXy5lYWNoKGV4cG9ydHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gcHJvdG87XG4gIH07XG5cbiAgLy8gRXhwb3J0IEV2ZW50cyBhcyBCYWNrYm9uZUV2ZW50cyBkZXBlbmRpbmcgb24gY3VycmVudCBjb250ZXh0XG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50cztcbiAgICB9XG4gICAgZXhwb3J0cy5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfWVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBFdmVudHM7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfVxufSkodGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2FwaS5qc1wiKTtcbiIsInZhciBhcGkgPSBmdW5jdGlvbiAod2hvKSB7XG5cbiAgICB2YXIgX21ldGhvZHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBtID0gW107XG5cblx0bS5hZGRfYmF0Y2ggPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICBtLnVuc2hpZnQob2JqKTtcblx0fTtcblxuXHRtLnVwZGF0ZSA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRtW2ldW3BdID0gdmFsdWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBmYWxzZTtcblx0fTtcblxuXHRtLmFkZCA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlKSB7XG5cdCAgICBpZiAobS51cGRhdGUgKG1ldGhvZCwgdmFsdWUpICkge1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgcmVnID0ge307XG5cdFx0cmVnW21ldGhvZF0gPSB2YWx1ZTtcblx0XHRtLmFkZF9iYXRjaCAocmVnKTtcblx0ICAgIH1cblx0fTtcblxuXHRtLmdldCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdHJldHVybiBtW2ldW3BdO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHR9O1xuXG5cdHJldHVybiBtO1xuICAgIH07XG5cbiAgICB2YXIgbWV0aG9kcyAgICA9IF9tZXRob2RzKCk7XG4gICAgdmFyIGFwaSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgYXBpLmNoZWNrID0gZnVuY3Rpb24gKG1ldGhvZCwgY2hlY2ssIG1zZykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkuY2hlY2sobWV0aG9kW2ldLCBjaGVjaywgbXNnKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC5jaGVjayhjaGVjaywgbXNnKTtcblx0fSBlbHNlIHtcblx0ICAgIHdob1ttZXRob2RdLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAobWV0aG9kLCBjYmFrKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS50cmFuc2Zvcm0gKG1ldGhvZFtpXSwgY2Jhayk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QudHJhbnNmb3JtIChjYmFrKTtcblx0fSBlbHNlIHtcblx0ICAgIHdob1ttZXRob2RdLnRyYW5zZm9ybShjYmFrKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICB2YXIgYXR0YWNoX21ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QsIG9wdHMpIHtcblx0dmFyIGNoZWNrcyA9IFtdO1xuXHR2YXIgdHJhbnNmb3JtcyA9IFtdO1xuXG5cdHZhciBnZXR0ZXIgPSBvcHRzLm9uX2dldHRlciB8fCBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gbWV0aG9kcy5nZXQobWV0aG9kKTtcblx0fTtcblxuXHR2YXIgc2V0dGVyID0gb3B0cy5vbl9zZXR0ZXIgfHwgZnVuY3Rpb24gKHgpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFuc2Zvcm1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0eCA9IHRyYW5zZm9ybXNbaV0oeCk7XG5cdCAgICB9XG5cblx0ICAgIGZvciAodmFyIGo9MDsgajxjaGVja3MubGVuZ3RoOyBqKyspIHtcblx0XHRpZiAoIWNoZWNrc1tqXS5jaGVjayh4KSkge1xuXHRcdCAgICB2YXIgbXNnID0gY2hlY2tzW2pdLm1zZyB8fCBcblx0XHRcdChcIlZhbHVlIFwiICsgeCArIFwiIGRvZXNuJ3Qgc2VlbSB0byBiZSB2YWxpZCBmb3IgdGhpcyBtZXRob2RcIik7XG5cdFx0ICAgIHRocm93IChtc2cpO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIG1ldGhvZHMuYWRkKG1ldGhvZCwgeCk7XG5cdH07XG5cblx0dmFyIG5ld19tZXRob2QgPSBmdW5jdGlvbiAobmV3X3ZhbCkge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGdldHRlcigpO1xuXHQgICAgfVxuXHQgICAgc2V0dGVyKG5ld192YWwpO1xuXHQgICAgcmV0dXJuIHdobzsgLy8gUmV0dXJuIHRoaXM/XG5cdH07XG5cdG5ld19tZXRob2QuY2hlY2sgPSBmdW5jdGlvbiAoY2JhaywgbXNnKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gY2hlY2tzO1xuXHQgICAgfVxuXHQgICAgY2hlY2tzLnB1c2ggKHtjaGVjayA6IGNiYWssXG5cdFx0XHQgIG1zZyAgIDogbXNnfSk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fTtcblx0bmV3X21ldGhvZC50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY2Jhaykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIHRyYW5zZm9ybXM7XG5cdCAgICB9XG5cdCAgICB0cmFuc2Zvcm1zLnB1c2goY2Jhayk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fTtcblxuXHR3aG9bbWV0aG9kXSA9IG5ld19tZXRob2Q7XG4gICAgfTtcblxuICAgIHZhciBnZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIG9wdHMpIHtcblx0aWYgKHR5cGVvZiAocGFyYW0pID09PSAnb2JqZWN0Jykge1xuXHQgICAgbWV0aG9kcy5hZGRfYmF0Y2ggKHBhcmFtKTtcblx0ICAgIGZvciAodmFyIHAgaW4gcGFyYW0pIHtcblx0XHRhdHRhY2hfbWV0aG9kIChwLCBvcHRzKTtcblx0ICAgIH1cblx0fSBlbHNlIHtcblx0ICAgIG1ldGhvZHMuYWRkIChwYXJhbSwgb3B0cy5kZWZhdWx0X3ZhbHVlKTtcblx0ICAgIGF0dGFjaF9tZXRob2QgKHBhcmFtLCBvcHRzKTtcblx0fVxuICAgIH07XG5cbiAgICBhcGkuZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZn0pO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5nZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fc2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIGdldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgc2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX3NldHRlciA6IG9uX3NldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuc2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX2dldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBzZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIGdldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9nZXR0ZXIgOiBvbl9nZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCA9IGZ1bmN0aW9uIChuYW1lLCBjYmFrKSB7XG5cdGlmICh0eXBlb2YgKG5hbWUpID09PSAnb2JqZWN0Jykge1xuXHQgICAgZm9yICh2YXIgcCBpbiBuYW1lKSB7XG5cdFx0d2hvW3BdID0gbmFtZVtwXTtcblx0ICAgIH1cblx0fSBlbHNlIHtcblx0ICAgIHdob1tuYW1lXSA9IGNiYWs7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFwaTtcbiAgICBcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGFwaTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9uZXdpY2suanNcIik7XG4iLCIvKipcbiAqIE5ld2ljayBhbmQgbmh4IGZvcm1hdHMgcGFyc2VyIGluIEphdmFTY3JpcHQuXG4gKlxuICogQ29weXJpZ2h0IChjKSBKYXNvbiBEYXZpZXMgMjAxMCBhbmQgTWlndWVsIFBpZ25hdGVsbGlcbiAqICBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqICBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqICBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICpcbiAqIEV4YW1wbGUgdHJlZSAoZnJvbSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL05ld2lja19mb3JtYXQpOlxuICpcbiAqICstLTAuMS0tQVxuICogRi0tLS0tMC4yLS0tLS1CICAgICAgICAgICAgKy0tLS0tLS0wLjMtLS0tQ1xuICogKy0tLS0tLS0tLS0tLS0tLS0tLTAuNS0tLS0tRVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgKy0tLS0tLS0tLTAuNC0tLS0tLURcbiAqXG4gKiBOZXdpY2sgZm9ybWF0OlxuICogKEE6MC4xLEI6MC4yLChDOjAuMyxEOjAuNClFOjAuNSlGO1xuICpcbiAqIENvbnZlcnRlZCB0byBKU09OOlxuICoge1xuICogICBuYW1lOiBcIkZcIixcbiAqICAgYnJhbmNoc2V0OiBbXG4gKiAgICAge25hbWU6IFwiQVwiLCBsZW5ndGg6IDAuMX0sXG4gKiAgICAge25hbWU6IFwiQlwiLCBsZW5ndGg6IDAuMn0sXG4gKiAgICAge1xuICogICAgICAgbmFtZTogXCJFXCIsXG4gKiAgICAgICBsZW5ndGg6IDAuNSxcbiAqICAgICAgIGJyYW5jaHNldDogW1xuICogICAgICAgICB7bmFtZTogXCJDXCIsIGxlbmd0aDogMC4zfSxcbiAqICAgICAgICAge25hbWU6IFwiRFwiLCBsZW5ndGg6IDAuNH1cbiAqICAgICAgIF1cbiAqICAgICB9XG4gKiAgIF1cbiAqIH1cbiAqXG4gKiBDb252ZXJ0ZWQgdG8gSlNPTiwgYnV0IHdpdGggbm8gbmFtZXMgb3IgbGVuZ3RoczpcbiAqIHtcbiAqICAgYnJhbmNoc2V0OiBbXG4gKiAgICAge30sIHt9LCB7XG4gKiAgICAgICBicmFuY2hzZXQ6IFt7fSwge31dXG4gKiAgICAgfVxuICogICBdXG4gKiB9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcGFyc2VfbmV3aWNrIDogZnVuY3Rpb24ocykge1xuXHR2YXIgYW5jZXN0b3JzID0gW107XG5cdHZhciB0cmVlID0ge307XG5cdHZhciB0b2tlbnMgPSBzLnNwbGl0KC9cXHMqKDt8XFwofFxcKXwsfDopXFxzKi8pO1xuXHR2YXIgc3VidHJlZTtcblx0Zm9yICh2YXIgaT0wOyBpPHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXHQgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgICAgY2FzZSAnKCc6IC8vIG5ldyBicmFuY2hzZXRcblx0XHRzdWJ0cmVlID0ge307XG5cdFx0dHJlZS5jaGlsZHJlbiA9IFtzdWJ0cmVlXTtcblx0XHRhbmNlc3RvcnMucHVzaCh0cmVlKTtcblx0XHR0cmVlID0gc3VidHJlZTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJywnOiAvLyBhbm90aGVyIGJyYW5jaFxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHRhbmNlc3RvcnNbYW5jZXN0b3JzLmxlbmd0aC0xXS5jaGlsZHJlbi5wdXNoKHN1YnRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnKSc6IC8vIG9wdGlvbmFsIG5hbWUgbmV4dFxuXHRcdHRyZWUgPSBhbmNlc3RvcnMucG9wKCk7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICc6JzogLy8gb3B0aW9uYWwgbGVuZ3RoIG5leHRcblx0XHRicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG5cdFx0dmFyIHggPSB0b2tlbnNbaS0xXTtcblx0XHRpZiAoeCA9PSAnKScgfHwgeCA9PSAnKCcgfHwgeCA9PSAnLCcpIHtcblx0XHQgICAgdHJlZS5uYW1lID0gdG9rZW47XG5cdFx0fSBlbHNlIGlmICh4ID09ICc6Jykge1xuXHRcdCAgICB0cmVlLmJyYW5jaF9sZW5ndGggPSBwYXJzZUZsb2F0KHRva2VuKTtcblx0XHR9XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRyZWU7XG4gICAgfSxcblxuICAgIHBhcnNlX25oeCA6IGZ1bmN0aW9uIChzKSB7XG5cdHZhciBhbmNlc3RvcnMgPSBbXTtcblx0dmFyIHRyZWUgPSB7fTtcblx0dmFyIHN1YnRyZWU7XG5cblx0dmFyIHRva2VucyA9IHMuc3BsaXQoIC9cXHMqKDt8XFwofFxcKXxcXFt8XFxdfCx8Onw9KVxccyovICk7XG5cdGZvciAodmFyIGk9MDsgaTx0b2tlbnMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXTtcblx0ICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgICAgICAgIGNhc2UgJygnOiAvLyBuZXcgY2hpbGRyZW5cblx0XHRzdWJ0cmVlID0ge307XG5cdFx0dHJlZS5jaGlsZHJlbiA9IFtzdWJ0cmVlXTtcblx0XHRhbmNlc3RvcnMucHVzaCh0cmVlKTtcblx0XHR0cmVlID0gc3VidHJlZTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJywnOiAvLyBhbm90aGVyIGJyYW5jaFxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHRhbmNlc3RvcnNbYW5jZXN0b3JzLmxlbmd0aC0xXS5jaGlsZHJlbi5wdXNoKHN1YnRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnKSc6IC8vIG9wdGlvbmFsIG5hbWUgbmV4dFxuXHRcdHRyZWUgPSBhbmNlc3RvcnMucG9wKCk7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICc6JzogLy8gb3B0aW9uYWwgbGVuZ3RoIG5leHRcblx0XHRicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG5cdFx0dmFyIHggPSB0b2tlbnNbaS0xXTtcblx0XHRpZiAoeCA9PSAnKScgfHwgeCA9PSAnKCcgfHwgeCA9PSAnLCcpIHtcblx0XHQgICAgdHJlZS5uYW1lID0gdG9rZW47XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHggPT0gJzonKSB7XG5cdFx0ICAgIHZhciB0ZXN0X3R5cGUgPSB0eXBlb2YgdG9rZW47XG5cdFx0ICAgIGlmKCFpc05hTih0b2tlbikpe1xuXHRcdFx0dHJlZS5icmFuY2hfbGVuZ3RoID0gcGFyc2VGbG9hdCh0b2tlbik7XG5cdFx0ICAgIH1cblx0XHR9XG5cdFx0ZWxzZSBpZiAoeCA9PSAnPScpe1xuXHRcdCAgICB2YXIgeDIgPSB0b2tlbnNbaS0yXTtcblx0XHQgICAgc3dpdGNoKHgyKXtcblx0XHQgICAgY2FzZSAnRCc6XG5cdFx0XHR0cmVlLmR1cGxpY2F0aW9uID0gdG9rZW47XG5cdFx0XHRicmVhaztcblx0XHQgICAgY2FzZSAnRyc6XG5cdFx0XHR0cmVlLmdlbmVfaWQgPSB0b2tlbjtcblx0XHRcdGJyZWFrO1xuXHRcdCAgICBjYXNlICdUJzpcblx0XHRcdHRyZWUudGF4b25faWQgPSB0b2tlbjtcblx0XHRcdGJyZWFrO1xuXHRcdCAgICBkZWZhdWx0IDpcblx0XHRcdHRyZWVbdG9rZW5zW2ktMl1dID0gdG9rZW47XG5cdFx0ICAgIH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0ICAgIHZhciB0ZXN0O1xuXG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0cmVlO1xuICAgIH1cbn07XG4iLCJ2YXIgbm9kZSA9IHJlcXVpcmUoXCIuL3NyYy9ub2RlLmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gbm9kZTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiLy8gcmVxdWlyZSgnZnMnKS5yZWFkZGlyU3luYyhfX2Rpcm5hbWUgKyAnLycpLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuLy8gICAgIGlmIChmaWxlLm1hdGNoKC8uK1xcLmpzL2cpICE9PSBudWxsICYmIGZpbGUgIT09IF9fZmlsZW5hbWUpIHtcbi8vIFx0dmFyIG5hbWUgPSBmaWxlLnJlcGxhY2UoJy5qcycsICcnKTtcbi8vIFx0bW9kdWxlLmV4cG9ydHNbbmFtZV0gPSByZXF1aXJlKCcuLycgKyBmaWxlKTtcbi8vICAgICB9XG4vLyB9KTtcblxuLy8gU2FtZSBhc1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG51dGlscy5yZWR1Y2UgPSByZXF1aXJlKFwiLi9yZWR1Y2UuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB1dGlscztcbiIsInZhciByZWR1Y2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNtb290aCA9IDU7XG4gICAgdmFyIHZhbHVlID0gJ3ZhbCc7XG4gICAgdmFyIHJlZHVuZGFudCA9IGZ1bmN0aW9uIChhLCBiKSB7XG5cdGlmIChhIDwgYikge1xuXHQgICAgcmV0dXJuICgoYi1hKSA8PSAoYiAqIDAuMikpO1xuXHR9XG5cdHJldHVybiAoKGEtYikgPD0gKGEgKiAwLjIpKTtcbiAgICB9O1xuICAgIHZhciBwZXJmb3JtX3JlZHVjZSA9IGZ1bmN0aW9uIChhcnIpIHtyZXR1cm4gYXJyO307XG5cbiAgICB2YXIgcmVkdWNlID0gZnVuY3Rpb24gKGFycikge1xuXHRpZiAoIWFyci5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBhcnI7XG5cdH1cblx0dmFyIHNtb290aGVkID0gcGVyZm9ybV9zbW9vdGgoYXJyKTtcblx0dmFyIHJlZHVjZWQgID0gcGVyZm9ybV9yZWR1Y2Uoc21vb3RoZWQpO1xuXHRyZXR1cm4gcmVkdWNlZDtcbiAgICB9O1xuXG4gICAgdmFyIG1lZGlhbiA9IGZ1bmN0aW9uICh2LCBhcnIpIHtcblx0YXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0ICAgIHJldHVybiBhW3ZhbHVlXSAtIGJbdmFsdWVdO1xuXHR9KTtcblx0aWYgKGFyci5sZW5ndGggJSAyKSB7XG5cdCAgICB2W3ZhbHVlXSA9IGFyclt+fihhcnIubGVuZ3RoIC8gMildW3ZhbHVlXTtcdCAgICBcblx0fSBlbHNlIHtcblx0ICAgIHZhciBuID0gfn4oYXJyLmxlbmd0aCAvIDIpIC0gMTtcblx0ICAgIHZbdmFsdWVdID0gKGFycltuXVt2YWx1ZV0gKyBhcnJbbisxXVt2YWx1ZV0pIC8gMjtcblx0fVxuXG5cdHJldHVybiB2O1xuICAgIH07XG5cbiAgICB2YXIgY2xvbmUgPSBmdW5jdGlvbiAoc291cmNlKSB7XG5cdHZhciB0YXJnZXQgPSB7fTtcblx0Zm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcblx0ICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcblx0XHR0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRhcmdldDtcbiAgICB9O1xuXG4gICAgdmFyIHBlcmZvcm1fc21vb3RoID0gZnVuY3Rpb24gKGFycikge1xuXHRpZiAoc21vb3RoID09PSAwKSB7IC8vIG5vIHNtb290aFxuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoX2FyciA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbG93ID0gKGkgPCBzbW9vdGgpID8gMCA6IChpIC0gc21vb3RoKTtcblx0ICAgIHZhciBoaWdoID0gKGkgPiAoYXJyLmxlbmd0aCAtIHNtb290aCkpID8gYXJyLmxlbmd0aCA6IChpICsgc21vb3RoKTtcblx0ICAgIHNtb290aF9hcnJbaV0gPSBtZWRpYW4oY2xvbmUoYXJyW2ldKSwgYXJyLnNsaWNlKGxvdyxoaWdoKzEpKTtcblx0fVxuXHRyZXR1cm4gc21vb3RoX2FycjtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVjZXIgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBwZXJmb3JtX3JlZHVjZTtcblx0fVxuXHRwZXJmb3JtX3JlZHVjZSA9IGNiYWs7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS5yZWR1bmRhbnQgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiByZWR1bmRhbnQ7XG5cdH1cblx0cmVkdW5kYW50ID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTtcblx0fVxuXHR2YWx1ZSA9IHZhbDtcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnNtb290aCA9IGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gc21vb3RoO1xuXHR9XG5cdHNtb290aCA9IHZhbDtcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJlZHVjZTtcbn07XG5cbnZhciBibG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKClcblx0LnZhbHVlKCdzdGFydCcpO1xuXG4gICAgdmFyIHZhbHVlMiA9ICdlbmQnO1xuXG4gICAgdmFyIGpvaW4gPSBmdW5jdGlvbiAob2JqMSwgb2JqMikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ29iamVjdCcgOiB7XG4gICAgICAgICAgICAgICAgJ3N0YXJ0JyA6IG9iajEub2JqZWN0W3JlZC52YWx1ZSgpXSxcbiAgICAgICAgICAgICAgICAnZW5kJyAgIDogb2JqMlt2YWx1ZTJdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ3ZhbHVlJyAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gdmFyIGpvaW4gPSBmdW5jdGlvbiAob2JqMSwgb2JqMikgeyByZXR1cm4gb2JqMSB9O1xuXG4gICAgcmVkLnJlZHVjZXIoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1bmRhbnQgPSByZWQucmVkdW5kYW50KCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IHtcblx0ICAgICdvYmplY3QnIDogYXJyWzBdLFxuXHQgICAgJ3ZhbHVlJyAgOiBhcnJbMF1bdmFsdWUyXVxuXHR9O1xuXHRmb3IgKHZhciBpPTE7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyLnZhbHVlKSkge1xuXHRcdGN1cnIgPSBqb2luKGN1cnIsIGFycltpXSk7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICByZWR1Y2VkX2Fyci5wdXNoIChjdXJyLm9iamVjdCk7XG5cdCAgICBjdXJyLm9iamVjdCA9IGFycltpXTtcblx0ICAgIGN1cnIudmFsdWUgPSBhcnJbaV0uZW5kO1xuXHR9XG5cdHJlZHVjZWRfYXJyLnB1c2goY3Vyci5vYmplY3QpO1xuXG5cdC8vIHJlZHVjZWRfYXJyLnB1c2goYXJyW2Fyci5sZW5ndGgtMV0pO1xuXHRyZXR1cm4gcmVkdWNlZF9hcnI7XG4gICAgfSk7XG5cbiAgICByZWR1Y2Uuam9pbiA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGpvaW47XG5cdH1cblx0am9pbiA9IGNiYWs7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJlZHVjZS52YWx1ZTIgPSBmdW5jdGlvbiAoZmllbGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdmFsdWUyO1xuXHR9XG5cdHZhbHVlMiA9IGZpZWxkO1xuXHRyZXR1cm4gcmVkO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkO1xufTtcblxudmFyIGxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlZCA9IHJlZHVjZSgpO1xuXG4gICAgcmVkLnJlZHVjZXIgKCBmdW5jdGlvbiAoYXJyKSB7XG5cdHZhciByZWR1bmRhbnQgPSByZWQucmVkdW5kYW50KCk7XG5cdHZhciB2YWx1ZSA9IHJlZC52YWx1ZSgpO1xuXHR2YXIgcmVkdWNlZF9hcnIgPSBbXTtcblx0dmFyIGN1cnIgPSBhcnJbMF07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoLTE7IGkrKykge1xuXHQgICAgaWYgKHJlZHVuZGFudCAoYXJyW2ldW3ZhbHVlXSwgY3Vyclt2YWx1ZV0pKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICByZWR1Y2VkX2Fyci5wdXNoIChjdXJyKTtcblx0ICAgIGN1cnIgPSBhcnJbaV07XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyKTtcblx0cmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJldHVybiByZWQ7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWNlO1xubW9kdWxlLmV4cG9ydHMubGluZSA9IGxpbmU7XG5tb2R1bGUuZXhwb3J0cy5ibG9jayA9IGJsb2NrO1xuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGl0ZXJhdG9yIDogZnVuY3Rpb24oaW5pdF92YWwpIHtcblx0dmFyIGkgPSBpbml0X3ZhbCB8fCAwO1xuXHR2YXIgaXRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBpKys7XG5cdH07XG5cdHJldHVybiBpdGVyO1xuICAgIH0sXG5cbiAgICBzY3JpcHRfcGF0aCA6IGZ1bmN0aW9uIChzY3JpcHRfbmFtZSkgeyAvLyBzY3JpcHRfbmFtZSBpcyB0aGUgZmlsZW5hbWVcblx0dmFyIHNjcmlwdF9zY2FwZWQgPSBzY3JpcHRfbmFtZS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcblx0dmFyIHNjcmlwdF9yZSA9IG5ldyBSZWdFeHAoc2NyaXB0X3NjYXBlZCArICckJyk7XG5cdHZhciBzY3JpcHRfcmVfc3ViID0gbmV3IFJlZ0V4cCgnKC4qKScgKyBzY3JpcHRfc2NhcGVkICsgJyQnKTtcblxuXHQvLyBUT0RPOiBUaGlzIHJlcXVpcmVzIHBoYW50b20uanMgb3IgYSBzaW1pbGFyIGhlYWRsZXNzIHdlYmtpdCB0byB3b3JrIChkb2N1bWVudClcblx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdHZhciBwYXRoID0gXCJcIjsgIC8vIERlZmF1bHQgdG8gY3VycmVudCBwYXRoXG5cdGlmKHNjcmlwdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yKHZhciBpIGluIHNjcmlwdHMpIHtcblx0XHRpZihzY3JpcHRzW2ldLnNyYyAmJiBzY3JpcHRzW2ldLnNyYy5tYXRjaChzY3JpcHRfcmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRzW2ldLnNyYy5yZXBsYWNlKHNjcmlwdF9yZV9zdWIsICckMScpO1xuXHRcdH1cbiAgICAgICAgICAgIH1cblx0fVxuXHRyZXR1cm4gcGF0aDtcbiAgICB9LFxuXG4gICAgZGVmZXJfY2FuY2VsIDogZnVuY3Rpb24gKGNiYWssIHRpbWUpIHtcblx0dmFyIHRpY2s7XG5cblx0dmFyIGRlZmVyX2NhbmNlbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIGNsZWFyVGltZW91dCh0aWNrKTtcblx0ICAgIHRpY2sgPSBzZXRUaW1lb3V0KGNiYWssIHRpbWUpO1xuXHR9O1xuXG5cdHJldHVybiBkZWZlcl9jYW5jZWw7XG4gICAgfVxufTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGl0ZXJhdG9yID0gcmVxdWlyZShcInRudC51dGlsc1wiKS5pdGVyYXRvcjtcblxudmFyIHRudF9ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbi8vdG50LnRyZWUubm9kZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChub2RlKTtcblxuICAgIC8vIEFQSVxuLy8gICAgIG5vZGUubm9kZXMgPSBmdW5jdGlvbigpIHtcbi8vIFx0aWYgKGNsdXN0ZXIgPT09IHVuZGVmaW5lZCkge1xuLy8gXHQgICAgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcbi8vIFx0ICAgIC8vIFRPRE86IGxlbmd0aCBhbmQgY2hpbGRyZW4gc2hvdWxkIGJlIGV4cG9zZWQgaW4gdGhlIEFQSVxuLy8gXHQgICAgLy8gaS5lLiB0aGUgdXNlciBzaG91bGQgYmUgYWJsZSB0byBjaGFuZ2UgdGhpcyBkZWZhdWx0cyB2aWEgdGhlIEFQSVxuLy8gXHQgICAgLy8gY2hpbGRyZW4gaXMgdGhlIGRlZmF1bHRzIGZvciBwYXJzZV9uZXdpY2ssIGJ1dCBtYXliZSB3ZSBzaG91bGQgY2hhbmdlIHRoYXRcbi8vIFx0ICAgIC8vIG9yIGF0IGxlYXN0IG5vdCBhc3N1bWUgdGhpcyBpcyBhbHdheXMgdGhlIGNhc2UgZm9yIHRoZSBkYXRhIHByb3ZpZGVkXG4vLyBcdFx0LnZhbHVlKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5sZW5ndGh9KVxuLy8gXHRcdC5jaGlsZHJlbihmdW5jdGlvbihkKSB7cmV0dXJuIGQuY2hpbGRyZW59KTtcbi8vIFx0fVxuLy8gXHRub2RlcyA9IGNsdXN0ZXIubm9kZXMoZGF0YSk7XG4vLyBcdHJldHVybiBub2Rlcztcbi8vICAgICB9O1xuXG4gICAgdmFyIGFwcGx5X3RvX2RhdGEgPSBmdW5jdGlvbiAoZGF0YSwgY2Jhaykge1xuXHRjYmFrKGRhdGEpO1xuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdGFwcGx5X3RvX2RhdGEoZGF0YS5jaGlsZHJlbltpXSwgY2Jhayk7XG5cdCAgICB9XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGNyZWF0ZV9pZHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBpID0gaXRlcmF0b3IoMSk7XG5cdC8vIFdlIGNhbid0IHVzZSBhcHBseSBiZWNhdXNlIGFwcGx5IGNyZWF0ZXMgbmV3IHRyZWVzIG9uIGV2ZXJ5IG5vZGVcblx0Ly8gV2Ugc2hvdWxkIHVzZSB0aGUgZGlyZWN0IGRhdGEgaW5zdGVhZFxuXHRhcHBseV90b19kYXRhIChkYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgaWYgKGQuX2lkID09PSB1bmRlZmluZWQpIHtcblx0XHRkLl9pZCA9IGkoKTtcblx0XHQvLyBUT0RPOiBOb3Qgc3VyZSBfaW5TdWJUcmVlIGlzIHN0cmljdGx5IG5lY2Vzc2FyeVxuXHRcdC8vIGQuX2luU3ViVHJlZSA9IHtwcmV2OnRydWUsIGN1cnI6dHJ1ZX07XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICB2YXIgbGlua19wYXJlbnRzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0aWYgKGRhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgLy8gX3BhcmVudD9cblx0ICAgIGRhdGEuY2hpbGRyZW5baV0uX3BhcmVudCA9IGRhdGE7XG5cdCAgICBsaW5rX3BhcmVudHMoZGF0YS5jaGlsZHJlbltpXSk7XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGNvbXB1dGVfcm9vdF9kaXN0cyA9IGZ1bmN0aW9uIChkYXRhKSB7XG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICB2YXIgbDtcblx0ICAgIGlmIChkLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX3Jvb3RfZGlzdCA9IDA7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciBsID0gMDtcblx0XHRpZiAoZC5icmFuY2hfbGVuZ3RoKSB7XG5cdFx0ICAgIGwgPSBkLmJyYW5jaF9sZW5ndGhcblx0XHR9XG5cdFx0ZC5fcm9vdF9kaXN0ID0gbCArIGQuX3BhcmVudC5fcm9vdF9kaXN0O1xuXHQgICAgfVxuXHR9KTtcbiAgICB9O1xuXG4gICAgLy8gVE9ETzogZGF0YSBjYW4ndCBiZSByZXdyaXR0ZW4gdXNlZCB0aGUgYXBpIHlldC4gV2UgbmVlZCBmaW5hbGl6ZXJzXG4gICAgbm9kZS5kYXRhID0gZnVuY3Rpb24obmV3X2RhdGEpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gZGF0YVxuXHR9XG5cdGRhdGEgPSBuZXdfZGF0YTtcblx0Y3JlYXRlX2lkcygpO1xuXHRsaW5rX3BhcmVudHMoZGF0YSk7XG5cdGNvbXB1dGVfcm9vdF9kaXN0cyhkYXRhKTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfTtcbiAgICAvLyBXZSBiaW5kIHRoZSBkYXRhIHRoYXQgaGFzIGJlZW4gcGFzc2VkXG4gICAgbm9kZS5kYXRhKGRhdGEpO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfYWxsJywgZnVuY3Rpb24gKGNiYWssIGRlZXApIHtcblx0dmFyIG5vZGVzID0gW107XG5cdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAoY2JhayhuKSkge1xuXHRcdG5vZGVzLnB1c2ggKG4pO1xuXHQgICAgfVxuXHR9KTtcblx0cmV0dXJuIG5vZGVzO1xuICAgIH0pO1xuICAgIFxuICAgIGFwaS5tZXRob2QgKCdmaW5kX25vZGUnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHRpZiAoY2Jhayhub2RlKSkge1xuXHQgICAgcmV0dXJuIG5vZGU7XG5cdH1cblxuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdHZhciBmb3VuZCA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5bal0pLmZpbmRfbm9kZShjYmFrLCBkZWVwKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuXG5cdGlmIChkZWVwICYmIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dG50X25vZGUoZGF0YS5fY2hpbGRyZW5baV0pLmZpbmRfbm9kZShjYmFrLCBkZWVwKVxuXHRcdHZhciBmb3VuZCA9IHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2ldKS5maW5kX25vZGUoY2JhaywgZGVlcCk7XG5cdFx0aWYgKGZvdW5kKSB7XG5cdFx0ICAgIHJldHVybiBmb3VuZDtcblx0XHR9XG5cdCAgICB9XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX25vZGVfYnlfbmFtZScsIGZ1bmN0aW9uKG5hbWUsIGRlZXApIHtcblx0cmV0dXJuIG5vZGUuZmluZF9ub2RlIChmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgcmV0dXJuIG5vZGUubm9kZV9uYW1lKCkgPT09IG5hbWVcblx0fSwgZGVlcCk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgndG9nZ2xlJywgZnVuY3Rpb24oKSB7XG5cdGlmIChkYXRhKSB7XG5cdCAgICBpZiAoZGF0YS5jaGlsZHJlbikgeyAvLyBVbmNvbGxhcHNlZCAtPiBjb2xsYXBzZVxuXHRcdHZhciBoaWRkZW4gPSAwO1xuXHRcdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdFx0ICAgIHZhciBoaWRkZW5faGVyZSA9IG4ubl9oaWRkZW4oKSB8fCAwO1xuXHRcdCAgICBoaWRkZW4gKz0gKG4ubl9oaWRkZW4oKSB8fCAwKSArIDE7XG5cdFx0fSk7XG5cdFx0bm9kZS5uX2hpZGRlbiAoaGlkZGVuLTEpO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gZGF0YS5jaGlsZHJlbjtcblx0XHRkYXRhLmNoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfSBlbHNlIHsgICAgICAgICAgICAgLy8gQ29sbGFwc2VkIC0+IHVuY29sbGFwc2Vcblx0XHRub2RlLm5faGlkZGVuKDApO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSBkYXRhLl9jaGlsZHJlbjtcblx0XHRkYXRhLl9jaGlsZHJlbiA9IHVuZGVmaW5lZDtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdpc19jb2xsYXBzZWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiAoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCAmJiBkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGhhc19hbmNlc3RvciA9IGZ1bmN0aW9uKG4sIGFuY2VzdG9yKSB7XG5cdC8vIEl0IGlzIGJldHRlciB0byB3b3JrIGF0IHRoZSBkYXRhIGxldmVsXG5cdG4gPSBuLmRhdGEoKTtcblx0YW5jZXN0b3IgPSBhbmNlc3Rvci5kYXRhKCk7XG5cdGlmIChuLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIGZhbHNlXG5cdH1cblx0biA9IG4uX3BhcmVudFxuXHRmb3IgKDs7KSB7XG5cdCAgICBpZiAobiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgaWYgKG4gPT09IGFuY2VzdG9yKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdCAgICB9XG5cdCAgICBuID0gbi5fcGFyZW50O1xuXHR9XG4gICAgfTtcblxuICAgIC8vIFRoaXMgaXMgdGhlIGVhc2llc3Qgd2F5IHRvIGNhbGN1bGF0ZSB0aGUgTENBIEkgY2FuIHRoaW5rIG9mLiBCdXQgaXQgaXMgdmVyeSBpbmVmZmljaWVudCB0b28uXG4gICAgLy8gSXQgaXMgd29ya2luZyBmaW5lIGJ5IG5vdywgYnV0IGluIGNhc2UgaXQgbmVlZHMgdG8gYmUgbW9yZSBwZXJmb3JtYW50IHdlIGNhbiBpbXBsZW1lbnQgdGhlIExDQVxuICAgIC8vIGFsZ29yaXRobSBleHBsYWluZWQgaGVyZTpcbiAgICAvLyBodHRwOi8vY29tbXVuaXR5LnRvcGNvZGVyLmNvbS90Yz9tb2R1bGU9U3RhdGljJmQxPXR1dG9yaWFscyZkMj1sb3dlc3RDb21tb25BbmNlc3RvclxuICAgIGFwaS5tZXRob2QgKCdsY2EnLCBmdW5jdGlvbiAobm9kZXMpIHtcblx0aWYgKG5vZGVzLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgcmV0dXJuIG5vZGVzWzBdO1xuXHR9XG5cdHZhciBsY2Ffbm9kZSA9IG5vZGVzWzBdO1xuXHRmb3IgKHZhciBpID0gMTsgaTxub2Rlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgbGNhX25vZGUgPSBfbGNhKGxjYV9ub2RlLCBub2Rlc1tpXSk7XG5cdH1cblx0cmV0dXJuIGxjYV9ub2RlO1xuXHQvLyByZXR1cm4gdG50X25vZGUobGNhX25vZGUpO1xuICAgIH0pO1xuXG4gICAgdmFyIF9sY2EgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcblx0aWYgKG5vZGUxLmRhdGEoKSA9PT0gbm9kZTIuZGF0YSgpKSB7XG5cdCAgICByZXR1cm4gbm9kZTE7XG5cdH1cblx0aWYgKGhhc19hbmNlc3Rvcihub2RlMSwgbm9kZTIpKSB7XG5cdCAgICByZXR1cm4gbm9kZTI7XG5cdH1cblx0cmV0dXJuIF9sY2Eobm9kZTEsIG5vZGUyLnBhcmVudCgpKTtcbiAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCgnbl9oaWRkZW4nLCBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIG5vZGUucHJvcGVydHkoJ19oaWRkZW4nKTtcblx0fVxuXHRub2RlLnByb3BlcnR5KCdfaGlkZGVuJywgdmFsKTtcblx0cmV0dXJuIG5vZGVcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX25vZGVzJywgZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIG5vZGVzID0gW107XG5cdG5vZGUuYXBwbHkoZnVuY3Rpb24gKG4pIHtcblx0ICAgIG5vZGVzLnB1c2gobik7XG5cdH0sIGRlZXApO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZ2V0X2FsbF9sZWF2ZXMnLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgbGVhdmVzID0gW107XG5cdG5vZGUuYXBwbHkoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChuLmlzX2xlYWYoZGVlcCkpIHtcblx0XHRsZWF2ZXMucHVzaChuKTtcblx0ICAgIH1cblx0fSwgZGVlcCk7XG5cdHJldHVybiBsZWF2ZXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgndXBzdHJlYW0nLCBmdW5jdGlvbihjYmFrKSB7XG5cdGNiYWsobm9kZSk7XG5cdHZhciBwYXJlbnQgPSBub2RlLnBhcmVudCgpO1xuXHRpZiAocGFyZW50ICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIHBhcmVudC51cHN0cmVhbShjYmFrKTtcblx0fVxuLy9cdHRudF9ub2RlKHBhcmVudCkudXBzdHJlYW0oY2Jhayk7XG4vLyBcdG5vZGUudXBzdHJlYW0obm9kZS5fcGFyZW50LCBjYmFrKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdzdWJ0cmVlJywgZnVuY3Rpb24obm9kZXMsIGtlZXBfc2luZ2xldG9ucykge1xuXHRpZiAoa2VlcF9zaW5nbGV0b25zID09PSB1bmRlZmluZWQpIHtcblx0ICAgIGtlZXBfc2luZ2xldG9ucyA9IGZhbHNlO1xuXHR9XG4gICAgXHR2YXIgbm9kZV9jb3VudHMgPSB7fTtcbiAgICBcdGZvciAodmFyIGk9MDsgaTxub2Rlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIG4gPSBub2Rlc1tpXTtcblx0ICAgIGlmIChuICE9PSB1bmRlZmluZWQpIHtcblx0XHRuLnVwc3RyZWFtIChmdW5jdGlvbiAodGhpc19ub2RlKXtcblx0XHQgICAgdmFyIGlkID0gdGhpc19ub2RlLmlkKCk7XG5cdFx0ICAgIGlmIChub2RlX2NvdW50c1tpZF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0bm9kZV9jb3VudHNbaWRdID0gMDtcblx0XHQgICAgfVxuXHRcdCAgICBub2RlX2NvdW50c1tpZF0rK1xuICAgIFx0XHR9KTtcblx0ICAgIH1cbiAgICBcdH1cbiAgICBcblx0dmFyIGlzX3NpbmdsZXRvbiA9IGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0ICAgIHZhciBuX2NoaWxkcmVuID0gMDtcblx0ICAgIGlmIChub2RlX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGk9MDsgaTxub2RlX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgaWQgPSBub2RlX2RhdGEuY2hpbGRyZW5baV0uX2lkO1xuXHRcdGlmIChub2RlX2NvdW50c1tpZF0gPiAwKSB7XG5cdFx0ICAgIG5fY2hpbGRyZW4rKztcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbl9jaGlsZHJlbiA9PT0gMTtcblx0fTtcblxuXHR2YXIgc3VidHJlZSA9IHt9O1xuXHRjb3B5X2RhdGEgKGRhdGEsIHN1YnRyZWUsIDAsIGZ1bmN0aW9uIChub2RlX2RhdGEpIHtcblx0ICAgIHZhciBub2RlX2lkID0gbm9kZV9kYXRhLl9pZDtcblx0ICAgIHZhciBjb3VudHMgPSBub2RlX2NvdW50c1tub2RlX2lkXTtcblx0ICAgIFxuXHQgICAgLy8gSXMgaW4gcGF0aFxuXHQgICAgaWYgKGNvdW50cyA+IDApIHtcblx0XHRpZiAoaXNfc2luZ2xldG9uKG5vZGVfZGF0YSkgJiYgIWtlZXBfc2luZ2xldG9ucykge1xuXHRcdCAgICByZXR1cm4gZmFsc2U7IFxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIC8vIElzIG5vdCBpbiBwYXRoXG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH0pO1xuXG5cdHJldHVybiB0bnRfbm9kZShzdWJ0cmVlLmNoaWxkcmVuWzBdKTtcbiAgICB9KTtcblxuICAgIHZhciBjb3B5X2RhdGEgPSBmdW5jdGlvbiAob3JpZ19kYXRhLCBzdWJ0cmVlLCBjdXJyQnJhbmNoTGVuZ3RoLCBjb25kaXRpb24pIHtcbiAgICAgICAgaWYgKG9yaWdfZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZGl0aW9uKG9yaWdfZGF0YSkpIHtcblx0ICAgIHZhciBjb3B5ID0gY29weV9ub2RlKG9yaWdfZGF0YSwgY3VyckJyYW5jaExlbmd0aCk7XG5cdCAgICBpZiAoc3VidHJlZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3VidHJlZS5jaGlsZHJlbiA9IFtdO1xuXHQgICAgfVxuXHQgICAgc3VidHJlZS5jaGlsZHJlbi5wdXNoKGNvcHkpO1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEgKG9yaWdfZGF0YS5jaGlsZHJlbltpXSwgY29weSwgMCwgY29uZGl0aW9uKTtcblx0ICAgIH1cbiAgICAgICAgfSBlbHNlIHtcblx0ICAgIGlmIChvcmlnX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgIH1cblx0ICAgIGN1cnJCcmFuY2hMZW5ndGggKz0gb3JpZ19kYXRhLmJyYW5jaF9sZW5ndGggfHwgMDtcblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZ19kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29weV9kYXRhKG9yaWdfZGF0YS5jaGlsZHJlbltpXSwgc3VidHJlZSwgY3VyckJyYW5jaExlbmd0aCwgY29uZGl0aW9uKTtcblx0ICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgY29weV9ub2RlID0gZnVuY3Rpb24gKG5vZGVfZGF0YSwgZXh0cmFCcmFuY2hMZW5ndGgpIHtcblx0dmFyIGNvcHkgPSB7fTtcblx0Ly8gY29weSBhbGwgdGhlIG93biBwcm9wZXJ0aWVzIGV4Y2VwdHMgbGlua3MgdG8gb3RoZXIgbm9kZXMgb3IgZGVwdGhcblx0Zm9yICh2YXIgcGFyYW0gaW4gbm9kZV9kYXRhKSB7XG5cdCAgICBpZiAoKHBhcmFtID09PSBcImNoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9jaGlsZHJlblwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJfcGFyZW50XCIpIHx8XG5cdFx0KHBhcmFtID09PSBcImRlcHRoXCIpKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICBpZiAobm9kZV9kYXRhLmhhc093blByb3BlcnR5KHBhcmFtKSkge1xuXHRcdGNvcHlbcGFyYW1dID0gbm9kZV9kYXRhW3BhcmFtXTtcblx0ICAgIH1cblx0fVxuXHRpZiAoKGNvcHkuYnJhbmNoX2xlbmd0aCAhPT0gdW5kZWZpbmVkKSAmJiAoZXh0cmFCcmFuY2hMZW5ndGggIT09IHVuZGVmaW5lZCkpIHtcblx0ICAgIGNvcHkuYnJhbmNoX2xlbmd0aCArPSBleHRyYUJyYW5jaExlbmd0aDtcblx0fVxuXHRyZXR1cm4gY29weTtcbiAgICB9O1xuXG4gICAgXG4gICAgLy8gVE9ETzogVGhpcyBtZXRob2QgdmlzaXRzIGFsbCB0aGUgbm9kZXNcbiAgICAvLyBhIG1vcmUgcGVyZm9ybWFudCB2ZXJzaW9uIHNob3VsZCByZXR1cm4gdHJ1ZVxuICAgIC8vIHRoZSBmaXJzdCB0aW1lIGNiYWsobm9kZSkgaXMgdHJ1ZVxuICAgIGFwaS5tZXRob2QgKCdwcmVzZW50JywgZnVuY3Rpb24gKGNiYWspIHtcblx0Ly8gY2JhayBzaG91bGQgcmV0dXJuIHRydWUvZmFsc2Vcblx0dmFyIGlzX3RydWUgPSBmYWxzZTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pID09PSB0cnVlKSB7XG5cdFx0aXNfdHJ1ZSA9IHRydWU7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gaXNfdHJ1ZTtcbiAgICB9KTtcblxuICAgIC8vIGNiYWsgaXMgY2FsbGVkIHdpdGggdHdvIG5vZGVzXG4gICAgLy8gYW5kIHNob3VsZCByZXR1cm4gYSBuZWdhdGl2ZSBudW1iZXIsIDAgb3IgYSBwb3NpdGl2ZSBudW1iZXJcbiAgICBhcGkubWV0aG9kICgnc29ydCcsIGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmIChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXG5cdHZhciBuZXdfY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIG5ld19jaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0fVxuXG5cdG5ld19jaGlsZHJlbi5zb3J0KGNiYWspO1xuXG5cdGRhdGEuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPG5ld19jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgZGF0YS5jaGlsZHJlbi5wdXNoKG5ld19jaGlsZHJlbltpXS5kYXRhKCkpO1xuXHR9XG5cblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pLnNvcnQoY2Jhayk7XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdmbGF0dGVuJywgZnVuY3Rpb24gKCkge1xuXHRpZiAobm9kZS5pc19sZWFmKCkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cdHZhciBkYXRhID0gbm9kZS5kYXRhKCk7XG5cdHZhciBuZXdyb290ID0gY29weV9ub2RlKGRhdGEpO1xuXHR2YXIgbGVhdmVzID0gbm9kZS5nZXRfYWxsX2xlYXZlcygpO1xuXHRuZXdyb290LmNoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIG5ld3Jvb3QuY2hpbGRyZW4ucHVzaChjb3B5X25vZGUobGVhdmVzW2ldLmRhdGEoKSkpO1xuXHR9XG5cblx0cmV0dXJuIHRudF9ub2RlKG5ld3Jvb3QpO1xuICAgIH0pO1xuXG4gICAgXG4gICAgLy8gVE9ETzogVGhpcyBtZXRob2Qgb25seSAnYXBwbHkncyB0byBub24gY29sbGFwc2VkIG5vZGVzIChpZSAuX2NoaWxkcmVuIGlzIG5vdCB2aXNpdGVkKVxuICAgIC8vIFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIGFuIGV4dHJhIGZsYWcgKHRydWUvZmFsc2UpIHRvIHZpc2l0IGFsc28gY29sbGFwc2VkIG5vZGVzP1xuICAgIGFwaS5tZXRob2QgKCdhcHBseScsIGZ1bmN0aW9uKGNiYWssIGRlZXApIHtcblx0aWYgKGRlZXAgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgZGVlcCA9IGZhbHNlO1xuXHR9XG5cdGNiYWsobm9kZSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIG4gPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKVxuXHRcdG4uYXBwbHkoY2JhaywgZGVlcCk7XG5cdCAgICB9XG5cdH1cblxuXHRpZiAoKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpICYmIGRlZXApIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdHZhciBuID0gdG50X25vZGUoZGF0YS5fY2hpbGRyZW5bal0pO1xuXHRcdG4uYXBwbHkoY2JhaywgZGVlcCk7XG5cdCAgICB9XG5cdH1cbiAgICB9KTtcblxuICAgIC8vIFRPRE86IE5vdCBzdXJlIGlmIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB2aWEgYSBjYWxsYmFjazpcbiAgICAvLyByb290LnByb3BlcnR5IChmdW5jdGlvbiAobm9kZSwgdmFsKSB7XG4gICAgLy8gICAgbm9kZS5kZWVwZXIuZmllbGQgPSB2YWxcbiAgICAvLyB9LCAnbmV3X3ZhbHVlJylcbiAgICBhcGkubWV0aG9kICgncHJvcGVydHknLCBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgaWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRyZXR1cm4gcHJvcChkYXRhKVx0XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZGF0YVtwcm9wXVxuXHR9XG5cdGlmICgodHlwZW9mIHByb3ApID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBwcm9wKGRhdGEsIHZhbHVlKTsgICBcblx0fVxuXHRkYXRhW3Byb3BdID0gdmFsdWU7XG5cdHJldHVybiBub2RlO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2xlYWYnLCBmdW5jdGlvbihkZWVwKSB7XG5cdGlmIChkZWVwKSB7XG5cdCAgICByZXR1cm4gKChkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpICYmIChkYXRhLl9jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSk7XG5cdH1cblx0cmV0dXJuIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZDtcbiAgICB9KTtcblxuICAgIC8vIEl0IGxvb2tzIGxpa2UgdGhlIGNsdXN0ZXIgY2FuJ3QgYmUgdXNlZCBmb3IgYW55dGhpbmcgdXNlZnVsIGhlcmVcbiAgICAvLyBJdCBpcyBub3cgaW5jbHVkZWQgYXMgYW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRvIHRoZSB0bnQudHJlZSgpIG1ldGhvZCBjYWxsXG4gICAgLy8gc28gSSdtIGNvbW1lbnRpbmcgdGhlIGdldHRlclxuICAgIC8vIG5vZGUuY2x1c3RlciA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFx0cmV0dXJuIGNsdXN0ZXI7XG4gICAgLy8gfTtcblxuICAgIC8vIG5vZGUuZGVwdGggPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIC8vICAgICByZXR1cm4gbm9kZS5kZXB0aDtcbiAgICAvLyB9O1xuXG4vLyAgICAgbm9kZS5uYW1lID0gZnVuY3Rpb24gKG5vZGUpIHtcbi8vICAgICAgICAgcmV0dXJuIG5vZGUubmFtZTtcbi8vICAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lkJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2lkJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnbm9kZV9uYW1lJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnbmFtZScpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2JyYW5jaF9sZW5ndGgnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdicmFuY2hfbGVuZ3RoJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncm9vdF9kaXN0JywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX3Jvb3RfZGlzdCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2NoaWxkcmVuJywgZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIGNoaWxkcmVuID0gW107XG5cblx0aWYgKGRhdGEuY2hpbGRyZW4pIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y2hpbGRyZW4ucHVzaCh0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKSk7XG5cdCAgICB9XG5cdH1cblx0aWYgKChkYXRhLl9jaGlsZHJlbikgJiYgZGVlcCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0Y2hpbGRyZW4ucHVzaCh0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltqXSkpO1xuXHQgICAgfVxuXHR9XG5cdGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIGNoaWxkcmVuO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3BhcmVudCcsIGZ1bmN0aW9uICgpIHtcblx0aWYgKGRhdGEuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiB0bnRfbm9kZShkYXRhLl9wYXJlbnQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5vZGU7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRudF9ub2RlO1xuXG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKCd0bnQuYXBpJyk7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmRpYWdvbmFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBkID0gZnVuY3Rpb24gKGRpYWdvbmFsUGF0aCkge1xuXHR2YXIgc291cmNlID0gZGlhZ29uYWxQYXRoLnNvdXJjZTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGRpYWdvbmFsUGF0aC50YXJnZXQ7XG4gICAgICAgIHZhciBtaWRwb2ludFggPSAoc291cmNlLnggKyB0YXJnZXQueCkgLyAyO1xuICAgICAgICB2YXIgbWlkcG9pbnRZID0gKHNvdXJjZS55ICsgdGFyZ2V0LnkpIC8gMjtcbiAgICAgICAgdmFyIHBhdGhEYXRhID0gW3NvdXJjZSwge3g6IHRhcmdldC54LCB5OiBzb3VyY2UueX0sIHRhcmdldF07XG5cdHBhdGhEYXRhID0gcGF0aERhdGEubWFwKGQucHJvamVjdGlvbigpKTtcblx0cmV0dXJuIGQucGF0aCgpKHBhdGhEYXRhLCByYWRpYWxfY2FsYy5jYWxsKHRoaXMscGF0aERhdGEpKVxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGQpXG5cdC5nZXRzZXQgKCdwcm9qZWN0aW9uJylcblx0LmdldHNldCAoJ3BhdGgnKVxuICAgIFxuICAgIHZhciBjb29yZGluYXRlVG9BbmdsZSA9IGZ1bmN0aW9uIChjb29yZCwgcmFkaXVzKSB7XG4gICAgICBcdHZhciB3aG9sZUFuZ2xlID0gMiAqIE1hdGguUEksXG4gICAgICAgIHF1YXJ0ZXJBbmdsZSA9IHdob2xlQW5nbGUgLyA0XG5cdFxuICAgICAgXHR2YXIgY29vcmRRdWFkID0gY29vcmRbMF0gPj0gMCA/IChjb29yZFsxXSA+PSAwID8gMSA6IDIpIDogKGNvb3JkWzFdID49IDAgPyA0IDogMyksXG4gICAgICAgIGNvb3JkQmFzZUFuZ2xlID0gTWF0aC5hYnMoTWF0aC5hc2luKGNvb3JkWzFdIC8gcmFkaXVzKSlcblx0XG4gICAgICBcdC8vIFNpbmNlIHRoaXMgaXMganVzdCBiYXNlZCBvbiB0aGUgYW5nbGUgb2YgdGhlIHJpZ2h0IHRyaWFuZ2xlIGZvcm1lZFxuICAgICAgXHQvLyBieSB0aGUgY29vcmRpbmF0ZSBhbmQgdGhlIG9yaWdpbiwgZWFjaCBxdWFkIHdpbGwgaGF2ZSBkaWZmZXJlbnQgXG4gICAgICBcdC8vIG9mZnNldHNcbiAgICAgIFx0dmFyIGNvb3JkQW5nbGU7XG4gICAgICBcdHN3aXRjaCAoY29vcmRRdWFkKSB7XG4gICAgICBcdGNhc2UgMTpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSBxdWFydGVyQW5nbGUgLSBjb29yZEJhc2VBbmdsZVxuICAgICAgXHQgICAgYnJlYWtcbiAgICAgIFx0Y2FzZSAyOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IHF1YXJ0ZXJBbmdsZSArIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdCAgICBicmVha1xuICAgICAgXHRjYXNlIDM6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gMipxdWFydGVyQW5nbGUgKyBxdWFydGVyQW5nbGUgLSBjb29yZEJhc2VBbmdsZVxuICAgICAgXHQgICAgYnJlYWtcbiAgICAgIFx0Y2FzZSA0OlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IDMqcXVhcnRlckFuZ2xlICsgY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0fVxuICAgICAgXHRyZXR1cm4gY29vcmRBbmdsZVxuICAgIH07XG5cbiAgICB2YXIgcmFkaWFsX2NhbGMgPSBmdW5jdGlvbiAocGF0aERhdGEpIHtcblx0dmFyIHNyYyA9IHBhdGhEYXRhWzBdO1xuXHR2YXIgbWlkID0gcGF0aERhdGFbMV07XG5cdHZhciBkc3QgPSBwYXRoRGF0YVsyXTtcblx0dmFyIHJhZGl1cyA9IE1hdGguc3FydChzcmNbMF0qc3JjWzBdICsgc3JjWzFdKnNyY1sxXSk7XG5cdHZhciBzcmNBbmdsZSA9IGNvb3JkaW5hdGVUb0FuZ2xlKHNyYywgcmFkaXVzKTtcblx0dmFyIG1pZEFuZ2xlID0gY29vcmRpbmF0ZVRvQW5nbGUobWlkLCByYWRpdXMpO1xuXHR2YXIgY2xvY2t3aXNlID0gTWF0aC5hYnMobWlkQW5nbGUgLSBzcmNBbmdsZSkgPiBNYXRoLlBJID8gbWlkQW5nbGUgPD0gc3JjQW5nbGUgOiBtaWRBbmdsZSA+IHNyY0FuZ2xlO1xuXHRyZXR1cm4ge1xuXHQgICAgcmFkaXVzICAgOiByYWRpdXMsXG5cdCAgICBjbG9ja3dpc2UgOiBjbG9ja3dpc2Vcblx0fTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGQ7XG59O1xuXG4vLyB2ZXJ0aWNhbCBkaWFnb25hbCBmb3IgcmVjdCBicmFuY2hlc1xudHJlZS5kaWFnb25hbC52ZXJ0aWNhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGF0aCA9IGZ1bmN0aW9uKHBhdGhEYXRhLCBvYmopIHtcblx0dmFyIHNyYyA9IHBhdGhEYXRhWzBdO1xuXHR2YXIgbWlkID0gcGF0aERhdGFbMV07XG5cdHZhciBkc3QgPSBwYXRoRGF0YVsyXTtcblx0dmFyIHJhZGl1cyA9IDIwMDAwMDsgLy8gTnVtYmVyIGxvbmcgZW5vdWdoXG5cblx0cmV0dXJuIFwiTVwiICsgc3JjICsgXCIgQVwiICsgW3JhZGl1cyxyYWRpdXNdICsgXCIgMCAwLDAgXCIgKyBtaWQgKyBcIk1cIiArIG1pZCArIFwiTFwiICsgZHN0OyBcblx0XG4gICAgfTtcblxuICAgIHZhciBwcm9qZWN0aW9uID0gZnVuY3Rpb24oZCkgeyBcblx0cmV0dXJuIFtkLnksIGQueF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyZWUuZGlhZ29uYWwoKVxuICAgICAgXHQucGF0aChwYXRoKVxuICAgICAgXHQucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcbn07XG5cbnRyZWUuZGlhZ29uYWwucmFkaWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXRoID0gZnVuY3Rpb24ocGF0aERhdGEsIG9iaikge1xuICAgICAgXHR2YXIgc3JjID0gcGF0aERhdGFbMF07XG4gICAgICBcdHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcbiAgICAgIFx0dmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuXHR2YXIgcmFkaXVzID0gb2JqLnJhZGl1cztcblx0dmFyIGNsb2Nrd2lzZSA9IG9iai5jbG9ja3dpc2U7XG5cblx0aWYgKGNsb2Nrd2lzZSkge1xuXHQgICAgcmV0dXJuIFwiTVwiICsgc3JjICsgXCIgQVwiICsgW3JhZGl1cyxyYWRpdXNdICsgXCIgMCAwLDAgXCIgKyBtaWQgKyBcIk1cIiArIG1pZCArIFwiTFwiICsgZHN0OyBcblx0fSBlbHNlIHtcblx0ICAgIHJldHVybiBcIk1cIiArIG1pZCArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgc3JjICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDtcblx0fVxuXG4gICAgfTtcblxuICAgIHZhciBwcm9qZWN0aW9uID0gZnVuY3Rpb24oZCkge1xuICAgICAgXHR2YXIgciA9IGQueSwgYSA9IChkLnggLSA5MCkgLyAxODAgKiBNYXRoLlBJO1xuICAgICAgXHRyZXR1cm4gW3IgKiBNYXRoLmNvcyhhKSwgciAqIE1hdGguc2luKGEpXTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRyZWUuZGlhZ29uYWwoKVxuICAgICAgXHQucGF0aChwYXRoKVxuICAgICAgXHQucHJvamVjdGlvbihwcm9qZWN0aW9uKVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5kaWFnb25hbDtcbiIsInZhciB0cmVlID0gcmVxdWlyZSAoXCIuL3RyZWUuanNcIik7XG50cmVlLmxhYmVsID0gcmVxdWlyZShcIi4vbGFiZWwuanNcIik7XG50cmVlLmRpYWdvbmFsID0gcmVxdWlyZShcIi4vZGlhZ29uYWwuanNcIik7XG50cmVlLmxheW91dCA9IHJlcXVpcmUoXCIuL2xheW91dC5qc1wiKTtcbnRyZWUubm9kZV9kaXNwbGF5ID0gcmVxdWlyZShcIi4vbm9kZV9kaXNwbGF5LmpzXCIpO1xuLy8gdHJlZS5ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG4vLyB0cmVlLnBhcnNlX25ld2ljayA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25ld2ljaztcbi8vIHRyZWUucGFyc2Vfbmh4ID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2Vfbmh4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlO1xuXG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUubGFiZWwgPSBmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxuICAgIC8vIFRPRE86IE5vdCBzdXJlIGlmIHdlIHNob3VsZCBiZSByZW1vdmluZyBieSBkZWZhdWx0IHByZXYgbGFiZWxzXG4gICAgLy8gb3IgaXQgd291bGQgYmUgYmV0dGVyIHRvIGhhdmUgYSBzZXBhcmF0ZSByZW1vdmUgbWV0aG9kIGNhbGxlZCBieSB0aGUgdmlzXG4gICAgLy8gb24gdXBkYXRlXG4gICAgLy8gV2UgYWxzbyBoYXZlIHRoZSBwcm9ibGVtIHRoYXQgd2UgbWF5IGJlIHRyYW5zaXRpb25pbmcgZnJvbVxuICAgIC8vIHRleHQgdG8gaW1nIGxhYmVscyBhbmQgd2UgbmVlZCB0byByZW1vdmUgdGhlIGxhYmVsIG9mIGEgZGlmZmVyZW50IHR5cGVcbiAgICB2YXIgbGFiZWwgPSBmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUsIG5vZGVfc2l6ZSkge1xuXHRpZiAodHlwZW9mIChub2RlKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cobm9kZSk7XG4gICAgICAgIH1cblxuXHRsYWJlbC5kaXNwbGF5KCkuY2FsbCh0aGlzLCBub2RlLCBsYXlvdXRfdHlwZSlcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9sYWJlbFwiKVxuXHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcblx0XHR2YXIgdCA9IGxhYmVsLnRyYW5zZm9ybSgpKG5vZGUsIGxheW91dF90eXBlKTtcblx0XHRyZXR1cm4gXCJ0cmFuc2xhdGUgKFwiICsgKHQudHJhbnNsYXRlWzBdICsgbm9kZV9zaXplKSArIFwiIFwiICsgdC50cmFuc2xhdGVbMV0gKyBcIilyb3RhdGUoXCIgKyB0LnJvdGF0ZSArIFwiKVwiO1xuXHQgICAgfSlcblx0Ly8gVE9ETzogdGhpcyBjbGljayBldmVudCBpcyBwcm9iYWJseSBuZXZlciBmaXJlZCBzaW5jZSB0aGVyZSBpcyBhbiBvbmNsaWNrIGV2ZW50IGluIHRoZSBub2RlIGcgZWxlbWVudD9cblx0ICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKCl7XG5cdFx0aWYgKGxhYmVsLm9uX2NsaWNrKCkgIT09IHVuZGVmaW5lZCkge1xuXHRcdCAgICBkMy5ldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHQgICAgbGFiZWwub25fY2xpY2soKS5jYWxsKHRoaXMsIG5vZGUpO1xuXHRcdH1cblx0ICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuXHQuZ2V0c2V0ICgnd2lkdGgnLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIHdpZHRoIGNhbGxiYWNrXCIgfSlcblx0LmdldHNldCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgaGVpZ2h0IGNhbGxiYWNrXCIgfSlcblx0LmdldHNldCAoJ2Rpc3BsYXknLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIGRpc3BsYXkgY2FsbGJhY2tcIiB9KVxuXHQuZ2V0c2V0ICgndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSB0cmFuc2Zvcm0gY2FsbGJhY2tcIiB9KVxuXHQuZ2V0c2V0ICgnb25fY2xpY2snKTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIFRleHQgYmFzZWQgbGFiZWxzXG50cmVlLmxhYmVsLnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVsID0gdHJlZS5sYWJlbCgpO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblx0LmdldHNldCAoJ2ZvbnRzaXplJywgMTApXG5cdC5nZXRzZXQgKCdjb2xvcicsIFwiIzAwMFwiKVxuXHQuZ2V0c2V0ICgndGV4dCcsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5kYXRhKCkubmFtZTtcblx0fSlcblxuICAgIGxhYmVsLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHR2YXIgbCA9IGQzLnNlbGVjdCh0aGlzKVxuXHQgICAgLmFwcGVuZChcInRleHRcIilcblx0ICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAobGF5b3V0X3R5cGUgPT09IFwicmFkaWFsXCIpIHtcblx0XHQgICAgcmV0dXJuIChkLnglMzYwIDwgMTgwKSA/IFwic3RhcnRcIiA6IFwiZW5kXCI7XG5cdFx0fVxuXHRcdHJldHVybiBcInN0YXJ0XCI7XG5cdCAgICB9KVxuXHQgICAgLnRleHQoZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gbGFiZWwudGV4dCgpKG5vZGUpXG5cdCAgICB9KVxuXHQgICAgLnN0eWxlKCdmb250LXNpemUnLCBsYWJlbC5mb250c2l6ZSgpICsgXCJweFwiKVxuXHQgICAgLnN0eWxlKCdmaWxsJywgZDMuZnVuY3RvcihsYWJlbC5jb2xvcigpKShub2RlKSk7XG5cblx0cmV0dXJuIGw7XG4gICAgfSk7XG5cbiAgICBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHR2YXIgZCA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgdCA9IHtcblx0ICAgIHRyYW5zbGF0ZSA6IFs1LCA1XSxcblx0ICAgIHJvdGF0ZSA6IDBcblx0fTtcblx0aWYgKGxheW91dF90eXBlID09PSBcInJhZGlhbFwiKSB7XG5cdCAgICB0LnRyYW5zbGF0ZVsxXSA9IHQudHJhbnNsYXRlWzFdIC0gKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwuZm9udHNpemUoKSlcblx0ICAgIHQucm90YXRlID0gKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKVxuXHR9XG5cdHJldHVybiB0O1xuICAgIH0pO1xuXG5cbiAgICAvLyBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gXHR2YXIgZCA9IG5vZGUuZGF0YSgpO1xuICAgIC8vIFx0cmV0dXJuIFwidHJhbnNsYXRlKDEwIDUpcm90YXRlKFwiICsgKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKSArIFwiKVwiO1xuICAgIC8vIH0pO1xuXG4gICAgbGFiZWwud2lkdGggKGZ1bmN0aW9uIChub2RlKSB7XG5cdHZhciBzdmcgPSBkMy5zZWxlY3QoXCJib2R5XCIpXG5cdCAgICAuYXBwZW5kKFwic3ZnXCIpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCAwKVxuXHQgICAgLnN0eWxlKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuXG5cdHZhciB0ZXh0ID0gc3ZnXG5cdCAgICAuYXBwZW5kKFwidGV4dFwiKVxuXHQgICAgLnN0eWxlKCdmb250LXNpemUnLCBsYWJlbC5mb250c2l6ZSgpICsgXCJweFwiKVxuXHQgICAgLnRleHQobGFiZWwudGV4dCgpKG5vZGUpKTtcblxuXHR2YXIgd2lkdGggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCkud2lkdGg7XG5cdHN2Zy5yZW1vdmUoKTtcblxuXHRyZXR1cm4gd2lkdGg7XG4gICAgfSk7XG5cbiAgICBsYWJlbC5oZWlnaHQgKGZ1bmN0aW9uIChub2RlKSB7XG5cdHJldHVybiBsYWJlbC5mb250c2l6ZSgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxuLy8gSW1hZ2UgYmFzZWQgbGFiZWxzXG50cmVlLmxhYmVsLmltZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWwgPSB0cmVlLmxhYmVsKCk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuXHQuZ2V0c2V0ICgnc3JjJywgZnVuY3Rpb24gKCkge30pXG5cbiAgICBsYWJlbC5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0aWYgKGxhYmVsLnNyYygpKG5vZGUpKSB7XG5cdCAgICB2YXIgbCA9IGQzLnNlbGVjdCh0aGlzKVxuXHRcdC5hcHBlbmQoXCJpbWFnZVwiKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgbGFiZWwud2lkdGgoKSgpKVxuXHRcdC5hdHRyKFwiaGVpZ2h0XCIsIGxhYmVsLmhlaWdodCgpKCkpXG5cdFx0LmF0dHIoXCJ4bGluazpocmVmXCIsIGxhYmVsLnNyYygpKG5vZGUpKTtcblx0ICAgIHJldHVybiBsO1xuXHR9XG5cdC8vIGZhbGxiYWNrIHRleHQgaW4gY2FzZSB0aGUgaW1nIGlzIG5vdCBmb3VuZD9cblx0cmV0dXJuIGQzLnNlbGVjdCh0aGlzKVxuXHQgICAgLmFwcGVuZChcInRleHRcIilcblx0ICAgIC50ZXh0KFwiXCIpO1xuICAgIH0pO1xuXG4gICAgbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGQgPSBub2RlLmRhdGEoKTtcblx0dmFyIHQgPSB7XG5cdCAgICB0cmFuc2xhdGUgOiBbMTAsICgtbGFiZWwuaGVpZ2h0KCkoKSAvIDIpXSxcblx0ICAgIHJvdGF0ZSA6IDBcblx0fTtcblx0aWYgKGxheW91dF90eXBlID09PSAncmFkaWFsJykge1xuXHQgICAgdC50cmFuc2xhdGVbMF0gPSB0LnRyYW5zbGF0ZVswXSArIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLndpZHRoKCkoKSksXG5cdCAgICB0LnRyYW5zbGF0ZVsxXSA9IHQudHJhbnNsYXRlWzFdICsgKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwuaGVpZ2h0KCkoKSksXG5cdCAgICB0LnJvdGF0ZSA9IChkLnglMzYwIDwgMTgwID8gMCA6IDE4MClcblx0fVxuXG5cdHJldHVybiB0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxuLy8gTGFiZWxzIG1hZGUgb2YgMisgc2ltcGxlIGxhYmVsc1xudHJlZS5sYWJlbC5jb21wb3NpdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVscyA9IFtdO1xuXG4gICAgdmFyIGxhYmVsID0gZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdHZhciBjdXJyX3hvZmZzZXQgPSAwO1xuXG5cdGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBkaXNwbGF5ID0gbGFiZWxzW2ldO1xuXG5cdCAgICAoZnVuY3Rpb24gKG9mZnNldCkge1xuXHRcdGRpc3BsYXkudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0XHQgICAgdmFyIHRzdXBlciA9IGRpc3BsYXkuX3N1cGVyXy50cmFuc2Zvcm0oKShub2RlLCBsYXlvdXRfdHlwZSk7XG5cdFx0ICAgIHZhciB0ID0ge1xuXHRcdFx0dHJhbnNsYXRlIDogW29mZnNldCArIHRzdXBlci50cmFuc2xhdGVbMF0sIHRzdXBlci50cmFuc2xhdGVbMV1dLFxuXHRcdFx0cm90YXRlIDogdHN1cGVyLnJvdGF0ZVxuXHRcdCAgICB9O1xuXHRcdCAgICByZXR1cm4gdDtcblx0XHR9KVxuXHQgICAgfSkoY3Vycl94b2Zmc2V0KTtcblxuXHQgICAgY3Vycl94b2Zmc2V0ICs9IDEwO1xuXHQgICAgY3Vycl94b2Zmc2V0ICs9IGRpc3BsYXkud2lkdGgoKShub2RlKTtcblxuXHQgICAgZGlzcGxheS5jYWxsKHRoaXMsIG5vZGUsIGxheW91dF90eXBlKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuXG4gICAgYXBpLm1ldGhvZCAoJ2FkZF9sYWJlbCcsIGZ1bmN0aW9uIChkaXNwbGF5LCBub2RlKSB7XG5cdGRpc3BsYXkuX3N1cGVyXyA9IHt9O1xuXHRhcGlqcyAoZGlzcGxheS5fc3VwZXJfKVxuXHQgICAgLmdldCAoJ3RyYW5zZm9ybScsIGRpc3BsYXkudHJhbnNmb3JtKCkpO1xuXG5cdGxhYmVscy5wdXNoKGRpc3BsYXkpO1xuXHRyZXR1cm4gbGFiZWw7XG4gICAgfSk7XG4gICAgXG4gICAgYXBpLm1ldGhvZCAoJ3dpZHRoJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHZhciB0b3Rfd2lkdGggPSAwO1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGxhYmVscy5sZW5ndGg7IGkrKykge1xuXHRcdHRvdF93aWR0aCArPSBwYXJzZUludChsYWJlbHNbaV0ud2lkdGgoKShub2RlKSk7XG5cdFx0dG90X3dpZHRoICs9IHBhcnNlSW50KGxhYmVsc1tpXS5fc3VwZXJfLnRyYW5zZm9ybSgpKG5vZGUpLnRyYW5zbGF0ZVswXSk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiB0b3Rfd2lkdGg7XG5cdH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBmdW5jdGlvbiAobm9kZSkge1xuXHQgICAgdmFyIG1heF9oZWlnaHQgPSAwO1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGxhYmVscy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBjdXJyX2hlaWdodCA9IGxhYmVsc1tpXS5oZWlnaHQoKShub2RlKTtcblx0XHRpZiAoIGN1cnJfaGVpZ2h0ID4gbWF4X2hlaWdodCkge1xuXHRcdCAgICBtYXhfaGVpZ2h0ID0gY3Vycl9oZWlnaHQ7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG1heF9oZWlnaHQ7XG5cdH1cbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUubGFiZWw7XG5cblxuIiwiLy8gQmFzZWQgb24gdGhlIGNvZGUgYnkgS2VuLWljaGkgVWVkYSBpbiBodHRwOi8vYmwub2Nrcy5vcmcva3VlZGEvMTAzNjc3NiNkMy5waHlsb2dyYW0uanNcblxudmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgZGlhZ29uYWwgPSByZXF1aXJlKFwiLi9kaWFnb25hbC5qc1wiKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUubGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIHZhciBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuXHQuc29ydChudWxsKVxuXHQudmFsdWUoZnVuY3Rpb24gKGQpIHtyZXR1cm4gZC5sZW5ndGh9IClcblx0LnNlcGFyYXRpb24oZnVuY3Rpb24gKCkge3JldHVybiAxfSk7XG4gICAgXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsKVxuXHQuZ2V0c2V0ICgnc2NhbGUnLCB0cnVlKVxuXHQuZ2V0c2V0ICgnbWF4X2xlYWZfbGFiZWxfd2lkdGgnLCAwKVxuXHQubWV0aG9kIChcImNsdXN0ZXJcIiwgY2x1c3Rlcilcblx0Lm1ldGhvZCgneXNjYWxlJywgZnVuY3Rpb24gKCkge3Rocm93IFwieXNjYWxlIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwifSlcblx0Lm1ldGhvZCgnYWRqdXN0X2NsdXN0ZXJfc2l6ZScsIGZ1bmN0aW9uICgpIHt0aHJvdyBcImFkanVzdF9jbHVzdGVyX3NpemUgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCIgfSlcblx0Lm1ldGhvZCgnd2lkdGgnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJ3aWR0aCBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pXG5cdC5tZXRob2QoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHt0aHJvdyBcImhlaWdodCBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pO1xuXG4gICAgYXBpLm1ldGhvZCgnc2NhbGVfYnJhbmNoX2xlbmd0aHMnLCBmdW5jdGlvbiAoY3Vycikge1xuXHRpZiAobC5zY2FsZSgpID09PSBmYWxzZSkge1xuXHQgICAgcmV0dXJuXG5cdH1cblxuXHR2YXIgbm9kZXMgPSBjdXJyLm5vZGVzO1xuXHR2YXIgdHJlZSA9IGN1cnIudHJlZTtcblxuXHR2YXIgcm9vdF9kaXN0cyA9IG5vZGVzLm1hcCAoZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBkLl9yb290X2Rpc3Q7XG5cdH0pO1xuXG5cdHZhciB5c2NhbGUgPSBsLnlzY2FsZShyb290X2Rpc3RzKTtcblx0dHJlZS5hcHBseSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIG5vZGUucHJvcGVydHkoXCJ5XCIsIHlzY2FsZShub2RlLnJvb3RfZGlzdCgpKSk7XG5cdH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGw7XG59O1xuXG50cmVlLmxheW91dC52ZXJ0aWNhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGF5b3V0ID0gdHJlZS5sYXlvdXQoKTtcbiAgICAvLyBFbGVtZW50cyBsaWtlICdsYWJlbHMnIGRlcGVuZCBvbiB0aGUgbGF5b3V0IHR5cGUuIFRoaXMgZXhwb3NlcyBhIHdheSBvZiBpZGVudGlmeWluZyB0aGUgbGF5b3V0IHR5cGVcbiAgICBsYXlvdXQudHlwZSA9IFwidmVydGljYWxcIjtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGF5b3V0KVxuXHQuZ2V0c2V0ICgnd2lkdGgnLCAzNjApXG5cdC5nZXQgKCd0cmFuc2xhdGVfdmlzJywgWzIwLDIwXSlcblx0Lm1ldGhvZCAoJ2RpYWdvbmFsJywgZGlhZ29uYWwudmVydGljYWwpXG5cdC5tZXRob2QgKCd0cmFuc2Zvcm1fbm9kZScsIGZ1bmN0aW9uIChkKSB7XG4gICAgXHQgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC55ICsgXCIsXCIgKyBkLnggKyBcIilcIjtcblx0fSk7XG5cbiAgICBhcGkubWV0aG9kKCdoZWlnaHQnLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgXHRyZXR1cm4gKHBhcmFtcy5uX2xlYXZlcyAqIHBhcmFtcy5sYWJlbF9oZWlnaHQpO1xuICAgIH0pOyBcblxuICAgIGFwaS5tZXRob2QoJ3lzY2FsZScsIGZ1bmN0aW9uIChkaXN0cykge1xuICAgIFx0cmV0dXJuIGQzLnNjYWxlLmxpbmVhcigpXG4gICAgXHQgICAgLmRvbWFpbihbMCwgZDMubWF4KGRpc3RzKV0pXG4gICAgXHQgICAgLnJhbmdlKFswLCBsYXlvdXQud2lkdGgoKSAtIDIwIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCldKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QoJ2FkanVzdF9jbHVzdGVyX3NpemUnLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgXHR2YXIgaCA9IGxheW91dC5oZWlnaHQocGFyYW1zKTtcbiAgICBcdHZhciB3ID0gbGF5b3V0LndpZHRoKCkgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKSAtIGxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gLSBwYXJhbXMubGFiZWxfcGFkZGluZztcbiAgICBcdGxheW91dC5jbHVzdGVyLnNpemUgKFtoLHddKTtcbiAgICBcdHJldHVybiBsYXlvdXQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGF5b3V0O1xufTtcblxudHJlZS5sYXlvdXQucmFkaWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXlvdXQgPSB0cmVlLmxheW91dCgpO1xuICAgIC8vIEVsZW1lbnRzIGxpa2UgJ2xhYmVscycgZGVwZW5kIG9uIHRoZSBsYXlvdXQgdHlwZS4gVGhpcyBleHBvc2VzIGEgd2F5IG9mIGlkZW50aWZ5aW5nIHRoZSBsYXlvdXQgdHlwZVxuICAgIGxheW91dC50eXBlID0gJ3JhZGlhbCc7XG5cbiAgICB2YXIgZGVmYXVsdF93aWR0aCA9IDM2MDtcbiAgICB2YXIgciA9IGRlZmF1bHRfd2lkdGggLyAyO1xuXG4gICAgdmFyIGNvbmYgPSB7XG4gICAgXHR3aWR0aCA6IDM2MFxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxheW91dClcblx0LmdldHNldCAoY29uZilcblx0LmdldHNldCAoJ3RyYW5zbGF0ZV92aXMnLCBbciwgcl0pIC8vIFRPRE86IDEuMyBzaG91bGQgYmUgcmVwbGFjZWQgYnkgYSBzZW5zaWJsZSB2YWx1ZVxuXHQubWV0aG9kICgndHJhbnNmb3JtX25vZGUnLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiO1xuXHR9KVxuXHQubWV0aG9kICgnZGlhZ29uYWwnLCBkaWFnb25hbC5yYWRpYWwpXG5cdC5tZXRob2QgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25mLndpZHRoIH0pO1xuXG4gICAgLy8gQ2hhbmdlcyBpbiB3aWR0aCBhZmZlY3QgY2hhbmdlcyBpbiByXG4gICAgbGF5b3V0LndpZHRoLnRyYW5zZm9ybSAoZnVuY3Rpb24gKHZhbCkge1xuICAgIFx0ciA9IHZhbCAvIDI7XG4gICAgXHRsYXlvdXQuY2x1c3Rlci5zaXplKFszNjAsIHJdKVxuICAgIFx0bGF5b3V0LnRyYW5zbGF0ZV92aXMoW3IsIHJdKTtcbiAgICBcdHJldHVybiB2YWw7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kIChcInlzY2FsZVwiLCAgZnVuY3Rpb24gKGRpc3RzKSB7XG5cdHJldHVybiBkMy5zY2FsZS5saW5lYXIoKVxuXHQgICAgLmRvbWFpbihbMCxkMy5tYXgoZGlzdHMpXSlcblx0ICAgIC5yYW5nZShbMCwgcl0pO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoXCJhZGp1c3RfY2x1c3Rlcl9zaXplXCIsIGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0ciA9IChsYXlvdXQud2lkdGgoKS8yKSAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpIC0gMjA7XG5cdGxheW91dC5jbHVzdGVyLnNpemUoWzM2MCwgcl0pO1xuXHRyZXR1cm4gbGF5b3V0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxheW91dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUubGF5b3V0O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLm5vZGVfZGlzcGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBuID0gZnVuY3Rpb24gKG5vZGUpIHtcblx0bi5kaXNwbGF5KCkuY2FsbCh0aGlzLCBub2RlKVxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG4pXG5cdC5nZXRzZXQoXCJzaXplXCIsIDQuNSlcblx0LmdldHNldChcImZpbGxcIiwgXCJibGFja1wiKVxuXHQuZ2V0c2V0KFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcblx0LmdldHNldChcInN0cm9rZV93aWR0aFwiLCBcIjFweFwiKVxuXHQuZ2V0c2V0KFwiZGlzcGxheVwiLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJkaXNwbGF5IGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwifSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LmNpcmNsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdGQzLnNlbGVjdCh0aGlzKVxuXHQgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuXHQgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uZmlsbCgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2Vfd2lkdGgoKSkobm9kZSk7XG5cdCAgICB9KVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS5zcXVhcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG5cdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gLXNcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gLXM7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBzKjI7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gcyoyO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uZmlsbCgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2Vfd2lkdGgoKSkobm9kZSk7XG5cdCAgICB9KVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS50cmlhbmdsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdHZhciBzID0gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG5cdGQzLnNlbGVjdCh0aGlzKVxuXHQgICAgLmFwcGVuZChcInBvbHlnb25cIilcblx0ICAgIC5hdHRyKFwicG9pbnRzXCIsICgtcykgKyBcIiwwIFwiICsgcyArIFwiLFwiICsgKC1zKSArIFwiIFwiICsgcyArIFwiLFwiICsgcylcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uZmlsbCgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlKCkpKG5vZGUpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2Vfd2lkdGgoKSkobm9kZSk7XG5cdCAgICB9KVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG4vLyB0cmVlLm5vZGVfZGlzcGxheS5jb25kID0gZnVuY3Rpb24gKCkge1xuLy8gICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuLy8gICAgIC8vIGNvbmRpdGlvbnMgYXJlIG9iamVjdHMgd2l0aFxuLy8gICAgIC8vIG5hbWUgOiBhIG5hbWUgZm9yIHRoaXMgZGlzcGxheVxuLy8gICAgIC8vIGNhbGxiYWNrOiB0aGUgY29uZGl0aW9uIHRvIGFwcGx5IChyZWNlaXZlcyBhIHRudC5ub2RlKVxuLy8gICAgIC8vIGRpc3BsYXk6IGEgbm9kZV9kaXNwbGF5XG4vLyAgICAgdmFyIGNvbmRzID0gW107XG5cbi8vICAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG4vLyBcdHZhciBzID0gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG4vLyBcdGZvciAodmFyIGk9MDsgaTxjb25kcy5sZW5ndGg7IGkrKykge1xuLy8gXHQgICAgdmFyIGNvbmQgPSBjb25kc1tpXTtcbi8vIFx0ICAgIC8vIEZvciBlYWNoIG5vZGUsIHRoZSBmaXJzdCBjb25kaXRpb24gbWV0IGlzIHVzZWRcbi8vIFx0ICAgIGlmIChjb25kLmNhbGxiYWNrLmNhbGwodGhpcywgbm9kZSkgPT09IHRydWUpIHtcbi8vIFx0XHRjb25kLmRpc3BsYXkuY2FsbCh0aGlzLCBub2RlKVxuLy8gXHRcdGJyZWFrO1xuLy8gXHQgICAgfVxuLy8gXHR9XG4vLyAgICAgfSlcblxuLy8gICAgIHZhciBhcGkgPSBhcGlqcyhuKTtcblxuLy8gICAgIGFwaS5tZXRob2QoXCJhZGRcIiwgZnVuY3Rpb24gKG5hbWUsIGNiYWssIG5vZGVfZGlzcGxheSkge1xuLy8gXHRjb25kcy5wdXNoKHsgbmFtZSA6IG5hbWUsXG4vLyBcdFx0ICAgICBjYWxsYmFjayA6IGNiYWssXG4vLyBcdFx0ICAgICBkaXNwbGF5IDogbm9kZV9kaXNwbGF5XG4vLyBcdFx0ICAgfSk7XG4vLyBcdHJldHVybiBuO1xuLy8gICAgIH0pO1xuXG4vLyAgICAgYXBpLm1ldGhvZChcInJlc2V0XCIsIGZ1bmN0aW9uICgpIHtcbi8vIFx0Y29uZHMgPSBbXTtcbi8vIFx0cmV0dXJuIG47XG4vLyAgICAgfSk7XG5cbi8vICAgICBhcGkubWV0aG9kKFwidXBkYXRlXCIsIGZ1bmN0aW9uIChuYW1lLCBjYmFrLCBuZXdfZGlzcGxheSkge1xuLy8gXHRmb3IgKHZhciBpPTA7IGk8Y29uZHMubGVuZ3RoOyBpKyspIHtcbi8vIFx0ICAgIGlmIChjb25kc1tpXS5uYW1lID09PSBuYW1lKSB7XG4vLyBcdFx0Y29uZHNbaV0uY2FsbGJhY2sgPSBjYmFrO1xuLy8gXHRcdGNvbmRzW2ldLmRpc3BsYXkgPSBuZXdfZGlzcGxheTtcbi8vIFx0ICAgIH1cbi8vIFx0fVxuLy8gXHRyZXR1cm4gbjtcbi8vICAgICB9KTtcblxuLy8gICAgIHJldHVybiBuO1xuXG4vLyB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLm5vZGVfZGlzcGxheTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRudF90cmVlX25vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcblxudmFyIHRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaCAoXCJjbGlja1wiLCBcImRibGNsaWNrXCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIik7XG5cbiAgICB2YXIgY29uZiA9IHtcblx0ZHVyYXRpb24gICAgICAgICA6IDUwMCwgICAgICAvLyBEdXJhdGlvbiBvZiB0aGUgdHJhbnNpdGlvbnNcblx0bm9kZV9kaXNwbGF5ICAgICA6IHRyZWUubm9kZV9kaXNwbGF5LmNpcmNsZSgpLFxuXHRsYWJlbCAgICAgICAgICAgIDogdHJlZS5sYWJlbC50ZXh0KCksXG5cdGxheW91dCAgICAgICAgICAgOiB0cmVlLmxheW91dC52ZXJ0aWNhbCgpLFxuXHQvLyBvbl9jbGljayAgICAgICAgIDogZnVuY3Rpb24gKCkge30sXG5cdC8vIG9uX2RibF9jbGljayAgICAgOiBmdW5jdGlvbiAoKSB7fSxcblx0Ly8gb25fbW91c2VvdmVyICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuXHRicmFuY2hfY29sb3IgICAgICAgOiAnYmxhY2snLFxuXHRpZCAgICAgICAgICAgICAgIDogXCJfaWRcIlxuICAgIH07XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBmb2N1c2VkIG5vZGVcbiAgICAvLyBUT0RPOiBXb3VsZCBpdCBiZSBiZXR0ZXIgdG8gaGF2ZSBtdWx0aXBsZSBmb2N1c2VkIG5vZGVzPyAoaWUgdXNlIGFuIGFycmF5KVxuICAgIHZhciBmb2N1c2VkX25vZGU7XG5cbiAgICAvLyBFeHRyYSBkZWxheSBpbiB0aGUgdHJhbnNpdGlvbnMgKFRPRE86IE5lZWRlZD8pXG4gICAgdmFyIGRlbGF5ID0gMDtcblxuICAgIC8vIEVhc2Ugb2YgdGhlIHRyYW5zaXRpb25zXG4gICAgdmFyIGVhc2UgPSBcImN1YmljLWluLW91dFwiO1xuXG4gICAgLy8gQnkgbm9kZSBkYXRhXG4gICAgdmFyIHNwX2NvdW50cyA9IHt9O1xuXG4gICAgdmFyIHNjYWxlID0gZmFsc2U7XG5cbiAgICAvLyBUaGUgaWQgb2YgdGhlIHRyZWUgY29udGFpbmVyXG4gICAgdmFyIGRpdl9pZDtcblxuICAgIC8vIFRoZSB0cmVlIHZpc3VhbGl6YXRpb24gKHN2ZylcbiAgICB2YXIgc3ZnO1xuICAgIHZhciB2aXM7XG4gICAgdmFyIGxpbmtzX2c7XG4gICAgdmFyIG5vZGVzX2c7XG5cbiAgICAvLyBUT0RPOiBGb3Igbm93LCBjb3VudHMgYXJlIGdpdmVuIG9ubHkgZm9yIGxlYXZlc1xuICAgIC8vIGJ1dCBpdCBtYXkgYmUgZ29vZCB0byBhbGxvdyBjb3VudHMgZm9yIGludGVybmFsIG5vZGVzXG4gICAgdmFyIGNvdW50cyA9IHt9O1xuXG4gICAgLy8gVGhlIGZ1bGwgdHJlZVxuICAgIHZhciBiYXNlID0ge1xuXHR0cmVlIDogdW5kZWZpbmVkLFxuXHRkYXRhIDogdW5kZWZpbmVkLFxuXHRub2RlcyA6IHVuZGVmaW5lZCxcblx0bGlua3MgOiB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgLy8gVGhlIGN1cnIgdHJlZS4gTmVlZGVkIHRvIHJlLWNvbXB1dGUgdGhlIGxpbmtzIC8gbm9kZXMgcG9zaXRpb25zIG9mIHN1YnRyZWVzXG4gICAgdmFyIGN1cnIgPSB7XG5cdHRyZWUgOiB1bmRlZmluZWQsXG5cdGRhdGEgOiB1bmRlZmluZWQsXG5cdG5vZGVzIDogdW5kZWZpbmVkLFxuXHRsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY2JhayByZXR1cm5lZFxuICAgIHZhciB0ID0gZnVuY3Rpb24gKGRpdikge1xuXHRkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIik7XG5cbiAgICAgICAgdmFyIHRyZWVfZGl2ID0gZDMuc2VsZWN0KGRpdilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIChjb25mLmxheW91dC53aWR0aCgpICsgIFwicHhcIikpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2dyb3VwRGl2XCIpO1xuXG5cdHZhciBjbHVzdGVyID0gY29uZi5sYXlvdXQuY2x1c3RlcjtcblxuXHR2YXIgbl9sZWF2ZXMgPSBjdXJyLnRyZWUuZ2V0X2FsbF9sZWF2ZXMoKS5sZW5ndGg7XG5cblx0dmFyIG1heF9sZWFmX2xhYmVsX2xlbmd0aCA9IGZ1bmN0aW9uICh0cmVlKSB7XG5cdCAgICB2YXIgbWF4ID0gMDtcblx0ICAgIHZhciBsZWF2ZXMgPSB0cmVlLmdldF9hbGxfbGVhdmVzKCk7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGxhYmVsX3dpZHRoID0gY29uZi5sYWJlbC53aWR0aCgpKGxlYXZlc1tpXSkgKyBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkobGVhdmVzW2ldKTtcblx0XHRpZiAobGFiZWxfd2lkdGggPiBtYXgpIHtcblx0XHQgICAgbWF4ID0gbGFiZWxfd2lkdGg7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG1heDtcblx0fTtcblxuXHR2YXIgbWF4X2xlYWZfbm9kZV9oZWlnaHQgPSBmdW5jdGlvbiAodHJlZSkge1xuXHQgICAgdmFyIG1heCA9IDA7XG5cdCAgICB2YXIgbGVhdmVzID0gdHJlZS5nZXRfYWxsX2xlYXZlcygpO1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBub2RlX3NpemUgPSBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkobGVhdmVzW2ldKTtcblx0XHRpZiAobm9kZV9zaXplID4gbWF4KSB7XG5cdFx0ICAgIG1heCA9IG5vZGVfc2l6ZTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gbWF4ICogMjtcblx0fTtcblxuXHR2YXIgbWF4X2xhYmVsX2xlbmd0aCA9IG1heF9sZWFmX2xhYmVsX2xlbmd0aChjdXJyLnRyZWUpO1xuXHRjb25mLmxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aChtYXhfbGFiZWxfbGVuZ3RoKTtcblxuXHR2YXIgbWF4X25vZGVfaGVpZ2h0ID0gbWF4X2xlYWZfbm9kZV9oZWlnaHQoY3Vyci50cmVlKTtcblxuXHQvLyBDbHVzdGVyIHNpemUgaXMgdGhlIHJlc3VsdCBvZi4uLlxuXHQvLyB0b3RhbCB3aWR0aCBvZiB0aGUgdmlzIC0gdHJhbnNmb3JtIGZvciB0aGUgdHJlZSAtIG1heF9sZWFmX2xhYmVsX3dpZHRoIC0gaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIGxhYmVsXG5cdC8vIFRPRE86IFN1YnN0aXR1dGUgMTUgYnkgdGhlIGhvcml6b250YWwgdHJhbnNmb3JtIG9mIHRoZSBub2Rlc1xuXHR2YXIgY2x1c3Rlcl9zaXplX3BhcmFtcyA9IHtcblx0ICAgIG5fbGVhdmVzIDogbl9sZWF2ZXMsXG5cdCAgICBsYWJlbF9oZWlnaHQgOiBkMy5tYXgoW2QzLmZ1bmN0b3IoY29uZi5sYWJlbC5oZWlnaHQoKSkoKSwgbWF4X25vZGVfaGVpZ2h0XSksXG5cdCAgICBsYWJlbF9wYWRkaW5nIDogMTVcblx0fTtcblxuXHRjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG5cdHZhciBkaWFnb25hbCA9IGNvbmYubGF5b3V0LmRpYWdvbmFsKCk7XG5cdHZhciB0cmFuc2Zvcm0gPSBjb25mLmxheW91dC50cmFuc2Zvcm1fbm9kZTtcblxuXHRzdmcgPSB0cmVlX2RpdlxuXHQgICAgLmFwcGVuZChcInN2Z1wiKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmxheW91dC53aWR0aCgpKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgY29uZi5sYXlvdXQuaGVpZ2h0KGNsdXN0ZXJfc2l6ZV9wYXJhbXMpICsgMzApXG5cdCAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cdHZpcyA9IHN2Z1xuXHQgICAgLmFwcGVuZChcImdcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfc3RfXCIgKyBkaXZfaWQpXG5cdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLFxuXHRcdCAgXCJ0cmFuc2xhdGUoXCIgK1xuXHRcdCAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdICtcblx0XHQgIFwiLFwiICtcblx0XHQgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVsxXSArXG5cdFx0ICBcIilcIik7XG5cblx0Y3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcblx0Y29uZi5sYXlvdXQuc2NhbGVfYnJhbmNoX2xlbmd0aHMoY3Vycik7XG5cdGN1cnIubGlua3MgPSBjbHVzdGVyLmxpbmtzKGN1cnIubm9kZXMpO1xuXG5cdC8vIExJTktTXG5cdC8vIEFsbCB0aGUgbGlua3MgYXJlIGdyb3VwZWQgaW4gYSBnIGVsZW1lbnRcblx0bGlua3NfZyA9IHZpc1xuXHQgICAgLmFwcGVuZChcImdcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rc1wiKTtcblx0bm9kZXNfZyA9IHZpc1xuXHQgICAgLmFwcGVuZChcImdcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2Rlc1wiKTtcblxuXHQvL3ZhciBsaW5rID0gdmlzXG5cdHZhciBsaW5rID0gbGlua3NfZ1xuXHQgICAgLnNlbGVjdEFsbChcInBhdGgudG50X3RyZWVfbGlua1wiKVxuXHQgICAgLmRhdGEoY3Vyci5saW5rcywgZnVuY3Rpb24oZCl7cmV0dXJuIGQudGFyZ2V0W2NvbmYuaWRdfSk7XG5cblx0bGlua1xuXHQgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJwYXRoXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGlua1wiKVxuXHQgICAgLmF0dHIoXCJpZFwiLCBmdW5jdGlvbihkKSB7XG5cdCAgICBcdHJldHVybiBcInRudF90cmVlX2xpbmtfXCIgKyBkaXZfaWQgKyBcIl9cIiArIGQudGFyZ2V0Ll9pZDtcblx0ICAgIH0pXG5cdCAgICAuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3Rvcihjb25mLmJyYW5jaF9jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cdC8vIE5PREVTXG5cdC8vdmFyIG5vZGUgPSB2aXNcblx0dmFyIG5vZGUgPSBub2Rlc19nXG5cdCAgICAuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG5cdCAgICAuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7cmV0dXJuIGRbY29uZi5pZF19KTtcblxuXHR2YXIgbmV3X25vZGUgPSBub2RlXG5cdCAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcblx0XHRpZiAobi5jaGlsZHJlbikge1xuXHRcdCAgICBpZiAobi5kZXB0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIlxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiaW5uZXIgdG50X3RyZWVfbm9kZVwiXG5cdFx0ICAgIH1cblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJsZWFmIHRudF90cmVlX25vZGVcIlxuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0XHRyZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZFxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0Ly8gZGlzcGxheSBub2RlIHNoYXBlXG5cdG5ld19ub2RlXG5cdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpXG5cdCAgICB9KTtcblxuXHQvLyBkaXNwbGF5IG5vZGUgbGFiZWxcblx0bmV3X25vZGVcblx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuXHQgICAgXHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcblx0ICAgIH0pO1xuXG4gICAgbmV3X25vZGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgfSk7XG4gICAgbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6ZGJsY2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgfSk7XG4gICAgbmV3X25vZGUub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICB9KTtcbiAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTptb3VzZW91dFwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICB9KTtcblxuXHQvLyBuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vICAgICBjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgLy9cblx0Ly8gICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cdC8vIH0pO1xuICAgIC8vXG5cdC8vIG5ld19ub2RlLm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuXHQvLyAgICAgY29uZi5vbl9tb3VzZW92ZXIuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAvL1xuXHQvLyAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0Ly8gfSk7XG4gICAgLy9cblx0Ly8gbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuXHQvLyAgICAgY29uZi5vbl9kYmxfY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAvL1xuXHQvLyAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0Ly8gfSk7XG5cblxuXHQvLyBVcGRhdGUgcGxvdHMgYW4gdXBkYXRlZCB0cmVlXG5cdGFwaS5tZXRob2QgKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcblx0ICAgIHRyZWVfZGl2XG5cdFx0LnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyBcInB4XCIpKTtcblx0ICAgIHN2Zy5hdHRyKFwid2lkdGhcIiwgY29uZi5sYXlvdXQud2lkdGgoKSk7XG5cblx0ICAgIHZhciBjbHVzdGVyID0gY29uZi5sYXlvdXQuY2x1c3Rlcjtcblx0ICAgIHZhciBkaWFnb25hbCA9IGNvbmYubGF5b3V0LmRpYWdvbmFsKCk7XG5cdCAgICB2YXIgdHJhbnNmb3JtID0gY29uZi5sYXlvdXQudHJhbnNmb3JtX25vZGU7XG5cblx0ICAgIHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG5cdCAgICBjb25mLmxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aChtYXhfbGFiZWxfbGVuZ3RoKTtcblxuXHQgICAgdmFyIG1heF9ub2RlX2hlaWdodCA9IG1heF9sZWFmX25vZGVfaGVpZ2h0KGN1cnIudHJlZSk7XG5cblx0ICAgIC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG5cdCAgICAvLyB0b3RhbCB3aWR0aCBvZiB0aGUgdmlzIC0gdHJhbnNmb3JtIGZvciB0aGUgdHJlZSAtIG1heF9sZWFmX2xhYmVsX3dpZHRoIC0gaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIGxhYmVsXG5cdC8vIFRPRE86IFN1YnN0aXR1dGUgMTUgYnkgdGhlIHRyYW5zZm9ybSBvZiB0aGUgbm9kZXMgKHByb2JhYmx5IGJ5IHNlbGVjdGluZyBvbmUgbm9kZSBhc3N1bWluZyBhbGwgdGhlIG5vZGVzIGhhdmUgdGhlIHNhbWUgdHJhbnNmb3JtXG5cdCAgICB2YXIgbl9sZWF2ZXMgPSBjdXJyLnRyZWUuZ2V0X2FsbF9sZWF2ZXMoKS5sZW5ndGg7XG5cdCAgICB2YXIgY2x1c3Rlcl9zaXplX3BhcmFtcyA9IHtcblx0XHRuX2xlYXZlcyA6IG5fbGVhdmVzLFxuXHRcdGxhYmVsX2hlaWdodCA6IGQzLm1heChbZDMuZnVuY3Rvcihjb25mLmxhYmVsLmhlaWdodCgpKSgpLCBtYXhfbm9kZV9oZWlnaHRdKSxcblx0XHRsYWJlbF9wYWRkaW5nIDogMTVcblx0ICAgIH07XG5cdCAgICBjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG5cdCAgICBzdmdcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdFx0LmVhc2UoZWFzZSlcblx0XHQuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMCk7IC8vIGhlaWdodCBpcyBpbiB0aGUgbGF5b3V0XG5cblx0ICAgIHZpc1xuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLFxuXHRcdCAgICAgIFwidHJhbnNsYXRlKFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuXHRcdCAgICAgIFwiLFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuXHRcdCAgICAgIFwiKVwiKTtcblxuXHQgICAgY3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcblx0ICAgIGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuXHQgICAgY3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cblx0ICAgIC8vIExJTktTXG5cdCAgICB2YXIgbGluayA9IGxpbmtzX2dcblx0XHQuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG5cdFx0LmRhdGEoY3Vyci5saW5rcywgZnVuY3Rpb24oZCl7cmV0dXJuIGQudGFyZ2V0W2NvbmYuaWRdfSk7XG5cbiAgICAgICAgICAgIC8vIE5PREVTXG5cdCAgICB2YXIgbm9kZSA9IG5vZGVzX2dcblx0XHQuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG5cdFx0LmRhdGEoY3Vyci5ub2RlcywgZnVuY3Rpb24oZCkge3JldHVybiBkW2NvbmYuaWRdfSk7XG5cblx0ICAgIHZhciBleGl0X2xpbmsgPSBsaW5rXG5cdFx0LmV4aXQoKVxuXHRcdC5yZW1vdmUoKTtcblxuXHQgICAgbGlua1xuXHRcdC5lbnRlcigpXG5cdFx0LmFwcGVuZChcInBhdGhcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGlua1wiKVxuXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgZC50YXJnZXQuX2lkO1xuXHRcdH0pXG5cdFx0LmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIGQzLmZ1bmN0b3IoY29uZi5icmFuY2hfY29sb3IpKHRudF90cmVlX25vZGUoZC5zb3VyY2UpLCB0bnRfdHJlZV9ub2RlKGQudGFyZ2V0KSk7XG5cdFx0fSlcblx0XHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cdCAgICBsaW5rXG5cdCAgICBcdC50cmFuc2l0aW9uKClcblx0XHQuZWFzZShlYXNlKVxuXHQgICAgXHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0ICAgIFx0LmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcblxuXG5cdCAgICAvLyBOb2Rlc1xuXHQgICAgdmFyIG5ld19ub2RlID0gbm9kZVxuXHRcdC5lbnRlcigpXG5cdFx0LmFwcGVuZChcImdcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcblx0XHQgICAgaWYgKG4uY2hpbGRyZW4pIHtcblx0XHRcdGlmIChuLmRlcHRoID09IDApIHtcblx0XHRcdCAgICByZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIlxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdCAgICByZXR1cm4gXCJpbm5lciB0bnRfdHJlZV9ub2RlXCJcblx0XHRcdH1cblx0XHQgICAgfSBlbHNlIHtcblx0XHRcdHJldHVybiBcImxlYWYgdG50X3RyZWVfbm9kZVwiXG5cdFx0ICAgIH1cblx0XHR9KVxuXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIFwidG50X3RyZWVfbm9kZV9cIiArIGRpdl9pZCArIFwiX1wiICsgZC5faWQ7XG5cdFx0fSlcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuXG5cdCAgICAvLyBFeGl0aW5nIG5vZGVzIGFyZSBqdXN0IHJlbW92ZWRcblx0ICAgIG5vZGVcblx0XHQuZXhpdCgpXG5cdFx0LnJlbW92ZSgpO1xuXG4gICAgICAgIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3X25vZGUub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTptb3VzZW91dFwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuXG5cdCAgICAvLyBuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Ly8gY29uZi5vbl9jbGljay5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAvL1xuXHRcdC8vIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cdCAgICAvLyB9KTtcbiAgICAgICAgLy9cblx0ICAgIC8vIG5ld19ub2RlLm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdC8vIGNvbmYub25fbW91c2VvdmVyLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgIC8vXG5cdFx0Ly8gdHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIC8vIH0pO1xuICAgICAgICAvL1xuXHQgICAgLy8gbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdC8vIGNvbmYub25fZGJsX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgIC8vXG5cdFx0Ly8gdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIC8vIH0pO1xuXG5cblx0ICAgIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGFsbCB0aGUgbm9kZXMgYWdhaW4gaW4gY2FzZSB0aGV5IGhhdmUgY2hhbmdlZCBsaXZlbHkgKG9yIHRoZSBsYXlvdXQpXG5cdCAgICBub2RlLnNlbGVjdEFsbChcIipcIikucmVtb3ZlKCk7XG5cdCAgICBub2RlXG5cdFx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpXG5cdFx0ICAgIH0pO1xuXG5cdCAgICAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhbGwgdGhlIGxhYmVscyBhZ2FpbiBpbiBjYXNlIHRoZXkgaGF2ZSBjaGFuZ2VkIGxpdmVseSAob3IgdGhlIGxheW91dClcblx0ICAgIG5vZGVcblx0XHQgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcblx0XHQgICAgfSk7XG5cblx0ICAgIG5vZGVcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmVhc2UoZWFzZSlcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuXG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKHQpXG5cdC5nZXRzZXQgKGNvbmYpXG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIGRhdGEgdXNpbmcgZ2V0c2V0IC8gZmluYWxpemVycyAmIHRyYW5zZm9ybXNcbiAgICBhcGkubWV0aG9kICgnZGF0YScsIGZ1bmN0aW9uIChkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGJhc2UuZGF0YTtcblx0fVxuXG5cdC8vIFRoZSBvcmlnaW5hbCBkYXRhIGlzIHN0b3JlZCBhcyB0aGUgYmFzZSBhbmQgY3VyciBkYXRhXG5cdGJhc2UuZGF0YSA9IGQ7XG5cdGN1cnIuZGF0YSA9IGQ7XG5cblx0Ly8gU2V0IHVwIGEgbmV3IHRyZWUgYmFzZWQgb24gdGhlIGRhdGFcblx0dmFyIG5ld3RyZWUgPSB0bnRfdHJlZV9ub2RlKGJhc2UuZGF0YSk7XG5cblx0dC5yb290KG5ld3RyZWUpO1xuXG5cdHRyZWUudHJpZ2dlcihcImRhdGE6aGFzQ2hhbmdlZFwiLCBiYXNlLmRhdGEpO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogUmV3cml0ZSB0cmVlIHVzaW5nIGdldHNldCAvIGZpbmFsaXplcnMgJiB0cmFuc2Zvcm1zXG4gICAgYXBpLm1ldGhvZCAoJ3Jvb3QnLCBmdW5jdGlvbiAobXlUcmVlKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gY3Vyci50cmVlO1xuICAgIFx0fVxuXG5cdC8vIFRoZSBvcmlnaW5hbCB0cmVlIGlzIHN0b3JlZCBhcyB0aGUgYmFzZSwgcHJldiBhbmQgY3VyciB0cmVlXG4gICAgXHRiYXNlLnRyZWUgPSBteVRyZWU7XG5cdGN1cnIudHJlZSA9IGJhc2UudHJlZTtcbi8vXHRwcmV2LnRyZWUgPSBiYXNlLnRyZWU7XG4gICAgXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdzdWJ0cmVlJywgZnVuY3Rpb24gKGN1cnJfbm9kZXMsIGtlZXBTaW5nbGV0b25zKSB7XG5cdHZhciBzdWJ0cmVlID0gYmFzZS50cmVlLnN1YnRyZWUoY3Vycl9ub2Rlcywga2VlcFNpbmdsZXRvbnMpO1xuXHRjdXJyLmRhdGEgPSBzdWJ0cmVlLmRhdGEoKTtcblx0Y3Vyci50cmVlID0gc3VidHJlZTtcblxuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdmb2N1c19ub2RlJywgZnVuY3Rpb24gKG5vZGUsIGtlZXBTaW5nbGV0b25zKSB7XG5cdC8vIGZpbmRcblx0dmFyIGZvdW5kX25vZGUgPSB0LnJvb3QoKS5maW5kX25vZGUoZnVuY3Rpb24gKG4pIHtcblx0ICAgIHJldHVybiBub2RlLmlkKCkgPT09IG4uaWQoKTtcblx0fSk7XG5cdGZvY3VzZWRfbm9kZSA9IGZvdW5kX25vZGU7XG5cdHQuc3VidHJlZShmb3VuZF9ub2RlLmdldF9hbGxfbGVhdmVzKCksIGtlZXBTaW5nbGV0b25zKTtcblxuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdoYXNfZm9jdXMnLCBmdW5jdGlvbiAobm9kZSkge1xuXHRyZXR1cm4gKChmb2N1c2VkX25vZGUgIT09IHVuZGVmaW5lZCkgJiYgKGZvY3VzZWRfbm9kZS5pZCgpID09PSBub2RlLmlkKCkpKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyZWxlYXNlX2ZvY3VzJywgZnVuY3Rpb24gKCkge1xuXHR0LmRhdGEgKGJhc2UuZGF0YSk7XG5cdGZvY3VzZWRfbm9kZSA9IHVuZGVmaW5lZDtcblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZDMucmViaW5kICh0LCBkaXNwYXRjaCwgXCJvblwiKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWU7XG4iXX0=
