// Voxel Alpha LAN server. Usage: node server.js [port]   (no npm install needed)
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const PORT=+process.argv[2]||3000,clients=new Map(),edits=new Map(),conts=new Map(),t0=Date.now();let nid=1,auth=null;
const send=(res,m)=>res.write('data:'+JSON.stringify(m)+'\n\n');
const bc=(m,except)=>{for(const [id,c] of clients)if(id!==except)send(c.res,m)};
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x');
 if(u.pathname=='/events'){
  const id=nid++,name=(u.searchParams.get('name')||'Player'+id).slice(0,16);
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive'});
  if(auth==null)auth=id;
  send(res,{t:'hello',id,auth,el:(Date.now()-t0)/1000,
   edits:[...edits].map(([k,v])=>k.split(',').map(Number).concat(v)),conts:[...conts.values()],
   players:[...clients].map(([i,c])=>Object.assign({},c.pos,{id:i,name:c.name}))});
  clients.set(id,{res,name,pos:{}});bc({t:'join',id,name},id);
  console.log(name+' joined ('+clients.size+' online)');
  const ka=setInterval(()=>res.write(':\n\n'),15000);
  req.on('close',()=>{clearInterval(ka);clients.delete(id);bc({t:'bye',id});console.log(name+' left');
   if(id===auth){auth=clients.size?Math.min(...clients.keys()):null;if(auth!=null)bc({t:'auth',id:auth})}});
  return}
 if(u.pathname=='/send'&&req.method=='POST'){
  let b='';req.on('data',d=>b+=d).on('end',()=>{try{
   const m=JSON.parse(b),id=+u.searchParams.get('id');
   if(m.t=='blk')edits.set([m.x,m.y,m.z].join(','),m.id);
   if(m.t=='pos'){const c=clients.get(id);if(c)c.pos=m}
   if(m.t=='cont'){if(m.del)conts.delete(m.key);else conts.set(m.key,[m.key,m.k,m.d])}
   m.id=id;
   if(m.t=='chat'){const c=clients.get(id);m.name=c?c.name:'?';m.text=String(m.text).slice(0,120)}
   if(m.to!=null){const c=clients.get(m.to);if(c)send(c.res,m)}
   else if(m.t=='atk'){const c=clients.get(auth);if(c&&auth!==id)send(c.res,m)}
   else bc(m,id)}catch(e){}res.end('ok')});return}
 fs.readFile(path.join(__dirname,'voxelcraft.html'),(e,d)=>{res.writeHead(e?404:200,{'Content-Type':'text/html'});res.end(d)})
}).listen(PORT,'0.0.0.0',()=>{
 console.log('Voxel Alpha server running. Players on your network open:');
 for(const l of Object.values(os.networkInterfaces()))for(const i of l)if(i.family=='IPv4'&&!i.internal)console.log('  http://'+i.address+':'+PORT);
});
