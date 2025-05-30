//index.html#lang=en
const translations = {
  pt: {    
    search: "Buscar projetos...",
    proj1_title: "Gerador de Imagem SD 1.5",
    proj1_desc_small: `Gerador de imagem feito em Python 3.11, rodando Stable Diffusion 1.5 sem GPU`,
    proj1_desc: `Gerador de imagem feito em Python 3.11, rodando Stable Diffusion 1.5 sem GPU, apenas com
    processador.<br>Utiliza FastSD CPU, uma versão mais rápida da Difusão Estável na CPU, baseada em Modelos de Consistência Latente e Destilação de Difusão Adversarial.
    <br><br>Codigo Original: <a href="https://github.com/rupeshs/fastsdcpu" target="_blank">https://github.com/rupeshs/fastsdcpu</a>`,
    proj2_title: "Prototipo Jogo 3D WEB",
    proj2_desc: "Prototipo de um jogo 3D feito para rodar na página, com interatividade entre vários itens...",
    proj3_title: "Controle a Escavadeira",
    proj3_desc: "Controle uma Escavadeira com o teclado, simula todos o controle de uma escavadeira no navegaor, com fisica e 3D, feito em javascript",
    view_more: "Ver mais",    
    proj1_placeholder:"Imagem que Deseja Gerar 'em Ingles'",
    proj1_button:"Gerar",
    proj4_desc:`<h5 class="my-0 text-danger">SOBRE</h5>
    <p>Liveness Check (ou verificação de vivacidade) é uma técnica usada para garantir que uma pessoa está fisicamente presente durante uma autenticação facial, e não apenas exibindo uma foto, vídeo ou máscara.</p>
    <h5 class="my-0 text-danger">EXEMPLO</h5><p>Este botão acima acionar o comando javascript:<br><code>dlive.create('en', email, token).start();</code></p>
    <p>Todo processo a partir dai é automatico, a quantidade de testes e os erros permitidos é configurada pelo: challenge, retry, attempt. em <code>API ACTIONS</code> na esquerda.<br>
      Caso a detecção falhe o script de falha definido será executaro.<br>Caso a detecção finalize com sucesso, o script de sucesso será executado, caso tenha sido configurado
      um URL SUCESS, a mesma irá receber o TOKEN definido no dlive.create. <br>'http://site.com/page?TOKEN=XXX' <br>A API tem 3 asincronas funções definidas:<br>
      <code>dlive.create(language, email, token);</code> language ='pt' ou 'en', email/KEY, token=string<br><code>dlive.start();</code><br><code>dlive.stop();</code><br>
    </p><h5 class="my-0 text-danger">IMPLEMENTAÇÃO</h5><p>Para adicionar a API, basta incluir o script em sua pagina:<br>
      <code>https://didisoftwares.ddns.net/4/liveness.js</code><br>É preciso ter um protoco HTTPS para que a webcam funcione !</p>
    <h5 class="my-0 text-danger">CRIAR UM EMAIL/KEY</h5>Voce pode utilizar a parte da esquerda nesta tela para criar um script de falha e sucesso personalizado, assim
    como definir uma URL SUCESS, em caso de sucesso, alem da configuração de tentativas.<br>Após salvar sua configuração só é possivel sobrescrever novamente o mesmo EMAIL/KEY se colocar a mesma senha.`,
    proj4_card_desc:"Liveness Check (ou verificação de vivacidade) é uma técnica usada para garantir que uma pessoa está fisicamente presente durante uma autenticação facial, e não apenas exibindo uma foto, vídeo ou máscara.",
    proj5_desc:`<h5 class="my-0 text-danger">SOBRE</h5>
    <p>É uma tecnologia de fala de máquina ou tecnologia de síntese de fala. Faz parte do diálogo homem-máquina, permitindo que as máquinas falem. Projetado para converter de forma inteligente texto em fala natural.</p>
    <h5 class="my-0 text-danger">EXEMPLO</h5>
    <p>A classe <code>dspeech</code> tem as seguintes funcoes:<br>
    <code>dspeech.pause();</code> pausa o audio atual<br>
    <code>dspeech.play();</code> continua o audio pausado<br>
    <code>dspeech.stop();</code> para de tocar o audio, nao é posivel dar play<br>
    <code>dspeech.say(texto,linguagem,tipo,rate,pitch,volume);</code><br>
    Onde Texto é oque deseja falar, linguagem é uma das:(pt en ru), tipo 0 é mulher 1 é homen, rate pitch e volume alteram velocidade timbre e volume da voz</p>
    <h5 class="my-0 text-danger">IMPLEMENTAÇÃO</h5><p>Para adicionar a API, basta incluir o script em sua pagina:<br><code>https://didisoftwares.ddns.net/5/dspeech.js</code></p>`,
    proj5_card_desc:`<p>É uma tecnologia de fala de máquina ou tecnologia de síntese de fala. Faz parte do diálogo homem-máquina, permitindo que as máquinas falem. Projetado para converter de forma inteligente texto em fala natural.</p>`,    
    speach: "FALE",
    speach_ph:"Texto para Falar",
    proj6_card_desc:`<p>EXEMPLO DE FISICA</p><p><b class="text-danger">Clique aqui</b> e escreva qualquer coisa e ira aplicar fisica no elemento, utilizando JOLT Physics.</p>`,
    proj7_desc:`Base de jogo 2D que utiliza apenas canvas e fisica, sem bibliotecas complexas`,
    proj8_desc:`Exemplo de fisica e contato com peças de domino coloridas`,
    proj9_title:`Terreno Infinito`,
    proj9_desc:`Um gerador de terreno sem fim, Use W e D para virar.`,
  },
  en: {    
    search: "Search projects...",
    proj1_title: "Image Generator SD 1.5",
    proj1_desc_small:`Image generator made in Python 3.11, running Stable Diffusion 1.5 without GPU`,
    proj1_desc: `Image generator made in Python 3.11, running Stable Diffusion 1.5 without GPU, only with processor.<br>Uses FastSD CPU, a faster version of Stable Diffusion on CPU, based on Latent Consistency Models and Adversarial Diffusion Distillation.
    <br><br>Original Code: <a href="https://github.com/rupeshs/fastsdcpu" target="_blank">https://github.com/rupeshs/fastsdcpu</a>`,
    proj2_title: "3D Web Game Prototype",
    proj2_desc: "Prototype of a 3D game made to run in the browser, with interaction between various items...",
    proj3_title: "Control the Excavator",
    proj3_desc: "Control an Excavator with the keyboard, simulate all the controls of an excavator in the browser, with physics and 3D, made in javascript",
    view_more: "View more",    
    proj1_placeholder:"Image You Want to Generate'",
    proj1_button:"Generate",
    proj4_desc:`<h5 class="my-0 text-danger">ABOUT</h5>
    <p>Liveness Check is a technique used to ensure that a person is physically present during a facial authentication, and not just by displaying a photo, video, or mask.</p>
    <h5 class="my-0 text-danger">EXAMPLE</h5><p>This button above triggers the javascript:<br><code>dlive.create('en', email, token).start();</code></p>
    <p>Every process from then on is automatic, the amount of tests and errors allowed is configured by: challenge, retry, attempt. in <code>API ACTIONS</code> on the left. <br>
    In case the detection fails, the defined failure script will be executed. <br>If the detection completes successfully, the success script will be executed, if it has been configured
    a URL SUCESS, it will receive the TOKEN defined in dlive.create. <br>'http://site.com/page?TOKEN=XXX' <br>The API has 3 asynchronous functions defined:<br>
    <code>dlive.create(language, email, token);</code> language ='pt' or 'en', email/KEY, token=string<br><code>dlive.start();</code><br><code>dlive.stop();</code><br>
    </p><h5 class="my-0 text-danger">IMPLEMENTATION</h5><p>To add the API, simply include the script on your page:<br>
    <code></code><br>https://didisoftwares.ddns.net/4/liveness.js You need to have an HTTPS protocol for the webcam to work!</p>
    <h5 class="my-0 text-danger">CREATE AN EMAIL/KEY</h5>You can use the left part of this screen to create a custom failure and success script, as well as
    how to set a URL SUCESS, on success, as well as the configuration of retries. <br>After saving your configuration it is only possible to overwrite the same EMAIL/KEY again if you enter the same password.`,
    proj4_card_desc:"Liveness Check is a technique used to ensure that a person is physically present during a facial authentication, and not just by displaying a photo, video, or mask.",
    proj5_desc:`<h5 class="my-0 text-danger">ABOUT</h5><p>It is a machine speech technology or speech synthesis technology. It is part of human-machine dialogue, allowing machines to speak. Designed to intelligently convert text into natural speech.</p><h5 class="my-0 text-danger">EXAMPLE</h5><p>The class <code>dspeech</code> has the following functions:<br><code>dspeech.pause();</code> pauses the current audio<br><code>dspeech.play();</code> resumes the paused audio<br><code>dspeech.stop();</code> stops playing the audio, it is not possible to play again<br><code>dspeech.say(text,language,type,rate,pitch,volume);</code><br>Where Text is what you want to say, language is one of: (pt en ru), type 0 is female 1 is male, rate, pitch, and volume change the speed, timbre, and volume of the voice.</p><h5 class="my-0 text-danger">IMPLEMENTATION</h5><p>To add the API, just include the script on your page:<br><code>https://didisoftwares.ddns.net/5/dspeech.js</code></p>`,
    proj5_card_desc:`<p>It is a machine speech technology or speech synthesis technology. It is part of human-machine dialogue, allowing machines to speak. Designed to intelligently convert text into natural speech.</p>`,
    speach:"SPEACH",
    speach_ph:"Text to Speech",
    proj6_card_desc:`<p>PHYSICS EXAMPLE</p><p><b class="text-danger">Click here</b> and write anything, and it will apply physics to the element, using JOLT Physics.</p>`,
    proj7_desc:`2D game base that uses only canvas and physics, without complex libraries`,
    proj8_desc:`Example of physics and contact with colored domino pieces`,
    proj9_title:`Infinite Terrain`,
    proj9_desc:`An endless terrain generator, Use W and D to turn.`,
  }
};

function setLanguage(lang) {
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) el.innerHTML = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) el.placeholder = translations[lang][key];
  });
  reloadIframes();
  window._TRANSLATION_LANG=lang;
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('lang') || 'pt';
  setLanguage(savedLang);
});


function reloadIframes() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      // Verifica se o iframe é do mesmo domínio
      try {
        if (iframe.src && iframe.src.startsWith(location.origin)) {
          iframe.contentWindow.location.reload(); // Recarrega o iframe
        }
      } catch (e) {
        //console.warn('Não foi possível recarregar o iframe:', e);
      }
    });
  }

  (function () {
    const hash = window.location.hash.substring(1); // Remove o "#"
    const hashParams = new URLSearchParams(hash);
    const lang = hashParams.get('lang');      
    if (lang) {
      localStorage.setItem('language', lang);
  
      if (typeof setLanguage === 'function') {
        setLanguage(lang);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          if (typeof setLanguage === 'function') {
            setLanguage(lang);
          }
        });
      }
  
      // Remove apenas o parâmetro lang do hash
      hashParams.delete('lang');
      const newHash = hashParams.toString();
      const cleanUrl = window.location.href.split('#')[0] + (newHash ? '#' + newHash : '');
  
      history.replaceState(null, '', cleanUrl);
    }
  })();
  