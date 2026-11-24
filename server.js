const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "db.json");
app.use(express.json({limit:"100kb"}));
app.use(express.static(path.join(__dirname, "public")));

const MENU=[
 {id:"samosa",n:"Samosa",p:15,e:"🥟"},{id:"sandwich",n:"Veg sandwich",p:40,e:"🥪"},
 {id:"dosa",n:"Masala dosa",p:60,e:"🫓"},{id:"chai",n:"Masala chai",p:10,e:"🍵"},
 {id:"coffee",n:"Cold coffee",p:50,e:"🧋"},{id:"maggi",n:"Maggi",p:35,e:"🍜"},
 {id:"roll",n:"Paneer roll",p:70,e:"🌯"},{id:"fries",n:"French fries",p:45,e:"🍟"}
];
const INITIAL_STOCK={samosa:20,sandwich:8,dosa:12,chai:50,coffee:3,maggi:0,roll:9,fries:15};

function freshDb(){return {stock:{...INITIAL_STOCK},orders:[],nextOrderId:101};}
function loadDb(){try{return JSON.parse(fs.readFileSync(DATA_FILE,"utf8"));}catch{const db=freshDb();saveDb(db);return db;}}
function saveDb(db){fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});fs.writeFileSync(DATA_FILE,JSON.stringify(db,null,2));}
let db=loadDb();

class Node234{constructor(leaf=true){this.keys=[];this.children=[];this.leaf=leaf;}}
class Tree234{
 constructor(){this.root=new Node234(true);}
 search(key,node=this.root){let i=0;while(i<node.keys.length&&key>node.keys[i])i++;if(i<node.keys.length&&node.keys[i]===key)return true;return node.leaf?false:this.search(key,node.children[i]);}
 splitChild(parent,index){const full=parent.children[index],right=new Node234(full.leaf),middle=full.keys[1];right.keys=full.keys.splice(2);full.keys.pop();if(!full.leaf)right.children=full.children.splice(2);parent.children.splice(index+1,0,right);parent.keys.splice(index,0,middle);}
 insertNonFull(node,key){let i=node.keys.length-1;if(node.leaf){while(i>=0&&key<node.keys[i])i--;node.keys.splice(i+1,0,key);return;}while(i>=0&&key<node.keys[i])i--;i++;if(node.children[i].keys.length===3){this.splitChild(node,i);if(key>node.keys[i])i++;}this.insertNonFull(node.children[i],key);}
 insert(key){if(this.search(key))return;if(this.root.keys.length===3){const old=this.root,next=new Node234(false);next.children=[old];this.splitChild(next,0);this.root=next;}this.insertNonFull(this.root,key);}
 sorted(node=this.root,out=[]){for(let i=0;i<node.keys.length;i++){if(!node.leaf)this.sorted(node.children[i],out);out.push(node.keys[i]);}if(!node.leaf)this.sorted(node.children[node.keys.length],out);return out;}
}
const orderTree=new Tree234();db.orders.forEach(o=>orderTree.insert(Number(o.id)));
const error=(res,status,message)=>res.status(status).json({error:message});

app.get("/api/health",(req,res)=>res.json({ok:true,service:"Campus Bites API"}));
app.get("/api/bootstrap",(req,res)=>res.json({menu:MENU,stock:db.stock,orders:db.orders}));
app.get("/api/menu",(req,res)=>res.json({menu:MENU}));
app.get("/api/inventory",(req,res)=>res.json({stock:db.stock}));
app.get("/api/inventory/:id",(req,res)=>{if(!(req.params.id in db.stock))return error(res,404,"Menu item not found");res.json({item:req.params.id,qty:db.stock[req.params.id]});});
app.post("/api/inventory/:id/restock",(req,res)=>{const id=req.params.id,quantity=Number(req.body.quantity??10);if(!(id in db.stock))return error(res,404,"Menu item not found");if(!Number.isInteger(quantity)||quantity<1||quantity>10000)return error(res,400,"Quantity must be a positive whole number");db.stock[id]+=quantity;saveDb(db);res.json({stock:db.stock});});
app.get("/api/orders",(req,res)=>res.json({orders:db.orders}));
app.post("/api/orders",(req,res)=>{
 const {name="Guest",items=[],source="web"}=req.body||{};if(!Array.isArray(items)||items.length===0)return error(res,400,"Add at least one item");const normalized=[];
 for(const line of items){const menuItem=MENU.find(m=>m.id===line.id),qty=Number(line.q);if(!menuItem)return error(res,400,"Unknown menu item");if(!Number.isInteger(qty)||qty<1)return error(res,400,"Invalid quantity");if((db.stock[line.id]||0)<qty)return error(res,409,`${menuItem.n} has only ${db.stock[line.id]||0} left`);const existing=normalized.find(x=>x.id===line.id);if(existing)existing.q+=qty;else normalized.push({id:line.id,n:menuItem.n,p:menuItem.p,q:qty});}
 normalized.forEach(line=>db.stock[line.id]-=line.q);const order={id:db.nextOrderId++,name:String(name).trim().slice(0,80)||"Guest",items:normalized,total:normalized.reduce((s,i)=>s+i.q*i.p,0),status:0,source,createdAt:new Date().toISOString()};db.orders.push(order);orderTree.insert(order.id);saveDb(db);res.status(201).json({order,orders:db.orders,stock:db.stock});
});
app.patch("/api/orders/:id/advance",(req,res)=>{const order=db.orders.find(o=>o.id===Number(req.params.id));if(!order)return error(res,404,"Order not found");if(order.status<3)order.status++;saveDb(db);res.json({order,orders:db.orders,stock:db.stock});});
app.get("/api/orders/search/:id",(req,res)=>{const id=Number(req.params.id);if(!Number.isInteger(id)||!orderTree.search(id))return res.json({order:null,sortedIds:orderTree.sorted()});res.json({order:db.orders.find(o=>o.id===id)||null,sortedIds:orderTree.sorted()});});
app.get("/api/ai/summary",(req,res)=>{const sold={};db.orders.forEach(o=>o.items.forEach(i=>sold[i.id]=(sold[i.id]||0)+i.q));const ranked=MENU.map(m=>({...m,sold:sold[m.id]||0,left:db.stock[m.id]})).sort((a,b)=>b.sold-a.sold);const low=ranked.filter(m=>m.left<=5),top=ranked[0];const summary=`${top&&top.sold?`Top seller: ${top.n} (${top.sold} sold). `:"No sales have been recorded yet. "}${low.length?`Restock soon: ${low.map(m=>`${m.n} (${m.left} left)`).join(", ")}.`:"Current stock levels look healthy."}`;res.json({summary,unitsSold:sold});});
app.post("/api/ai/suggest",(req,res)=>{const text=String(req.body?.text||"").toLower(),selected={};if(!text.trim())return error(res,400,"Describe what you would like to eat");const hints={tea:"chai",cold:"coffee",spicy:"maggi",noodle:"maggi",paneer:"roll",wrap:"roll",hungry:"dosa",heavy:"dosa",snack:"samosa",light:"samosa",crispy:"fries"};MENU.forEach(m=>{if(text.includes(m.id))selected[m.id]=1});Object.entries(hints).forEach(([word,id])=>{if(text.includes(word)&&!selected[id])selected[id]=1});let items=Object.entries(selected).map(([id,q])=>({id,q:Math.min(q,db.stock[id]||0)})).filter(x=>x.q>0);if(!items.length)items=["samosa","chai"].filter(id=>db.stock[id]>0).map(id=>({id,q:1}));const budget=text.match(/(?:under|below|within|budget|₹|rs)[ .]*([0-9]+)/);const total=()=>items.reduce((sum,line)=>sum+line.q*MENU.find(m=>m.id===line.id).p,0);if(budget){const limit=Number(budget[1]);while(items.length>1&&total()>limit)items.shift()}res.json({message:"Here is a quick pick based on your request.",items,total:total()});});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`Campus Bites running at http://localhost:${PORT}`));
