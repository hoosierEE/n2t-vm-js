'use strict';
// javascript backend for Nand2Tetris virtual machine

const ptr={sp:0,local:1,argument:2,pointer:3,this:3,that:4,temp:5,static:16};
const stat=16;//static vars start here

//Transform line into a space-separated list of words in a command. May return an empty list.
function normalize(line){return line.split(/\/\//)[0].split(/[ \t]+/).filter(x=>x)}

//Return subset of RAM as {address:value,} object.
function showRam(addresses){return addresses.reduce((acc,k,i)=>(acc[k]=RAM[addresses[i]],acc), {});}
function show_ram(n){return RAM.slice(0,n)}

//globals
let RAM,RAMSIZE=32768;
function initRam(size=RAMSIZE){RAMSIZE=size;RAM=new Int16Array(size); RAM[0]=256;}

//stack
function sp(){return RAM[ptr.sp];}
function s1(){return sp()-1;}
function s2(){return sp()-2;}
function spInc(){RAM[ptr.sp]+=1;}
function spDec(){RAM[ptr.sp]-=1;}

//memory
function pop(){spDec();return RAM[sp()];}
function popTo(segment,offset){RAM[ptr[segment]+offset]=pop();}
function push(x){RAM[sp()]=x;spInc();}
function pushFrom(segment,offset){push(RAM[ptr[segment]+offset]);}

//arith
function add(){RAM[s2()]=   RAM[s2()] +RAM[s1()];  spDec();}
function and(){RAM[s2()]=   RAM[s2()] &RAM[s1()];  spDec();}
function or() {RAM[s2()]=   RAM[s2()] |RAM[s1()];  spDec();}
function sub(){RAM[s2()]=   RAM[s2()] -RAM[s1()];  spDec();}
//compare: true is -1, false is 0
function eq() {RAM[s2()]=-(+RAM[s2()]==RAM[s1()]); spDec();}
function gt() {RAM[s2()]=-(+RAM[s2()] >RAM[s1()]); spDec();}
function lt() {RAM[s2()]=-(+RAM[s2()] <RAM[s1()]); spDec();}
//unary
function neg(){RAM[s1()]=-RAM[s1()];}
function not(){RAM[s1()]=~RAM[s1()];}//bitwise

//parse
function run(line){
  const l=normalize(line), arith={add,and,or,sub,eq,gt,lt,neg,not};
  if(Array.isArray(l) && l.length==0){return true;}
  else if(l[0]=='push'){
    if(l[1]=='constant'){push(l[2]);}
    else if(l[1]in ptr){pushFrom(l[1],l[2]);}
    else{return false;}
  }
  else if(l[0]=='pop'){popTo(l[1],l[2]);}
  else if(l[0]in arith){arith[l[0]]();}
  else{return false;}
  return true;
}

function test(cmd){
  if(run(cmd)){return RAM[s1()];}
  else{return `Error: ${cmd}`;}
}

initRam(300);
test('')
test('//a comment');
test('bad command');
test('push constant 3');
test('push constant 2');
test('pop static 0');
test('pop static 1');
test('push static 0'); // 2
test('push static 1'); // 3
test('sub');

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
