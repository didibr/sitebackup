const { exec } = require('child_process');

class TaskQueue {
  constructor() {
    this.queue = [];
    this.isRunning = false;
  }

  add(prompt, res) {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, res, resolve, reject });
      this.runNext();
    });
  }

  runNext() {
    if (this.isRunning || this.queue.length === 0) return;

    const { prompt, res, resolve, reject } = this.queue.shift();
    this.isRunning = true;

    if (!res.writableEnded && res.writable) {
    } else {
      console.log("Comando cancelado ", safePrompt);
      this.isRunning = false;
      reject(`Cancelado: ${safePrompt}`);
      this.runNext();
      return;
    }

    const safePrompt = prompt.replace(/(["$`\\])/g, '\\$1');
    const command = `/www/pages/1/fastcpu/inicia.sh --prompt "${safePrompt}"`;

    console.log("Executando comando:", command);

    exec(command, (error, stdout, stderr) => {
      this.isRunning = false;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Comando finalizado`);

      if (error) {
        console.error(`Erro: ${error.message}`);
        reject(`Erro: ${error.message}`);
      } else {
        const lines = stdout.trim().split('\n');
        //console.log(lines);
        var filename= lines[lines.length - 2];
        const lastLine = filename + "#" + lines[lines.length - 1];
        
        // Agendar remoção do arquivo após 1 minuto (60000 ms)
        setTimeout(() => {
          const fs = require('fs');          
          fs.unlink(`/www/pages/1/fastcpu/results/${filename}`, (err) => {});
          filename=filename.substr(0,filename.length-6)+".json";          
          fs.unlink(`/www/pages/1/fastcpu/results/${filename}`, (err) => {});
        }, 60000); // 1 minuto

        resolve(lastLine || "Comando executado.");
      }

      this.runNext(); // processa próxima tarefa na fila
    });
  }
}

module.exports = new TaskQueue();
