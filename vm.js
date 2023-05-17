'use strict';
let PC,RAM,RAMSIZE=32768,
    code=[],//array of parsed instructions indexed by PC
    fun={},//lookup table for function:PC pairs
    lut={};//lookup table for label:PC pairs
const print=(x)=>{
  const y=typeof x=='string'?x:JSON.stringify(x)
  const r=y.replace(/^ +/,s=>'&nbsp'.repeat(s.length));
  document.querySelector("div.messages").innerHTML+=`<p>${r}</p>`
},
      log=console.log,
      ptr={sp:0,local:1,argument:2,pointer:3,this:3,that:4,temp:5,static:16},
      sp=()=>RAM[ptr.sp], s1=()=>sp()-1, s2=()=>sp()-2,
      tokenize=line=>line.split(/\/\//)[0].split(/\s+/).filter(x=>x),
      validName=label=>/^[^0-9]?[a-zA-Z_.:]+/.test(label),
      spDn=()=>{RAM[ptr.sp]-=1},
      spUp=()=>{RAM[ptr.sp]+=1};
const lang={//NOTE: return value, if any, will be jumped to
  'pop'     :(s,v)=>{spDn(); if('temp'==s)RAM[ptr[s]+v]=RAM[sp()]
                     else if('pointer'==s)RAM[ptr[s]+v]=RAM[sp()]
                     else RAM[RAM[ptr[s]]+v]=RAM[sp()]},
  'push'    :(s,v)=>{if('constant'==s)RAM[sp()]=v
                     else if('temp'==s)RAM[sp()]=RAM[ptr[s]+v]
                     else if('pointer'==s)RAM[sp()]=RAM[ptr[s]+v]
                     else RAM[sp()]=RAM[RAM[ptr[s]]+v]; spUp()},
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
  // 'function':(f,n)=>{fun[f]=PC+1;Array(n).fill().map(_=>lang.push('constant',0))},
  'function':(f,n)=>{fun[f]=PC+1;for(let i=0;i<n;i++)lang.push('constant',0)},
  'return'  :()=>{
    const frame=RAM[ptr.local];
    RAM[RAM[ptr.argument]]=RAM[s1()]
    RAM[ptr.sp]=RAM[ptr.argument]+1
    RAM[ptr.that]=RAM[frame-1]
    RAM[ptr.this]=RAM[frame-2]
    RAM[ptr.argument]=RAM[frame-3]
    RAM[ptr.local]=RAM[frame-4]
    return RAM[frame-5]
  },

  //FIXME: this/that are correct after NestedCall, but other stack values are wrong
  'call'    :(f,m)=>{//m args already pushed on stack by caller
    // print(RAM.slice(0,5));print(RAM.slice(sp(),sp()+5))
    const SP=ptr.sp
    RAM[RAM[SP]+0]=PC+1//return address
    RAM[RAM[SP]+1]=RAM[RAM[ptr.local]]
    RAM[RAM[SP]+2]=RAM[RAM[ptr.argument]]
    RAM[RAM[SP]+3]=RAM[RAM[ptr.this]]
    RAM[RAM[SP]+4]=RAM[RAM[ptr.that]]
    RAM[RAM[ptr.argument]]=sp()-m-5
    RAM[RAM[ptr.local]]=sp()
    spUp()
    return fun[f]
  },
  'end'     :()=>{},//allows mixing top-level code with function definitions
};

function initRam(size){RAMSIZE=size;RAM=new Int16Array(size);RAM[0]=256}
function resetAll(){RAM=0;PC=0;code=[];fun={};lut={}}
function parse1(line){
  const l=tokenize(line)
  if(l.length==0) return{nop:line}
  if(!(l[0]in lang)) return{err:`(${l[0]}) not recognized`}
  if(lang[l[0]].length != l.length-1)
    return{err:`${l[0]} expects ${lang[l[0]].length} arguments, got ${l.length-1}: ${l}`}
  if(l.length==3) l[2]=parseInt(l[2])
  if(l[0]in lang && lang[l[0]].length == l.length-1) return l
  else return{err:line}
}
function parse(lines){//=>{ok:[parsed],err:line}
  const cmds=[]
  for(let line of lines){
    const x=parse1(line)
    if('err'in x)return x
    if('nop'in x)continue
    else cmds.push(x)
  }
  return{ok:cmds}
}
function run(cmd){
  if(!cmd)return -1//null or undefined command
  const[c,...rest]=cmd
  return lang[c](...rest)//commands return undefined or a new PC value
}

// UI
window.addEventListener('load',e=>{
  const prog=document.querySelector('#history'),
        cli=document.querySelector('#cli'),
        button=document.querySelector('button'),
        view=document.querySelector('div.memview div.items');
  button.addEventListener('click',e=>print(e))
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
