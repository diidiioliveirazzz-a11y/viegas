# Viegas Barber

Plataforma Web desenvolvida em **HTML5**, **CSS3**, **JavaScript**, **Node.js** e **NoSQL**. Design sofisticado, responsivo (Dark/Light mode) e todas as funcionalidades de barbearia integradas.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5 Semântico, CSS3 Moderno (com variáveis CSS e temas claro/escuro) e Vanilla JavaScript modular.
- **Backend**: Node.js com Express e sessões seguras (`express-session`).
- **Base de Dados NoSQL**:
  - Motor NoSQL orientado a documentos (coleções JSON persistentes em `data/nosql/`: `users`, `services`, `subscriptions`, `appointments`, `blocked_times`, `reviews`, `settings`, `hair_styles`, `media_assets`, `client_hair_history`, `loyalty`, `rewards`, `products`, `orders`, `notifications`, `waitlist`).
  - Compatibilidade com **MongoDB** nativo via `MONGODB_URI` (MongoDB local ou MongoDB Atlas na nuvem). Se não for configurada uma URI externa, o motor NoSQL embutido é ativado automaticamente sem requerer nenhuma dependência adicional.

---

## 🚀 Como Executar

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Inicialização da Base de Dados NoSQL (Seed automático)
O seed automático é executado ao iniciar a aplicação pela primeira vez ou via comando:
```bash
npm run seed
```

### 3. Iniciar o Servidor
```bash
npm start
# ou em modo de desenvolvimento:
npm run dev
```

Aceder no navegador: [http://localhost:3000](http://localhost:3000)

---

## 👥 Contas e Acesso

- **Conta do Barbeiro / Administrador**:
  - Início de Sessão: Opção `@ do Instagram`
  - Utilizador: `admin`
  - Palavra-passe: `ViegasAdmin1`
  - Dá acesso ao **Dashboard** (`/dashboard`).
- **Clientes**:
  - Podem criar conta com `@ do Instagram` ou Gmail/email.
  - Podem fazer marcações normais ou Duo, acumular pontos no clube de fidelização, encomendar produtos na loja e subscrever o plano mensal.

---

## ✂️ Funcionalidades

- **Marcações Online (`/marcar`)**: Seleção de serviço, data com janela dinâmica (7 dias regular, 8 dias VIP), cálculo automático de horários livres, preferências de corte silencioso, pedido de música e marcação Duo (duas pessoas consecutivas).
- **Vagas Flash & Lista de Espera (`/espera`)**: Notificação automática com contagem de 10 minutos para vagas libertadas por cancelamentos.
- **Galeria de Cortes (`/galeria`)**: Catálogo fotográfico de cortes com contagem de gostos e atalho direto para marcação.
- **Loja de Produtos (`/loja`)**: Catálogo com controlo de stock em tempo real e reserva para pagamento no balcão.
- **Clube de Fidelização (`/fidelizacao`)**: Pontos e níveis (Bronze, Prata, Ouro, VIP) com recompensas exclusivas.
- **Plano Mensal (`/plano`)**: Subscrição de 40€/mês (2 cortes + 2 barbas) confirmada no balcão pelo barbeiro.
- **Histórico & Cortes (`/meus-cortes`)**: Registo pessoal de fotos e notas de cortes anteriores.
- **Assistente Virtual**: Assistente inteligente no canto inferior direito para tirar dúvidas sobre marcações, preços, localização e horários.
- **Dashboard do Barbeiro (`/dashboard`)**:
  - Agenda Hoje e Agenda Completa (Concluir, Falta, Cancelar).
  - Gestão de Clientes e níveis de fidelização.
  - Reservas da Loja com reposição de stock em caso de cancelamento.
  - Catálogo & Stock com adição/eliminação de produtos e cortes.
  - Gestão e ativação de subscrições do plano mensal.
  - Mapa de Procura (Heatmap) e bloqueio de horários/folgas.
  - Definições da barbearia (horários de abertura, fecho, almoço e contactos).
