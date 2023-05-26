'use strict';
/////
// VM
let currentTest,PC,RAM,RAMSIZE=32768,
    code=[],//array of parsed instructions indexed by PC
    fun={},//lookup table for function:PC pairs
    lut={};//lookup table for label:PC pairs
const Js=JSON.stringify,
      print=(x)=>{
        const r=typeof x=='string'?x:Js(x).replace(/^ +/,s=>'&nbsp'.repeat(s.length));
        document.querySelector("div.messages").innerHTML+=`<p>${r}</p>`
      },
      log=console.log,
      ptr={sp:0,local:1,argument:2,pointer:3,this:3,that:4,temp:5,static:16},
      sp=()=>RAM[ptr.sp], s1=()=>sp()-1, s2=()=>sp()-2,
      tokenize=line=>line.split(/\/\//)[0].split(/\s+/).filter(x=>x),
      // validName=label=>/^[^0-9]?[a-zA-Z_.:]+/.test(label),
      spDn=()=>{RAM[0]-=1},
      spUp=()=>{RAM[0]+=1};
const lang={//NOTE: PC=(return value)||PC+1
  'pop'     :(s,v)=>{spDn(); if(['pointer','temp'].includes(s))RAM[ptr[s]+v]=RAM[sp()]
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

  //FIXME: maybe incorrectly saving or restoring stack frames
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
  'end'     :()=>{},//so repl knows when function ends
};

function initRam(size){RAMSIZE=size;RAM=new Int16Array(size);RAM[0]=256}
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
function resetAll(){
  document.querySelector('#program').innerHTML='';currentTest=null
  RAM=0;PC=0;code=[];fun={};lut={}
}


/////
// UI
function tag(e,value){
  let [x,...cls]=e.split(' ')
  cls=(cls.length)?` class="${cls.join(' ')}"`:''
  return`<${x}${cls}>${value}</${x}>`
}
const si=x=>tag('span index',x),sv=x=>tag('span value',x)
function showRam(N){
  const h=tag('div ramhead',si('address')+sv('value'))
  const r=Array.from(RAM.slice(0,N)).map((x,i)=>tag('div ramrow',si(i)+sv(x))).join('')
  return tag('div ramtop',h+r)
}
function showStack(spStart){
  const h=tag('div ramhead',si('address')+sv('value'))
  const r=Array.from(RAM.slice(spStart,sp())).map((x,i)=>tag('div ramrow',si(i+spStart)+sv(x)))
  return tag('div ramtop',h+r.reverse().join(''))
}

function showProgram(){
  if(PC<0||undefined==currentTest)return''
  return currentTest.map((x,i)=>`<div ${i==PC?'class="hl"':''}>${x.join(' ')}</div>`).join('')
}

function update(){
  document.querySelector('#memview').innerHTML=showRam(16)
  document.querySelector('#stack').innerHTML=showStack(256)
  document.querySelector('#programName').innerHTML=document.querySelector('#test-chooser').value
  const prog=document.querySelector('#program');
  prog.innerHTML=showProgram()
  const highlight=document.querySelector('.hl');
  if(highlight){
    const [hr,pr]=[highlight,prog].map(x=>x.getBoundingClientRect())
    if(hr.y < pr.y){
      log('above', prog.scrollTop)
    }
    if(hr.y+hr.height > pr.y+pr.height){
      prog.scrollTop += hr.height
      // math:
      // if current line is past pr.y+pr.height, prog.scrollTop should be increased.
      // For example, if prog shows 10 lines, and current line is line 13, the prog.scrollTop
      // should be 3x line height.
      // If current line is 4, but have already scrolled so 4 is hidden,
      // then prog.scrollTop should be (4-1)x line height
      log('below', prog.scrollTop, PC, PC*parseInt(hr.height))
    }
  }
}


///////////
// debugger
function debug(){
  //TODO: scroll to and highlight current line
  if(!currentTest || PC<0)return
  const prog=document.querySelector('#program'),
        result=run(currentTest[PC]),
        inst=currentTest[PC]?.join(' ') //FIXME not needed if displaying entire test
  switch(true){
  case result==undefined:PC+=1;break;
  case result<0:return;
  default:PC=result;
  }
  update()
}

/////////////
// self tests
function test(t){
  resetAll()
  initRam(6000)
  const PASS=1,FAIL=0,parsed=parse(t.prog.split(/\n/))
  if('err'in parsed) return{parse:parsed} //parse error? return
  if('setup'in t) t.setup()
  const cmds=parsed.ok
  while(PC>=0 && t.steps-->0){
    const result=run(cmds[PC])
    if(result==undefined) PC+=1
    else PC=result
  }

  let status=PASS
  const errorMessages=[]
  for(let i in t.addr){
    const ri=RAM[t.addr[i]]
    if(ri!=t.vals[i]){
      status = FAIL
      errorMessages.push(`RAM[${t.addr[i]}]==${ri}, expected: ${t.vals[i]}`)
    }
  }
  return{status,errorMessages}
}

for(let t in tests){
  const result=test(tests[t])
  if(result.status==1) print(`${t} ✅`)
  else if(result.parse){print(`${t} ❌ (parse error): ${result.parse.err}`);break}
  else {
    print(`${t} ❌ wrong value(s):`)
    for(let e of result.errorMessages){print(`  ${e}`);}
    break
  }
}

function testInteractive(testname){
  // 1. clear displayed program
  // 2. initialize globals like RAM, SP, etc.
  // 3. call update() then let user click the button
  const t=tests[testname]
  resetAll()
  initRam(6000)
  if(t.setup) t.setup()
  currentTest=parse(t.prog.split(/\n/)).ok
  update()
}

window.addEventListener('load',e=>{
  const chooser=document.querySelector('#test-chooser')
  for(let t in tests){
    chooser.innerHTML+=`<option value="${t}">${t}</option>`
  }
  chooser.addEventListener('change',e=>{

    testInteractive(chooser.value)
  })
})

window.addEventListener('load',e=>{
  const prog=document.querySelector('#history'),
        cli=document.querySelector('#cli');

  cli.addEventListener('keypress',e=>{
    if(e.charCode==13 && !e.shiftKey){
      e.preventDefault()
      prog.value+=cli.value.trim()+'\n'
      cli.value=''
      prog.scrollTop=prog.scrollHeight
      update()
    }
  })
  document.querySelector('button').addEventListener('click',debug)
  prog.scrollTop=prog.scrollHeight
  update()
})
