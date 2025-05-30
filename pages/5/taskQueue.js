const { exec } = require('child_process');
const fs = require('fs');

class TaskQueue {
  constructor() {
    this.queue = [];
    this.isRunning = false;
    this.runcount=0;
    this.runNext = this.runNext.bind(this); //secure runxext
  }

  add(data, conx) {  
    return new Promise((resolve, reject) => {
      this.queue.push({ data, conx, resolve, reject });
      this.runNext();
    });
  }
  

  runNext() {
    if (this.isRunning || this.queue.length === 0) return;
  
    const { data, conx, resolve, reject } = this.queue.shift();
    this.isRunning = true;
  
    const { speech, lang, type, rate, pitch, volume } = data;
  
    if (!conx?.socket || conx.socket.readyState !== 'open') {
      console.log("Comando cancelado (cliente desconectado):", speech);
      this.isRunning = false;
      reject(`Cancelado: ${speech}`);
      this.runNext();
      return;
    }
  

    this.runcount=this.runcount+1;
    let langName="Vitória";
    const safeSpeech = speech.replace(/(["$`\\])/g, '\\$1');
    const outputName='output'+this.runcount+'.wav';
    const outputPath = 'd:\\'+outputName;

    switch(lang){
      case "pt":langName="Vitória";if(type==1)langName="Ricardo";break;
      case "en":langName="Jennifer";if(type==1)langName="Joey";break;
      case "es":langName="Miguel";if(type==1)langName="Miguel";break;
      case "ru":langName="Tatyana";break;
    }

    langName="IVONA 2 "+langName;    
    //const rate = 150;  // A velocidade da fala (ajuste conforme necessário)
    //const volume = 100;  // O volume (0 a 100, sendo 100 o mais alto)
    //pitch
    // Comando Balcon com parâmetros rate e volume
    const command = `WINEPREFIX=/www/wine wine "c:\\\\balcon\\\\balcon.exe" -n "${langName}" -t "${safeSpeech}" -s ${rate} -p ${pitch} -v ${volume} -w "${outputPath}"`;

    //const command = `WINEPREFIX=/www/wine wine "c:\\\\balcon\\\\balcon.exe" -n "${langName}" -t "${safeSpeech}" -w "${outputPath}"`;

    

    console.log("Executando comando:", command);

    exec(command, (error, stdout, stderr) => {
      this.isRunning = false;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Comando finalizado`);

      if (error) {
        console.error(`Erro: ${error.message}`);
        reject(`Erro: ${error.message}`);
      } else {
        // Retorna o path gerado e agenda sua remoção
        const wavPath = '/www/pages/5/audio/'+outputName; // caminho no Linux

        // Agendar remoção do arquivo após 1 minuto (60000 ms)
        setTimeout(() => {          
          fs.unlink(wavPath, (err) => {
            if (err) console.warn(`Erro ao remover ${outputName}: ${err.message}`);
            else console.log(`${outputName} removido após 1 minuto.`);
          });          
        }, 60000);


        resolve(outputName);
      }

      this.runNext(); // processa próxima tarefa
    });
  }
}

module.exports = new TaskQueue();
