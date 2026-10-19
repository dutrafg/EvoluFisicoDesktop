/* Desktop-only native SQLite client. No automatic migration or destructive legacy writes. */
(function(){
'use strict';
if(!window.chrome || !window.chrome.webview) return;
const pending=new Map();
let counter=0;
window.chrome.webview.addEventListener('message',function(event){
 const msg=event.data;
 if(!msg || msg.type!=='native-storage-result' || typeof msg.requestId!=='string')return;
 const item=pending.get(msg.requestId);
 if(!item)return;
 pending.delete(msg.requestId);
 clearTimeout(item.timer);
 if(msg.error)item.reject(new Error(msg.error));
 else item.resolve(msg.data);
});
function call(action,recordId,data){
 return new Promise((resolve,reject)=>{
  const requestId='ef-'+Date.now().toString(36)+'-'+(++counter).toString(36);
  const timer=setTimeout(()=>{
   pending.delete(requestId);
   reject(new Error('Tempo limite excedido na comunicação com o banco local.'));
  },15000);
  pending.set(requestId,{resolve,reject,timer});
  try{
   window.chrome.webview.postMessage({type:'native-storage',requestId,action,recordId,data});
  }catch(error){
   clearTimeout(timer);pending.delete(requestId);reject(error);
  }
 });
}
const encode=bytes=>{
 let result='';
 for(let i=0;i<bytes.length;i+=8192)
  result+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
 return btoa(result);
};
const decode=base64=>Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
window.EFNativeStorage=Object.freeze({
 health:()=>call('health'),
 list:async()=>JSON.parse(await call('list')),
 read:async id=>{const data=await call('read',id);return data===null?null:decode(data);},
 write:(id,bytes)=>{
  if(!(bytes instanceof Uint8Array))throw new TypeError('Esperado Uint8Array');
  return call('write',id,encode(bytes));
 },
 delete:id=>call('delete',id)
});
})();
