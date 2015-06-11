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
        branch_color     : 'black',
        id               : function (d) {
            return d._id;
        }
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
            var label_width = conf.label.width()(leaves[i]) + d3.functor (conf.node_display.size())(leaves[i]);
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
	    .data(curr.links, function(d){
            return conf.id(d.target);
        });

	link
	    .enter()
	    .append("path")
	    .attr("class", "tnt_tree_link")
	    .attr("id", function(d) {
	    	return "tnt_tree_link_" + div_id + "_" + conf.id(d.target);
	    })
	    .style("stroke", function (d) {
            return d3.functor(conf.branch_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
	    })
	    .attr("d", diagonal);

	// NODES
	//var node = vis
	var node = nodes_g
	    .selectAll("g.tnt_tree_node")
	    .data(curr.nodes, function(d) {
            return conf.id(d)
        });

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
		.data(curr.links, function(d){
            return conf.id(d.target)
        });

            // NODES
	    var node = nodes_g
		.selectAll("g.tnt_tree_node")
		.data(curr.nodes, function(d) {return conf.id(d)});

	    var exit_link = link
		.exit()
		.remove();

	    link
		.enter()
		.append("path")
		.attr("class", "tnt_tree_link")
		.attr("id", function (d) {
		    return "tnt_tree_link_" + div_id + "_" + conf.id(d.target);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvZmFrZV9kYTc5ZGI3YS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvYmlvanMtZXZlbnRzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQuYXBpL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQuYXBpL3NyYy9hcGkuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svc3JjL25ld2ljay5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3JlZHVjZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy91dGlscy5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9zcmMvbm9kZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9zcmMvZGlhZ29uYWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL3NyYy9sYWJlbC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQudHJlZS9zcmMvbGF5b3V0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC50cmVlL3NyYy9ub2RlX2Rpc3BsYXkuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50LnRyZWUvc3JjL3RyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFJBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0ge307XG59XG50bnQudHJlZSA9IHJlcXVpcmUoXCIuL2luZGV4LmpzXCIpO1xudG50LnRyZWUubm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xudG50LnRyZWUucGFyc2VfbmV3aWNrID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2VfbmV3aWNrO1xudG50LnRyZWUucGFyc2Vfbmh4ID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2Vfbmh4O1xuXG4iLCIvLyBpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuLy8gICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0ge31cbi8vIH1cbm1vZHVsZS5leHBvcnRzID0gdHJlZSA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcbnZhciBldmVudHN5c3RlbSA9IHJlcXVpcmUoXCJiaW9qcy1ldmVudHNcIik7XG5ldmVudHN5c3RlbS5taXhpbih0cmVlKTtcbi8vdG50LnV0aWxzID0gcmVxdWlyZShcInRudC51dGlsc1wiKTtcbi8vdG50LnRvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG4vL3RudC50cmVlID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xuXG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZShcImJhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lXCIpO1xuXG5ldmVudHMub25BbGwgPSBmdW5jdGlvbihjYWxsYmFjayxjb250ZXh0KXtcbiAgdGhpcy5vbihcImFsbFwiLCBjYWxsYmFjayxjb250ZXh0KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBNaXhpbiB1dGlsaXR5XG5ldmVudHMub2xkTWl4aW4gPSBldmVudHMubWl4aW47XG5ldmVudHMubWl4aW4gPSBmdW5jdGlvbihwcm90bykge1xuICBldmVudHMub2xkTWl4aW4ocHJvdG8pO1xuICAvLyBhZGQgY3VzdG9tIG9uQWxsXG4gIHZhciBleHBvcnRzID0gWydvbkFsbCddO1xuICBmb3IodmFyIGk9MDsgaSA8IGV4cG9ydHMubGVuZ3RoO2krKyl7XG4gICAgdmFyIG5hbWUgPSBleHBvcnRzW2ldO1xuICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgfVxuICByZXR1cm4gcHJvdG87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50cztcbiIsIi8qKlxuICogU3RhbmRhbG9uZSBleHRyYWN0aW9uIG9mIEJhY2tib25lLkV2ZW50cywgbm8gZXh0ZXJuYWwgZGVwZW5kZW5jeSByZXF1aXJlZC5cbiAqIERlZ3JhZGVzIG5pY2VseSB3aGVuIEJhY2tvbmUvdW5kZXJzY29yZSBhcmUgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnRcbiAqIGdsb2JhbCBjb250ZXh0LlxuICpcbiAqIE5vdGUgdGhhdCBkb2NzIHN1Z2dlc3QgdG8gdXNlIHVuZGVyc2NvcmUncyBgXy5leHRlbmQoKWAgbWV0aG9kIHRvIGFkZCBFdmVudHNcbiAqIHN1cHBvcnQgdG8gc29tZSBnaXZlbiBvYmplY3QuIEEgYG1peGluKClgIG1ldGhvZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgRXZlbnRzXG4gKiBwcm90b3R5cGUgdG8gYXZvaWQgdXNpbmcgdW5kZXJzY29yZSBmb3IgdGhhdCBzb2xlIHB1cnBvc2U6XG4gKlxuICogICAgIHZhciBteUV2ZW50RW1pdHRlciA9IEJhY2tib25lRXZlbnRzLm1peGluKHt9KTtcbiAqXG4gKiBPciBmb3IgYSBmdW5jdGlvbiBjb25zdHJ1Y3RvcjpcbiAqXG4gKiAgICAgZnVuY3Rpb24gTXlDb25zdHJ1Y3Rvcigpe31cbiAqICAgICBNeUNvbnN0cnVjdG9yLnByb3RvdHlwZS5mb28gPSBmdW5jdGlvbigpe31cbiAqICAgICBCYWNrYm9uZUV2ZW50cy5taXhpbihNeUNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gKlxuICogKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuICogKGMpIDIwMTMgTmljb2xhcyBQZXJyaWF1bHRcbiAqL1xuLyogZ2xvYmFsIGV4cG9ydHM6dHJ1ZSwgZGVmaW5lLCBtb2R1bGUgKi9cbihmdW5jdGlvbigpIHtcbiAgdmFyIHJvb3QgPSB0aGlzLFxuICAgICAgbmF0aXZlRm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLFxuICAgICAgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICBpZENvdW50ZXIgPSAwO1xuXG4gIC8vIFJldHVybnMgYSBwYXJ0aWFsIGltcGxlbWVudGF0aW9uIG1hdGNoaW5nIHRoZSBtaW5pbWFsIEFQSSBzdWJzZXQgcmVxdWlyZWRcbiAgLy8gYnkgQmFja2JvbmUuRXZlbnRzXG4gIGZ1bmN0aW9uIG1pbmlzY29yZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAga2V5czogT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2Ygb2JqICE9PSBcImZ1bmN0aW9uXCIgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImtleXMoKSBjYWxsZWQgb24gYSBub24tb2JqZWN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXksIGtleXMgPSBbXTtcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBrZXlzW2tleXMubGVuZ3RoXSA9IGtleTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgICB9LFxuXG4gICAgICB1bmlxdWVJZDogZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICAgICAgfSxcblxuICAgICAgaGFzOiBmdW5jdGlvbihvYmosIGtleSkge1xuICAgICAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gICAgICB9LFxuXG4gICAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhcyhvYmosIGtleSkpIHtcbiAgICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgb25jZTogZnVuY3Rpb24oZnVuYykge1xuICAgICAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgZnVuYyA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHZhciBfID0gbWluaXNjb3JlKCksIEV2ZW50cztcblxuICAvLyBCYWNrYm9uZS5FdmVudHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQSBtb2R1bGUgdGhhdCBjYW4gYmUgbWl4ZWQgaW4gdG8gKmFueSBvYmplY3QqIGluIG9yZGVyIHRvIHByb3ZpZGUgaXQgd2l0aFxuICAvLyBjdXN0b20gZXZlbnRzLiBZb3UgbWF5IGJpbmQgd2l0aCBgb25gIG9yIHJlbW92ZSB3aXRoIGBvZmZgIGNhbGxiYWNrXG4gIC8vIGZ1bmN0aW9ucyB0byBhbiBldmVudDsgYHRyaWdnZXJgLWluZyBhbiBldmVudCBmaXJlcyBhbGwgY2FsbGJhY2tzIGluXG4gIC8vIHN1Y2Nlc3Npb24uXG4gIC8vXG4gIC8vICAgICB2YXIgb2JqZWN0ID0ge307XG4gIC8vICAgICBfLmV4dGVuZChvYmplY3QsIEJhY2tib25lLkV2ZW50cyk7XG4gIC8vICAgICBvYmplY3Qub24oJ2V4cGFuZCcsIGZ1bmN0aW9uKCl7IGFsZXJ0KCdleHBhbmRlZCcpOyB9KTtcbiAgLy8gICAgIG9iamVjdC50cmlnZ2VyKCdleHBhbmQnKTtcbiAgLy9cbiAgRXZlbnRzID0ge1xuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uIFBhc3NpbmcgYFwiYWxsXCJgIHdpbGwgYmluZFxuICAgIC8vIHRoZSBjYWxsYmFjayB0byBhbGwgZXZlbnRzIGZpcmVkLlxuICAgIG9uOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSB8fCAodGhpcy5fZXZlbnRzW25hbWVdID0gW10pO1xuICAgICAgZXZlbnRzLnB1c2goe2NhbGxiYWNrOiBjYWxsYmFjaywgY29udGV4dDogY29udGV4dCwgY3R4OiBjb250ZXh0IHx8IHRoaXN9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIG9ubHkgYmUgdHJpZ2dlcmVkIGEgc2luZ2xlIHRpbWUuIEFmdGVyIHRoZSBmaXJzdCB0aW1lXG4gICAgLy8gdGhlIGNhbGxiYWNrIGlzIGludm9rZWQsIGl0IHdpbGwgYmUgcmVtb3ZlZC5cbiAgICBvbmNlOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uY2UnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIG9uY2UgPSBfLm9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYub2ZmKG5hbWUsIG9uY2UpO1xuICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgICBvbmNlLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgcmV0dXJuIHRoaXMub24obmFtZSwgb25jZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8vIFJlbW92ZSBvbmUgb3IgbWFueSBjYWxsYmFja3MuIElmIGBjb250ZXh0YCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyB3aXRoIHRoYXQgZnVuY3Rpb24uIElmIGBjYWxsYmFja2AgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3MgZm9yIHRoZSBldmVudC4gSWYgYG5hbWVgIGlzIG51bGwsIHJlbW92ZXMgYWxsIGJvdW5kXG4gICAgLy8gY2FsbGJhY2tzIGZvciBhbGwgZXZlbnRzLlxuICAgIG9mZjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXRhaW4sIGV2LCBldmVudHMsIG5hbWVzLCBpLCBsLCBqLCBrO1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIWV2ZW50c0FwaSh0aGlzLCAnb2ZmJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkpIHJldHVybiB0aGlzO1xuICAgICAgaWYgKCFuYW1lICYmICFjYWxsYmFjayAmJiAhY29udGV4dCkge1xuICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIG5hbWVzID0gbmFtZSA/IFtuYW1lXSA6IF8ua2V5cyh0aGlzLl9ldmVudHMpO1xuICAgICAgZm9yIChpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIGlmIChldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0pIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSByZXRhaW4gPSBbXTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sgfHwgY29udGV4dCkge1xuICAgICAgICAgICAgZm9yIChqID0gMCwgayA9IGV2ZW50cy5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgZXYgPSBldmVudHNbal07XG4gICAgICAgICAgICAgIGlmICgoY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldi5jYWxsYmFjay5fY2FsbGJhY2spIHx8XG4gICAgICAgICAgICAgICAgICAoY29udGV4dCAmJiBjb250ZXh0ICE9PSBldi5jb250ZXh0KSkge1xuICAgICAgICAgICAgICAgIHJldGFpbi5wdXNoKGV2KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXJldGFpbi5sZW5ndGgpIGRlbGV0ZSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRyaWdnZXIgb25lIG9yIG1hbnkgZXZlbnRzLCBmaXJpbmcgYWxsIGJvdW5kIGNhbGxiYWNrcy4gQ2FsbGJhY2tzIGFyZVxuICAgIC8vIHBhc3NlZCB0aGUgc2FtZSBhcmd1bWVudHMgYXMgYHRyaWdnZXJgIGlzLCBhcGFydCBmcm9tIHRoZSBldmVudCBuYW1lXG4gICAgLy8gKHVubGVzcyB5b3UncmUgbGlzdGVuaW5nIG9uIGBcImFsbFwiYCwgd2hpY2ggd2lsbCBjYXVzZSB5b3VyIGNhbGxiYWNrIHRvXG4gICAgLy8gcmVjZWl2ZSB0aGUgdHJ1ZSBuYW1lIG9mIHRoZSBldmVudCBhcyB0aGUgZmlyc3QgYXJndW1lbnQpLlxuICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ3RyaWdnZXInLCBuYW1lLCBhcmdzKSkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdO1xuICAgICAgdmFyIGFsbEV2ZW50cyA9IHRoaXMuX2V2ZW50cy5hbGw7XG4gICAgICBpZiAoZXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGV2ZW50cywgYXJncyk7XG4gICAgICBpZiAoYWxsRXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGFsbEV2ZW50cywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBUZWxsIHRoaXMgb2JqZWN0IHRvIHN0b3AgbGlzdGVuaW5nIHRvIGVpdGhlciBzcGVjaWZpYyBldmVudHMgLi4uIG9yXG4gICAgLy8gdG8gZXZlcnkgb2JqZWN0IGl0J3MgY3VycmVudGx5IGxpc3RlbmluZyB0by5cbiAgICBzdG9wTGlzdGVuaW5nOiBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzO1xuICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGRlbGV0ZUxpc3RlbmVyID0gIW5hbWUgJiYgIWNhbGxiYWNrO1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JykgY2FsbGJhY2sgPSB0aGlzO1xuICAgICAgaWYgKG9iaikgKGxpc3RlbmVycyA9IHt9KVtvYmouX2xpc3RlbmVySWRdID0gb2JqO1xuICAgICAgZm9yICh2YXIgaWQgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgIGxpc3RlbmVyc1tpZF0ub2ZmKG5hbWUsIGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgICAgaWYgKGRlbGV0ZUxpc3RlbmVyKSBkZWxldGUgdGhpcy5fbGlzdGVuZXJzW2lkXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICB9O1xuXG4gIC8vIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHNwbGl0IGV2ZW50IHN0cmluZ3MuXG4gIHZhciBldmVudFNwbGl0dGVyID0gL1xccysvO1xuXG4gIC8vIEltcGxlbWVudCBmYW5jeSBmZWF0dXJlcyBvZiB0aGUgRXZlbnRzIEFQSSBzdWNoIGFzIG11bHRpcGxlIGV2ZW50XG4gIC8vIG5hbWVzIGBcImNoYW5nZSBibHVyXCJgIGFuZCBqUXVlcnktc3R5bGUgZXZlbnQgbWFwcyBge2NoYW5nZTogYWN0aW9ufWBcbiAgLy8gaW4gdGVybXMgb2YgdGhlIGV4aXN0aW5nIEFQSS5cbiAgdmFyIGV2ZW50c0FwaSA9IGZ1bmN0aW9uKG9iaiwgYWN0aW9uLCBuYW1lLCByZXN0KSB7XG4gICAgaWYgKCFuYW1lKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIEhhbmRsZSBldmVudCBtYXBzLlxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW2tleSwgbmFtZVtrZXldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBzcGFjZSBzZXBhcmF0ZWQgZXZlbnQgbmFtZXMuXG4gICAgaWYgKGV2ZW50U3BsaXR0ZXIudGVzdChuYW1lKSkge1xuICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChldmVudFNwbGl0dGVyKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW25hbWVzW2ldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIEEgZGlmZmljdWx0LXRvLWJlbGlldmUsIGJ1dCBvcHRpbWl6ZWQgaW50ZXJuYWwgZGlzcGF0Y2ggZnVuY3Rpb24gZm9yXG4gIC8vIHRyaWdnZXJpbmcgZXZlbnRzLiBUcmllcyB0byBrZWVwIHRoZSB1c3VhbCBjYXNlcyBzcGVlZHkgKG1vc3QgaW50ZXJuYWxcbiAgLy8gQmFja2JvbmUgZXZlbnRzIGhhdmUgMyBhcmd1bWVudHMpLlxuICB2YXIgdHJpZ2dlckV2ZW50cyA9IGZ1bmN0aW9uKGV2ZW50cywgYXJncykge1xuICAgIHZhciBldiwgaSA9IC0xLCBsID0gZXZlbnRzLmxlbmd0aCwgYTEgPSBhcmdzWzBdLCBhMiA9IGFyZ3NbMV0sIGEzID0gYXJnc1syXTtcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4KTsgcmV0dXJuO1xuICAgICAgY2FzZSAxOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEpOyByZXR1cm47XG4gICAgICBjYXNlIDI6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIpOyByZXR1cm47XG4gICAgICBjYXNlIDM6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIsIGEzKTsgcmV0dXJuO1xuICAgICAgZGVmYXVsdDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suYXBwbHkoZXYuY3R4LCBhcmdzKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGxpc3Rlbk1ldGhvZHMgPSB7bGlzdGVuVG86ICdvbicsIGxpc3RlblRvT25jZTogJ29uY2UnfTtcblxuICAvLyBJbnZlcnNpb24tb2YtY29udHJvbCB2ZXJzaW9ucyBvZiBgb25gIGFuZCBgb25jZWAuIFRlbGwgKnRoaXMqIG9iamVjdCB0b1xuICAvLyBsaXN0ZW4gdG8gYW4gZXZlbnQgaW4gYW5vdGhlciBvYmplY3QgLi4uIGtlZXBpbmcgdHJhY2sgb2Ygd2hhdCBpdCdzXG4gIC8vIGxpc3RlbmluZyB0by5cbiAgXy5lYWNoKGxpc3Rlbk1ldGhvZHMsIGZ1bmN0aW9uKGltcGxlbWVudGF0aW9uLCBtZXRob2QpIHtcbiAgICBFdmVudHNbbWV0aG9kXSA9IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMgfHwgKHRoaXMuX2xpc3RlbmVycyA9IHt9KTtcbiAgICAgIHZhciBpZCA9IG9iai5fbGlzdGVuZXJJZCB8fCAob2JqLl9saXN0ZW5lcklkID0gXy51bmlxdWVJZCgnbCcpKTtcbiAgICAgIGxpc3RlbmVyc1tpZF0gPSBvYmo7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBvYmpbaW1wbGVtZW50YXRpb25dKG5hbWUsIGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuICBFdmVudHMuYmluZCAgID0gRXZlbnRzLm9uO1xuICBFdmVudHMudW5iaW5kID0gRXZlbnRzLm9mZjtcblxuICAvLyBNaXhpbiB1dGlsaXR5XG4gIEV2ZW50cy5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gICAgdmFyIGV4cG9ydHMgPSBbJ29uJywgJ29uY2UnLCAnb2ZmJywgJ3RyaWdnZXInLCAnc3RvcExpc3RlbmluZycsICdsaXN0ZW5UbycsXG4gICAgICAgICAgICAgICAgICAgJ2xpc3RlblRvT25jZScsICdiaW5kJywgJ3VuYmluZCddO1xuICAgIF8uZWFjaChleHBvcnRzLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBwcm90b1tuYW1lXSA9IHRoaXNbbmFtZV07XG4gICAgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9O1xuXG4gIC8vIEV4cG9ydCBFdmVudHMgYXMgQmFja2JvbmVFdmVudHMgZGVwZW5kaW5nIG9uIGN1cnJlbnQgY29udGV4dFxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7XG4gICAgfVxuICAgIGV4cG9ydHMuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1lbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRXZlbnRzO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1cbn0pKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvbmV3aWNrLmpzXCIpO1xuIiwiLyoqXG4gKiBOZXdpY2sgYW5kIG5oeCBmb3JtYXRzIHBhcnNlciBpbiBKYXZhU2NyaXB0LlxuICpcbiAqIENvcHlyaWdodCAoYykgSmFzb24gRGF2aWVzIDIwMTAgYW5kIE1pZ3VlbCBQaWduYXRlbGxpXG4gKiAgXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiAgXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiAgXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqXG4gKiBFeGFtcGxlIHRyZWUgKGZyb20gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9OZXdpY2tfZm9ybWF0KTpcbiAqXG4gKiArLS0wLjEtLUFcbiAqIEYtLS0tLTAuMi0tLS0tQiAgICAgICAgICAgICstLS0tLS0tMC4zLS0tLUNcbiAqICstLS0tLS0tLS0tLS0tLS0tLS0wLjUtLS0tLUVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICstLS0tLS0tLS0wLjQtLS0tLS1EXG4gKlxuICogTmV3aWNrIGZvcm1hdDpcbiAqIChBOjAuMSxCOjAuMiwoQzowLjMsRDowLjQpRTowLjUpRjtcbiAqXG4gKiBDb252ZXJ0ZWQgdG8gSlNPTjpcbiAqIHtcbiAqICAgbmFtZTogXCJGXCIsXG4gKiAgIGJyYW5jaHNldDogW1xuICogICAgIHtuYW1lOiBcIkFcIiwgbGVuZ3RoOiAwLjF9LFxuICogICAgIHtuYW1lOiBcIkJcIiwgbGVuZ3RoOiAwLjJ9LFxuICogICAgIHtcbiAqICAgICAgIG5hbWU6IFwiRVwiLFxuICogICAgICAgbGVuZ3RoOiAwLjUsXG4gKiAgICAgICBicmFuY2hzZXQ6IFtcbiAqICAgICAgICAge25hbWU6IFwiQ1wiLCBsZW5ndGg6IDAuM30sXG4gKiAgICAgICAgIHtuYW1lOiBcIkRcIiwgbGVuZ3RoOiAwLjR9XG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICBdXG4gKiB9XG4gKlxuICogQ29udmVydGVkIHRvIEpTT04sIGJ1dCB3aXRoIG5vIG5hbWVzIG9yIGxlbmd0aHM6XG4gKiB7XG4gKiAgIGJyYW5jaHNldDogW1xuICogICAgIHt9LCB7fSwge1xuICogICAgICAgYnJhbmNoc2V0OiBbe30sIHt9XVxuICogICAgIH1cbiAqICAgXVxuICogfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHBhcnNlX25ld2ljayA6IGZ1bmN0aW9uKHMpIHtcblx0dmFyIGFuY2VzdG9ycyA9IFtdO1xuXHR2YXIgdHJlZSA9IHt9O1xuXHR2YXIgdG9rZW5zID0gcy5zcGxpdCgvXFxzKig7fFxcKHxcXCl8LHw6KVxccyovKTtcblx0dmFyIHN1YnRyZWU7XG5cdGZvciAodmFyIGk9MDsgaTx0b2tlbnMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXTtcblx0ICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgICAgICAgIGNhc2UgJygnOiAvLyBuZXcgYnJhbmNoc2V0XG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdHRyZWUuY2hpbGRyZW4gPSBbc3VidHJlZV07XG5cdFx0YW5jZXN0b3JzLnB1c2godHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcsJzogLy8gYW5vdGhlciBicmFuY2hcblx0XHRzdWJ0cmVlID0ge307XG5cdFx0YW5jZXN0b3JzW2FuY2VzdG9ycy5sZW5ndGgtMV0uY2hpbGRyZW4ucHVzaChzdWJ0cmVlKTtcblx0XHR0cmVlID0gc3VidHJlZTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJyknOiAvLyBvcHRpb25hbCBuYW1lIG5leHRcblx0XHR0cmVlID0gYW5jZXN0b3JzLnBvcCgpO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnOic6IC8vIG9wdGlvbmFsIGxlbmd0aCBuZXh0XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuXHRcdHZhciB4ID0gdG9rZW5zW2ktMV07XG5cdFx0aWYgKHggPT0gJyknIHx8IHggPT0gJygnIHx8IHggPT0gJywnKSB7XG5cdFx0ICAgIHRyZWUubmFtZSA9IHRva2VuO1xuXHRcdH0gZWxzZSBpZiAoeCA9PSAnOicpIHtcblx0XHQgICAgdHJlZS5icmFuY2hfbGVuZ3RoID0gcGFyc2VGbG9hdCh0b2tlbik7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0cmVlO1xuICAgIH0sXG5cbiAgICBwYXJzZV9uaHggOiBmdW5jdGlvbiAocykge1xuXHR2YXIgYW5jZXN0b3JzID0gW107XG5cdHZhciB0cmVlID0ge307XG5cdHZhciBzdWJ0cmVlO1xuXG5cdHZhciB0b2tlbnMgPSBzLnNwbGl0KCAvXFxzKig7fFxcKHxcXCl8XFxbfFxcXXwsfDp8PSlcXHMqLyApO1xuXHRmb3IgKHZhciBpPTA7IGk8dG9rZW5zLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV07XG5cdCAgICBzd2l0Y2ggKHRva2VuKSB7XG4gICAgICAgICAgICBjYXNlICcoJzogLy8gbmV3IGNoaWxkcmVuXG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdHRyZWUuY2hpbGRyZW4gPSBbc3VidHJlZV07XG5cdFx0YW5jZXN0b3JzLnB1c2godHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcsJzogLy8gYW5vdGhlciBicmFuY2hcblx0XHRzdWJ0cmVlID0ge307XG5cdFx0YW5jZXN0b3JzW2FuY2VzdG9ycy5sZW5ndGgtMV0uY2hpbGRyZW4ucHVzaChzdWJ0cmVlKTtcblx0XHR0cmVlID0gc3VidHJlZTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJyknOiAvLyBvcHRpb25hbCBuYW1lIG5leHRcblx0XHR0cmVlID0gYW5jZXN0b3JzLnBvcCgpO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnOic6IC8vIG9wdGlvbmFsIGxlbmd0aCBuZXh0XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuXHRcdHZhciB4ID0gdG9rZW5zW2ktMV07XG5cdFx0aWYgKHggPT0gJyknIHx8IHggPT0gJygnIHx8IHggPT0gJywnKSB7XG5cdFx0ICAgIHRyZWUubmFtZSA9IHRva2VuO1xuXHRcdH1cblx0XHRlbHNlIGlmICh4ID09ICc6Jykge1xuXHRcdCAgICB2YXIgdGVzdF90eXBlID0gdHlwZW9mIHRva2VuO1xuXHRcdCAgICBpZighaXNOYU4odG9rZW4pKXtcblx0XHRcdHRyZWUuYnJhbmNoX2xlbmd0aCA9IHBhcnNlRmxvYXQodG9rZW4pO1xuXHRcdCAgICB9XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHggPT0gJz0nKXtcblx0XHQgICAgdmFyIHgyID0gdG9rZW5zW2ktMl07XG5cdFx0ICAgIHN3aXRjaCh4Mil7XG5cdFx0ICAgIGNhc2UgJ0QnOlxuXHRcdFx0dHJlZS5kdXBsaWNhdGlvbiA9IHRva2VuO1xuXHRcdFx0YnJlYWs7XG5cdFx0ICAgIGNhc2UgJ0cnOlxuXHRcdFx0dHJlZS5nZW5lX2lkID0gdG9rZW47XG5cdFx0XHRicmVhaztcblx0XHQgICAgY2FzZSAnVCc6XG5cdFx0XHR0cmVlLnRheG9uX2lkID0gdG9rZW47XG5cdFx0XHRicmVhaztcblx0XHQgICAgZGVmYXVsdCA6XG5cdFx0XHR0cmVlW3Rva2Vuc1tpLTJdXSA9IHRva2VuO1xuXHRcdCAgICB9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdCAgICB2YXIgdGVzdDtcblxuXHRcdH1cblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdHJlZTtcbiAgICB9XG59O1xuIiwidmFyIG5vZGUgPSByZXF1aXJlKFwiLi9zcmMvbm9kZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IG5vZGU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIi8vIHJlcXVpcmUoJ2ZzJykucmVhZGRpclN5bmMoX19kaXJuYW1lICsgJy8nKS5mb3JFYWNoKGZ1bmN0aW9uKGZpbGUpIHtcbi8vICAgICBpZiAoZmlsZS5tYXRjaCgvLitcXC5qcy9nKSAhPT0gbnVsbCAmJiBmaWxlICE9PSBfX2ZpbGVuYW1lKSB7XG4vLyBcdHZhciBuYW1lID0gZmlsZS5yZXBsYWNlKCcuanMnLCAnJyk7XG4vLyBcdG1vZHVsZS5leHBvcnRzW25hbWVdID0gcmVxdWlyZSgnLi8nICsgZmlsZSk7XG4vLyAgICAgfVxuLy8gfSk7XG5cbi8vIFNhbWUgYXNcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xudXRpbHMucmVkdWNlID0gcmVxdWlyZShcIi4vcmVkdWNlLmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdXRpbHM7XG4iLCJ2YXIgcmVkdWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzbW9vdGggPSA1O1xuICAgIHZhciB2YWx1ZSA9ICd2YWwnO1xuICAgIHZhciByZWR1bmRhbnQgPSBmdW5jdGlvbiAoYSwgYikge1xuXHRpZiAoYSA8IGIpIHtcblx0ICAgIHJldHVybiAoKGItYSkgPD0gKGIgKiAwLjIpKTtcblx0fVxuXHRyZXR1cm4gKChhLWIpIDw9IChhICogMC4yKSk7XG4gICAgfTtcbiAgICB2YXIgcGVyZm9ybV9yZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7cmV0dXJuIGFycjt9O1xuXG4gICAgdmFyIHJlZHVjZSA9IGZ1bmN0aW9uIChhcnIpIHtcblx0aWYgKCFhcnIubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhlZCA9IHBlcmZvcm1fc21vb3RoKGFycik7XG5cdHZhciByZWR1Y2VkICA9IHBlcmZvcm1fcmVkdWNlKHNtb290aGVkKTtcblx0cmV0dXJuIHJlZHVjZWQ7XG4gICAgfTtcblxuICAgIHZhciBtZWRpYW4gPSBmdW5jdGlvbiAodiwgYXJyKSB7XG5cdGFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG5cdCAgICByZXR1cm4gYVt2YWx1ZV0gLSBiW3ZhbHVlXTtcblx0fSk7XG5cdGlmIChhcnIubGVuZ3RoICUgMikge1xuXHQgICAgdlt2YWx1ZV0gPSBhcnJbfn4oYXJyLmxlbmd0aCAvIDIpXVt2YWx1ZV07XHQgICAgXG5cdH0gZWxzZSB7XG5cdCAgICB2YXIgbiA9IH5+KGFyci5sZW5ndGggLyAyKSAtIDE7XG5cdCAgICB2W3ZhbHVlXSA9IChhcnJbbl1bdmFsdWVdICsgYXJyW24rMV1bdmFsdWVdKSAvIDI7XG5cdH1cblxuXHRyZXR1cm4gdjtcbiAgICB9O1xuXG4gICAgdmFyIGNsb25lID0gZnVuY3Rpb24gKHNvdXJjZSkge1xuXHR2YXIgdGFyZ2V0ID0ge307XG5cdGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG5cdCAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KHByb3ApKSB7XG5cdFx0dGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0YXJnZXQ7XG4gICAgfTtcblxuICAgIHZhciBwZXJmb3JtX3Ntb290aCA9IGZ1bmN0aW9uIChhcnIpIHtcblx0aWYgKHNtb290aCA9PT0gMCkgeyAvLyBubyBzbW9vdGhcblx0ICAgIHJldHVybiBhcnI7XG5cdH1cblx0dmFyIHNtb290aF9hcnIgPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIGxvdyA9IChpIDwgc21vb3RoKSA/IDAgOiAoaSAtIHNtb290aCk7XG5cdCAgICB2YXIgaGlnaCA9IChpID4gKGFyci5sZW5ndGggLSBzbW9vdGgpKSA/IGFyci5sZW5ndGggOiAoaSArIHNtb290aCk7XG5cdCAgICBzbW9vdGhfYXJyW2ldID0gbWVkaWFuKGNsb25lKGFycltpXSksIGFyci5zbGljZShsb3csaGlnaCsxKSk7XG5cdH1cblx0cmV0dXJuIHNtb290aF9hcnI7XG4gICAgfTtcblxuICAgIHJlZHVjZS5yZWR1Y2VyID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gcGVyZm9ybV9yZWR1Y2U7XG5cdH1cblx0cGVyZm9ybV9yZWR1Y2UgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdW5kYW50ID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gcmVkdW5kYW50O1xuXHR9XG5cdHJlZHVuZGFudCA9IGNiYWs7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS52YWx1ZSA9IGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdmFsdWU7XG5cdH1cblx0dmFsdWUgPSB2YWw7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS5zbW9vdGggPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHNtb290aDtcblx0fVxuXHRzbW9vdGggPSB2YWw7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJldHVybiByZWR1Y2U7XG59O1xuXG52YXIgYmxvY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlZCA9IHJlZHVjZSgpXG5cdC52YWx1ZSgnc3RhcnQnKTtcblxuICAgIHZhciB2YWx1ZTIgPSAnZW5kJztcblxuICAgIHZhciBqb2luID0gZnVuY3Rpb24gKG9iajEsIG9iajIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdvYmplY3QnIDoge1xuICAgICAgICAgICAgICAgICdzdGFydCcgOiBvYmoxLm9iamVjdFtyZWQudmFsdWUoKV0sXG4gICAgICAgICAgICAgICAgJ2VuZCcgICA6IG9iajJbdmFsdWUyXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICd2YWx1ZScgIDogb2JqMlt2YWx1ZTJdXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIHZhciBqb2luID0gZnVuY3Rpb24gKG9iajEsIG9iajIpIHsgcmV0dXJuIG9iajEgfTtcblxuICAgIHJlZC5yZWR1Y2VyKCBmdW5jdGlvbiAoYXJyKSB7XG5cdHZhciB2YWx1ZSA9IHJlZC52YWx1ZSgpO1xuXHR2YXIgcmVkdW5kYW50ID0gcmVkLnJlZHVuZGFudCgpO1xuXHR2YXIgcmVkdWNlZF9hcnIgPSBbXTtcblx0dmFyIGN1cnIgPSB7XG5cdCAgICAnb2JqZWN0JyA6IGFyclswXSxcblx0ICAgICd2YWx1ZScgIDogYXJyWzBdW3ZhbHVlMl1cblx0fTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgaWYgKHJlZHVuZGFudCAoYXJyW2ldW3ZhbHVlXSwgY3Vyci52YWx1ZSkpIHtcblx0XHRjdXJyID0gam9pbihjdXJyLCBhcnJbaV0pO1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgcmVkdWNlZF9hcnIucHVzaCAoY3Vyci5vYmplY3QpO1xuXHQgICAgY3Vyci5vYmplY3QgPSBhcnJbaV07XG5cdCAgICBjdXJyLnZhbHVlID0gYXJyW2ldLmVuZDtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIub2JqZWN0KTtcblxuXHQvLyByZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmVkdWNlLmpvaW4gPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBqb2luO1xuXHR9XG5cdGpvaW4gPSBjYmFrO1xuXHRyZXR1cm4gcmVkO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUyID0gZnVuY3Rpb24gKGZpZWxkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlMjtcblx0fVxuXHR2YWx1ZTIgPSBmaWVsZDtcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJlZDtcbn07XG5cbnZhciBsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKTtcblxuICAgIHJlZC5yZWR1Y2VyICggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgcmVkdW5kYW50ID0gcmVkLnJlZHVuZGFudCgpO1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0gYXJyWzBdO1xuXHRmb3IgKHZhciBpPTE7IGk8YXJyLmxlbmd0aC0xOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnJbdmFsdWVdKSkge1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgcmVkdWNlZF9hcnIucHVzaCAoY3Vycik7XG5cdCAgICBjdXJyID0gYXJyW2ldO1xuXHR9XG5cdHJlZHVjZWRfYXJyLnB1c2goY3Vycik7XG5cdHJlZHVjZWRfYXJyLnB1c2goYXJyW2Fyci5sZW5ndGgtMV0pO1xuXHRyZXR1cm4gcmVkdWNlZF9hcnI7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVkO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjZTtcbm1vZHVsZS5leHBvcnRzLmxpbmUgPSBsaW5lO1xubW9kdWxlLmV4cG9ydHMuYmxvY2sgPSBibG9jaztcblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpdGVyYXRvciA6IGZ1bmN0aW9uKGluaXRfdmFsKSB7XG5cdHZhciBpID0gaW5pdF92YWwgfHwgMDtcblx0dmFyIGl0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gaSsrO1xuXHR9O1xuXHRyZXR1cm4gaXRlcjtcbiAgICB9LFxuXG4gICAgc2NyaXB0X3BhdGggOiBmdW5jdGlvbiAoc2NyaXB0X25hbWUpIHsgLy8gc2NyaXB0X25hbWUgaXMgdGhlIGZpbGVuYW1lXG5cdHZhciBzY3JpcHRfc2NhcGVkID0gc2NyaXB0X25hbWUucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG5cdHZhciBzY3JpcHRfcmUgPSBuZXcgUmVnRXhwKHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXHR2YXIgc2NyaXB0X3JlX3N1YiA9IG5ldyBSZWdFeHAoJyguKiknICsgc2NyaXB0X3NjYXBlZCArICckJyk7XG5cblx0Ly8gVE9ETzogVGhpcyByZXF1aXJlcyBwaGFudG9tLmpzIG9yIGEgc2ltaWxhciBoZWFkbGVzcyB3ZWJraXQgdG8gd29yayAoZG9jdW1lbnQpXG5cdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuXHR2YXIgcGF0aCA9IFwiXCI7ICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgcGF0aFxuXHRpZihzY3JpcHRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvcih2YXIgaSBpbiBzY3JpcHRzKSB7XG5cdFx0aWYoc2NyaXB0c1tpXS5zcmMgJiYgc2NyaXB0c1tpXS5zcmMubWF0Y2goc2NyaXB0X3JlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NyaXB0c1tpXS5zcmMucmVwbGFjZShzY3JpcHRfcmVfc3ViLCAnJDEnKTtcblx0XHR9XG4gICAgICAgICAgICB9XG5cdH1cblx0cmV0dXJuIHBhdGg7XG4gICAgfSxcblxuICAgIGRlZmVyX2NhbmNlbCA6IGZ1bmN0aW9uIChjYmFrLCB0aW1lKSB7XG5cdHZhciB0aWNrO1xuXG5cdHZhciBkZWZlcl9jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICBjbGVhclRpbWVvdXQodGljayk7XG5cdCAgICB0aWNrID0gc2V0VGltZW91dChjYmFrLCB0aW1lKTtcblx0fTtcblxuXHRyZXR1cm4gZGVmZXJfY2FuY2VsO1xuICAgIH1cbn07XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBpdGVyYXRvciA9IHJlcXVpcmUoXCJ0bnQudXRpbHNcIikuaXRlcmF0b3I7XG5cbnZhciB0bnRfbm9kZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4vL3RudC50cmVlLm5vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobm9kZSk7XG5cbiAgICAvLyBBUElcbi8vICAgICBub2RlLm5vZGVzID0gZnVuY3Rpb24oKSB7XG4vLyBcdGlmIChjbHVzdGVyID09PSB1bmRlZmluZWQpIHtcbi8vIFx0ICAgIGNsdXN0ZXIgPSBkMy5sYXlvdXQuY2x1c3RlcigpXG4vLyBcdCAgICAvLyBUT0RPOiBsZW5ndGggYW5kIGNoaWxkcmVuIHNob3VsZCBiZSBleHBvc2VkIGluIHRoZSBBUElcbi8vIFx0ICAgIC8vIGkuZS4gdGhlIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gY2hhbmdlIHRoaXMgZGVmYXVsdHMgdmlhIHRoZSBBUElcbi8vIFx0ICAgIC8vIGNoaWxkcmVuIGlzIHRoZSBkZWZhdWx0cyBmb3IgcGFyc2VfbmV3aWNrLCBidXQgbWF5YmUgd2Ugc2hvdWxkIGNoYW5nZSB0aGF0XG4vLyBcdCAgICAvLyBvciBhdCBsZWFzdCBub3QgYXNzdW1lIHRoaXMgaXMgYWx3YXlzIHRoZSBjYXNlIGZvciB0aGUgZGF0YSBwcm92aWRlZFxuLy8gXHRcdC52YWx1ZShmdW5jdGlvbihkKSB7cmV0dXJuIGQubGVuZ3RofSlcbi8vIFx0XHQuY2hpbGRyZW4oZnVuY3Rpb24oZCkge3JldHVybiBkLmNoaWxkcmVufSk7XG4vLyBcdH1cbi8vIFx0bm9kZXMgPSBjbHVzdGVyLm5vZGVzKGRhdGEpO1xuLy8gXHRyZXR1cm4gbm9kZXM7XG4vLyAgICAgfTtcblxuICAgIHZhciBhcHBseV90b19kYXRhID0gZnVuY3Rpb24gKGRhdGEsIGNiYWspIHtcblx0Y2JhayhkYXRhKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRhcHBseV90b19kYXRhKGRhdGEuY2hpbGRyZW5baV0sIGNiYWspO1xuXHQgICAgfVxuXHR9XG4gICAgfTtcblxuICAgIHZhciBjcmVhdGVfaWRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgaSA9IGl0ZXJhdG9yKDEpO1xuXHQvLyBXZSBjYW4ndCB1c2UgYXBwbHkgYmVjYXVzZSBhcHBseSBjcmVhdGVzIG5ldyB0cmVlcyBvbiBldmVyeSBub2RlXG5cdC8vIFdlIHNob3VsZCB1c2UgdGhlIGRpcmVjdCBkYXRhIGluc3RlYWRcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIGlmIChkLl9pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5faWQgPSBpKCk7XG5cdFx0Ly8gVE9ETzogTm90IHN1cmUgX2luU3ViVHJlZSBpcyBzdHJpY3RseSBuZWNlc3Nhcnlcblx0XHQvLyBkLl9pblN1YlRyZWUgPSB7cHJldjp0cnVlLCBjdXJyOnRydWV9O1xuXHQgICAgfVxuXHR9KTtcbiAgICB9O1xuXG4gICAgdmFyIGxpbmtfcGFyZW50cyA9IGZ1bmN0aW9uIChkYXRhKSB7XG5cdGlmIChkYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIC8vIF9wYXJlbnQ/XG5cdCAgICBkYXRhLmNoaWxkcmVuW2ldLl9wYXJlbnQgPSBkYXRhO1xuXHQgICAgbGlua19wYXJlbnRzKGRhdGEuY2hpbGRyZW5baV0pO1xuXHR9XG4gICAgfTtcblxuICAgIHZhciBjb21wdXRlX3Jvb3RfZGlzdHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRhcHBseV90b19kYXRhIChkYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgdmFyIGw7XG5cdCAgICBpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0XHRkLl9yb290X2Rpc3QgPSAwO1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgbCA9IDA7XG5cdFx0aWYgKGQuYnJhbmNoX2xlbmd0aCkge1xuXHRcdCAgICBsID0gZC5icmFuY2hfbGVuZ3RoXG5cdFx0fVxuXHRcdGQuX3Jvb3RfZGlzdCA9IGwgKyBkLl9wYXJlbnQuX3Jvb3RfZGlzdDtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIC8vIFRPRE86IGRhdGEgY2FuJ3QgYmUgcmV3cml0dGVuIHVzZWQgdGhlIGFwaSB5ZXQuIFdlIG5lZWQgZmluYWxpemVyc1xuICAgIG5vZGUuZGF0YSA9IGZ1bmN0aW9uKG5ld19kYXRhKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGRhdGFcblx0fVxuXHRkYXRhID0gbmV3X2RhdGE7XG5cdGNyZWF0ZV9pZHMoKTtcblx0bGlua19wYXJlbnRzKGRhdGEpO1xuXHRjb21wdXRlX3Jvb3RfZGlzdHMoZGF0YSk7XG5cdHJldHVybiBub2RlO1xuICAgIH07XG4gICAgLy8gV2UgYmluZCB0aGUgZGF0YSB0aGF0IGhhcyBiZWVuIHBhc3NlZFxuICAgIG5vZGUuZGF0YShkYXRhKTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX2FsbCcsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikpIHtcblx0XHRub2Rlcy5wdXNoIChuKTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcbiAgICBcbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlJywgZnVuY3Rpb24gKGNiYWssIGRlZXApIHtcblx0aWYgKGNiYWsobm9kZSkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2pdKS5maW5kX25vZGUoY2JhaywgZGVlcCk7XG5cdFx0aWYgKGZvdW5kKSB7XG5cdFx0ICAgIHJldHVybiBmb3VuZDtcblx0XHR9XG5cdCAgICB9XG5cdH1cblxuXHRpZiAoZGVlcCAmJiAoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2ldKS5maW5kX25vZGUoY2JhaywgZGVlcClcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlX2J5X25hbWUnLCBmdW5jdGlvbihuYW1lLCBkZWVwKSB7XG5cdHJldHVybiBub2RlLmZpbmRfbm9kZSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHJldHVybiBub2RlLm5vZGVfbmFtZSgpID09PSBuYW1lXG5cdH0sIGRlZXApO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3RvZ2dsZScsIGZ1bmN0aW9uKCkge1xuXHRpZiAoZGF0YSkge1xuXHQgICAgaWYgKGRhdGEuY2hpbGRyZW4pIHsgLy8gVW5jb2xsYXBzZWQgLT4gY29sbGFwc2Vcblx0XHR2YXIgaGlkZGVuID0gMDtcblx0XHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHRcdCAgICB2YXIgaGlkZGVuX2hlcmUgPSBuLm5faGlkZGVuKCkgfHwgMDtcblx0XHQgICAgaGlkZGVuICs9IChuLm5faGlkZGVuKCkgfHwgMCkgKyAxO1xuXHRcdH0pO1xuXHRcdG5vZGUubl9oaWRkZW4gKGhpZGRlbi0xKTtcblx0XHRkYXRhLl9jaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW47XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IHVuZGVmaW5lZDtcblx0ICAgIH0gZWxzZSB7ICAgICAgICAgICAgIC8vIENvbGxhcHNlZCAtPiB1bmNvbGxhcHNlXG5cdFx0bm9kZS5uX2hpZGRlbigwKTtcblx0XHRkYXRhLmNoaWxkcmVuID0gZGF0YS5fY2hpbGRyZW47XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfY29sbGFwc2VkJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQgJiYgZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIHZhciBoYXNfYW5jZXN0b3IgPSBmdW5jdGlvbihuLCBhbmNlc3Rvcikge1xuXHQvLyBJdCBpcyBiZXR0ZXIgdG8gd29yayBhdCB0aGUgZGF0YSBsZXZlbFxuXHRuID0gbi5kYXRhKCk7XG5cdGFuY2VzdG9yID0gYW5jZXN0b3IuZGF0YSgpO1xuXHRpZiAobi5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiBmYWxzZVxuXHR9XG5cdG4gPSBuLl9wYXJlbnRcblx0Zm9yICg7Oykge1xuXHQgICAgaWYgKG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cblx0ICAgIGlmIChuID09PSBhbmNlc3Rvcikge1xuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgbiA9IG4uX3BhcmVudDtcblx0fVxuICAgIH07XG5cbiAgICAvLyBUaGlzIGlzIHRoZSBlYXNpZXN0IHdheSB0byBjYWxjdWxhdGUgdGhlIExDQSBJIGNhbiB0aGluayBvZi4gQnV0IGl0IGlzIHZlcnkgaW5lZmZpY2llbnQgdG9vLlxuICAgIC8vIEl0IGlzIHdvcmtpbmcgZmluZSBieSBub3csIGJ1dCBpbiBjYXNlIGl0IG5lZWRzIHRvIGJlIG1vcmUgcGVyZm9ybWFudCB3ZSBjYW4gaW1wbGVtZW50IHRoZSBMQ0FcbiAgICAvLyBhbGdvcml0aG0gZXhwbGFpbmVkIGhlcmU6XG4gICAgLy8gaHR0cDovL2NvbW11bml0eS50b3Bjb2Rlci5jb20vdGM/bW9kdWxlPVN0YXRpYyZkMT10dXRvcmlhbHMmZDI9bG93ZXN0Q29tbW9uQW5jZXN0b3JcbiAgICBhcGkubWV0aG9kICgnbGNhJywgZnVuY3Rpb24gKG5vZGVzKSB7XG5cdGlmIChub2Rlcy5sZW5ndGggPT09IDEpIHtcblx0ICAgIHJldHVybiBub2Rlc1swXTtcblx0fVxuXHR2YXIgbGNhX25vZGUgPSBub2Rlc1swXTtcblx0Zm9yICh2YXIgaSA9IDE7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIGxjYV9ub2RlID0gX2xjYShsY2Ffbm9kZSwgbm9kZXNbaV0pO1xuXHR9XG5cdHJldHVybiBsY2Ffbm9kZTtcblx0Ly8gcmV0dXJuIHRudF9ub2RlKGxjYV9ub2RlKTtcbiAgICB9KTtcblxuICAgIHZhciBfbGNhID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XG5cdGlmIChub2RlMS5kYXRhKCkgPT09IG5vZGUyLmRhdGEoKSkge1xuXHQgICAgcmV0dXJuIG5vZGUxO1xuXHR9XG5cdGlmIChoYXNfYW5jZXN0b3Iobm9kZTEsIG5vZGUyKSkge1xuXHQgICAgcmV0dXJuIG5vZGUyO1xuXHR9XG5cdHJldHVybiBfbGNhKG5vZGUxLCBub2RlMi5wYXJlbnQoKSk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QoJ25faGlkZGVuJywgZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBub2RlLnByb3BlcnR5KCdfaGlkZGVuJyk7XG5cdH1cblx0bm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicsIHZhbCk7XG5cdHJldHVybiBub2RlXG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZ2V0X2FsbF9ub2RlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBub2Rlcy5wdXNoKG4pO1xuXHR9LCBkZWVwKTtcblx0cmV0dXJuIG5vZGVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbGVhdmVzJywgZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIGxlYXZlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAobi5pc19sZWFmKGRlZXApKSB7XG5cdFx0bGVhdmVzLnB1c2gobik7XG5cdCAgICB9XG5cdH0sIGRlZXApO1xuXHRyZXR1cm4gbGVhdmVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Vwc3RyZWFtJywgZnVuY3Rpb24oY2Jhaykge1xuXHRjYmFrKG5vZGUpO1xuXHR2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnQoKTtcblx0aWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBwYXJlbnQudXBzdHJlYW0oY2Jhayk7XG5cdH1cbi8vXHR0bnRfbm9kZShwYXJlbnQpLnVwc3RyZWFtKGNiYWspO1xuLy8gXHRub2RlLnVwc3RyZWFtKG5vZGUuX3BhcmVudCwgY2Jhayk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnc3VidHJlZScsIGZ1bmN0aW9uKG5vZGVzLCBrZWVwX3NpbmdsZXRvbnMpIHtcblx0aWYgKGtlZXBfc2luZ2xldG9ucyA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBrZWVwX3NpbmdsZXRvbnMgPSBmYWxzZTtcblx0fVxuICAgIFx0dmFyIG5vZGVfY291bnRzID0ge307XG4gICAgXHRmb3IgKHZhciBpPTA7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBuID0gbm9kZXNbaV07XG5cdCAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0bi51cHN0cmVhbSAoZnVuY3Rpb24gKHRoaXNfbm9kZSl7XG5cdFx0ICAgIHZhciBpZCA9IHRoaXNfbm9kZS5pZCgpO1xuXHRcdCAgICBpZiAobm9kZV9jb3VudHNbaWRdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdG5vZGVfY291bnRzW2lkXSA9IDA7XG5cdFx0ICAgIH1cblx0XHQgICAgbm9kZV9jb3VudHNbaWRdKytcbiAgICBcdFx0fSk7XG5cdCAgICB9XG4gICAgXHR9XG4gICAgXG5cdHZhciBpc19zaW5nbGV0b24gPSBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbl9jaGlsZHJlbiA9IDA7XG5cdCAgICBpZiAobm9kZV9kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bm9kZV9kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGlkID0gbm9kZV9kYXRhLmNoaWxkcmVuW2ldLl9pZDtcblx0XHRpZiAobm9kZV9jb3VudHNbaWRdID4gMCkge1xuXHRcdCAgICBuX2NoaWxkcmVuKys7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG5fY2hpbGRyZW4gPT09IDE7XG5cdH07XG5cblx0dmFyIHN1YnRyZWUgPSB7fTtcblx0Y29weV9kYXRhIChkYXRhLCBzdWJ0cmVlLCAwLCBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbm9kZV9pZCA9IG5vZGVfZGF0YS5faWQ7XG5cdCAgICB2YXIgY291bnRzID0gbm9kZV9jb3VudHNbbm9kZV9pZF07XG5cdCAgICBcblx0ICAgIC8vIElzIGluIHBhdGhcblx0ICAgIGlmIChjb3VudHMgPiAwKSB7XG5cdFx0aWYgKGlzX3NpbmdsZXRvbihub2RlX2RhdGEpICYmICFrZWVwX3NpbmdsZXRvbnMpIHtcblx0XHQgICAgcmV0dXJuIGZhbHNlOyBcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdCAgICB9XG5cdCAgICAvLyBJcyBub3QgaW4gcGF0aFxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9KTtcblxuXHRyZXR1cm4gdG50X25vZGUoc3VidHJlZS5jaGlsZHJlblswXSk7XG4gICAgfSk7XG5cbiAgICB2YXIgY29weV9kYXRhID0gZnVuY3Rpb24gKG9yaWdfZGF0YSwgc3VidHJlZSwgY3VyckJyYW5jaExlbmd0aCwgY29uZGl0aW9uKSB7XG4gICAgICAgIGlmIChvcmlnX2RhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmRpdGlvbihvcmlnX2RhdGEpKSB7XG5cdCAgICB2YXIgY29weSA9IGNvcHlfbm9kZShvcmlnX2RhdGEsIGN1cnJCcmFuY2hMZW5ndGgpO1xuXHQgICAgaWYgKHN1YnRyZWUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN1YnRyZWUuY2hpbGRyZW4gPSBbXTtcblx0ICAgIH1cblx0ICAgIHN1YnRyZWUuY2hpbGRyZW4ucHVzaChjb3B5KTtcblx0ICAgIGlmIChvcmlnX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZ19kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29weV9kYXRhIChvcmlnX2RhdGEuY2hpbGRyZW5baV0sIGNvcHksIDAsIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH0gZWxzZSB7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBjdXJyQnJhbmNoTGVuZ3RoICs9IG9yaWdfZGF0YS5icmFuY2hfbGVuZ3RoIHx8IDA7XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YShvcmlnX2RhdGEuY2hpbGRyZW5baV0sIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGNvcHlfbm9kZSA9IGZ1bmN0aW9uIChub2RlX2RhdGEsIGV4dHJhQnJhbmNoTGVuZ3RoKSB7XG5cdHZhciBjb3B5ID0ge307XG5cdC8vIGNvcHkgYWxsIHRoZSBvd24gcHJvcGVydGllcyBleGNlcHRzIGxpbmtzIHRvIG90aGVyIG5vZGVzIG9yIGRlcHRoXG5cdGZvciAodmFyIHBhcmFtIGluIG5vZGVfZGF0YSkge1xuXHQgICAgaWYgKChwYXJhbSA9PT0gXCJjaGlsZHJlblwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJfY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX3BhcmVudFwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJkZXB0aFwiKSkge1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgaWYgKG5vZGVfZGF0YS5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHtcblx0XHRjb3B5W3BhcmFtXSA9IG5vZGVfZGF0YVtwYXJhbV07XG5cdCAgICB9XG5cdH1cblx0aWYgKChjb3B5LmJyYW5jaF9sZW5ndGggIT09IHVuZGVmaW5lZCkgJiYgKGV4dHJhQnJhbmNoTGVuZ3RoICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBjb3B5LmJyYW5jaF9sZW5ndGggKz0gZXh0cmFCcmFuY2hMZW5ndGg7XG5cdH1cblx0cmV0dXJuIGNvcHk7XG4gICAgfTtcblxuICAgIFxuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIHZpc2l0cyBhbGwgdGhlIG5vZGVzXG4gICAgLy8gYSBtb3JlIHBlcmZvcm1hbnQgdmVyc2lvbiBzaG91bGQgcmV0dXJuIHRydWVcbiAgICAvLyB0aGUgZmlyc3QgdGltZSBjYmFrKG5vZGUpIGlzIHRydWVcbiAgICBhcGkubWV0aG9kICgncHJlc2VudCcsIGZ1bmN0aW9uIChjYmFrKSB7XG5cdC8vIGNiYWsgc2hvdWxkIHJldHVybiB0cnVlL2ZhbHNlXG5cdHZhciBpc190cnVlID0gZmFsc2U7XG5cdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAoY2JhayhuKSA9PT0gdHJ1ZSkge1xuXHRcdGlzX3RydWUgPSB0cnVlO1xuXHQgICAgfVxuXHR9KTtcblx0cmV0dXJuIGlzX3RydWU7XG4gICAgfSk7XG5cbiAgICAvLyBjYmFrIGlzIGNhbGxlZCB3aXRoIHR3byBub2Rlc1xuICAgIC8vIGFuZCBzaG91bGQgcmV0dXJuIGEgbmVnYXRpdmUgbnVtYmVyLCAwIG9yIGEgcG9zaXRpdmUgbnVtYmVyXG4gICAgYXBpLm1ldGhvZCAoJ3NvcnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHR2YXIgbmV3X2NoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBuZXdfY2hpbGRyZW4ucHVzaCh0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKSk7XG5cdH1cblxuXHRuZXdfY2hpbGRyZW4uc29ydChjYmFrKTtcblxuXHRkYXRhLmNoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxuZXdfY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIGRhdGEuY2hpbGRyZW4ucHVzaChuZXdfY2hpbGRyZW5baV0uZGF0YSgpKTtcblx0fVxuXG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKS5zb3J0KGNiYWspO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmxhdHRlbicsIGZ1bmN0aW9uICgpIHtcblx0aWYgKG5vZGUuaXNfbGVhZigpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXHR2YXIgZGF0YSA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgbmV3cm9vdCA9IGNvcHlfbm9kZShkYXRhKTtcblx0dmFyIGxlYXZlcyA9IG5vZGUuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0bmV3cm9vdC5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBuZXdyb290LmNoaWxkcmVuLnB1c2goY29weV9ub2RlKGxlYXZlc1tpXS5kYXRhKCkpKTtcblx0fVxuXG5cdHJldHVybiB0bnRfbm9kZShuZXdyb290KTtcbiAgICB9KTtcblxuICAgIFxuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIG9ubHkgJ2FwcGx5J3MgdG8gbm9uIGNvbGxhcHNlZCBub2RlcyAoaWUgLl9jaGlsZHJlbiBpcyBub3QgdmlzaXRlZClcbiAgICAvLyBXb3VsZCBpdCBiZSBiZXR0ZXIgdG8gaGF2ZSBhbiBleHRyYSBmbGFnICh0cnVlL2ZhbHNlKSB0byB2aXNpdCBhbHNvIGNvbGxhcHNlZCBub2Rlcz9cbiAgICBhcGkubWV0aG9kICgnYXBwbHknLCBmdW5jdGlvbihjYmFrLCBkZWVwKSB7XG5cdGlmIChkZWVwID09PSB1bmRlZmluZWQpIHtcblx0ICAgIGRlZXAgPSBmYWxzZTtcblx0fVxuXHRjYmFrKG5vZGUpO1xuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBuID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSlcblx0XHRuLmFwcGx5KGNiYWssIGRlZXApO1xuXHQgICAgfVxuXHR9XG5cblx0aWYgKChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKTtcblx0XHRuLmFwcGx5KGNiYWssIGRlZXApO1xuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdmlhIGEgY2FsbGJhY2s6XG4gICAgLy8gcm9vdC5wcm9wZXJ0eSAoZnVuY3Rpb24gKG5vZGUsIHZhbCkge1xuICAgIC8vICAgIG5vZGUuZGVlcGVyLmZpZWxkID0gdmFsXG4gICAgLy8gfSwgJ25ld192YWx1ZScpXG4gICAgYXBpLm1ldGhvZCAoJ3Byb3BlcnR5JywgZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcblx0ICAgIGlmICgodHlwZW9mIHByb3ApID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0cmV0dXJuIHByb3AoZGF0YSlcdFxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGRhdGFbcHJvcF1cblx0fVxuXHRpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcHJvcChkYXRhLCB2YWx1ZSk7ICAgXG5cdH1cblx0ZGF0YVtwcm9wXSA9IHZhbHVlO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdpc19sZWFmJywgZnVuY3Rpb24oZGVlcCkge1xuXHRpZiAoZGVlcCkge1xuXHQgICAgcmV0dXJuICgoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSAmJiAoZGF0YS5fY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkpO1xuXHR9XG5cdHJldHVybiBkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQ7XG4gICAgfSk7XG5cbiAgICAvLyBJdCBsb29rcyBsaWtlIHRoZSBjbHVzdGVyIGNhbid0IGJlIHVzZWQgZm9yIGFueXRoaW5nIHVzZWZ1bCBoZXJlXG4gICAgLy8gSXQgaXMgbm93IGluY2x1ZGVkIGFzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byB0aGUgdG50LnRyZWUoKSBtZXRob2QgY2FsbFxuICAgIC8vIHNvIEknbSBjb21tZW50aW5nIHRoZSBnZXR0ZXJcbiAgICAvLyBub2RlLmNsdXN0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBcdHJldHVybiBjbHVzdGVyO1xuICAgIC8vIH07XG5cbiAgICAvLyBub2RlLmRlcHRoID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAvLyAgICAgcmV0dXJuIG5vZGUuZGVwdGg7XG4gICAgLy8gfTtcblxuLy8gICAgIG5vZGUubmFtZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4vLyAgICAgICAgIHJldHVybiBub2RlLm5hbWU7XG4vLyAgICAgfTtcblxuICAgIGFwaS5tZXRob2QgKCdpZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ19pZCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ25vZGVfbmFtZScsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ25hbWUnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdicmFuY2hfbGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnYnJhbmNoX2xlbmd0aCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Jvb3RfZGlzdCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ19yb290X2Rpc3QnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdjaGlsZHJlbicsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBjaGlsZHJlbiA9IFtdO1xuXG5cdGlmIChkYXRhLmNoaWxkcmVuKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoZGF0YS5fY2hpbGRyZW4pICYmIGRlZXApIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5fY2hpbGRyZW5bal0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiBjaGlsZHJlbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gdG50X25vZGUoZGF0YS5fcGFyZW50KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBub2RlO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfbm9kZTtcblxuIiwidmFyIGFwaWpzID0gcmVxdWlyZSgndG50LmFwaScpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5kaWFnb25hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZCA9IGZ1bmN0aW9uIChkaWFnb25hbFBhdGgpIHtcblx0dmFyIHNvdXJjZSA9IGRpYWdvbmFsUGF0aC5zb3VyY2U7XG4gICAgICAgIHZhciB0YXJnZXQgPSBkaWFnb25hbFBhdGgudGFyZ2V0O1xuICAgICAgICB2YXIgbWlkcG9pbnRYID0gKHNvdXJjZS54ICsgdGFyZ2V0LngpIC8gMjtcbiAgICAgICAgdmFyIG1pZHBvaW50WSA9IChzb3VyY2UueSArIHRhcmdldC55KSAvIDI7XG4gICAgICAgIHZhciBwYXRoRGF0YSA9IFtzb3VyY2UsIHt4OiB0YXJnZXQueCwgeTogc291cmNlLnl9LCB0YXJnZXRdO1xuXHRwYXRoRGF0YSA9IHBhdGhEYXRhLm1hcChkLnByb2plY3Rpb24oKSk7XG5cdHJldHVybiBkLnBhdGgoKShwYXRoRGF0YSwgcmFkaWFsX2NhbGMuY2FsbCh0aGlzLHBhdGhEYXRhKSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChkKVxuXHQuZ2V0c2V0ICgncHJvamVjdGlvbicpXG5cdC5nZXRzZXQgKCdwYXRoJylcbiAgICBcbiAgICB2YXIgY29vcmRpbmF0ZVRvQW5nbGUgPSBmdW5jdGlvbiAoY29vcmQsIHJhZGl1cykge1xuICAgICAgXHR2YXIgd2hvbGVBbmdsZSA9IDIgKiBNYXRoLlBJLFxuICAgICAgICBxdWFydGVyQW5nbGUgPSB3aG9sZUFuZ2xlIC8gNFxuXHRcbiAgICAgIFx0dmFyIGNvb3JkUXVhZCA9IGNvb3JkWzBdID49IDAgPyAoY29vcmRbMV0gPj0gMCA/IDEgOiAyKSA6IChjb29yZFsxXSA+PSAwID8gNCA6IDMpLFxuICAgICAgICBjb29yZEJhc2VBbmdsZSA9IE1hdGguYWJzKE1hdGguYXNpbihjb29yZFsxXSAvIHJhZGl1cykpXG5cdFxuICAgICAgXHQvLyBTaW5jZSB0aGlzIGlzIGp1c3QgYmFzZWQgb24gdGhlIGFuZ2xlIG9mIHRoZSByaWdodCB0cmlhbmdsZSBmb3JtZWRcbiAgICAgIFx0Ly8gYnkgdGhlIGNvb3JkaW5hdGUgYW5kIHRoZSBvcmlnaW4sIGVhY2ggcXVhZCB3aWxsIGhhdmUgZGlmZmVyZW50IFxuICAgICAgXHQvLyBvZmZzZXRzXG4gICAgICBcdHZhciBjb29yZEFuZ2xlO1xuICAgICAgXHRzd2l0Y2ggKGNvb3JkUXVhZCkge1xuICAgICAgXHRjYXNlIDE6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gcXVhcnRlckFuZ2xlIC0gY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgMjpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSBxdWFydGVyQW5nbGUgKyBjb29yZEJhc2VBbmdsZVxuICAgICAgXHQgICAgYnJlYWtcbiAgICAgIFx0Y2FzZSAzOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IDIqcXVhcnRlckFuZ2xlICsgcXVhcnRlckFuZ2xlIC0gY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgNDpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSAzKnF1YXJ0ZXJBbmdsZSArIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdH1cbiAgICAgIFx0cmV0dXJuIGNvb3JkQW5nbGVcbiAgICB9O1xuXG4gICAgdmFyIHJhZGlhbF9jYWxjID0gZnVuY3Rpb24gKHBhdGhEYXRhKSB7XG5cdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcblx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSBNYXRoLnNxcnQoc3JjWzBdKnNyY1swXSArIHNyY1sxXSpzcmNbMV0pO1xuXHR2YXIgc3JjQW5nbGUgPSBjb29yZGluYXRlVG9BbmdsZShzcmMsIHJhZGl1cyk7XG5cdHZhciBtaWRBbmdsZSA9IGNvb3JkaW5hdGVUb0FuZ2xlKG1pZCwgcmFkaXVzKTtcblx0dmFyIGNsb2Nrd2lzZSA9IE1hdGguYWJzKG1pZEFuZ2xlIC0gc3JjQW5nbGUpID4gTWF0aC5QSSA/IG1pZEFuZ2xlIDw9IHNyY0FuZ2xlIDogbWlkQW5nbGUgPiBzcmNBbmdsZTtcblx0cmV0dXJuIHtcblx0ICAgIHJhZGl1cyAgIDogcmFkaXVzLFxuXHQgICAgY2xvY2t3aXNlIDogY2xvY2t3aXNlXG5cdH07XG4gICAgfTtcblxuICAgIHJldHVybiBkO1xufTtcblxuLy8gdmVydGljYWwgZGlhZ29uYWwgZm9yIHJlY3QgYnJhbmNoZXNcbnRyZWUuZGlhZ29uYWwudmVydGljYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSBmdW5jdGlvbihwYXRoRGF0YSwgb2JqKSB7XG5cdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcblx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSAyMDAwMDA7IC8vIE51bWJlciBsb25nIGVub3VnaFxuXG5cdHJldHVybiBcIk1cIiArIHNyYyArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgbWlkICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDsgXG5cdFxuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGZ1bmN0aW9uKGQpIHsgXG5cdHJldHVybiBbZC55LCBkLnhdO1xuICAgIH1cblxuICAgIHJldHVybiB0cmVlLmRpYWdvbmFsKClcbiAgICAgIFx0LnBhdGgocGF0aClcbiAgICAgIFx0LnByb2plY3Rpb24ocHJvamVjdGlvbik7XG59O1xuXG50cmVlLmRpYWdvbmFsLnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGF0aCA9IGZ1bmN0aW9uKHBhdGhEYXRhLCBvYmopIHtcbiAgICAgIFx0dmFyIHNyYyA9IHBhdGhEYXRhWzBdO1xuICAgICAgXHR2YXIgbWlkID0gcGF0aERhdGFbMV07XG4gICAgICBcdHZhciBkc3QgPSBwYXRoRGF0YVsyXTtcblx0dmFyIHJhZGl1cyA9IG9iai5yYWRpdXM7XG5cdHZhciBjbG9ja3dpc2UgPSBvYmouY2xvY2t3aXNlO1xuXG5cdGlmIChjbG9ja3dpc2UpIHtcblx0ICAgIHJldHVybiBcIk1cIiArIHNyYyArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgbWlkICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDsgXG5cdH0gZWxzZSB7XG5cdCAgICByZXR1cm4gXCJNXCIgKyBtaWQgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIHNyYyArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7XG5cdH1cblxuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIFx0dmFyIHIgPSBkLnksIGEgPSAoZC54IC0gOTApIC8gMTgwICogTWF0aC5QSTtcbiAgICAgIFx0cmV0dXJuIFtyICogTWF0aC5jb3MoYSksIHIgKiBNYXRoLnNpbihhKV07XG4gICAgfTtcblxuICAgIHJldHVybiB0cmVlLmRpYWdvbmFsKClcbiAgICAgIFx0LnBhdGgocGF0aClcbiAgICAgIFx0LnByb2plY3Rpb24ocHJvamVjdGlvbilcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUuZGlhZ29uYWw7XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUgKFwiLi90cmVlLmpzXCIpO1xudHJlZS5sYWJlbCA9IHJlcXVpcmUoXCIuL2xhYmVsLmpzXCIpO1xudHJlZS5kaWFnb25hbCA9IHJlcXVpcmUoXCIuL2RpYWdvbmFsLmpzXCIpO1xudHJlZS5sYXlvdXQgPSByZXF1aXJlKFwiLi9sYXlvdXQuanNcIik7XG50cmVlLm5vZGVfZGlzcGxheSA9IHJlcXVpcmUoXCIuL25vZGVfZGlzcGxheS5qc1wiKTtcbi8vIHRyZWUubm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuLy8gdHJlZS5wYXJzZV9uZXdpY2sgPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uZXdpY2s7XG4vLyB0cmVlLnBhcnNlX25oeCA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25oeDtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZTtcblxuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxhYmVsID0gZnVuY3Rpb24gKCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiB3ZSBzaG91bGQgYmUgcmVtb3ZpbmcgYnkgZGVmYXVsdCBwcmV2IGxhYmVsc1xuICAgIC8vIG9yIGl0IHdvdWxkIGJlIGJldHRlciB0byBoYXZlIGEgc2VwYXJhdGUgcmVtb3ZlIG1ldGhvZCBjYWxsZWQgYnkgdGhlIHZpc1xuICAgIC8vIG9uIHVwZGF0ZVxuICAgIC8vIFdlIGFsc28gaGF2ZSB0aGUgcHJvYmxlbSB0aGF0IHdlIG1heSBiZSB0cmFuc2l0aW9uaW5nIGZyb21cbiAgICAvLyB0ZXh0IHRvIGltZyBsYWJlbHMgYW5kIHdlIG5lZWQgdG8gcmVtb3ZlIHRoZSBsYWJlbCBvZiBhIGRpZmZlcmVudCB0eXBlXG4gICAgdmFyIGxhYmVsID0gZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlLCBub2RlX3NpemUpIHtcblx0aWYgKHR5cGVvZiAobm9kZSkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93KG5vZGUpO1xuICAgICAgICB9XG5cblx0bGFiZWwuZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSwgbGF5b3V0X3R5cGUpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGFiZWxcIilcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0dmFyIHQgPSBsYWJlbC50cmFuc2Zvcm0oKShub2RlLCBsYXlvdXRfdHlwZSk7XG5cdFx0cmV0dXJuIFwidHJhbnNsYXRlIChcIiArICh0LnRyYW5zbGF0ZVswXSArIG5vZGVfc2l6ZSkgKyBcIiBcIiArIHQudHJhbnNsYXRlWzFdICsgXCIpcm90YXRlKFwiICsgdC5yb3RhdGUgKyBcIilcIjtcblx0ICAgIH0pXG5cdC8vIFRPRE86IHRoaXMgY2xpY2sgZXZlbnQgaXMgcHJvYmFibHkgbmV2ZXIgZmlyZWQgc2luY2UgdGhlcmUgaXMgYW4gb25jbGljayBldmVudCBpbiB0aGUgbm9kZSBnIGVsZW1lbnQ/XG5cdCAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbigpe1xuXHRcdGlmIChsYWJlbC5vbl9jbGljaygpICE9PSB1bmRlZmluZWQpIHtcblx0XHQgICAgZDMuZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0ICAgIGxhYmVsLm9uX2NsaWNrKCkuY2FsbCh0aGlzLCBub2RlKTtcblx0XHR9XG5cdCAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblx0LmdldHNldCAoJ3dpZHRoJywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSB3aWR0aCBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIGhlaWdodCBjYWxsYmFja1wiIH0pXG5cdC5nZXRzZXQgKCdkaXNwbGF5JywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSBkaXNwbGF5IGNhbGxiYWNrXCIgfSlcblx0LmdldHNldCAoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgdHJhbnNmb3JtIGNhbGxiYWNrXCIgfSlcblx0LmdldHNldCAoJ29uX2NsaWNrJyk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBUZXh0IGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC50ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbCA9IHRyZWUubGFiZWwoKTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cdC5nZXRzZXQgKCdmb250c2l6ZScsIDEwKVxuXHQuZ2V0c2V0ICgnY29sb3InLCBcIiMwMDBcIilcblx0LmdldHNldCAoJ3RleHQnLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgcmV0dXJuIGQuZGF0YSgpLm5hbWU7XG5cdH0pXG5cbiAgICBsYWJlbC5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGwgPSBkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGxheW91dF90eXBlID09PSBcInJhZGlhbFwiKSB7XG5cdFx0ICAgIHJldHVybiAoZC54JTM2MCA8IDE4MCkgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xuXHRcdH1cblx0XHRyZXR1cm4gXCJzdGFydFwiO1xuXHQgICAgfSlcblx0ICAgIC50ZXh0KGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIGxhYmVsLnRleHQoKShub2RlKVxuXHQgICAgfSlcblx0ICAgIC5zdHlsZSgnZm9udC1zaXplJywgbGFiZWwuZm9udHNpemUoKSArIFwicHhcIilcblx0ICAgIC5zdHlsZSgnZmlsbCcsIGQzLmZ1bmN0b3IobGFiZWwuY29sb3IoKSkobm9kZSkpO1xuXG5cdHJldHVybiBsO1xuICAgIH0pO1xuXG4gICAgbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcblx0dmFyIGQgPSBub2RlLmRhdGEoKTtcblx0dmFyIHQgPSB7XG5cdCAgICB0cmFuc2xhdGUgOiBbNSwgNV0sXG5cdCAgICByb3RhdGUgOiAwXG5cdH07XG5cdGlmIChsYXlvdXRfdHlwZSA9PT0gXCJyYWRpYWxcIikge1xuXHQgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSAtIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmZvbnRzaXplKCkpXG5cdCAgICB0LnJvdGF0ZSA9IChkLnglMzYwIDwgMTgwID8gMCA6IDE4MClcblx0fVxuXHRyZXR1cm4gdDtcbiAgICB9KTtcblxuXG4gICAgLy8gbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSkge1xuICAgIC8vIFx0dmFyIGQgPSBub2RlLmRhdGEoKTtcbiAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZSgxMCA1KXJvdGF0ZShcIiArIChkLnglMzYwIDwgMTgwID8gMCA6IDE4MCkgKyBcIilcIjtcbiAgICAvLyB9KTtcblxuICAgIGxhYmVsLndpZHRoIChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgc3ZnID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuXHQgICAgLmFwcGVuZChcInN2Z1wiKVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgMClcblx0ICAgIC5zdHlsZSgndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcblxuXHR2YXIgdGV4dCA9IHN2Z1xuXHQgICAgLmFwcGVuZChcInRleHRcIilcblx0ICAgIC5zdHlsZSgnZm9udC1zaXplJywgbGFiZWwuZm9udHNpemUoKSArIFwicHhcIilcblx0ICAgIC50ZXh0KGxhYmVsLnRleHQoKShub2RlKSk7XG5cblx0dmFyIHdpZHRoID0gdGV4dC5ub2RlKCkuZ2V0QkJveCgpLndpZHRoO1xuXHRzdmcucmVtb3ZlKCk7XG5cblx0cmV0dXJuIHdpZHRoO1xuICAgIH0pO1xuXG4gICAgbGFiZWwuaGVpZ2h0IChmdW5jdGlvbiAobm9kZSkge1xuXHRyZXR1cm4gbGFiZWwuZm9udHNpemUoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIEltYWdlIGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC5pbWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVsID0gdHJlZS5sYWJlbCgpO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblx0LmdldHNldCAoJ3NyYycsIGZ1bmN0aW9uICgpIHt9KVxuXG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdGlmIChsYWJlbC5zcmMoKShub2RlKSkge1xuXHQgICAgdmFyIGwgPSBkMy5zZWxlY3QodGhpcylcblx0XHQuYXBwZW5kKFwiaW1hZ2VcIilcblx0XHQuYXR0cihcIndpZHRoXCIsIGxhYmVsLndpZHRoKCkoKSlcblx0XHQuYXR0cihcImhlaWdodFwiLCBsYWJlbC5oZWlnaHQoKSgpKVxuXHRcdC5hdHRyKFwieGxpbms6aHJlZlwiLCBsYWJlbC5zcmMoKShub2RlKSk7XG5cdCAgICByZXR1cm4gbDtcblx0fVxuXHQvLyBmYWxsYmFjayB0ZXh0IGluIGNhc2UgdGhlIGltZyBpcyBub3QgZm91bmQ/XG5cdHJldHVybiBkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAudGV4dChcIlwiKTtcbiAgICB9KTtcblxuICAgIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdHZhciBkID0gbm9kZS5kYXRhKCk7XG5cdHZhciB0ID0ge1xuXHQgICAgdHJhbnNsYXRlIDogWzEwLCAoLWxhYmVsLmhlaWdodCgpKCkgLyAyKV0sXG5cdCAgICByb3RhdGUgOiAwXG5cdH07XG5cdGlmIChsYXlvdXRfdHlwZSA9PT0gJ3JhZGlhbCcpIHtcblx0ICAgIHQudHJhbnNsYXRlWzBdID0gdC50cmFuc2xhdGVbMF0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC53aWR0aCgpKCkpLFxuXHQgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSArIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmhlaWdodCgpKCkpLFxuXHQgICAgdC5yb3RhdGUgPSAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApXG5cdH1cblxuXHRyZXR1cm4gdDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIExhYmVscyBtYWRlIG9mIDIrIHNpbXBsZSBsYWJlbHNcbnRyZWUubGFiZWwuY29tcG9zaXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbHMgPSBbXTtcblxuICAgIHZhciBsYWJlbCA9IGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuXHR2YXIgY3Vycl94b2Zmc2V0ID0gMDtcblxuXHRmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgZGlzcGxheSA9IGxhYmVsc1tpXTtcblxuXHQgICAgKGZ1bmN0aW9uIChvZmZzZXQpIHtcblx0XHRkaXNwbGF5LnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG5cdFx0ICAgIHZhciB0c3VwZXIgPSBkaXNwbGF5Ll9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuXHRcdCAgICB2YXIgdCA9IHtcblx0XHRcdHRyYW5zbGF0ZSA6IFtvZmZzZXQgKyB0c3VwZXIudHJhbnNsYXRlWzBdLCB0c3VwZXIudHJhbnNsYXRlWzFdXSxcblx0XHRcdHJvdGF0ZSA6IHRzdXBlci5yb3RhdGVcblx0XHQgICAgfTtcblx0XHQgICAgcmV0dXJuIHQ7XG5cdFx0fSlcblx0ICAgIH0pKGN1cnJfeG9mZnNldCk7XG5cblx0ICAgIGN1cnJfeG9mZnNldCArPSAxMDtcblx0ICAgIGN1cnJfeG9mZnNldCArPSBkaXNwbGF5LndpZHRoKCkobm9kZSk7XG5cblx0ICAgIGRpc3BsYXkuY2FsbCh0aGlzLCBub2RlLCBsYXlvdXRfdHlwZSk7XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblxuICAgIGFwaS5tZXRob2QgKCdhZGRfbGFiZWwnLCBmdW5jdGlvbiAoZGlzcGxheSwgbm9kZSkge1xuXHRkaXNwbGF5Ll9zdXBlcl8gPSB7fTtcblx0YXBpanMgKGRpc3BsYXkuX3N1cGVyXylcblx0ICAgIC5nZXQgKCd0cmFuc2Zvcm0nLCBkaXNwbGF5LnRyYW5zZm9ybSgpKTtcblxuXHRsYWJlbHMucHVzaChkaXNwbGF5KTtcblx0cmV0dXJuIGxhYmVsO1xuICAgIH0pO1xuICAgIFxuICAgIGFwaS5tZXRob2QgKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICB2YXIgdG90X3dpZHRoID0gMDtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcblx0XHR0b3Rfd2lkdGggKz0gcGFyc2VJbnQobGFiZWxzW2ldLndpZHRoKCkobm9kZSkpO1xuXHRcdHRvdF93aWR0aCArPSBwYXJzZUludChsYWJlbHNbaV0uX3N1cGVyXy50cmFuc2Zvcm0oKShub2RlKS50cmFuc2xhdGVbMF0pO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdG90X3dpZHRoO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHZhciBtYXhfaGVpZ2h0ID0gMDtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgY3Vycl9oZWlnaHQgPSBsYWJlbHNbaV0uaGVpZ2h0KCkobm9kZSk7XG5cdFx0aWYgKCBjdXJyX2hlaWdodCA+IG1heF9oZWlnaHQpIHtcblx0XHQgICAgbWF4X2hlaWdodCA9IGN1cnJfaGVpZ2h0O1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBtYXhfaGVpZ2h0O1xuXHR9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxhYmVsO1xuXG5cbiIsIi8vIEJhc2VkIG9uIHRoZSBjb2RlIGJ5IEtlbi1pY2hpIFVlZGEgaW4gaHR0cDovL2JsLm9ja3Mub3JnL2t1ZWRhLzEwMzY3NzYjZDMucGh5bG9ncmFtLmpzXG5cbnZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGRpYWdvbmFsID0gcmVxdWlyZShcIi4vZGlhZ29uYWwuanNcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxheW91dCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBsID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcblx0LnNvcnQobnVsbClcblx0LnZhbHVlKGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQubGVuZ3RofSApXG5cdC5zZXBhcmF0aW9uKGZ1bmN0aW9uICgpIHtyZXR1cm4gMX0pO1xuICAgIFxuICAgIHZhciBhcGkgPSBhcGlqcyAobClcblx0LmdldHNldCAoJ3NjYWxlJywgdHJ1ZSlcblx0LmdldHNldCAoJ21heF9sZWFmX2xhYmVsX3dpZHRoJywgMClcblx0Lm1ldGhvZCAoXCJjbHVzdGVyXCIsIGNsdXN0ZXIpXG5cdC5tZXRob2QoJ3lzY2FsZScsIGZ1bmN0aW9uICgpIHt0aHJvdyBcInlzY2FsZSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pXG5cdC5tZXRob2QoJ2FkanVzdF9jbHVzdGVyX3NpemUnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJhZGp1c3RfY2x1c3Rlcl9zaXplIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiIH0pXG5cdC5tZXRob2QoJ3dpZHRoJywgZnVuY3Rpb24gKCkge3Rocm93IFwid2lkdGggaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KVxuXHQubWV0aG9kKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJoZWlnaHQgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KTtcblxuICAgIGFwaS5tZXRob2QoJ3NjYWxlX2JyYW5jaF9sZW5ndGhzJywgZnVuY3Rpb24gKGN1cnIpIHtcblx0aWYgKGwuc2NhbGUoKSA9PT0gZmFsc2UpIHtcblx0ICAgIHJldHVyblxuXHR9XG5cblx0dmFyIG5vZGVzID0gY3Vyci5ub2Rlcztcblx0dmFyIHRyZWUgPSBjdXJyLnRyZWU7XG5cblx0dmFyIHJvb3RfZGlzdHMgPSBub2Rlcy5tYXAgKGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5fcm9vdF9kaXN0O1xuXHR9KTtcblxuXHR2YXIgeXNjYWxlID0gbC55c2NhbGUocm9vdF9kaXN0cyk7XG5cdHRyZWUuYXBwbHkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBub2RlLnByb3BlcnR5KFwieVwiLCB5c2NhbGUobm9kZS5yb290X2Rpc3QoKSkpO1xuXHR9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsO1xufTtcblxudHJlZS5sYXlvdXQudmVydGljYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxheW91dCA9IHRyZWUubGF5b3V0KCk7XG4gICAgLy8gRWxlbWVudHMgbGlrZSAnbGFiZWxzJyBkZXBlbmQgb24gdGhlIGxheW91dCB0eXBlLiBUaGlzIGV4cG9zZXMgYSB3YXkgb2YgaWRlbnRpZnlpbmcgdGhlIGxheW91dCB0eXBlXG4gICAgbGF5b3V0LnR5cGUgPSBcInZlcnRpY2FsXCI7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxheW91dClcblx0LmdldHNldCAoJ3dpZHRoJywgMzYwKVxuXHQuZ2V0ICgndHJhbnNsYXRlX3ZpcycsIFsyMCwyMF0pXG5cdC5tZXRob2QgKCdkaWFnb25hbCcsIGRpYWdvbmFsLnZlcnRpY2FsKVxuXHQubWV0aG9kICgndHJhbnNmb3JtX25vZGUnLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueSArIFwiLFwiICsgZC54ICsgXCIpXCI7XG5cdH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnaGVpZ2h0JywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0cmV0dXJuIChwYXJhbXMubl9sZWF2ZXMgKiBwYXJhbXMubGFiZWxfaGVpZ2h0KTtcbiAgICB9KTsgXG5cbiAgICBhcGkubWV0aG9kKCd5c2NhbGUnLCBmdW5jdGlvbiAoZGlzdHMpIHtcbiAgICBcdHJldHVybiBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0ICAgIC5kb21haW4oWzAsIGQzLm1heChkaXN0cyldKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgbGF5b3V0LndpZHRoKCkgLSAyMCAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpXSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKCdhZGp1c3RfY2x1c3Rlcl9zaXplJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0dmFyIGggPSBsYXlvdXQuaGVpZ2h0KHBhcmFtcyk7XG4gICAgXHR2YXIgdyA9IGxheW91dC53aWR0aCgpIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCkgLSBsYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdIC0gcGFyYW1zLmxhYmVsX3BhZGRpbmc7XG4gICAgXHRsYXlvdXQuY2x1c3Rlci5zaXplIChbaCx3XSk7XG4gICAgXHRyZXR1cm4gbGF5b3V0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxheW91dDtcbn07XG5cbnRyZWUubGF5b3V0LnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGF5b3V0ID0gdHJlZS5sYXlvdXQoKTtcbiAgICAvLyBFbGVtZW50cyBsaWtlICdsYWJlbHMnIGRlcGVuZCBvbiB0aGUgbGF5b3V0IHR5cGUuIFRoaXMgZXhwb3NlcyBhIHdheSBvZiBpZGVudGlmeWluZyB0aGUgbGF5b3V0IHR5cGVcbiAgICBsYXlvdXQudHlwZSA9ICdyYWRpYWwnO1xuXG4gICAgdmFyIGRlZmF1bHRfd2lkdGggPSAzNjA7XG4gICAgdmFyIHIgPSBkZWZhdWx0X3dpZHRoIC8gMjtcblxuICAgIHZhciBjb25mID0ge1xuICAgIFx0d2lkdGggOiAzNjBcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYXlvdXQpXG5cdC5nZXRzZXQgKGNvbmYpXG5cdC5nZXRzZXQgKCd0cmFuc2xhdGVfdmlzJywgW3IsIHJdKSAvLyBUT0RPOiAxLjMgc2hvdWxkIGJlIHJlcGxhY2VkIGJ5IGEgc2Vuc2libGUgdmFsdWVcblx0Lm1ldGhvZCAoJ3RyYW5zZm9ybV9ub2RlJywgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBcInJvdGF0ZShcIiArIChkLnggLSA5MCkgKyBcIil0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIilcIjtcblx0fSlcblx0Lm1ldGhvZCAoJ2RpYWdvbmFsJywgZGlhZ29uYWwucmFkaWFsKVxuXHQubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uZi53aWR0aCB9KTtcblxuICAgIC8vIENoYW5nZXMgaW4gd2lkdGggYWZmZWN0IGNoYW5nZXMgaW4gclxuICAgIGxheW91dC53aWR0aC50cmFuc2Zvcm0gKGZ1bmN0aW9uICh2YWwpIHtcbiAgICBcdHIgPSB2YWwgLyAyO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZShbMzYwLCByXSlcbiAgICBcdGxheW91dC50cmFuc2xhdGVfdmlzKFtyLCByXSk7XG4gICAgXHRyZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoXCJ5c2NhbGVcIiwgIGZ1bmN0aW9uIChkaXN0cykge1xuXHRyZXR1cm4gZDMuc2NhbGUubGluZWFyKClcblx0ICAgIC5kb21haW4oWzAsZDMubWF4KGRpc3RzKV0pXG5cdCAgICAucmFuZ2UoWzAsIHJdKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKFwiYWRqdXN0X2NsdXN0ZXJfc2l6ZVwiLCBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdHIgPSAobGF5b3V0LndpZHRoKCkvMikgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKSAtIDIwO1xuXHRsYXlvdXQuY2x1c3Rlci5zaXplKFszNjAsIHJdKTtcblx0cmV0dXJuIGxheW91dDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYXlvdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxheW91dDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5ub2RlX2Rpc3BsYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbiA9IGZ1bmN0aW9uIChub2RlKSB7XG5cdG4uZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChuKVxuXHQuZ2V0c2V0KFwic2l6ZVwiLCA0LjUpXG5cdC5nZXRzZXQoXCJmaWxsXCIsIFwiYmxhY2tcIilcblx0LmdldHNldChcInN0cm9rZVwiLCBcImJsYWNrXCIpXG5cdC5nZXRzZXQoXCJzdHJva2Vfd2lkdGhcIiwgXCIxcHhcIilcblx0LmdldHNldChcImRpc3BsYXlcIiwgZnVuY3Rpb24gKCkge3Rocm93IFwiZGlzcGxheSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcblx0ICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuc3F1YXJlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1zXG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1zO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gcyoyO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHMqMjtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkudHJpYW5nbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJwb2x5Z29uXCIpXG5cdCAgICAuYXR0cihcInBvaW50c1wiLCAoLXMpICsgXCIsMCBcIiArIHMgKyBcIixcIiArICgtcykgKyBcIiBcIiArIHMgKyBcIixcIiArIHMpXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxuLy8gdHJlZS5ub2RlX2Rpc3BsYXkuY29uZCA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbi8vICAgICAvLyBjb25kaXRpb25zIGFyZSBvYmplY3RzIHdpdGhcbi8vICAgICAvLyBuYW1lIDogYSBuYW1lIGZvciB0aGlzIGRpc3BsYXlcbi8vICAgICAvLyBjYWxsYmFjazogdGhlIGNvbmRpdGlvbiB0byBhcHBseSAocmVjZWl2ZXMgYSB0bnQubm9kZSlcbi8vICAgICAvLyBkaXNwbGF5OiBhIG5vZGVfZGlzcGxheVxuLy8gICAgIHZhciBjb25kcyA9IFtdO1xuXG4vLyAgICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuLy8gXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuLy8gXHRmb3IgKHZhciBpPTA7IGk8Y29uZHMubGVuZ3RoOyBpKyspIHtcbi8vIFx0ICAgIHZhciBjb25kID0gY29uZHNbaV07XG4vLyBcdCAgICAvLyBGb3IgZWFjaCBub2RlLCB0aGUgZmlyc3QgY29uZGl0aW9uIG1ldCBpcyB1c2VkXG4vLyBcdCAgICBpZiAoY29uZC5jYWxsYmFjay5jYWxsKHRoaXMsIG5vZGUpID09PSB0cnVlKSB7XG4vLyBcdFx0Y29uZC5kaXNwbGF5LmNhbGwodGhpcywgbm9kZSlcbi8vIFx0XHRicmVhaztcbi8vIFx0ICAgIH1cbi8vIFx0fVxuLy8gICAgIH0pXG5cbi8vICAgICB2YXIgYXBpID0gYXBpanMobik7XG5cbi8vICAgICBhcGkubWV0aG9kKFwiYWRkXCIsIGZ1bmN0aW9uIChuYW1lLCBjYmFrLCBub2RlX2Rpc3BsYXkpIHtcbi8vIFx0Y29uZHMucHVzaCh7IG5hbWUgOiBuYW1lLFxuLy8gXHRcdCAgICAgY2FsbGJhY2sgOiBjYmFrLFxuLy8gXHRcdCAgICAgZGlzcGxheSA6IG5vZGVfZGlzcGxheVxuLy8gXHRcdCAgIH0pO1xuLy8gXHRyZXR1cm4gbjtcbi8vICAgICB9KTtcblxuLy8gICAgIGFwaS5tZXRob2QoXCJyZXNldFwiLCBmdW5jdGlvbiAoKSB7XG4vLyBcdGNvbmRzID0gW107XG4vLyBcdHJldHVybiBuO1xuLy8gICAgIH0pO1xuXG4vLyAgICAgYXBpLm1ldGhvZChcInVwZGF0ZVwiLCBmdW5jdGlvbiAobmFtZSwgY2JhaywgbmV3X2Rpc3BsYXkpIHtcbi8vIFx0Zm9yICh2YXIgaT0wOyBpPGNvbmRzLmxlbmd0aDsgaSsrKSB7XG4vLyBcdCAgICBpZiAoY29uZHNbaV0ubmFtZSA9PT0gbmFtZSkge1xuLy8gXHRcdGNvbmRzW2ldLmNhbGxiYWNrID0gY2Jhaztcbi8vIFx0XHRjb25kc1tpXS5kaXNwbGF5ID0gbmV3X2Rpc3BsYXk7XG4vLyBcdCAgICB9XG4vLyBcdH1cbi8vIFx0cmV0dXJuIG47XG4vLyAgICAgfSk7XG5cbi8vICAgICByZXR1cm4gbjtcblxuLy8gfTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5ub2RlX2Rpc3BsYXk7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0bnRfdHJlZV9ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG5cbnZhciB0cmVlID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2ggKFwiY2xpY2tcIiwgXCJkYmxjbGlja1wiLCBcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIpO1xuXG4gICAgdmFyIGNvbmYgPSB7XG4gICAgICAgIGR1cmF0aW9uICAgICAgICAgOiA1MDAsICAgICAgLy8gRHVyYXRpb24gb2YgdGhlIHRyYW5zaXRpb25zXG4gICAgICAgIG5vZGVfZGlzcGxheSAgICAgOiB0cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUoKSxcbiAgICAgICAgbGFiZWwgICAgICAgICAgICA6IHRyZWUubGFiZWwudGV4dCgpLFxuICAgICAgICBsYXlvdXQgICAgICAgICAgIDogdHJlZS5sYXlvdXQudmVydGljYWwoKSxcbiAgICAgICAgLy8gb25fY2xpY2sgICAgICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICAvLyBvbl9kYmxfY2xpY2sgICAgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIC8vIG9uX21vdXNlb3ZlciAgICAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgYnJhbmNoX2NvbG9yICAgICA6ICdibGFjaycsXG4gICAgICAgIGlkICAgICAgICAgICAgICAgOiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQuX2lkO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGZvY3VzZWQgbm9kZVxuICAgIC8vIFRPRE86IFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIG11bHRpcGxlIGZvY3VzZWQgbm9kZXM/IChpZSB1c2UgYW4gYXJyYXkpXG4gICAgdmFyIGZvY3VzZWRfbm9kZTtcblxuICAgIC8vIEV4dHJhIGRlbGF5IGluIHRoZSB0cmFuc2l0aW9ucyAoVE9ETzogTmVlZGVkPylcbiAgICB2YXIgZGVsYXkgPSAwO1xuXG4gICAgLy8gRWFzZSBvZiB0aGUgdHJhbnNpdGlvbnNcbiAgICB2YXIgZWFzZSA9IFwiY3ViaWMtaW4tb3V0XCI7XG5cbiAgICAvLyBCeSBub2RlIGRhdGFcbiAgICB2YXIgc3BfY291bnRzID0ge307XG5cbiAgICB2YXIgc2NhbGUgPSBmYWxzZTtcblxuICAgIC8vIFRoZSBpZCBvZiB0aGUgdHJlZSBjb250YWluZXJcbiAgICB2YXIgZGl2X2lkO1xuXG4gICAgLy8gVGhlIHRyZWUgdmlzdWFsaXphdGlvbiAoc3ZnKVxuICAgIHZhciBzdmc7XG4gICAgdmFyIHZpcztcbiAgICB2YXIgbGlua3NfZztcbiAgICB2YXIgbm9kZXNfZztcblxuICAgIC8vIFRPRE86IEZvciBub3csIGNvdW50cyBhcmUgZ2l2ZW4gb25seSBmb3IgbGVhdmVzXG4gICAgLy8gYnV0IGl0IG1heSBiZSBnb29kIHRvIGFsbG93IGNvdW50cyBmb3IgaW50ZXJuYWwgbm9kZXNcbiAgICB2YXIgY291bnRzID0ge307XG5cbiAgICAvLyBUaGUgZnVsbCB0cmVlXG4gICAgdmFyIGJhc2UgPSB7XG4gICAgICAgIHRyZWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGRhdGEgOiB1bmRlZmluZWQsXG4gICAgICAgIG5vZGVzIDogdW5kZWZpbmVkLFxuICAgICAgICBsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY3VyciB0cmVlLiBOZWVkZWQgdG8gcmUtY29tcHV0ZSB0aGUgbGlua3MgLyBub2RlcyBwb3NpdGlvbnMgb2Ygc3VidHJlZXNcbiAgICB2YXIgY3VyciA9IHtcbiAgICAgICAgdHJlZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGF0YSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZXMgOiB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtzIDogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFRoZSBjYmFrIHJldHVybmVkXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGl2KSB7XG5cdGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuICAgIHZhciB0cmVlX2RpdiA9IGQzLnNlbGVjdChkaXYpXG4gICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyAgXCJweFwiKSlcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ncm91cERpdlwiKTtcblxuXHR2YXIgY2x1c3RlciA9IGNvbmYubGF5b3V0LmNsdXN0ZXI7XG5cblx0dmFyIG5fbGVhdmVzID0gY3Vyci50cmVlLmdldF9hbGxfbGVhdmVzKCkubGVuZ3RoO1xuXG5cdHZhciBtYXhfbGVhZl9sYWJlbF9sZW5ndGggPSBmdW5jdGlvbiAodHJlZSkge1xuXHQgICAgdmFyIG1heCA9IDA7XG5cdCAgICB2YXIgbGVhdmVzID0gdHJlZS5nZXRfYWxsX2xlYXZlcygpO1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGxhYmVsX3dpZHRoID0gY29uZi5sYWJlbC53aWR0aCgpKGxlYXZlc1tpXSkgKyBkMy5mdW5jdG9yIChjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKGxlYXZlc1tpXSk7XG4gICAgICAgICAgICBpZiAobGFiZWxfd2lkdGggPiBtYXgpIHtcbiAgICAgICAgICAgICAgICBtYXggPSBsYWJlbF93aWR0aDtcbiAgICAgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBtYXg7XG5cdH07XG5cblx0dmFyIG1heF9sZWFmX25vZGVfaGVpZ2h0ID0gZnVuY3Rpb24gKHRyZWUpIHtcblx0ICAgIHZhciBtYXggPSAwO1xuXHQgICAgdmFyIGxlYXZlcyA9IHRyZWUuZ2V0X2FsbF9sZWF2ZXMoKTtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbm9kZV9zaXplID0gZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKGxlYXZlc1tpXSk7XG5cdFx0aWYgKG5vZGVfc2l6ZSA+IG1heCkge1xuXHRcdCAgICBtYXggPSBub2RlX3NpemU7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG1heCAqIDI7XG5cdH07XG5cblx0dmFyIG1heF9sYWJlbF9sZW5ndGggPSBtYXhfbGVhZl9sYWJlbF9sZW5ndGgoY3Vyci50cmVlKTtcblx0Y29uZi5sYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgobWF4X2xhYmVsX2xlbmd0aCk7XG5cblx0dmFyIG1heF9ub2RlX2hlaWdodCA9IG1heF9sZWFmX25vZGVfaGVpZ2h0KGN1cnIudHJlZSk7XG5cblx0Ly8gQ2x1c3RlciBzaXplIGlzIHRoZSByZXN1bHQgb2YuLi5cblx0Ly8gdG90YWwgd2lkdGggb2YgdGhlIHZpcyAtIHRyYW5zZm9ybSBmb3IgdGhlIHRyZWUgLSBtYXhfbGVhZl9sYWJlbF93aWR0aCAtIGhvcml6b250YWwgdHJhbnNmb3JtIG9mIHRoZSBsYWJlbFxuXHQvLyBUT0RPOiBTdWJzdGl0dXRlIDE1IGJ5IHRoZSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbm9kZXNcblx0dmFyIGNsdXN0ZXJfc2l6ZV9wYXJhbXMgPSB7XG5cdCAgICBuX2xlYXZlcyA6IG5fbGVhdmVzLFxuXHQgICAgbGFiZWxfaGVpZ2h0IDogZDMubWF4KFtkMy5mdW5jdG9yKGNvbmYubGFiZWwuaGVpZ2h0KCkpKCksIG1heF9ub2RlX2hlaWdodF0pLFxuXHQgICAgbGFiZWxfcGFkZGluZyA6IDE1XG5cdH07XG5cblx0Y29uZi5sYXlvdXQuYWRqdXN0X2NsdXN0ZXJfc2l6ZShjbHVzdGVyX3NpemVfcGFyYW1zKTtcblxuXHR2YXIgZGlhZ29uYWwgPSBjb25mLmxheW91dC5kaWFnb25hbCgpO1xuXHR2YXIgdHJhbnNmb3JtID0gY29uZi5sYXlvdXQudHJhbnNmb3JtX25vZGU7XG5cblx0c3ZnID0gdHJlZV9kaXZcblx0ICAgIC5hcHBlbmQoXCJzdmdcIilcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgY29uZi5sYXlvdXQud2lkdGgoKSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGNvbmYubGF5b3V0LmhlaWdodChjbHVzdGVyX3NpemVfcGFyYW1zKSArIDMwKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKTtcblxuXHR2aXMgPSBzdmdcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X3N0X1wiICsgZGl2X2lkKVxuXHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIixcblx0XHQgIFwidHJhbnNsYXRlKFwiICtcblx0XHQgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVswXSArXG5cdFx0ICBcIixcIiArXG5cdFx0ICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuXHRcdCAgXCIpXCIpO1xuXG5cdGN1cnIubm9kZXMgPSBjbHVzdGVyLm5vZGVzKGN1cnIuZGF0YSk7XG5cdGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuXHRjdXJyLmxpbmtzID0gY2x1c3Rlci5saW5rcyhjdXJyLm5vZGVzKTtcblxuXHQvLyBMSU5LU1xuXHQvLyBBbGwgdGhlIGxpbmtzIGFyZSBncm91cGVkIGluIGEgZyBlbGVtZW50XG5cdGxpbmtzX2cgPSB2aXNcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua3NcIik7XG5cdG5vZGVzX2cgPSB2aXNcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZXNcIik7XG5cblx0Ly92YXIgbGluayA9IHZpc1xuXHR2YXIgbGluayA9IGxpbmtzX2dcblx0ICAgIC5zZWxlY3RBbGwoXCJwYXRoLnRudF90cmVlX2xpbmtcIilcblx0ICAgIC5kYXRhKGN1cnIubGlua3MsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgcmV0dXJuIGNvbmYuaWQoZC50YXJnZXQpO1xuICAgICAgICB9KTtcblxuXHRsaW5rXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInBhdGhcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9saW5rXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0ICAgIFx0cmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgY29uZi5pZChkLnRhcmdldCk7XG5cdCAgICB9KVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDMuZnVuY3Rvcihjb25mLmJyYW5jaF9jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cdC8vIE5PREVTXG5cdC8vdmFyIG5vZGUgPSB2aXNcblx0dmFyIG5vZGUgPSBub2Rlc19nXG5cdCAgICAuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG5cdCAgICAuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZi5pZChkKVxuICAgICAgICB9KTtcblxuXHR2YXIgbmV3X25vZGUgPSBub2RlXG5cdCAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcblx0XHRpZiAobi5jaGlsZHJlbikge1xuXHRcdCAgICBpZiAobi5kZXB0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIlxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiaW5uZXIgdG50X3RyZWVfbm9kZVwiXG5cdFx0ICAgIH1cblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJsZWFmIHRudF90cmVlX25vZGVcIlxuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0XHRyZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZFxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0Ly8gZGlzcGxheSBub2RlIHNoYXBlXG5cdG5ld19ub2RlXG5cdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpXG5cdCAgICB9KTtcblxuXHQvLyBkaXNwbGF5IG5vZGUgbGFiZWxcblx0bmV3X25vZGVcblx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuXHQgICAgXHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcblx0ICAgIH0pO1xuXG4gICAgbmV3X25vZGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgfSk7XG4gICAgbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6ZGJsY2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgfSk7XG4gICAgbmV3X25vZGUub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICB9KTtcbiAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTptb3VzZW91dFwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICB9KTtcblxuXHQvLyBuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vICAgICBjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgLy9cblx0Ly8gICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cdC8vIH0pO1xuICAgIC8vXG5cdC8vIG5ld19ub2RlLm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuXHQvLyAgICAgY29uZi5vbl9tb3VzZW92ZXIuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAvL1xuXHQvLyAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0Ly8gfSk7XG4gICAgLy9cblx0Ly8gbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuXHQvLyAgICAgY29uZi5vbl9kYmxfY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAvL1xuXHQvLyAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0Ly8gfSk7XG5cblxuXHQvLyBVcGRhdGUgcGxvdHMgYW4gdXBkYXRlZCB0cmVlXG5cdGFwaS5tZXRob2QgKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcblx0ICAgIHRyZWVfZGl2XG5cdFx0LnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyBcInB4XCIpKTtcblx0ICAgIHN2Zy5hdHRyKFwid2lkdGhcIiwgY29uZi5sYXlvdXQud2lkdGgoKSk7XG5cblx0ICAgIHZhciBjbHVzdGVyID0gY29uZi5sYXlvdXQuY2x1c3Rlcjtcblx0ICAgIHZhciBkaWFnb25hbCA9IGNvbmYubGF5b3V0LmRpYWdvbmFsKCk7XG5cdCAgICB2YXIgdHJhbnNmb3JtID0gY29uZi5sYXlvdXQudHJhbnNmb3JtX25vZGU7XG5cblx0ICAgIHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG5cdCAgICBjb25mLmxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aChtYXhfbGFiZWxfbGVuZ3RoKTtcblxuXHQgICAgdmFyIG1heF9ub2RlX2hlaWdodCA9IG1heF9sZWFmX25vZGVfaGVpZ2h0KGN1cnIudHJlZSk7XG5cblx0ICAgIC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG5cdCAgICAvLyB0b3RhbCB3aWR0aCBvZiB0aGUgdmlzIC0gdHJhbnNmb3JtIGZvciB0aGUgdHJlZSAtIG1heF9sZWFmX2xhYmVsX3dpZHRoIC0gaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIGxhYmVsXG5cdC8vIFRPRE86IFN1YnN0aXR1dGUgMTUgYnkgdGhlIHRyYW5zZm9ybSBvZiB0aGUgbm9kZXMgKHByb2JhYmx5IGJ5IHNlbGVjdGluZyBvbmUgbm9kZSBhc3N1bWluZyBhbGwgdGhlIG5vZGVzIGhhdmUgdGhlIHNhbWUgdHJhbnNmb3JtXG5cdCAgICB2YXIgbl9sZWF2ZXMgPSBjdXJyLnRyZWUuZ2V0X2FsbF9sZWF2ZXMoKS5sZW5ndGg7XG5cdCAgICB2YXIgY2x1c3Rlcl9zaXplX3BhcmFtcyA9IHtcblx0XHRuX2xlYXZlcyA6IG5fbGVhdmVzLFxuXHRcdGxhYmVsX2hlaWdodCA6IGQzLm1heChbZDMuZnVuY3Rvcihjb25mLmxhYmVsLmhlaWdodCgpKSgpLCBtYXhfbm9kZV9oZWlnaHRdKSxcblx0XHRsYWJlbF9wYWRkaW5nIDogMTVcblx0ICAgIH07XG5cdCAgICBjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG5cdCAgICBzdmdcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdFx0LmVhc2UoZWFzZSlcblx0XHQuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMCk7IC8vIGhlaWdodCBpcyBpbiB0aGUgbGF5b3V0XG5cblx0ICAgIHZpc1xuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLFxuXHRcdCAgICAgIFwidHJhbnNsYXRlKFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuXHRcdCAgICAgIFwiLFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuXHRcdCAgICAgIFwiKVwiKTtcblxuXHQgICAgY3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcblx0ICAgIGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuXHQgICAgY3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cblx0ICAgIC8vIExJTktTXG5cdCAgICB2YXIgbGluayA9IGxpbmtzX2dcblx0XHQuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG5cdFx0LmRhdGEoY3Vyci5saW5rcywgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICByZXR1cm4gY29uZi5pZChkLnRhcmdldClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIE5PREVTXG5cdCAgICB2YXIgbm9kZSA9IG5vZGVzX2dcblx0XHQuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG5cdFx0LmRhdGEoY3Vyci5ub2RlcywgZnVuY3Rpb24oZCkge3JldHVybiBjb25mLmlkKGQpfSk7XG5cblx0ICAgIHZhciBleGl0X2xpbmsgPSBsaW5rXG5cdFx0LmV4aXQoKVxuXHRcdC5yZW1vdmUoKTtcblxuXHQgICAgbGlua1xuXHRcdC5lbnRlcigpXG5cdFx0LmFwcGVuZChcInBhdGhcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGlua1wiKVxuXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgY29uZi5pZChkLnRhcmdldCk7XG5cdFx0fSlcblx0XHQuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gZDMuZnVuY3Rvcihjb25mLmJyYW5jaF9jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0XHR9KVxuXHRcdC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblx0ICAgIGxpbmtcblx0ICAgIFx0LnRyYW5zaXRpb24oKVxuXHRcdC5lYXNlKGVhc2UpXG5cdCAgICBcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHQgICAgXHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cblx0ICAgIC8vIE5vZGVzXG5cdCAgICB2YXIgbmV3X25vZGUgPSBub2RlXG5cdFx0LmVudGVyKClcblx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24obikge1xuXHRcdCAgICBpZiAobi5jaGlsZHJlbikge1xuXHRcdFx0aWYgKG4uZGVwdGggPT0gMCkge1xuXHRcdFx0ICAgIHJldHVybiBcInJvb3QgdG50X3RyZWVfbm9kZVwiXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0ICAgIHJldHVybiBcImlubmVyIHRudF90cmVlX25vZGVcIlxuXHRcdFx0fVxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwibGVhZiB0bnRfdHJlZV9ub2RlXCJcblx0XHQgICAgfVxuXHRcdH0pXG5cdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZDtcblx0XHR9KVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0ICAgIC8vIEV4aXRpbmcgbm9kZXMgYXJlIGp1c3QgcmVtb3ZlZFxuXHQgICAgbm9kZVxuXHRcdC5leGl0KClcblx0XHQucmVtb3ZlKCk7XG5cbiAgICAgICAgbmV3X25vZGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIG15X25vZGUpO1xuICAgICAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19ub2RlLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOm1vdXNlb3V0XCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG5cblx0ICAgIC8vIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHQvLyBjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgIC8vXG5cdFx0Ly8gdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIC8vIH0pO1xuICAgICAgICAvL1xuXHQgICAgLy8gbmV3X25vZGUub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Ly8gY29uZi5vbl9tb3VzZW92ZXIuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgLy9cblx0XHQvLyB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgLy8gfSk7XG4gICAgICAgIC8vXG5cdCAgICAvLyBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Ly8gY29uZi5vbl9kYmxfY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgLy9cblx0XHQvLyB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgLy8gfSk7XG5cblxuXHQgICAgLy8gV2UgbmVlZCB0byByZS1jcmVhdGUgYWxsIHRoZSBub2RlcyBhZ2FpbiBpbiBjYXNlIHRoZXkgaGF2ZSBjaGFuZ2VkIGxpdmVseSAob3IgdGhlIGxheW91dClcblx0ICAgIG5vZGUuc2VsZWN0QWxsKFwiKlwiKS5yZW1vdmUoKTtcblx0ICAgIG5vZGVcblx0XHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRcdGNvbmYubm9kZV9kaXNwbGF5LmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSlcblx0XHQgICAgfSk7XG5cblx0ICAgIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGFsbCB0aGUgbGFiZWxzIGFnYWluIGluIGNhc2UgdGhleSBoYXZlIGNoYW5nZWQgbGl2ZWx5IChvciB0aGUgbGF5b3V0KVxuXHQgICAgbm9kZVxuXHRcdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0XHRcdGNvbmYubGFiZWwuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpLCBjb25mLmxheW91dC50eXBlLCBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkodG50X3RyZWVfbm9kZShkKSkpO1xuXHRcdCAgICB9KTtcblxuXHQgICAgbm9kZVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZWFzZShlYXNlKVxuXHRcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0fSk7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAodClcblx0LmdldHNldCAoY29uZilcblxuICAgIC8vIFRPRE86IFJld3JpdGUgZGF0YSB1c2luZyBnZXRzZXQgLyBmaW5hbGl6ZXJzICYgdHJhbnNmb3Jtc1xuICAgIGFwaS5tZXRob2QgKCdkYXRhJywgZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gYmFzZS5kYXRhO1xuXHR9XG5cblx0Ly8gVGhlIG9yaWdpbmFsIGRhdGEgaXMgc3RvcmVkIGFzIHRoZSBiYXNlIGFuZCBjdXJyIGRhdGFcblx0YmFzZS5kYXRhID0gZDtcblx0Y3Vyci5kYXRhID0gZDtcblxuXHQvLyBTZXQgdXAgYSBuZXcgdHJlZSBiYXNlZCBvbiB0aGUgZGF0YVxuXHR2YXIgbmV3dHJlZSA9IHRudF90cmVlX25vZGUoYmFzZS5kYXRhKTtcblxuXHR0LnJvb3QobmV3dHJlZSk7XG5cblx0dHJlZS50cmlnZ2VyKFwiZGF0YTpoYXNDaGFuZ2VkXCIsIGJhc2UuZGF0YSk7XG5cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIHRyZWUgdXNpbmcgZ2V0c2V0IC8gZmluYWxpemVycyAmIHRyYW5zZm9ybXNcbiAgICBhcGkubWV0aG9kICgncm9vdCcsIGZ1bmN0aW9uIChteVRyZWUpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiBjdXJyLnRyZWU7XG4gICAgXHR9XG5cblx0Ly8gVGhlIG9yaWdpbmFsIHRyZWUgaXMgc3RvcmVkIGFzIHRoZSBiYXNlLCBwcmV2IGFuZCBjdXJyIHRyZWVcbiAgICBcdGJhc2UudHJlZSA9IG15VHJlZTtcblx0Y3Vyci50cmVlID0gYmFzZS50cmVlO1xuLy9cdHByZXYudHJlZSA9IGJhc2UudHJlZTtcbiAgICBcdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbiAoY3Vycl9ub2Rlcywga2VlcFNpbmdsZXRvbnMpIHtcblx0dmFyIHN1YnRyZWUgPSBiYXNlLnRyZWUuc3VidHJlZShjdXJyX25vZGVzLCBrZWVwU2luZ2xldG9ucyk7XG5cdGN1cnIuZGF0YSA9IHN1YnRyZWUuZGF0YSgpO1xuXHRjdXJyLnRyZWUgPSBzdWJ0cmVlO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZvY3VzX25vZGUnLCBmdW5jdGlvbiAobm9kZSwga2VlcFNpbmdsZXRvbnMpIHtcblx0Ly8gZmluZFxuXHR2YXIgZm91bmRfbm9kZSA9IHQucm9vdCgpLmZpbmRfbm9kZShmdW5jdGlvbiAobikge1xuXHQgICAgcmV0dXJuIG5vZGUuaWQoKSA9PT0gbi5pZCgpO1xuXHR9KTtcblx0Zm9jdXNlZF9ub2RlID0gZm91bmRfbm9kZTtcblx0dC5zdWJ0cmVlKGZvdW5kX25vZGUuZ2V0X2FsbF9sZWF2ZXMoKSwga2VlcFNpbmdsZXRvbnMpO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2hhc19mb2N1cycsIGZ1bmN0aW9uIChub2RlKSB7XG5cdHJldHVybiAoKGZvY3VzZWRfbm9kZSAhPT0gdW5kZWZpbmVkKSAmJiAoZm9jdXNlZF9ub2RlLmlkKCkgPT09IG5vZGUuaWQoKSkpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3JlbGVhc2VfZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG5cdHQuZGF0YSAoYmFzZS5kYXRhKTtcblx0Zm9jdXNlZF9ub2RlID0gdW5kZWZpbmVkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIHJldHVybiBkMy5yZWJpbmQgKHQsIGRpc3BhdGNoLCBcIm9uXCIpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZTtcbiJdfQ==
