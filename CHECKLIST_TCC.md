# 📋 Checklist de Alinhamento Acadêmico — CONIC 2026
## Módulo 3: Aplicativo do Paciente (Soberania Móvel, DPoP & Gestão de Consentimentos)

> **Documento Base:** *Artigo CONIC SEMESP 2026 — Plataforma SaaS Open Health (POHINC)*  
> **Repositório:** `aplicativo_centralizador_de_exames`  
> **Tecnologias Centrais:** React Native / Expo, Keycloak, DPoP (RFC 9449), Hardware Security Chip (Keystore/Secure Enclave)

---

### 📌 1. Visão Geral do Módulo no Artigo
Conforme descrito nas Seções **3.2, 4.2, 5, 6.1 e 7** do artigo:
* **Papel:** Aplicativo mobile centrado na soberania dos dados do paciente e conformidade estrita com a LGPD (*Privacy by Design*).
* **Mecanismos Críticos no Artigo:**
  - **Governança Descentralizada de Consentimentos:** O paciente autoriza e revoga granularmente o acesso aos seus exames clínicos em tempo real.
  - **DPoP Vinculado a Hardware:** O barramento central não possui autorização permanente de leitura. O fluxo exige requisição assinada em tempo real via DPoP atrelada ao chip físico de segurança do smartphone (Keystore / Secure Enclave).
  - **Métrica Publicada:** Escore de usabilidade **SUS de 84,2 pontos** ("excelente", Grau A).

---

### 🎯 2. Status Atual da Implementação
- [x] Estrutura completa em React Native / Expo com Expo Router e suporte a Dark Mode.
- [x] Geração de prova DPoP em `src/security/dpop.ts` utilizando curvas elípticas P-256 (`@noble/curves`).
- [x] Telas de Login, Cadastro, Validação de Código de E-mail, Visualização e Upload de Exames.
- [x] Termos de Consentimento e Privacidade informativos em `LegalTermsModal.tsx`.

---

### ⏳ 3. Pendências e Itens Faltantes para Alinhamento com a Documentação

#### 3.1. Sincronização de Branches no Git — 🚨 URGENTE
- [ ] **Fazer Merge da branch `dev` para a branch `main`:**
  - *Problema:* A branch `main` no GitHub possui apenas o primeiro commit com um `README.md` vazio (36 bytes). Todo o código-fonte desenvolvido reside na branch `dev`.
  - *Ação:* Executar `git checkout main && git merge dev && git push origin main` para disponibilizar o código publicamente como citado no artigo.

#### 3.2. Interface de Gestão Descentralizada de Consentimentos — 🚨 GAP CRÍTICO
- [ ] **Criar a Tela de Consentimentos do Paciente:**
  - O artigo define como pilar central: *"gestão descentralizada de consentimentos pelo paciente... restituindo ao paciente a governança sobre seus dados com o uso de criptografia DPoP"*.
  - *Problema:* Não existe uma tela no aplicativo onde o titular visualiza pedidos de acesso e concede/revoga autorização.
  - *Ação:* Implementar tela (`src/app/exam-flow/consents.tsx` ou aba dedicada) contendo:
    1. Lista de solicitações de clínicas/médicos pendentes de aprovação.
    2. Botões de ação rápida: **"Autorizar Acesso"** e **"Revogar Acesso"**.
    3. Exibição de escopo: quais exames ou períodos o médico poderá consultar.
    4. Confirmação biométrica e assinatura DPoP no momento da aprovação.

#### 3.3. Assinatura Vinculada a Hardware (Hardware Security Chip)
- [ ] **Migrar de `AsyncStorage` para `expo-secure-store`:**
  - As chaves privadas do DPoP estão salvas no `AsyncStorage` comum (texto claro no sandbox do app). Devem ser migradas para o `expo-secure-store` (que utiliza Keystore no Android e Keychain no iOS).
- [ ] **Assinatura Criptográfica via Biometria/Hardware:**
  - Em `src/security/signer.native.ts` (linha 37), a função `sign()` executa um fallback que apenas calcula um hash SHA-256 (`Crypto.digestStringAsync`).
  - Utilizar `rnBiometrics.createSignature({ promptMessage, payload, cancelButtonText })` para assinar o desafio com a chave privada residente no chip de segurança de hardware.

#### 3.4. Alinhamento de Rotas com o Backend Centralizador
- [ ] **Compatibilidade dos Endpoints de Exames:**
  - Em `src/services/exams.ts`, o app chama `POST /api/exams`, `GET /api/exams`, `GET /api/exams/:id` e `DELETE /api/exams/:id`.
  - Garantir que esses endpoints estejam devidamente implementados no backend (`sistema_centralizador_de_dados_clinicos_back`) para que o aplicativo não enfrente erros 404 ao salvar e listar exames reais.
