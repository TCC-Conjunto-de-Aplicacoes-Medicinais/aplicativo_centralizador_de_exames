// Service worker mínimo: habilita a instalação da PWA. Sem cache: os dados clínicos nunca ficam
// guardados no navegador, e as requisições seguem sempre para a rede.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
