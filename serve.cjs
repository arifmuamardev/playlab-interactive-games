// No dependencies required. Run: node serve.cjs
const http=require('node:http'), fs=require('node:fs'), path=require('node:path');
const dir=path.join(__dirname,'dist'),host='127.0.0.1',port=Number(process.env.PORT||8765);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  const url=new URL(req.url,`http://${host}:${port}`);
  const requested=path.resolve(dir,'.'+decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if(!requested.startsWith(dir+path.sep)&&requested!==dir){res.writeHead(403);res.end('Forbidden');return;}
  fs.readFile(requested,(err,data)=>{
    if(err){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(requested)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  });
}).listen(port,host,()=>{
  console.log(`\nPlayLab is running:\n  Game library  http://localhost:${port}/\n  Survey host    http://localhost:${port}/?game=survey\n  Projector       http://localhost:${port}/?game=survey&view=display\n\nUse Chrome/Edge in two windows on the same computer. Press Ctrl+C to stop.\n`);
});
