'use strict';
let PC=0,RAM,RAMSIZE=32768;
const print=console.log;
const ptr={sp:0,local:1,argument:2,pointer:3,this:3,that:4,temp:5,static:16},
      lut={},//lookup table for label:PC pairs
      code=[],//array of parsed instructions indexed by PC
      sp=()=>RAM[ptr.sp], s1=()=>sp()-1, s2=()=>sp()-2,
      tokenize=line=>line.split(/\/\//)[0].split(/\s+/).filter(x=>x),
      validName=label=>/^[^0-9]?[a-zA-Z_.:]+/.test(label),
      spDn=()=>{RAM[ptr.sp]-=1},
      spUp=()=>{RAM[ptr.sp]+=1};
const lang={
  'pop'     :(s,v)=>{spDn();RAM[ptr[s]+v]=RAM[sp()]},
  'push'    :(s,v)=>{RAM[sp()]=s=='constant'?v:RAM[ptr[s]+v];spUp()},
  'add'     :()=>{RAM[s2()]=   RAM[s2()] +RAM[s1()];spDn()},
  'and'     :()=>{RAM[s2()]=   RAM[s2()] &RAM[s1()];spDn()},
  'or'      :()=>{RAM[s2()]=   RAM[s2()] |RAM[s1()];spDn()},
  'sub'     :()=>{RAM[s2()]=   RAM[s2()] -RAM[s1()];spDn()},
  'eq'      :()=>{RAM[s2()]=0-(RAM[s2()]==RAM[s1()]);spDn()},
  'gt'      :()=>{RAM[s2()]=0-(RAM[s2()] >RAM[s1()]);spDn()},
  'lt'      :()=>{RAM[s2()]=0-(RAM[s2()] <RAM[s1()]);spDn()},
  'neg'     :()=>{RAM[s1()]=0-RAM[s1()]},
  'not'     :()=>{RAM[s1()]=~RAM[s1()]},
  'label'   :(l)=>{lut[l]=PC},
  'goto'    :(l)=>{PC=lut[l]},
  'ifgoto'  :(l)=>{spDn();if(RAM[sp()])lang['goto'](l)},
  'function':(f,n)=>{},//n local vars
  'call'    :(f,m)=>{},//m args already pushed on stack by caller
  'return'  :()=>{},
  'end'     :()=>{},
};

function initRam(size){RAMSIZE=size;RAM=new Int16Array(size);RAM[0]=256}
function setSegments(l,a,s,t){RAM[ptr.local]=l;RAM[ptr.argument]=110;RAM[ptr.this]=s;RAM[ptr.that]=t}
function sysInit(size){initRam(size);setSegments(3000,3010,4000,4010)}
function parse(line){//return {ok:parsed,err:line}
  const l=tokenize(line)
  if(l.length==0) return{ok:l}
  if(l.length==3) l[2]=parseInt(l[2])
  return(l[0] in lang)?{ok:l}:{err:line}
}
function run(cmd){
  if('ok'in cmd && cmd.ok.length){
    const[c,...rest]=cmd.ok
    code.push(cmd.ok)
    lang[c](...rest)
    // print(RAM.slice(sp()-4,sp()))
    PC++
  }
}

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
