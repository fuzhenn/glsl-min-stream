module.exports = minifier

var lang = require('cssauron-glsl')
  , is_variable = lang('decl > decllist > ident')
  , is_function = lang('decl > function > ident')
  , is_named_struct = lang('struct > ident')
  , through = require('through')
  , shortest = require('shortest')

function minifier(safe_words, mutate_storages) {
  safe_words = safe_words || ['main']

  var _ = {}
    , seen_names = {}
    , counter

  for(var i = 0, len = safe_words.length; i < len; ++i)
    _[safe_words[i]] = true
  safe_words = _

  counter = shortest()

  return through(mutate)

  function mutate(node) {
    // remove unnecessary grouping operators
    if(is_unnecessary_group(node)) return

    if(node.parent) {
      for(var current = node.parent; current.parent; current = current.parent) {
        if(is_unnecessary_group(current)) {
          current.parent.children[current.parent.children.indexOf(current)] = current.children[0]
          current.children[0].parent = current.parent
        }
      }
    }

    if(should_mutate(node)) {
      var t = node.parent.parent.children[1]
      if(mutate_storages || (t.type === 'placeholder' || t.token.data === 'const')) {
        var x = seen_names[node.token.data] || counter()
        seen_names[node.token.data] = x
        node.data = x
      }
    }

    this.emit('data', node)
  }

  function should_mutate(node) {
    var base = (
      is_variable(node) ||
      is_function(node) ||
      is_named_struct(node)
    )

    return base &&
          !safe_words.hasOwnProperty(node.token.data)
  }

  function is_unnecessary_group(node) {
    return node.type === 'group' && node.children[0].lbp >= node.parent.lbp
  }
}
