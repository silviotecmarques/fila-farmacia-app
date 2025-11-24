# Sistema de Fila para Farmácia (Sistema de Fila)

## 📌 Visão Geral

O **Sistema de Fila** é uma aplicação desktop construída com Electron, desenvolvida para gerenciar de forma visual e intuitiva a fila de atendimento de balconistas em uma farmácia. O foco principal é fornecer uma interface clara sobre quem está atendendo e quem é o próximo, além de coletar estatísticas básicas de desempenho.

**Versão Atual:** 1.0.6

---

## ✨ Funcionalidades Principais

* **Gestão Visual da Fila:** Interface limpa que mostra o atendente atual e a ordem dos próximos na fila (1º, 2º, 3º).
* **Controle de Prioridade ("Atendi"):** O atendente que finaliza o atendimento retorna automaticamente para o fim da fila (`fila.shift()` -> `fila.push()`).
* **Persistência de Dados:** O estado da fila e as estatísticas são salvos no armazenamento local do sistema (`localStorage`).
* **Reset Diário Automático:** A fila de atendimento é zerada ao iniciar o aplicativo em um novo dia de trabalho, garantindo um novo turno limpo.
* **Modo de Deleção Contextual:** O botão **EXCLUIR** ativa um modo de seleção por clique, permitindo remover permanentemente um ou mais balconistas do sistema de forma segura (sem confundir com a remoção da fila).
* **Cadastro Híbrido de Balconistas:** Modal para adicionar novos colaboradores, oferecendo a escolha entre 6 avatares fixos ou upload de uma imagem do computador.
* **Feedback Visual:** Utiliza filtro de escala de cinza (P&B via CSS) para indicar balconistas que estão fora de serviço.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** Electron (para aplicação Desktop cross-platform).
* **Linguagem:** JavaScript (ES6+).
* **Interface:** HTML5 e CSS3 (com customização baseada no Studio Ghibli Theme).
* **Outros:** `electron-updater`, `electron-builder` (para distribuição e auto-update).
* **[Nota:** O código inclui estrutura para o Chart.js, que pode ser reativada para exibir gráficos/estatísticas. **]**

---

## 🚀 Instalação e Execução (Desenvolvimento)

Para configurar e executar o projeto em seu ambiente local:

1.  **Clone o Repositório:**
    ```bash
    git clone [https://www.youtube.com/watch?v=BEsAXYPulBo](https://www.youtube.com/watch?v=BEsAXYPulBo)
    cd sistema-de-fila
    ```
2.  **Instale as Dependências:**
    ```bash
    npm install
    ```
3.  **Execute em Modo Desenvolvimento:**
    ```bash
    npm start
    ```

---

## ⚙️ Uso da Interface de Gestão

O acesso às configurações e ao cadastro de novos balconistas é feito pela tela de Gestão (`Botão FILA`).

### 1. Cadastro de Novo Balconista

1.  Clique no botão **+ ADICIONAR NOVO** no rodapé da tela de Gestão.
2.  Preencha o **Nome Completo**.
3.  **Selecione a Imagem:**
    * Escolha um dos 6 avatares na **Galeria**.
    * **OU** clique em **"Carregar do Computador"** para enviar uma foto local.

### 2. Deleção Permanente (Modo Excluir)

1.  Clique no botão **EXCLUIR** (o botão verde à esquerda). Ele ficará **opaco/ativo**.
2.  Clique nas **fotos dos balconistas** que deseja remover permanentemente do sistema (as fotos selecionadas ficarão com uma borda vermelha).
3.  Clique novamente no botão **EXCLUIR (X)** (o rótulo mostrará a contagem, ex: `EXCLUIR (2)`) para confirmar e finalizar a exclusão.

### 3. Gerenciamento de Imagens Fixas

Para que as imagens fixas da galeria (`duck.png`, `tiger.png`, etc.) e as imagens de novos usuários funcionem, elas devem ser armazenadas:

* **Avatares Fixos da Galeria:** Devem estar na pasta **`assets/fotos/galeria/`** (com os nomes `duck.png`, `fox.png`, etc.).
* **Imagens de Novos Usuários:** O sistema salva o dado da imagem internamente via Base64. Para fins de produção e reutilização em diferentes máquinas, a lógica real de salvamento de arquivos no Main Process (Node.js) deve garantir que a imagem seja salva no disco com o nome `[id_do_balconista]-colorida.png`.