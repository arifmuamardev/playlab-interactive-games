const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),storage=new Map();
const errors=[];
class Component {constructor(props){this.props=props;}forceUpdate(){}}
const makeReact=()=>({Component,createElement:(type,props,...children)=>({type,props:{...(props||{}),children:children.length===1?children[0]:children}})});
function flatten(node,texts=[],types=[],nodes=[]){
  if(node===null||node===undefined||node===false||node===true)return {texts,types,nodes};
  if(Array.isArray(node)){node.forEach(n=>flatten(n,texts,types,nodes));return {texts,types,nodes};}
  if(typeof node==='string'||typeof node==='number'){texts.push(String(node));return {texts,types,nodes};}
  if(typeof node.type==='function'){
    try{const inst=new node.type(node.props);return flatten(inst.render(),texts,types,nodes);}catch(e){errors.push(e.stack);return {texts,types,nodes};}
  }
  types.push(node.type);nodes.push(node);
  flatten(node.props?.children,texts,types,nodes);
  return {texts,types,nodes};
}
function render(query=''){
  const ctx={window:null,React:makeReact(),console,Math,Date,Object,Array,Number,String,Boolean,Map,Set,Promise,JSON,URL,URLSearchParams,setTimeout,clearTimeout,structuredClone,
  navigator:{},document:{getElementById:()=>({})},location:{href:'http://localhost:8890/'+query,search:query},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}};
  ctx.window=ctx;
  ctx.ReactDOM={render(el){ctx.rendered=flatten(el)}};
  vm.createContext(ctx);
  for(const file of ['vendor/hooks-compat.js','vendor/icons.js','dist/app.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  assert.deepEqual(errors,[],'virtual render errors');
  return ctx;
}
const hub=render();
assert(hub.rendered.texts.join(' ').includes('Make every room'));
assert(hub.rendered.texts.join(' ').includes('Quickfire Quiz'));
const host=render('?game=survey');
assert(host.rendered.texts.join(' ').includes('Survey Showdown'));
assert(host.rendered.texts.join(' ').includes('Tas'));
const btn=host.rendered.nodes.find(el=>el.type==='button'&&el.props.className?.includes('reveal-button'));
assert(btn,'survey host reveal button');btn.props.onClick();
const survey=JSON.parse(storage.get('playlab-survey-showdown-v2'));
assert.deepEqual(survey.progress['demo-1'].revealed,[0]);
assert.equal(survey.progress['demo-1'].awardedAmount,0);
const disp=render('?game=survey&view=display');
assert(disp.rendered.texts.join(' ').includes('KESALAHAN'));
assert(disp.rendered.texts.join(' ').includes('Tas'));
const quizHost=render('?game=quickfire');
assert(quizHost.rendered.texts.join(' ').includes('Merkurius'));
const reveal=quizHost.rendered.nodes.find(el=>el.type==='button'&&typeof el.props.children==='object'&&String(el.props.className).includes('quick-main-action'));
assert(reveal,'quickfire reveal');reveal.props.onClick();
const qstate=JSON.parse(storage.get('playlab-quickfire-state-v1'));
assert(qstate.revealed.t1);
const qDisplay=render('?game=quickfire&view=display');
assert(qDisplay.rendered.texts.join(' ').includes('QUICKFIRE'));
console.log('Game hub, survey host/display, quickfire host/display and interactions passed.');
