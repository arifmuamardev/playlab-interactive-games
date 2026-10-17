const fs=require('fs'),path=require('path');
let ts; try { ts=require('typescript'); } catch { ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
fs.mkdirSync(dist,{recursive:true});fs.mkdirSync(path.join(dist,'vendor'),{recursive:true});
let data=fs.readFileSync(path.join(root,'src/data.js'),'utf8').replaceAll(/export\s+(?=(?:const|function)\s)/g,'');
let main=fs.readFileSync(path.join(root,'src/main.jsx'),'utf8');
main=main.replace(/^import .*?from .*?;\s*$/gm,'').replace(/^import '\.\/styles\.css';\s*$/gm,'');
main=main.replace(/import\.meta\.env\.PROD/g,'true');
let start=`const React=window.React; const ReactDOM=window.ReactDOM; const {useState,useEffect,useRef,useCallback}=window.Hooks; const {ArrowLeft,ArrowRight,ArrowUpRight,Check,CheckCheck,ChevronDown,ChevronLeft,ChevronRight,CircleHelp,Copy,Download,Edit3,Expand,Eye,EyeOff,FileUp,Gamepad2,Headphones,Keyboard,Lock,Maximize,Minus,MonitorPlay,Plus,RotateCcw,Save,Settings2,ShieldAlert,SkipForward,Sparkles,Trash2,Trophy,Volume2,VolumeX,X}=window.IconSet; const createRoot = el => ({render:node=>ReactDOM.render(node,el)});\n`;
const src=start+'\n'+data+'\n'+main;
const result=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None,jsx:ts.JsxEmit.React,jsxFactory:'React.createElement',allowJs:true},fileName:'app.jsx',reportDiagnostics:true});
const errors=result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error)||[];
if(errors.length){console.error(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')).join('\n'));process.exit(1);}
fs.writeFileSync(path.join(dist,'app.js'),result.outputText);
fs.copyFileSync(path.join(root,'src/styles.css'),path.join(dist,'styles.css'));
for(const f of ['react.production.min.js','react-dom.production.min.js','hooks-compat.js','icons.js','THIRD_PARTY_LICENSES.txt'])fs.copyFileSync(path.join(root,'vendor',f),path.join(dist,'vendor',f));
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#10273c"><meta name="description" content="PlayLab — independent interactive games for classrooms and events"><title>PlayLab — Interactive Game Collection</title><link rel="stylesheet" href="./styles.css"></head><body><div id="root"></div><script src="./vendor/react.production.min.js"></script><script src="./vendor/react-dom.production.min.js"></script><script src="./vendor/hooks-compat.js"></script><script src="./vendor/icons.js"></script><script src="./app.js"></script></body></html>`;
fs.writeFileSync(path.join(dist,'index.html'),html);
console.log('Standalone zero-install build created with local React compatibility runtime.');
