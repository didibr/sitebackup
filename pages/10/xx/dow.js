const fs=require("fs");
const axios=require("axios");

function extractUrl(str){

str=String(str);

const m=str.match(/https?:\/\/[^<>"'\s]+/);

return m?m[0]:str;

}

(async()=>{

const arquivo=process.argv[2];

const data=JSON.parse(
fs.readFileSync(arquivo,"utf8")
);

let {img_prt,img_lst}=data;

img_prt=extractUrl(img_prt);

console.log("BASE:",img_prt);
console.log("TOTAL:",img_lst.length);

const url=`${img_prt}/${img_lst[0]}`;

console.log("URL TESTE:");
console.log(url);

try{

const r=await axios.get(url,{

responseType:"arraybuffer",

validateStatus:()=>true,

headers:{
"User-Agent":"Mozilla/5.0",
"Accept":"image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
"Accept-Language":"pt-BR,pt;q=0.9,en;q=0.8"
}

});

console.log("STATUS:",r.status);

console.log("HEADERS:");
console.log(r.headers);

console.log("BYTES:");
console.log(r.data?.length);

if(r.status!==200){

console.log("ERRO:");

console.log(
Buffer
.from(r.data)
.toString("utf8")
.slice(0,2000)
);

}

}catch(e){

console.error("FALHA:");

console.error(e);

}

})();
