/* Tiny functional-component / hooks compatibility layer for offline React 16.0 runtime.
   Supports the subset used by this application: useState, useRef, useEffect, useCallback.
   Provided only for the zero-install standalone preview build. The editable JSX source
   uses standard React 19 hooks for modern npm builds. */
(function(){
  var React=window.React, baseCreate=React.createElement, cache=new WeakMap(), active=null;
  function depsChanged(a,b){if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return true;for(var i=0;i<a.length;i++)if(!Object.is(a[i],b[i]))return true;return false;}
  function current(){if(!active)throw new Error('Hook used outside a functional component');return active;}
  function wrap(fn){if(cache.has(fn))return cache.get(fn);
    class HookComponent extends React.Component{
      constructor(props){super(props);this.hooks=[];this.nextHook=0;this.pending=[];}
      render(){var prev=active;active=this;this.nextHook=0;this.pending=[];try{return fn(this.props);}finally{active=prev;}}
      flushEffects(){var pending=this.pending.slice();this.pending=[];pending.forEach(i=>{var h=this.hooks[i];if(h.cleanup)h.cleanup();h.cleanup=h.effect()||null;});}
      componentDidMount(){this.flushEffects();}
      componentDidUpdate(){this.flushEffects();}
      componentWillUnmount(){this.hooks.forEach(h=>{if(h&&h.cleanup)h.cleanup();});}
    }
    HookComponent.displayName=fn.name||'Component';cache.set(fn,HookComponent);return HookComponent;
  }
  React.createElement=function(type){
    var args=Array.prototype.slice.call(arguments);
    if(typeof type==='function' && !(type.prototype&&type.prototype.isReactComponent))args[0]=wrap(type);
    return baseCreate.apply(React,args);
  };
  window.Hooks={
    useState:function(initial){var c=current(),i=c.nextHook++;if(!c.hooks[i]){
      var h={value:typeof initial==='function'?initial():initial};
      h.set=function(next){var val=typeof next==='function'?next(h.value):next;if(!Object.is(val,h.value)){h.value=val;c.forceUpdate();}};
      c.hooks[i]=h;
    }return [c.hooks[i].value,c.hooks[i].set];},
    useRef:function(initial){var c=current(),i=c.nextHook++;if(!c.hooks[i])c.hooks[i]={current:initial};return c.hooks[i];},
    useEffect:function(effect,deps){var c=current(),i=c.nextHook++,h=c.hooks[i];if(!h){h=c.hooks[i]={deps:deps,effect:effect,cleanup:null};c.pending.push(i)}else if(depsChanged(h.deps,deps)){h.deps=deps;h.effect=effect;c.pending.push(i);}},
    useCallback:function(fn,deps){var c=current(),i=c.nextHook++,h=c.hooks[i];if(!h||depsChanged(h.deps,deps)){h=c.hooks[i]={value:fn,deps:deps};}return h.value;}
  };
})();
