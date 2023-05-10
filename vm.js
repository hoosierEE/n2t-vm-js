'use strict';
let PC,RAM,RAMSIZE=32768;
const ptr={sp:0,local:1,argument:2,pointer:3,this:3,that:4,temp:5,static:16,nvars:0},
      lut={},//lookup table for label:PC pairs
      code=[],//array of parsed instructions indexed by PC
      sp=()=>RAM[ptr.sp], s1=()=>sp()-1, s2=()=>sp()-2,
      tokenize=line=>line.split(/\/\//)[0].split(/\s+/).filter(x=>x),
      validName=label=>/^[^0-9]?[a-zA-Z_.:]+/.test(label),
      arith={add,and,or,sub,eq,gt,lt,neg,not};
function spInc(){RAM[ptr.sp]+=1}
function spDec(){RAM[ptr.sp]-=1}
function pop(){spDec();return RAM[sp()]}
function popTo(segment,offset){RAM[ptr[segment]+offset]=pop()}
function push(x){RAM[sp()]=x;spInc()}
function pushFrom(segment,offset){push(RAM[ptr[segment]+offset])}
function add(){RAM[s2()]=   RAM[s2()] +RAM[s1()];  spDec()}
function and(){RAM[s2()]=   RAM[s2()] &RAM[s1()];  spDec()}
function or (){RAM[s2()]=   RAM[s2()] |RAM[s1()];  spDec()}
function sub(){RAM[s2()]=   RAM[s2()] -RAM[s1()];  spDec()}
function eq (){RAM[s2()]=0-(RAM[s2()]==RAM[s1()]); spDec()}//true:-1  false:0
function gt (){RAM[s2()]=0-(RAM[s2()] >RAM[s1()]); spDec()}
function lt (){RAM[s2()]=0-(RAM[s2()] <RAM[s1()]); spDec()}
function neg(){RAM[s1()]=0-RAM[s1()]}
function not(){RAM[s1()]=~RAM[s1()]}//bitwise

//TODO: functions
//TODO: label scope is current function
//TODO: control flow
// function label(l){}//Labels are {labelName: index} in (lut).
function ifgoto(l){if(pop())_goto(l)}
function _goto(l){PC=lut[l]}
function _function(f,n){}//n local vars
function call(f,m){}//m args already pushed on stack by caller
function _return(){}

function parse(line,pc){
  const l=tokenize(line);
  switch(true){
  case l[0]=='push':
    if(l[1]=='constant')return[push,parseInt(l[2])]
    if(l[1]in ptr)      return[pushFrom,l[1],parseInt(l[2])]
  case l[0]=='pop':     return(l.length==3)?[popTo,l[1],parseInt(l[2])]:[popTo,'static',ptr.nvars++]
  case l[0]in arith:    return[arith[l[0]]]
  case l[0]=='label':   lut[l[1]]=pc;return l
  case l[0]=='end'://pop context and eval
  case l[0]=='module'://push context
  case l[0]=='function'://push context
  case l[0]=='call':    return[call,l[1],parseInt(l[2])]
  case l[0]=='goto':    return[_goto,l[1]]
  case l[0]=='if-goto': return[ifgoto,l[1]]
  case l[0]=='return':  return[_return]
  default:return 0
  }
}

function initRam(size){RAMSIZE=size;RAM=new Int16Array(size);RAM[0]=256}
function initSegments(l,a,s,t){RAM[ptr.local]=l;RAM[ptr.argument]=110;RAM[ptr.this]=s;RAM[ptr.that]=t}
function Sysinit(size){initRam(size);initSegments(100,110,200,210)}
function test(cmds){
  Sysinit(500)
  let results=[], errors={}, pc=0
  for(let i in cmds){
    const cmd=cmds[i]
    let r=parse(cmd,pc)
    if(r){
      results.push([r[0].name].concat(r.slice(1)))
      pc+=1
    }
    else errors[i]=cmd
  }
  return results; //{results,errors}
}

window.addEventListener('load',e=>{
  Sysinit(500)
  const prog=document.querySelector('#program'),
        cli=document.querySelector('#cli');
  cli.addEventListener('keypress',e=>{
    if(e.charCode==13 && !e.shiftKey){
      e.preventDefault();
      prog.value+=cli.value+'\n';
      console.log(cli.value);
      cli.value='';
      prog.scrollTop=prog.scrollHeight;
    }
  })
//   prog.value=`//a comment
// bad command
// push constant 3 //blah blah blah
// push constant 2
// label foo
// // more comments
// pop static 0
// pop static 1
// add
// add
// push static 0
// push static 1
// sub
// `;
  prog.scrollTop=prog.scrollHeight;
})

// test([
//   '//a comment',
//   'bad command',
//   'push constant 3 //blah blah blah',
//   'push constant 2',
//   'label foo',
//   '// more comments',
//   'pop static 0',
//   'pop static 1',
//   'add',
//   'add',
//   'push static 0',
//   'push static 1',
//   'sub'
// ]).forEach(x=>console.log(x))
// console.log('lut:',lut)
