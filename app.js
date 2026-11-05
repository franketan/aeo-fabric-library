'use strict';
const KEY='ydcl-aeo-fabrics-v1';
const norm=s=>s.trim().toLocaleLowerCase();
// IDs identify records only; they are not authentication tokens.
function recordId(){
 if(globalThis.crypto && typeof globalThis.crypto.randomUUID==='function')return globalThis.crypto.randomUUID();
 if(globalThis.crypto && typeof globalThis.crypto.getRandomValues==='function'){
  const bytes=new Uint8Array(16);globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 }
 return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
}

function validate(d){
 if(!d||d.version!==2||!Array.isArray(d.fabrics)||!Array.isArray(d.styles))throw Error('Not a valid version 2 backup.');
 const ids=new Set(),names=new Set(),links=new Set(),styleIds=new Set();
 for(const f of d.fabrics){if(!f||typeof f.id!=='string'||!f.id||ids.has(f.id)||typeof f.name!=='string'||!f.name.trim()||f.name.length>160||typeof f.content!=='string'||!f.content.trim()||f.content.length>500||typeof f.price!=='number'||!Number.isFinite(f.price)||f.price<0||!['Mens','Womens','Unassigned'].includes(f.division)||names.has(f.division+'|'+norm(f.name)))throw Error('Invalid or duplicate fabric record.');ids.add(f.id);names.add(f.division+'|'+norm(f.name));}
 for(const s of d.styles){const k=JSON.stringify([s.division,norm(typeof s.number==='string'?s.number:''),s.fabricId]);if(typeof s.id!=='string'||!s.id||styleIds.has(s.id)||!['Mens','Womens'].includes(s.division)||typeof s.number!=='string'||!s.number.trim()||s.number.length>120||!ids.has(s.fabricId)||d.fabrics.find(f=>f.id===s.fabricId)?.division!==s.division||links.has(k))throw Error('Invalid, duplicate or unlinked style record.');styleIds.add(s.id);links.add(k);}
 return d;
}
function migrate(data){
 if(data.version!==1)return validate(data);
 const next={version:2,fabrics:[],styles:[]};
 for(const f of data.fabrics){
  const linked=data.styles.filter(s=>s.fabricId===f.id);
  const divisions=[...new Set(linked.map(s=>s.division))];
  if(!divisions.length)divisions.push('Unassigned');
  divisions.forEach((division,i)=>{
   const id=i===0?f.id:recordId();next.fabrics.push({...f,id,division});
   linked.filter(s=>s.division===division).forEach(s=>next.styles.push({...s,fabricId:id}));
  });
 }
 return validate(next);
}
let db={version:2,fabrics:[],styles:[]};let storageBroken=false;
try{const saved=localStorage.getItem(KEY);if(saved)db=migrate(JSON.parse(saved));}catch(e){storageBroken=true;}
const $=s=>document.querySelector(s), money=p=>'$'+p.toFixed(4).replace(/0{1,2}$/,'');
function status(s){$('#status').textContent=s;}
function commit(next){validate(next);try{localStorage.setItem(KEY,JSON.stringify(next));}catch(e){throw Error('Could not save. Browser storage may be full or unavailable. Export a backup before closing.');}db=next;render();}
function change(fn){try{const next=JSON.parse(JSON.stringify(db));fn(next);commit(next);status('Saved in this browser.');return true;}catch(e){alert(e.message);return false;}}
let tab='fabric';
let sortField='name',sortDescending=false;
const naturalOrder=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
function compareValues(a,b,field,descending){
 const result=field==='price'?Number(a)-Number(b):naturalOrder.compare(String(a),String(b));
 return descending?-result:result;
}
function sortingControls(){
 const available=tab==='fabric'?['division','name','content','price','linked']:['division','style','name','content','price'];
 if(!available.includes(sortField))sortField='name';
}
function sortHeading(th,label,field){
 th.append(document.createTextNode(label+' '));
 if(!field)return;
 const active=sortField===field;
 th.setAttribute('aria-sort',active?(sortDescending?'descending':'ascending'):'none');
 const button=document.createElement('button');
 button.type='button';button.className='column-sort';
 button.textContent=active?(sortDescending?'↓':'↑'):'↕';
 const nextDescending=active?!sortDescending:false;
 button.setAttribute('aria-label','Sort '+label+' '+(nextDescending?'descending':'ascending'));
 button.title='Sort '+label+' '+(nextDescending?'descending':'ascending');
 button.onclick=()=>{sortDescending=nextDescending;sortField=field;render();};
 th.append(button);
}
function sortVisibleRows(){
 const columns=tab==='fabric'?{division:0,name:1,content:2,price:3,linked:4}:{division:0,style:1,name:2,content:3,price:4};
 const value=(row,field)=>{const text=row.cells[columns[field]].textContent;return field==='price'?Number(text.replace('$','')):text;};
 const rows=Array.from($('#rows').children);
 rows.sort((a,b)=>compareValues(value(a,sortField),value(b,sortField),sortField,sortDescending)||naturalOrder.compare(value(a,'name'),value(b,'name'))||naturalOrder.compare(value(a,'division'),value(b,'division')));
 $('#rows').append(...rows);
}

function cell(row,text){const td=document.createElement('td');td.textContent=text;row.append(td);return td;}
function action(td,label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;td.append(b);}
function render(){
 sortingControls();
 $('#fabricCount').textContent=db.fabrics.length;$('#menCount').textContent=db.styles.filter(s=>s.division==='Mens').length;$('#womenCount').textContent=db.styles.filter(s=>s.division==='Womens').length;
 $('#fabricTab').setAttribute('aria-pressed',tab==='fabric');$('#styleTab').setAttribute('aria-pressed',tab==='style');
 $('#head').replaceChildren();const tr=document.createElement('tr');for(const name of(tab==='fabric'?['Division','Fabric name','Fabric content','USD / yd','Linked styles','Actions']:['Division','Style number','Fabric name','Fabric content','USD / yd','Actions'])){const th=document.createElement('th');const fields=tab==='fabric'?{'Division':'division','Fabric name':'name','Fabric content':'content','USD / yd':'price','Linked styles':'linked'}:{'Division':'division','Style number':'style','Fabric name':'name','Fabric content':'content','USD / yd':'price'};sortHeading(th,name,fields[name]);tr.append(th);}$('#head').append(tr);$('#rows').replaceChildren();
 const query=norm($('#search').value),division=$('#division').value;
 for(const f of [...db.fabrics].sort((a,b)=>a.name.localeCompare(b.name))){const styles=db.styles.filter(s=>s.fabricId===f.id);const match=norm([f.name,f.content,...styles.map(s=>s.number)].join(' ')).includes(query);
 if(tab==='fabric'){if(!match||(division&&f.division!==division))continue;const row=document.createElement('tr');cell(row,f.division);cell(row,f.name);cell(row,f.content);cell(row,money(f.price));cell(row,styles.map(s=>`${s.division} · ${s.number}`).join(', ')||'No styles linked');const td=cell(row,'');action(td,'Edit',()=>openFabric(f));action(td,'Delete',()=>{if(styles.length)return alert('Remove the linked styles before deleting this fabric.');if(confirm('Delete fabric '+f.name+'?'))change(d=>d.fabrics=d.fabrics.filter(x=>x.id!==f.id));});$('#rows').append(row);
 }else for(const s of styles){if(division&&s.division!==division)continue;if(!norm([s.number,s.division,f.name,f.content].join(' ')).includes(query))continue;const row=document.createElement('tr');[s.division,s.number,f.name,f.content,money(f.price)].forEach(t=>cell(row,t));const td=cell(row,'');action(td,'Edit',()=>openStyle(s));action(td,'Unlink',()=>{if(confirm('Unlink style '+s.number+'?'))change(d=>d.styles=d.styles.filter(x=>x.id!==s.id));});$('#rows').append(row);}}
 if($('#rows').children.length)sortVisibleRows();
 if(!$('#rows').children.length){const row=document.createElement('tr');const td=cell(row,db.fabrics.length?'No matching records.':'Your library is ready. Add your first fabric, then link a style.');td.colSpan=6;td.className='empty';$('#rows').append(row);}
}
function openFabric(f){const form=$('#fabricForm');form.reset();for(const key of ['id','name','content','price','division'])form.elements[key].value=f?(f[key]==='Unassigned'?'':f[key]):'';$('#fabricTitle').textContent=f?'Edit fabric':'Add fabric';$('#fabricDialog').showModal();}
function lookup(){return db.fabrics.find(f=>f.id===$('#styleForm').elements.fabricName.value);}
function autoFill(){const f=lookup();$('#autoFill').textContent=f?`Division: ${f.division} · Content: ${f.content} · Price: ${money(f.price)} / yd`:'Select an existing fabric. Add it to the fabric master first if it is new.';}
function openStyle(s){if(!db.fabrics.length)return alert('Add a fabric to the fabric master first.');const form=$('#styleForm');form.reset();form.elements.id.value=s?.id||'';form.elements.number.value=s?.number||'';const select=form.elements.fabricName;select.replaceChildren(new Option('Select fabric…',''));for(const f of db.fabrics.filter(f=>f.division!=='Unassigned')){select.add(new Option(f.division+' · '+f.name,f.id));}select.value=s?s.fabricId:'';autoFill();$('#styleDialog').showModal();}
$('#fabricForm').onsubmit=e=>{e.preventDefault();const form=e.target, id=form.elements.id.value||recordId(),name=form.elements.name.value.trim(),content=form.elements.content.value.trim(),price=Number(form.elements.price.value),division=form.elements.division.value;if(change(d=>{if(d.fabrics.some(f=>f.id!==id&&f.division===division&&norm(f.name)===norm(name)))throw Error('This fabric name already exists. Edit the existing record or use a distinct mill/reference name.');d.styles.filter(s=>s.fabricId===id).forEach(s=>s.division=division);const f={id,name,content,price,division},i=d.fabrics.findIndex(x=>x.id===id);if(i<0)d.fabrics.push(f);else d.fabrics[i]=f;}))$('#fabricDialog').close();};
$('#styleForm').onsubmit=e=>{e.preventDefault();const form=e.target,f=lookup();if(!f)return alert('Select an existing fabric name to automatically match its content and price.');const s={id:form.elements.id.value||recordId(),division:f.division,number:form.elements.number.value.trim(),fabricId:f.id};if(change(d=>{d.styles=d.styles.filter(x=>x.id!==s.id);d.styles.push(s);}))$('#styleDialog').close();};
$('#styleForm').elements.fabricName.onchange=autoFill;
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
$('#addFabric').onclick=()=>openFabric();$('#addStyle').onclick=()=>openStyle();$('#fabricTab').onclick=()=>{tab='fabric';render();};$('#styleTab').onclick=()=>{tab='style';render();};$('#search').oninput=render;$('#division').onchange=render;
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#backup').onclick=()=>download(JSON.stringify({...db,exportedAt:new Date().toISOString()},null,2),'AEO-Fabric-Backup-'+new Date().toISOString().slice(0,10)+'.json','application/json');
$('#restore').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Backup exceeds 10 MB.');const next=migrate(JSON.parse(await file.text()));if(confirm(`Replace this browser’s library with ${next.fabrics.length} fabrics and ${next.styles.length} style links? Export your current backup first if needed.`)){commit(next);status('Backup restored.');}}catch(err){alert('Restore failed: '+err.message);}finally{e.target.value='';}};
$('#csv').onclick=()=>{const rows=[['Division','Style number','Fabric name','Fabric content','Fabric price (USD/yd)']];for(const f of db.fabrics){const styles=db.styles.filter(s=>s.fabricId===f.id);for(const s of styles.length?styles:[{division:f.division,number:''}])rows.push([s.division,s.number,f.name,f.content,f.price]);}const quote=v=>'"'+String(typeof v==='string'&&/^[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';download('\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'AEO-Fabric-Library.csv','text/csv;charset=utf-8');};
render();if(storageBroken)status('Saved data could not be loaded. Restore a valid backup before entering new records; export is currently of the empty view.');
