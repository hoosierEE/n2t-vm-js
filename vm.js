// javascript backend for Nand2Tetris virtual machine
// RAM is (conceptually) an array of 16-bit Numbers
//
// Some addresses in RAM map to SCREEN, KBD, and named registers like SP, LCL, R9, etc.
'use strict'; //prefer let/const over var.

// const RAM=new Int16Array(32768); //actual value
const RAM=new Int16Array(4000); //for testing
const seg={sp:256, local:300, argument:400, this:3000, that:3010}

function normalize(line){//space-separated list of words in a command. MAY return an empty list.
  return line.split(/\/\//)[0].split(/[ \t]+/).filter(x=>x)}

function showRam(addresses){//=>subset of RAM as {address:value,} object
  return addresses.reduce((acc,k,i)=>(acc[k]=RAM[addresses[i]],acc), {});}

function spP(n=1){seg.sp += n;}
function spN(n=1){seg.sp -= n;}
function pushConstant(n){RAM[seg.sp]=n; spP();}
function pushSegment(n,x){RAM[seg[segment]+n]=x; spP();}
