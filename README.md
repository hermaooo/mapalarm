# Alarme Baseado em Localização

Um pequeno projeto de um alarme, onde, eu defino o raio da localização e, caso eu saia ou entre dentro desse raio, o programa dispara um alarme.

Nesse projeto foi utilizado a API do Google Maps, especificamente a Maps Javascript API e a Places API.

Para rodar esse projeto você deve ter uma chave API do Google Maps.

Dentro do arquivo App.jsx, você deve substituir o espaço em branco na constante API_KEY (linha 5) pela sua própria chave entre os parênteses.

As funcionalidades são:

- Escolher um ponto no mapa, manualmente ou usando a caixa de texto.
- Definir o tamanho do raio. 100m a 5000m com incrementos de 100m, e, 5000m a 15000m com incrementos de 500m.
- Definir se o alarme deve ser acionado ao entrar no raio ou sair do raio.
- Resetar o alarme após acionado.

Para executar, baixe os arquivos, e, na pasta aonde estão os arquivos execute npm install, após isso, npm run dev para rodar na porta local 5174. Para alterar a porta apenas modifique ela no arquivo vite.config.js.
