'use strict';
let RAM,RAMSIZE=32768;
const ptr={sp:0,local:1,argument:2,pointer:3,this:3,that:4,temp:5,static:16,nvars:0}
const lut={}//lookup table for label:instruction pairs
const tokenize=line=>line.split(/\/\//)[0].split(/\s+/).filter(x=>x), sp=()=>RAM[ptr.sp], s1=()=>sp()-1, s2=()=>sp()-2;
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

//TODO: control flow
// When reading a line of input, add commands to an array.
// Array index can be a jump target.
// Labels can be {labelName: index} pairs in a lookup table.

//TODO: functions

function parse(line,pc){
  const l=tokenize(line), arith={add,and,or,sub,eq,gt,lt,neg,not};
  if(l[0]=='push'){
    if(l[1]=='constant')return[push, l[2]]
    if(l[1]in ptr)return[pushFrom,l[1],l[2]]
  }
  if(l[0]=='pop'){
    if(l.length==3)return[popTo,l[1],l[2]]
    return[popTo,'static',ptr.nvars++]
  }
  if(l[0]in arith)return[arith[l[0]]]
  return[]
}

function initRam(size=RAMSIZE){RAMSIZE=size;RAM=new Int16Array(size);RAM[0]=256}
function initSegments(l,a,s,t){RAM[ptr.local]=l;RAM[ptr.argument]=110;RAM[ptr.this]=s;RAM[ptr.that]=t}
function tests(cmds){
  initRam(500)
  initSegments(100,110,200,210)
  let results=[], errors={}
  for(let i in cmds){
    const cmd=cmds[i]
    let r=parse(cmd)
    if(r.length){
      1/0
    }
    if(parse(cmd))results.push(RAM[s1()])
    else errors[i]=cmd
  }
  return {results,errors}
}

let sometests = tests([
  '//a comment',
  'bad command',
  'push constant 3 //blah blah blah',
  'push constant 2',
  '// more comments',
  'pop static 0',
  'pop static 1',
  'push static 0',
  'push static 1',
  'sub'
]);

console.log(sometests);

// initRam(300);
// test('')
// test('//a comment');
// test('bad command');
// test('push constant 3');
// test('push constant 2');
// test('pop static 0');
// test('pop static 1');
// test('push static 0'); // 2
// test('push static 1'); // 3
// test('sub');

// initRam(300);//tests
// push(3); console.log(sp(),RAM[s1()]);
// popTo('argument',1); console.log(sp(),RAM[s1()]);
// push(4); console.log(sp(),RAM[s1()]);
// popTo('argument',2); console.log(sp(),RAM[s1()]);
// push(10); console.log(sp(),RAM[s1()]);
// pushFrom('argument',1); console.log(sp(),RAM[s1()]);
// add(); console.log(sp(),RAM[s1()]);
// popTo('argument',3); console.log(sp(),RAM[s1()]);

// initRam(300);//tests:
// push(10); console.log(sp(),RAM[s1()]);
// push(2); console.log(sp(),RAM[s1()]);
// sub();   console.log(sp(),RAM[s1()]);
// push(3); console.log(sp(),RAM[s1()]);
// neg();   console.log(sp(),RAM[s1()]);
