'use strict';
let PC,RAM,RAMSIZE=32768,
    lut={},//lookup table for label:PC pairs
    code=[];//array of parsed instructions indexed by PC
const print=console.log,
      ptr={sp:0,local:1,argument:2,pointer:3,this:3,that:4,temp:5,static:16},
      sp=()=>RAM[ptr.sp], s1=()=>sp()-1, s2=()=>sp()-2,
      tokenize=line=>line.split(/\/\//)[0].split(/\s+/).filter(x=>x),
      validName=label=>/^[^0-9]?[a-zA-Z_.:]+/.test(label),
      spDn=()=>{RAM[ptr.sp]-=1};
const lang={//NOTE: only a couple of these return values
  'pop'     :(s,v)=>{spDn();if('temp'==s)RAM[ptr[s]+v]=RAM[sp()]
                     else if('pointer'==s)RAM[ptr[s]+v]=RAM[sp()]
                     else RAM[RAM[ptr[s]]+v]=RAM[sp()]},
  'push'    :(s,v)=>{if('constant'==s)RAM[sp()]=v
                     else if('temp'==s)RAM[sp()]=RAM[ptr[s]+v]
                     else if('pointer'==s)RAM[sp()]=RAM[ptr[s]+v]
                     else RAM[sp()]=RAM[RAM[ptr[s]]+v];RAM[ptr.sp]+=1},
  'add'     :()=>{RAM[s2()]=   RAM[s2()] +RAM[s1()];spDn()},
  'and'     :()=>{RAM[s2()]=   RAM[s2()] &RAM[s1()];spDn()},
  'or'      :()=>{RAM[s2()]=   RAM[s2()] |RAM[s1()];spDn()},
  'sub'     :()=>{RAM[s2()]=   RAM[s2()] -RAM[s1()];spDn()},
  'eq'      :()=>{RAM[s2()]=0-(RAM[s2()]==RAM[s1()]);spDn()},
  'gt'      :()=>{RAM[s2()]=0-(RAM[s2()] >RAM[s1()]);spDn()},
  'lt'      :()=>{RAM[s2()]=0-(RAM[s2()] <RAM[s1()]);spDn()},
  'neg'     :()=>{RAM[s1()]=0-RAM[s1()]},
  'not'     :()=>{RAM[s1()]=~RAM[s1()]},
  'label'   :(l)=>{lut[l]=PC+1},
  'goto'    :(l)=>{return lut[l]},
  'if-goto' :(l)=>{spDn();if(RAM[sp()])return lang['goto'](l)},
  'function':(f,n)=>{},//n local vars
  'call'    :(f,m)=>{},//m args already pushed on stack by caller
  'return'  :()=>{},
  'end'     :()=>{},
};

function initRam(size){RAMSIZE=size;RAM=new Int16Array(size);RAM[0]=256}
function resetAll(){RAM=0;PC=0;code=[];lut={}}
function parse(lines){//=>{ok:[parsed],err:line}
  const cmds=[]
  for(let line of lines){
    const l=tokenize(line)
    if(l.length==0) continue
    if(l.length==3) l[2]=parseInt(l[2])
    if(l[0]in lang) cmds.push(l)
    else return{err:line}
  }
  return {ok:cmds}
}
function _eval(cmd){
  if(!cmd)return -1
  const[c,...rest]=cmd
  return lang[c](...rest)
}

// UI
window.addEventListener('load',e=>{
  const prog=document.querySelector('#history'),
        cli=document.querySelector('#cli');
  cli.addEventListener('keypress',e=>{
    if(e.charCode==13 && !e.shiftKey){
      e.preventDefault()
      prog.value+=cli.value.trim()+'\n'
      cli.value=''
      prog.scrollTop=prog.scrollHeight
    }
  })
  prog.scrollTop=prog.scrollHeight
})
